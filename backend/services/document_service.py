import os
import PyPDF2
import docx
from datetime import datetime

def process_document(file_path, original_filename):
    """
    Process an uploaded document to extract text and metadata
    
    Args:
        file_path (str): Path to the uploaded file
        original_filename (str): Original filename
        
    Returns:
        dict: Document information including content and metadata
    """
    file_extension = os.path.splitext(file_path)[1].lower()
    
    # Extract content based on file type
    content = ""
    metadata = {
        "filename": original_filename,
        "processed_at": datetime.now().isoformat(),
        "file_size": os.path.getsize(file_path),
        "file_type": file_extension[1:]  # Remove the dot from extension
    }
    
    try:
        if file_extension == '.pdf':
            content, pdf_metadata = extract_pdf_content(file_path)
            metadata.update(pdf_metadata)
        elif file_extension in ['.docx', '.doc']:
            content, doc_metadata = extract_docx_content(file_path)
            metadata.update(doc_metadata)
        elif file_extension == '.txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            metadata["page_count"] = len(content.split('\n\n'))
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")
            
    except Exception as e:
        raise Exception(f"Error processing document: {str(e)}")
    
    return {
        "content": content,
        "metadata": metadata
    }

def extract_pdf_content(file_path):
    """Extract text and metadata from a PDF file"""
    content = ""
    metadata = {}
    
    with open(file_path, 'rb') as f:
        pdf_reader = PyPDF2.PdfReader(f)
        metadata["page_count"] = len(pdf_reader.pages)
        
        # Extract document info if available
        if pdf_reader.metadata:
            info = pdf_reader.metadata
            metadata["author"] = info.author if hasattr(info, 'author') else None
            metadata["creator"] = info.creator if hasattr(info, 'creator') else None
            metadata["producer"] = info.producer if hasattr(info, 'producer') else None
            metadata["subject"] = info.subject if hasattr(info, 'subject') else None
            metadata["title"] = info.title if hasattr(info, 'title') else None
        
        # Extract text from all pages
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            content += page.extract_text() + "\n\n"
    
    return content.strip(), metadata

def extract_docx_content(file_path):
    """Extract text and metadata from a DOCX file"""
    content = ""
    metadata = {}
    
    doc = docx.Document(file_path)
    metadata["page_count"] = len(doc.sections)
    metadata["paragraph_count"] = len(doc.paragraphs)
    
    # Extract core properties if available
    try:
        core_props = doc.core_properties
        metadata["author"] = core_props.author
        metadata["created"] = core_props.created.isoformat() if core_props.created else None
        metadata["modified"] = core_props.modified.isoformat() if core_props.modified else None
        metadata["title"] = core_props.title
    except:
        pass
    
    # Extract text from all paragraphs
    for para in doc.paragraphs:
        content += para.text + "\n"
    
    return content.strip(), metadata