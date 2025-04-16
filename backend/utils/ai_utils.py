import re
from langchain.text_splitter import RecursiveCharacterTextSplitter

def extract_legal_entities(text):
    """
    Extract legal entities from text (people, organizations, laws, etc.)
    
    Args:
        text (str): Text to extract entities from
        
    Returns:
        dict: Dictionary of extracted entities by type
    """
    # This is a simplified implementation
    # In a production system, you would use a more sophisticated NER model
    
    entities = {
        "people": [],
        "organizations": [],
        "laws": [],
        "cases": [],
        "dates": []
    }
    
    # Simple regex patterns for demonstration
    # Case citations (e.g., Smith v. Jones)
    case_pattern = r'([A-Z][a-z]+)\s+v\.\s+([A-Z][a-z]+)'
    cases = re.findall(case_pattern, text)
    entities["cases"] = [f"{p} v. {d}" for p, d in cases]
    
    # Laws and statutes (e.g., Section 123)
    law_pattern = r'Section\s+(\d+)'
    laws = re.findall(law_pattern, text)
    entities["laws"] = [f"Section {l}" for l in laws]
    
    return entities

def chunk_document(text, chunk_size=1000, chunk_overlap=200):
    """
    Split document into chunks for processing
    
    Args:
        text (str): Document text
        chunk_size (int): Size of each chunk
        chunk_overlap (int): Overlap between chunks
        
    Returns:
        list: List of text chunks
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    return text_splitter.split_text(text)