import os
import pickle
import faiss
import numpy as np
import spacy
import requests
from sentence_transformers import SentenceTransformer
from config import Config

# Initialize models
try:
    nlp = spacy.load(Config.NER_MODEL)
except OSError:
    # If the model is not installed, download it
    os.system(f"python -m spacy download {Config.NER_MODEL}")
    nlp = spacy.load(Config.NER_MODEL)

# Initialize embedder
embedder = SentenceTransformer(Config.EMBEDDING_MODEL)

# Create FAISS index directory if it doesn't exist
os.makedirs(Config.FAISS_INDEX_DIR, exist_ok=True)

def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF file."""
    import PyPDF2
    with open(pdf_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        return " ".join(page.extract_text() for page in reader.pages if page.extract_text())

def extract_text_from_docx(docx_path):
    """Extract text from a DOCX file."""
    from docx import Document
    doc = Document(docx_path)
    return " ".join([paragraph.text for paragraph in doc.paragraphs])

def chunk_text(text, chunk_size=None, overlap=None):
    """Chunk text into smaller segments with overlap."""
    if chunk_size is None:
        chunk_size = Config.CHUNK_SIZE
    if overlap is None:
        overlap = Config.CHUNK_OVERLAP
        
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def normalize_text(text):
    """Normalize text for better matching."""
    import re
    # Convert to lowercase
    text = text.lower()
    # Remove special characters and extra whitespace
    text = re.sub(r'[^\w\s]', ' ', text)
    text = ' '.join(text.split())
    return text

def get_embedding(text):
    """Get embedding for a text using the sentence transformer model."""
    # Normalize text before getting embedding
    text = normalize_text(text)
    embedding = embedder.encode([text])[0]
    # Normalize the embedding vector
    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding = embedding / norm
    return embedding

def create_faiss_index(chunks, document_id, index_file=None, chunk_file=None):
    """Create or load a FAISS index for document chunks."""
    if index_file is None:
        index_file = os.path.join(Config.FAISS_INDEX_DIR, f"{document_id}.index")
    if chunk_file is None:
        chunk_file = os.path.join(Config.FAISS_INDEX_DIR, f"{document_id}.chunks")
    
    if os.path.exists(index_file) and os.path.exists(chunk_file):
        with open(chunk_file, "rb") as f:
            chunks = pickle.load(f)
        index = faiss.read_index(index_file)
        return index, chunks
    else:
        embeddings = [get_embedding(chunk) for chunk in chunks]
        dim = len(embeddings[0])
        index = faiss.IndexFlatL2(dim)
        index.add(np.array(embeddings).astype("float32"))
        faiss.write_index(index, index_file)
        with open(chunk_file, "wb") as f:
            pickle.dump(chunks, f)
        return index, chunks

def retrieve_top_k_chunks_faiss(query, chunks, index, k=3):
    """Retrieve top-k similar chunks for a query using FAISS."""
    query_vec = get_embedding(query)
    D, I = index.search(np.array([query_vec]).astype("float32"), k)
    return [(chunks[i], D[0][idx]) for idx, i in enumerate(I[0])]

def extract_legal_entities(text):
    """Extract legal entities from text using spaCy NER."""
    doc = nlp(text)
    entities = [(ent.text, ent.label_) for ent in doc.ents]
    grouped = {}
    for ent_text, ent_label in entities:
        grouped.setdefault(ent_label, set()).add(ent_text)
    return grouped

def format_entities_for_prompt(entity_dict):
    """Format extracted entities for inclusion in a prompt."""
    if not entity_dict:
        return ""
    formatted = "\n\n🧾 Named Entities Extracted:\n"
    for label, values in entity_dict.items():
        formatted += f"• {label}: {', '.join(values)}\n"
    return formatted.strip()

def preprocess_text(text):
    """Basic text preprocessing for better matching."""
    return text.lower().strip()

def is_query_related_to_document(query, document_chunks, index, threshold=None):
    """Check if a query is related to a document based on similarity."""
    if threshold is None:
        threshold = 0.3  # Lower threshold since we're using normalized vectors
        
    # Normalize and preprocess query
    query = normalize_text(query)
    
    # Get top chunks and their distances
    top_chunks = retrieve_top_k_chunks_faiss(query, document_chunks, index, k=3)
    
    # Calculate average similarity score from top 3 chunks
    # Since we're using normalized vectors, the L2 distance needs to be converted differently
    similarity_scores = [1 - min(distance/2, 1.0) for chunk, distance in top_chunks]
    avg_similarity = sum(similarity_scores) / len(similarity_scores)
    
    # Check for legal keywords in query
    legal_keywords = {
        'appeal', 'court', 'judge', 'law', 'legal', 'case', 'argument', 'evidence',
        'plaintiff', 'defendant', 'petition', 'motion', 'ruling', 'judgment',
        'verdict', 'testimony', 'witness', 'counsel', 'attorney', 'jurisdiction'
    }
    query_words = set(query.split())
    has_legal_terms = bool(query_words.intersection(legal_keywords))
    
    # Consider both similarity and presence of legal terms
    is_relevant = avg_similarity > threshold or has_legal_terms
    
    # If the query explicitly mentions arguments or appeals, consider it relevant
    if 'argument' in query or 'appeal' in query:
        is_relevant = True
        
    return is_relevant

def get_prompt_template(query_type):
    """Get the appropriate prompt template based on query type."""
    templates = {
        "standard_analysis": """You are a legal expert providing a structured summary and legal issue identification based on a legal document.

DOCUMENT CONTENT:
{context}

QUERY: {query}

INSTRUCTIONS:
1. Begin with a brief summary of the document including parties, their roles, specific factual context (e.g., financial details, geographic location, company type), and the core legal matter.
2. List out **identified legal issues or concerns** explicitly.
3. Provide **relevant sections or acts** from Indian law associated with each issue (if possible).
4. Avoid speculation—base your response only on the document provided.
5. Use bullet points or headings to improve clarity.
""",
        "hypothetical_scenario": """You are a legal scenario simulator. Your task is to show how changes in the case elements may influence legal outcomes.

BASE CASE DESCRIPTION:
{context}

MODIFICATION REQUEST: {query}

INSTRUCTIONS:
1. Clearly state the **original scenario** and its likely legal outcome.
2. Then describe the **modified elements** as requested.
3. Analyze how the changes would alter:
   - Legal issues
   - Applicable sections or laws
   - Possible legal recommendations or judgments
4. Keep the comparison structured (Original vs. Modified).
5. Mention any assumptions you're making clearly.
""",
        "hierarchical_layer1": """You are generating an executive-level summary of a legal case.

LEGAL CASE INFORMATION:
{context}

REQUEST: {query}

INSTRUCTIONS:
1. Provide a concise **Executive Summary** with:
   - Nature of the case
   - Key facts (including company nature, financial details, location, and any facts central to the legal issue)
   - Legal issue(s)
   - Summary of legal recommendations
2. Do not go into section-wise detail or cite specific acts here.
3. Use formal, high-level language appropriate for senior stakeholders.
""",
        "hierarchical_layer2": """You are generating a detailed summary and section-wise legal breakdown.

CASE DETAILS:
{context}

REQUEST: {query}

INSTRUCTIONS:
1. Start with a **legal summary** similar to Layer 1.
2. Include:
   - Detailed **section-wise legal analysis** (cite relevant Indian laws)
   - Legal recommendations or next steps
3. Use bullet points for each section or issue discussed.
4. Avoid lengthy paragraphs; keep the flow clean and structured.
""",
        "hierarchical_layer3": """You are providing a comprehensive legal review for advanced analysis.

CASE DATA:
{context}

REQUEST: {query}

INSTRUCTIONS:
1. Include:
   - Legal summary (overview of facts and issue)
   - Section-wise breakdown (with citations to Indian acts)
   - Penalties imposed on the victims
   - Legal recommendations
   - Explanation of referenced **Acts/Articles**
   - Identification of **Rights involved**
   - Look-up for **Relevant Legal Precedents**
   **Judicial Reasoning Comparison**:
   - Summarize views expressed in previous judgments (e.g., High Court)
   - Describe how the final court ruling supports, refutes, or expands upon those views
   - Highlight any evolution or reinterpretation of law
   -Emphasize specific facts about the involved parties (e.g., type of company, monetary details, jurisdictional elements) when available, as they are often critical to the legal interpretation.


2. Ensure each part is well-labeled (e.g., "Legal Summary", "Rights Identified").
3. Provide brief citations and summaries for each precedent used.
4. Structure your response for depth and thorough understanding.
""",
        "legal_query": """You are a legal advisor helping with Indian law-related questions.

DOCUMENT CONTEXT:
{context}

USER QUERY:
{query}

INSTRUCTIONS:
1. Address the user query clearly and concisely.
2. Reference relevant Indian laws/acts if applicable.
3. Stay strictly within Indian legal context.
4. If more context is needed, say so explicitly.
"""
    }
    return templates.get(query_type)

def call_openrouter(prompt):
    """Call OpenRouter API to generate text"""
    response = requests.post(
        'https://openrouter.ai/api/v1/chat/completions',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {Config.OPENROUTER_API_KEY}',
            'HTTP-Referer': 'https://legalmind.app'
        },
        json={
            'model': Config.ANALYSIS_MODEL,
            'messages': [
                {'role': 'system', 'content': 'You are a legal expert generating structured legal insights.'},
                {'role': 'user', 'content': prompt}
            ]
        }
    )
    return response.json()['choices'][0]['message']['content']

def get_response_with_template(context, query_type, user_query, entity_dict=None):
    """Generate a response using the appropriate template and context."""
    if entity_dict is None:
        entity_dict = {}
        
    entities_text = format_entities_for_prompt(entity_dict)
    prompt = get_prompt_template(query_type).format(context=context, query=user_query)
    
    # Add entities to the prompt if available
    if entities_text:
        prompt += f"\n\n{entities_text}"
    
    response = call_openrouter(prompt)
    return response 