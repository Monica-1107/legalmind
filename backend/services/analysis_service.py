import os
import json
import requests
from datetime import datetime
from config import Config

def analyze_document(file_path, content, analysis_mode='standard', analysis_level=1, hypothetical_scenario=None):
    """
    Analyze a document using AI via OpenRouter API
    
    Args:
        file_path (str): Path to the document file
        content (str): Extracted text content of the document
        analysis_mode (str): Analysis mode (standard, hypothetical, hierarchical)
        analysis_level (int): Analysis detail level (1-3) for hierarchical mode
        hypothetical_scenario (dict): Hypothetical scenario details
        
    Returns:
        dict: Analysis results
    """
    # Truncate content if it's too long
    max_content_length = 15000  # Adjust based on token limits
    truncated_content = content[:max_content_length] if len(content) > max_content_length else content
    
    # Create appropriate prompt based on analysis mode
    if analysis_mode == 'standard':
        prompt = create_standard_analysis_prompt(truncated_content)
    elif analysis_mode == 'hypothetical':
        prompt = create_hypothetical_analysis_prompt(truncated_content, hypothetical_scenario)
    elif analysis_mode == 'hierarchical':
        prompt = create_hierarchical_analysis_prompt(truncated_content, analysis_level)
    else:
        raise ValueError(f"Unsupported analysis mode: {analysis_mode}")
    
    # Call OpenRouter API
    response = call_openrouter_api(prompt)
    
    # Process and structure the response
    result = {
        "analysis_mode": analysis_mode,
        "analysis_level": analysis_level if analysis_mode == 'hierarchical' else None,
        "content": response,
        "timestamp": datetime.now().isoformat()
    }
    
    # Add mode-specific fields
    if analysis_mode == 'standard':
        result["summary"] = response  # For standard mode, use the full response as summary
        result["key_points"] = extract_key_points(response)
    elif analysis_mode == 'hypothetical':
        result["hypothetical_scenario"] = hypothetical_scenario
        result["scenario_analysis"] = response  # For hypothetical mode, use the full response as scenario analysis
    
    return result

def extract_key_points(response):
    """Extract key points from the analysis response"""
    # This is a simple implementation - you might want to make it more sophisticated
    lines = response.split('\n')
    key_points = []
    for line in lines:
        if line.strip().startswith('*') or line.strip().startswith('-'):
            key_points.append(line.strip())
    return key_points

def call_openrouter_api(prompt):
    """Call OpenRouter API to generate text"""
    headers = {
        "Authorization": f"Bearer {Config.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://legalmind.app"  # Replace with your actual domain
    }
    
    data = {
        "model": Config.DEFAULT_MODEL,
        "messages": [
            {"role": "system", "content": "You are a legal expert analyzing legal documents."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1,  # Low temperature for more deterministic responses
        "max_tokens": 4000
    }
    
    try:
        response = requests.post(
            Config.OPENROUTER_API_URL,
            headers=headers,
            json=data
        )
        response.raise_for_status()
        
        result = response.json()
        return result["choices"][0]["message"]["content"]
    except Exception as e:
        raise Exception(f"Error calling OpenRouter API: {str(e)}")

def create_standard_analysis_prompt(content):
    """Create a prompt for standard document analysis"""
    return f"""
    Please analyze the following legal document. Provide a comprehensive analysis including:
    
    1. A summary of the case or document
    2. Key legal issues identified
    3. Relevant precedents that might apply
    4. Potential outcomes or implications
    
    Here is the document content:
    {content}
    
    Please format your response in markdown with clear sections and bullet points where appropriate.
    """

def create_hypothetical_analysis_prompt(content, scenario):
    """Create a prompt for hypothetical scenario analysis"""
    # Extract scenario elements
    facts = scenario.get('facts', 'No modified facts provided')
    arguments = scenario.get('arguments', 'No modified arguments provided')
    precedents = scenario.get('precedents', 'No modified precedents provided')
    
    return f"""
    Please analyze this legal document with hypothetical modifications. First, analyze the original document, then consider how the following hypothetical changes would affect the outcome:
    
    Modified Facts: {facts}
    Modified Arguments: {arguments}
    Modified Precedents: {precedents}
    
    Original document content:
    {content}
    
    Please provide:
    1. A brief analysis of the original case/document
    2. How each modification would affect the legal analysis
    3. A comparative analysis of the original vs. modified scenario
    4. The likely outcome under the modified scenario
    
    Format your response in markdown with clear sections.
    """

def create_hierarchical_analysis_prompt(content, level):
    """Create a prompt for hierarchical analysis at specified level"""
    if level == 1:
        detail_instruction = "Provide an executive summary (1-2 paragraphs covering only the most essential points)"
    elif level == 2:
        detail_instruction = "Provide a detailed breakdown including main arguments, critical precedents, and procedural history"
    else:  # level 3
        detail_instruction = "Provide a comprehensive review with full legal analysis, statutory references, and complete citations"
    
    return f"""
    Please analyze this legal document. {detail_instruction}.
    
    Document content:
    {content}
    
    Format your response in markdown with appropriate headings and structure for the level of detail requested.
    """