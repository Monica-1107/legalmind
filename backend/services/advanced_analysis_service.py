import os
from typing import Dict, List, Tuple, Optional
from utils.advanced_analysis import (
    extract_text_from_pdf,
    extract_text_from_docx,
    chunk_text,
    create_faiss_index,
    retrieve_top_k_chunks_faiss,
    extract_legal_entities,
    is_query_related_to_document,
    get_response_with_template
)
from config import Config

class AdvancedAnalysisService:
    def __init__(self):
        self.document_cache = {}  # Cache for document chunks and indices
        
    def process_document(self, file_path: str, document_id: str) -> Dict:
        """Process a document and prepare it for advanced analysis."""
        # Extract text based on file type
        if file_path.lower().endswith('.pdf'):
            text = extract_text_from_pdf(file_path)
        elif file_path.lower().endswith('.docx'):
            text = extract_text_from_docx(file_path)
        else:
            raise ValueError("Unsupported file format. Only PDF and DOCX files are supported.")
            
        # Extract entities
        entities = extract_legal_entities(text)
        
        # Chunk text and create FAISS index
        chunks = chunk_text(text)
        index, chunks = create_faiss_index(chunks, document_id)
        
        # Cache the document data
        self.document_cache[document_id] = {
            'chunks': chunks,
            'index': index,
            'entities': entities,
            'text': text
        }
        
        return {
            'document_id': document_id,
            'num_chunks': len(chunks),
            'entities': entities
        }
        
    def analyze_query(self, 
                     query: str, 
                     document_id: str, 
                     query_type: str = "standard_analysis",
                     k: int = 3) -> Dict:
        """Analyze a query against a processed document."""
        if document_id not in self.document_cache:
            raise ValueError(f"Document {document_id} not found. Please process the document first.")
            
        doc_data = self.document_cache[document_id]
        
        # Check if query is related to the document
        if not is_query_related_to_document(query, doc_data['chunks'], doc_data['index']):
            return {
                'is_relevant': False,
                'message': "The query appears to be unrelated to the document content."
            }
            
        # Retrieve relevant chunks
        relevant_chunks = retrieve_top_k_chunks_faiss(query, doc_data['chunks'], doc_data['index'], k=k)
        context = "\n\n".join(chunk for chunk, _ in relevant_chunks)
        
        # Generate response using template
        response = get_response_with_template(
            context=context,
            query_type=query_type,
            user_query=query,
            entity_dict=doc_data['entities']
        )
        
        return {
            'is_relevant': True,
            'response': response,
            'relevant_chunks': [chunk for chunk, _ in relevant_chunks],
            'entities': doc_data['entities']
        }
        
    def get_document_summary(self, document_id: str, layer: int = 1) -> Dict:
        """Get a hierarchical summary of the document."""
        if document_id not in self.document_cache:
            raise ValueError(f"Document {document_id} not found. Please process the document first.")
            
        doc_data = self.document_cache[document_id]
        query_type = f"hierarchical_layer{layer}"
        
        response = get_response_with_template(
            context=doc_data['text'],
            query_type=query_type,
            user_query="Generate a summary of this legal document.",
            entity_dict=doc_data['entities']
        )
        
        return {
            'summary': response,
            'entities': doc_data['entities']
        }
        
    def analyze_hypothetical_scenario(self, 
                                    document_id: str, 
                                    modification_request: str) -> Dict:
        """Analyze how changes in case elements might affect legal outcomes."""
        if document_id not in self.document_cache:
            raise ValueError(f"Document {document_id} not found. Please process the document first.")
            
        doc_data = self.document_cache[document_id]
        
        response = get_response_with_template(
            context=doc_data['text'],
            query_type="hypothetical_scenario",
            user_query=modification_request,
            entity_dict=doc_data['entities']
        )
        
        return {
            'analysis': response,
            'entities': doc_data['entities']
        }
        
    def clear_document_cache(self, document_id: Optional[str] = None):
        """Clear the document cache, either for a specific document or all documents."""
        if document_id:
            if document_id in self.document_cache:
                del self.document_cache[document_id]
        else:
            self.document_cache.clear() 