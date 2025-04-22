import os
import json
import networkx as nx
import matplotlib.pyplot as plt
from datetime import datetime
import uuid
from config import Config

class KnowledgeGraphService:
    """Service for generating and managing knowledge graphs from documents and chat sessions."""
    
    def __init__(self):
        self.graph_dir = os.path.join(Config.UPLOAD_FOLDER, 'knowledge_graphs')
        os.makedirs(self.graph_dir, exist_ok=True)
    
    # def generate_document_graph(self, documents, graph_name=None):
    #     """
    #     Generate a knowledge graph from one or more documents.
        
    #     Args:
    #         documents (list): List of document objects with content and metadata
    #         graph_name (str, optional): Custom name for the graph. Defaults to None.
            
    #     Returns:
    #         dict: Graph information including ID, name, and file path
    #     """
    #     # Create a new graph
    #     G = nx.Graph()
        
    #     # Process each document
    #     for doc in documents:
    #         # Add document node
    #         doc_id = str(doc.get('_id', 'unknown'))
    #         doc_node_id = f"doc_{doc_id}"
    #         G.add_node(doc_node_id, 
    #                    label=doc.get('filename', f"Document {doc_id}"),
    #                    type='document')
            
    #         # Extract entities and relationships from document content
    #         content = doc.get('content', '')
    #         if not content and 'file_path' in doc:
    #             # Try to read content from file if not in document
    #             try:
    #                 with open(doc['file_path'], 'r', encoding='utf-8') as f:
    #                     content = f.read()
    #             except Exception as e:
    #                 print(f"Error reading file {doc['file_path']}: {e}")
    #                 content = f"Document {doc_id}"
            
    #         entities, relationships = self._extract_entities_and_relationships(content)
            
    #         # Add entities as nodes and connect to document
    #         for entity in entities:
    #             entity_node_id = f"entity_{doc_id}_{entity['id']}"
    #             G.add_node(entity_node_id, 
    #                        label=entity['label'], 
    #                        type=entity['type'])
    #             G.add_edge(doc_node_id, entity_node_id, label='contains')
            
    #         # Add relationships between entities
    #         for rel in relationships:
    #             source_id = f"entity_{doc_id}_{rel['source']}"
    #             target_id = f"entity_{doc_id}_{rel['target']}"
    #             if source_id in G and target_id in G:
    #                 G.add_edge(source_id, target_id, 
    #                            label=rel['label'],
    #                            weight=rel.get('weight', 1.0))
        
    #     # Generate a unique ID for the graph
    #     graph_id = str(uuid.uuid4())
        
    #     # Generate a name if not provided
    #     if not graph_name:
    #         graph_name = f"document_graph_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
    #     # Save the graph as JSON
    #     graph_data = {
    #         'id': graph_id,
    #         'name': graph_name,
    #         'created_at': datetime.now().isoformat(),
    #         'document_ids': [str(doc.get('_id', '')) for doc in documents],
    #         'nodes': [{'id': n, 'label': G.nodes[n]['label'], 'type': G.nodes[n]['type']} 
    #                  for n in G.nodes()],
    #         'edges': [{'source': u, 'target': v, 'label': G.edges[u, v]['label']} 
    #                  for u, v in G.edges()]
    #     }
        
    #     # Save to file
    #     file_path = os.path.join(self.graph_dir, f"{graph_id}.json")
    #     with open(file_path, 'w') as f:
    #         json.dump(graph_data, f, indent=2)
        
    #     # Generate visualization
    #     self._generate_visualization(G, graph_id)
        
    #     return {
    #         'id': graph_id,
    #         'name': graph_name,
    #         'file_path': file_path,
    #         'visualization_path': os.path.join(self.graph_dir, f"{graph_id}.png"),
    #         'node_count': len(G.nodes()),
    #         'edge_count': len(G.edges())
    #     }
    def generate_document_graph(self, documents, graph_name=None, domain="legal"):
        """
        Generate a knowledge graph from one or more legal documents.
        
        Args:
            documents (list): List of document objects with content and metadata
            graph_name (str, optional): Custom name for the graph. Defaults to None.
            domain (str, optional): Domain context for entity extraction. Defaults to "legal".
            
        Returns:
            dict: Graph information including ID, name, and file path
        """
        # Create a new graph
        G = nx.Graph()
        
        # Define legal entity types
        legal_entity_types = {
            'CASE': 'case_citation',
            'STATUTE': 'statute_reference',
            'COURT': 'court',
            'JUDGE': 'judicial_entity',
            'JURISDICTION': 'jurisdiction',
            'PARTY': 'legal_party',
            'PRINCIPLE': 'legal_principle',
            'DATE': 'legal_date',
            'CLAUSE': 'legal_clause',
            'PROCEDURE': 'legal_procedure'
        }
        
        # Define legal relationship types
        legal_relationships = {
            'CITES': 'cites_case',
            'GOVERNS': 'governs',
            'INTERPRETS': 'interprets',
            'OVERRULES': 'overrules',
            'DISTINGUISHES': 'distinguishes',
            'APPLIES': 'applies',
            'CONTRACTS': 'contracts_with',
            'AFFIRMS': 'affirms',
            'REVERSES': 'reverses',
            'FOLLOWED_BY': 'followed_by'
        }
        
        # Process each document
        all_entities = {}  # Keep track of unique entities across documents
        entity_count = 0   # Entity counter for consistent IDs
        
        for doc in documents:
            # Add document node with extended metadata
            doc_id = str(doc.get('_id', 'unknown'))
            doc_node_id = f"doc_{doc_id}"
            
            # Extract document metadata
            doc_metadata = {
                'label': doc.get('filename', f"Document {doc_id}"),
                'type': 'document',
                'date': doc.get('date', None),
                'author': doc.get('author', None),
                'jurisdiction': doc.get('jurisdiction', None),
                'doc_type': doc.get('doc_type', 'legal_document'),
                'case_number': doc.get('case_number', None),
                'court': doc.get('court', None)
            }
            
            # Add document node with metadata
            G.add_node(doc_node_id, **doc_metadata)
            
            # Extract content from document
            content = doc.get('content', '')
            if not content and 'file_path' in doc:
                try:
                    with open(doc['file_path'], 'r', encoding='utf-8') as f:
                        content = f.read()
                except Exception as e:
                    print(f"Error reading file {doc['file_path']}: {e}")
                    content = f"Document {doc_id}"
            
            # Advanced entity and relationship extraction for legal domain
            entities, relationships = self._extract_legal_entities_and_relationships(
                content,
                legal_entity_types,
                legal_relationships
            )
            
            # Add entities as nodes and connect to document
            for entity in entities:
                # Check if entity already exists (deduplicate)
                entity_key = f"{entity['type']}:{entity['label']}"
                if entity_key in all_entities:
                    entity_node_id = all_entities[entity_key]
                else:
                    entity_count += 1
                    entity_node_id = f"entity_{entity_count}"
                    all_entities[entity_key] = entity_node_id
                    
                    # Add entity attributes
                    entity_attrs = {
                        'label': entity['label'],
                        'type': entity['type'],
                        'confidence': entity.get('confidence', 1.0),
                        'normalized_value': entity.get('normalized_value', entity['label']),
                        'context': entity.get('context', ''),
                        'frequency': entity.get('frequency', 1)
                    }
                    
                    G.add_node(entity_node_id, **entity_attrs)
                
                # Connect entity to document with context
                edge_data = {
                    'label': 'contains',
                    'context': entity.get('context', ''),
                    'position': entity.get('position', []),
                    'weight': entity.get('frequency', 1) / 10  # Normalize weight
                }
                G.add_edge(doc_node_id, entity_node_id, **edge_data)
            
            # Add relationships between entities with improved context
            for rel in relationships:
                # Get entity node IDs
                source_key = f"{rel['source_type']}:{rel['source']}"
                target_key = f"{rel['target_type']}:{rel['target']}"
                
                if source_key in all_entities and target_key in all_entities:
                    source_id = all_entities[source_key]
                    target_id = all_entities[target_key]
                    
                    # Add relationship with context and attributes
                    edge_data = {
                        'label': rel['label'],
                        'weight': rel.get('weight', 1.0),
                        'context': rel.get('context', ''),
                        'confidence': rel.get('confidence', 0.8),
                        'relation_type': rel.get('relation_type', 'legal_relation'),
                        'sentence': rel.get('sentence', '')
                    }
                    
                    G.add_edge(source_id, target_id, **edge_data)
        
        # Add citation network - connect cases that cite each other
        self._build_citation_network(G, all_entities)
        
        # Add precedent relationships
        self._add_precedent_relationships(G, all_entities)
        
        # Apply community detection for legal domains
        self._detect_legal_communities(G)
        
        # Generate a unique ID for the graph
        graph_id = str(uuid.uuid4())
        
        # Generate a name if not provided
        if not graph_name:
            graph_name = f"legal_document_graph_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Enhanced metadata for the graph
        graph_data = {
            'id': graph_id,
            'name': graph_name,
            'created_at': datetime.now().isoformat(),
            'document_ids': [str(doc.get('_id', '')) for doc in documents],
            'document_count': len(documents),
            'domain': domain,
            'entity_count': len(all_entities),
            'relationship_count': sum(1 for u, v in G.edges() if G.nodes[u].get('type') != 'document' and G.nodes[v].get('type') != 'document'),
            'entity_types': self._count_entity_types(G),
            'relationship_types': self._count_relationship_types(G),
            'nodes': [
                {
                    'id': n,
                    'label': G.nodes[n].get('label', ''),
                    'type': G.nodes[n].get('type', ''),
                    'normalized_value': G.nodes[n].get('normalized_value', ''),
                    'centrality': G.nodes[n].get('centrality', 0),
                    'community': G.nodes[n].get('community', 0)
                } 
                for n in G.nodes()
            ],
            'edges': [
                {
                    'source': u,
                    'target': v,
                    'label': G.edges[u, v].get('label', ''),
                    'weight': G.edges[u, v].get('weight', 1.0),
                    'confidence': G.edges[u, v].get('confidence', 1.0)
                } 
                for u, v in G.edges()
            ]
        }
        
        # Save to file with more detailed information
        file_path = os.path.join(self.graph_dir, f"{graph_id}.json")
        with open(file_path, 'w') as f:
            json.dump(graph_data, f, indent=2)
        
        # Generate enhanced legal visualization
        self._generate_legal_visualization(G, graph_id)
        
        # Create a simplified version for lightweight access
        simplified_graph = self._create_simplified_graph(G)
        simplified_path = os.path.join(self.graph_dir, f"{graph_id}_simplified.json")
        with open(simplified_path, 'w') as f:
            json.dump(simplified_graph, f, indent=2)
        
        return {
            'id': graph_id,
            'name': graph_name,
            'domain': domain,
            'file_path': file_path,
            'simplified_path': simplified_path,
            'visualization_path': os.path.join(self.graph_dir, f"{graph_id}.png"),
            'interactive_html': os.path.join(self.graph_dir, f"{graph_id}.html"),
            'node_count': len(G.nodes()),
            'edge_count': len(G.edges()),
            'entity_count': len(all_entities),
            'document_count': len(documents),
            'key_entities': self._extract_key_entities(G, limit=10),
            'entity_types': self._count_entity_types(G),
            'communities': self._get_community_summary(G)
        }
    def generate_chat_graph(self, chat_history, document_ids=None, graph_name=None):
        """
        Generate a knowledge graph from chat history.
        
        Args:
            chat_history (list): List of chat messages
            document_ids (list, optional): List of document IDs referenced in the chat. Defaults to None.
            graph_name (str, optional): Custom name for the graph. Defaults to None.
            
        Returns:
            dict: Graph information including ID, name, and file path
        """
        # Create a new graph
        G = nx.Graph()
        
        # Process chat history
        for i, message in enumerate(chat_history):
            # Add message nodes
            message_id = f"msg_{i}"
            G.add_node(message_id, 
                       label=message.get('user_message', '')[:30] + "...", 
                       type='user_message')
            
            response_id = f"resp_{i}"
            G.add_node(response_id, 
                       label=message.get('ai_response', '')[:30] + "...", 
                       type='ai_response')
            
            # Connect message to response
            G.add_edge(message_id, response_id, label='generates')
            
            # Extract entities from AI response
            entities = self._extract_entities_from_text(message.get('ai_response', ''))
            
            # Add entities as nodes and connect to response
            for entity in entities:
                entity_id = f"entity_{i}_{entity['id']}"
                G.add_node(entity_id, 
                           label=entity['label'], 
                           type=entity['type'])
                G.add_edge(response_id, entity_id, label='mentions')
        
        # Add document nodes if provided
        if document_ids:
            for doc_id in document_ids:
                doc_node_id = f"doc_{doc_id}"
                G.add_node(doc_node_id, 
                           label=f"Document {doc_id[:8]}", 
                           type='document')
                
                # Connect to all messages
                for i in range(len(chat_history)):
                    G.add_edge(doc_node_id, f"msg_{i}", label='referenced_in')
        
        # Generate a unique ID for the graph
        graph_id = str(uuid.uuid4())
        
        # Generate a name if not provided
        if not graph_name:
            graph_name = f"chat_graph_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Save the graph as JSON
        graph_data = {
            'id': graph_id,
            'name': graph_name,
            'created_at': datetime.now().isoformat(),
            'document_ids': document_ids or [],
            'nodes': [{'id': n, 'label': G.nodes[n]['label'], 'type': G.nodes[n]['type']} 
                     for n in G.nodes()],
            'edges': [{'source': u, 'target': v, 'label': G.edges[u, v]['label']} 
                     for u, v in G.edges()]
        }
        
        # Save to file
        file_path = os.path.join(self.graph_dir, f"{graph_id}.json")
        with open(file_path, 'w') as f:
            json.dump(graph_data, f, indent=2)
        
        # Generate visualization
        self._generate_visualization(G, graph_id)
        
        return {
            'id': graph_id,
            'name': graph_name,
            'file_path': file_path,
            'visualization_path': os.path.join(self.graph_dir, f"{graph_id}.png"),
            'node_count': len(G.nodes()),
            'edge_count': len(G.edges())
        }
    
    def get_graph(self, graph_id):
        """
        Retrieve a knowledge graph by ID.
        
        Args:
            graph_id (str): ID of the graph to retrieve
            
        Returns:
            dict: Graph data or None if not found
        """
        file_path = os.path.join(self.graph_dir, f"{graph_id}.json")
        if not os.path.exists(file_path):
            return None
        
        with open(file_path, 'r') as f:
            return json.load(f)
    
    def _extract_entities_and_relationships(self, text):
        """
        Extract entities and relationships from text.
        This is a simplified implementation that should be replaced with
        a more sophisticated NLP approach in production.
        
        Args:
            text (str): Text to extract from
            
        Returns:
            tuple: (entities, relationships)
        """
        # This is a placeholder implementation
        # In a real application, you would use NLP libraries like spaCy or NLTK
        # to extract named entities, relationships, etc.
        
        # For now, we'll just extract some basic entities
        entities = []
        relationships = []
        
        # Simple entity extraction (words that start with capital letters)
        words = text.split()
        for i, word in enumerate(words):
            # Clean the word (remove punctuation at the end)
            clean_word = word.rstrip('.,;:!?')
            
            if clean_word and clean_word[0].isupper() and len(clean_word) > 2:
                entity_id = f"entity_{i}"
                entities.append({
                    'id': entity_id,
                    'label': clean_word,
                    'type': 'entity'
                })
                
                # Create relationships between consecutive entities
                if i > 0:
                    prev_word = words[i-1].rstrip('.,;:!?')
                    if prev_word and prev_word[0].isupper():
                        prev_entity_id = f"entity_{i-1}"
                        relationships.append({
                            'source': prev_entity_id,
                            'target': entity_id,
                            'label': 'related_to'
                        })
        
        return entities, relationships
    
    def _extract_entities_from_text(self, text):
        """
        Extract entities from text.
        
        Args:
            text (str): Text to extract from
            
        Returns:
            list: List of entities
        """
        # Similar to the above method, but simplified for chat responses
        entities = []
        
        # Simple entity extraction
        words = text.split()
        for i, word in enumerate(words):
            # Clean the word (remove punctuation at the end)
            clean_word = word.rstrip('.,;:!?')
            
            if clean_word and clean_word[0].isupper() and len(clean_word) > 2:
                entity_id = f"entity_{i}"
                entities.append({
                    'id': entity_id,
                    'label': clean_word,
                    'type': 'entity'
                })
        
        return entities
    
    def _generate_visualization(self, G, graph_id):
        """
        Generate a visualization of the graph.
        
        Args:
            G (networkx.Graph): The graph to visualize
            graph_id (str): ID of the graph
        """
        plt.figure(figsize=(12, 8))
        
        # Set up the layout
        pos = nx.spring_layout(G, seed=42)
        
        # Draw nodes
        node_colors = []
        for node in G.nodes():
            if G.nodes[node]['type'] == 'entity':
                node_colors.append('lightblue')
            elif G.nodes[node]['type'] in ['user_message', 'ai_response']:
                node_colors.append('lightgreen')
            elif G.nodes[node]['type'] == 'document':
                node_colors.append('lightcoral')
            else:
                node_colors.append('lightgray')
        
        nx.draw_networkx_nodes(G, pos, node_color=node_colors, node_size=500)
        
        # Draw edges
        nx.draw_networkx_edges(G, pos, alpha=0.5)
        
        # Draw labels
        labels = {node: G.nodes[node]['label'] for node in G.nodes()}
        nx.draw_networkx_labels(G, pos, labels, font_size=8)
        
        # Draw edge labels
        edge_labels = {(u, v): G.edges[u, v]['label'] for u, v in G.edges()}
        nx.draw_networkx_edge_labels(G, pos, edge_labels, font_size=6)
        
        # Save the visualization
        plt.savefig(os.path.join(self.graph_dir, f"{graph_id}.png"), dpi=300, bbox_inches='tight')
        plt.close() 

    def _extract_legal_entities_and_relationships(self, text, entity_types, relationship_types):
        """
        Extract legal entities and relationships from text using NLP techniques.
        
        Args:
            text (str): Text content to analyze
            entity_types (dict): Dictionary of legal entity types
            relationship_types (dict): Dictionary of legal relationship types
            
        Returns:
            tuple: (entities, relationships)
        """
        # In a production system, this would use specialized NLP for legal text
        # This implementation provides a more sophisticated approach than the original
        
        entities = []
        relationships = []
        
        # Basic entity extraction for demonstration
        # In practice, use a legal NLP library or model fine-tuned for legal text
        
        # Extract case citations (basic pattern matching)
        case_pattern = r'([A-Z][a-z]+\s+v\.\s+[A-Z][a-z]+)'
        case_matches = re.finditer(case_pattern, text)
        for match in case_matches:
            case_name = match.group(1)
            context = text[max(0, match.start() - 50):min(len(text), match.end() + 50)]
            entities.append({
                'id': f"case_{len(entities)}",
                'label': case_name,
                'type': 'case_citation',
                'context': context,
                'position': [match.start(), match.end()],
                'normalized_value': self._normalize_case_citation(case_name),
                'confidence': 0.9
            })
        
        # Extract statute references (simple pattern)
        statute_pattern = r'(\d+\s+U\.S\.C\.\s+§\s+\d+)'
        statute_matches = re.finditer(statute_pattern, text)
        for match in statute_matches:
            statute = match.group(1)
            context = text[max(0, match.start() - 50):min(len(text), match.end() + 50)]
            entities.append({
                'id': f"statute_{len(entities)}",
                'label': statute,
                'type': 'statute_reference',
                'context': context,
                'position': [match.start(), match.end()],
                'normalized_value': self._normalize_statute(statute),
                'confidence': 0.95
            })
        
        # Extract dates (simple pattern)
        date_pattern = r'([A-Z][a-z]+\s+\d{1,2},\s+\d{4})'
        date_matches = re.finditer(date_pattern, text)
        for match in date_matches:
            date_str = match.group(1)
            context = text[max(0, match.start() - 50):min(len(text), match.end() + 50)]
            entities.append({
                'id': f"date_{len(entities)}",
                'label': date_str,
                'type': 'legal_date',
                'context': context,
                'position': [match.start(), match.end()],
                'normalized_value': self._normalize_date(date_str),
                'confidence': 0.85
            })
        
        # Extract legal principles (this would be more sophisticated in production)
        # Look for phrases after "principle of", "doctrine of", etc.
        principle_pattern = r'(principle of|doctrine of)\s+([A-Za-z\s]+)'
        principle_matches = re.finditer(principle_pattern, text)
        for match in principle_matches:
            principle = match.group(2).strip()
            context = text[max(0, match.start() - 50):min(len(text), match.end() + 50)]
            entities.append({
                'id': f"principle_{len(entities)}",
                'label': principle,
                'type': 'legal_principle',
                'context': context,
                'position': [match.start(), match.end()],
                'normalized_value': principle.lower(),
                'confidence': 0.7
            })
        
        # Extract court names
        court_pattern = r'(Supreme Court|District Court|Circuit Court|Court of Appeals)'
        court_matches = re.finditer(court_pattern, text)
        for match in court_matches:
            court = match.group(1)
            context = text[max(0, match.start() - 50):min(len(text), match.end() + 50)]
            entities.append({
                'id': f"court_{len(entities)}",
                'label': court,
                'type': 'court',
                'context': context,
                'position': [match.start(), match.end()],
                'normalized_value': court.lower(),
                'confidence': 0.9
            })
        
        # Extract relationships
        # For each pair of entities, check if they appear in proximity
        for i, entity1 in enumerate(entities):
            for j, entity2 in enumerate(entities):
                if i != j:
                    # Check if entities are close to each other
                    if abs(entity1['position'][0] - entity2['position'][0]) < 200:
                        # Extract the text between the entities
                        start = min(entity1['position'][1], entity2['position'][1])
                        end = max(entity1['position'][0], entity2['position'][0])
                        between_text = text[start:end]
                        
                        # Look for relationship patterns
                        if "cite" in between_text.lower():
                            relationships.append({
                                'source': entity1['id'],
                                'source_type': entity1['type'],
                                'target': entity2['id'],
                                'target_type': entity2['type'],
                                'label': 'cites',
                                'context': between_text,
                                'confidence': 0.8,
                                'relation_type': 'citation',
                                'sentence': between_text
                            })
                        elif "interpret" in between_text.lower():
                            relationships.append({
                                'source': entity1['id'],
                                'source_type': entity1['type'],
                                'target': entity2['id'],
                                'target_type': entity2['type'],
                                'label': 'interprets',
                                'context': between_text,
                                'confidence': 0.7,
                                'relation_type': 'interpretation',
                                'sentence': between_text
                            })
                        elif "overrule" in between_text.lower():
                            relationships.append({
                                'source': entity1['id'],
                                'source_type': entity1['type'],
                                'target': entity2['id'],
                                'target_type': entity2['type'],
                                'label': 'overrules',
                                'context': between_text,
                                'confidence': 0.9,
                                'relation_type': 'precedent',
                                'sentence': between_text
                            })
        
        return entities, relationships

    def _normalize_case_citation(self, citation):
        """Normalize a case citation to a standard format"""
        return citation.replace(' v. ', '_v_').lower()

    def _normalize_statute(self, statute):
        """Normalize a statute reference to a standard format"""
        return statute.replace(' ', '').replace('§', 'section').lower()

    def _normalize_date(self, date_str):
        """Convert a date string to ISO format"""
        try:
            parsed_date = datetime.strptime(date_str, '%B %d, %Y')
            return parsed_date.isoformat()
        except:
            return date_str

    def _build_citation_network(self, G, entity_dict):
        """Build a network of case citations"""
        # Find all case citation nodes
        case_nodes = [n for n in G.nodes() if G.nodes[n].get('type') == 'case_citation']
        
        # Look for existing citation relationships
        for u in case_nodes:
            for v in case_nodes:
                if u != v:
                    # If two cases are from the same document, check for a citation relationship
                    case1 = G.nodes[u].get('label', '')
                    case2 = G.nodes[v].get('label', '')
                    
                    # Simple heuristic - if one case label contains the other, add a citation
                    if case1 in case2 or case2 in case1:
                        if not G.has_edge(u, v):
                            G.add_edge(u, v, label='related_case', weight=0.5, confidence=0.6)

    def _add_precedent_relationships(self, G, entity_dict):
        """Add precedent relationships between cases based on dates"""
        # Find all case citation nodes with dates
        case_nodes = [n for n in G.nodes() if G.nodes[n].get('type') == 'case_citation']
        
        # Get associated dates
        cases_with_dates = []
        for case_node in case_nodes:
            # Find connected date nodes
            for neighbor in G.neighbors(case_node):
                if G.nodes[neighbor].get('type') == 'legal_date':
                    date_value = G.nodes[neighbor].get('normalized_value', '')
                    if date_value:
                        cases_with_dates.append((case_node, date_value))
        
        # Sort cases by date
        cases_with_dates.sort(key=lambda x: x[1])
        
        # Add precedent relationships
        for i in range(len(cases_with_dates) - 1):
            for j in range(i + 1, len(cases_with_dates)):
                earlier_case = cases_with_dates[i][0]
                later_case = cases_with_dates[j][0]
                
                # Add precedent relationship
                if not G.has_edge(later_case, earlier_case):
                    G.add_edge(later_case, earlier_case, 
                            label='follows_precedent', 
                            weight=0.7, 
                            confidence=0.6,
                            relation_type='temporal_precedent')

    def _detect_legal_communities(self, G):
        """Apply community detection to identify clusters of related entities"""
        # Use Louvain community detection algorithm
        if len(G) > 1:  # Need at least 2 nodes
            try:
                communities = nx.community.louvain_communities(G)
                
                # Add community attribute to nodes
                community_mapping = {}
                for i, community in enumerate(communities):
                    for node in community:
                        community_mapping[node] = i
                
                # Set community attribute
                nx.set_node_attributes(G, community_mapping, 'community')
                
                # Calculate centrality
                centrality = nx.betweenness_centrality(G)
                nx.set_node_attributes(G, centrality, 'centrality')
            except:
                # Fallback if community detection fails
                default_community = {node: 0 for node in G.nodes()}
                nx.set_node_attributes(G, default_community, 'community')
                
                default_centrality = {node: 0.5 for node in G.nodes()}
                nx.set_node_attributes(G, default_centrality, 'centrality')

    def _count_entity_types(self, G):
        """Count occurrences of each entity type"""
        type_counts = {}
        for node in G.nodes():
            node_type = G.nodes[node].get('type', 'unknown')
            if node_type in type_counts:
                type_counts[node_type] += 1
            else:
                type_counts[node_type] = 1
        return type_counts

    def _count_relationship_types(self, G):
        """Count occurrences of each relationship type"""
        rel_counts = {}
        for u, v in G.edges():
            rel_type = G.edges[u, v].get('label', 'unknown')
            if rel_type in rel_counts:
                rel_counts[rel_type] += 1
            else:
                rel_counts[rel_type] = 1
        return rel_counts

    def _extract_key_entities(self, G, limit=10):
        """Extract the most important entities based on centrality"""
        # Get all non-document nodes
        entity_nodes = [n for n in G.nodes() if G.nodes[n].get('type') != 'document']
        
        # Calculate centrality if not already done
        if 'centrality' not in G.nodes[list(G.nodes())[0]]:
            centrality = nx.betweenness_centrality(G)
            nx.set_node_attributes(G, centrality, 'centrality')
        
        # Sort entities by centrality
        key_entities = sorted(
            entity_nodes, 
            key=lambda n: G.nodes[n].get('centrality', 0), 
            reverse=True
        )[:limit]
        
        # Return entity details
        return [
            {
                'id': n,
                'label': G.nodes[n].get('label', ''),
                'type': G.nodes[n].get('type', ''),
                'centrality': G.nodes[n].get('centrality', 0)
            }
            for n in key_entities
        ]

    def _get_community_summary(self, G):
        """Get a summary of communities in the graph"""
        communities = {}
        for node in G.nodes():
            community = G.nodes[node].get('community', 0)
            node_type = G.nodes[node].get('type', '')
            
            if community not in communities:
                communities[community] = {'count': 0, 'types': {}}
            
            communities[community]['count'] += 1
            
            if node_type in communities[community]['types']:
                communities[community]['types'][node_type] += 1
            else:
                communities[community]['types'][node_type] = 1
        
        return communities

    def _create_simplified_graph(self, G):
        """Create a simplified version of the graph for visualization"""
        simplified = {
            'nodes': [],
            'links': []
        }
        
        # Add nodes
        for node in G.nodes():
            simplified['nodes'].append({
                'id': node,
                'label': G.nodes[node].get('label', '')[:20],  # Truncate long labels
                'type': G.nodes[node].get('type', ''),
                'community': G.nodes[node].get('community', 0),
                'centrality': G.nodes[node].get('centrality', 0)
            })
        
        # Add edges
        for u, v in G.edges():
            simplified['links'].append({
                'source': u,
                'target': v,
                'label': G.edges[u, v].get('label', '')
            })
        
        return simplified

    def _generate_legal_visualization(self, G, graph_id):
        """Generate an enhanced visualization for legal knowledge graphs"""
        plt.figure(figsize=(14, 10))
        
        # Set up the layout
        pos = nx.spring_layout(G, seed=42, k=0.3)  # Adjust k for better spacing
        
        # Define node colors by type
        color_map = {
            'document': 'lightcoral',
            'case_citation': 'lightblue',
            'statute_reference': 'lightgreen',
            'court': 'orange',
            'judicial_entity': 'yellow',
            'jurisdiction': 'cyan',
            'legal_party': 'pink',
            'legal_principle': 'purple',
            'legal_date': 'gray',
            'legal_clause': 'brown',
            'legal_procedure': 'olive'
        }
        
        # Draw nodes by type
        for node_type, color in color_map.items():
            nodes = [n for n in G.nodes() if G.nodes[n].get('type') == node_type]
            
            if nodes:
                # Size nodes by centrality (if available)
                sizes = []
                for n in nodes:
                    centrality = G.nodes[n].get('centrality', 0.5)
                    sizes.append(300 + 500 * centrality)  # Scale for visibility
                
                nx.draw_networkx_nodes(G, pos, 
                                    nodelist=nodes, 
                                    node_color=color, 
                                    node_size=sizes,
                                    alpha=0.8)
        
        # Define edge colors by type
        edge_colors = {
            'contains': 'gray',
            'cites': 'blue',
            'interprets': 'green',
            'overrules': 'red',
            'follows_precedent': 'purple',
            'related_case': 'orange'
        }
        
        # Draw edges by type
        for edge_type, color in edge_colors.items():
            edges = [(u, v) for u, v in G.edges() if G.edges[u, v].get('label') == edge_type]
            
            if edges:
                # Get edge weights
                weights = [G.edges[u, v].get('weight', 1.0) for u, v in edges]
                
                # Scale for visibility
                scaled_weights = [w * 2 for w in weights]
                
                nx.draw_networkx_edges(G, pos,
                                    edgelist=edges,
                                    width=scaled_weights,
                                    edge_color=color,
                                    alpha=0.6)
        
        # Draw labels for important nodes only
        centrality_threshold = 0.1  # Only label nodes with high centrality
        important_nodes = {}
        for node in G.nodes():
            if G.nodes[node].get('centrality', 0) > centrality_threshold:
                important_nodes[node] = G.nodes[node].get('label', '')
        
        nx.draw_networkx_labels(G, pos, labels=important_nodes, font_size=8, font_weight='bold')
        
        # Add a title and legend
        plt.title(f"Legal Knowledge Graph (ID: {graph_id})", fontsize=16)
        
        # Create custom legend
        node_patches = []
        for node_type, color in color_map.items():
            patch = plt.Line2D([0], [0], marker='o', color='w', markerfacecolor=color, markersize=10, label=node_type)
            node_patches.append(patch)
        
        edge_patches = []
        for edge_type, color in edge_colors.items():
            patch = plt.Line2D([0], [0], color=color, lw=2, label=edge_type)
            edge_patches.append(patch)
        
        plt.legend(handles=node_patches + edge_patches, loc='upper right', fontsize=8)
        
        # Save the visualization with high resolution
        plt.savefig(os.path.join(self.graph_dir, f"{graph_id}.png"), dpi=300, bbox_inches='tight')
        plt.close()
        
        # Also create an interactive HTML visualization using Pyvis
        try:
            from pyvis.network import Network
            
            # Create network
            net = Network(height="800px", width="100%", notebook=False, directed=True)
            
            # Add nodes
            for node in G.nodes():
                node_type = G.nodes[node].get('type', '')
                label = G.nodes[node].get('label', '')
                
                # Get node color
                color = color_map.get(node_type, 'gray')
                
                # Get node size based on centrality
                size = 20 + 30 * G.nodes[node].get('centrality', 0.5)
                
                # Add node with tooltip
                net.add_node(node, 
                            label=label, 
                            title=f"Type: {node_type}\nLabel: {label}", 
                            color=color, 
                            size=size)
            
            # Add edges
            for u, v in G.edges():
                edge_type = G.edges[u, v].get('label', '')
                weight = G.edges[u, v].get('weight', 1.0)
                confidence = G.edges[u, v].get('confidence', 1.0)
                
                # Get edge color
                color = edge_colors.get(edge_type, 'gray')
                
                # Add edge with tooltip
                net.add_edge(u, v, 
                            title=f"Type: {edge_type}\nConfidence: {confidence:.2f}", 
                            color=color, 
                            width=weight * 2)
            
            # Set physics options for better layout
            net.barnes_hut(gravity=-2000, central_gravity=0.3, spring_length=150)
            
            # Save the interactive visualization
            net.save_graph(os.path.join(self.graph_dir, f"{graph_id}.html"))
        except ImportError:
            print("Pyvis not available for HTML visualization. Skipping...")