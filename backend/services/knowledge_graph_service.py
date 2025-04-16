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
    
    def generate_document_graph(self, documents, graph_name=None):
        """
        Generate a knowledge graph from one or more documents.
        
        Args:
            documents (list): List of document objects with content and metadata
            graph_name (str, optional): Custom name for the graph. Defaults to None.
            
        Returns:
            dict: Graph information including ID, name, and file path
        """
        # Create a new graph
        G = nx.Graph()
        
        # Process each document
        for doc in documents:
            # Add document node
            doc_id = str(doc.get('_id', 'unknown'))
            doc_node_id = f"doc_{doc_id}"
            G.add_node(doc_node_id, 
                       label=doc.get('filename', f"Document {doc_id}"),
                       type='document')
            
            # Extract entities and relationships from document content
            content = doc.get('content', '')
            if not content and 'file_path' in doc:
                # Try to read content from file if not in document
                try:
                    with open(doc['file_path'], 'r', encoding='utf-8') as f:
                        content = f.read()
                except Exception as e:
                    print(f"Error reading file {doc['file_path']}: {e}")
                    content = f"Document {doc_id}"
            
            entities, relationships = self._extract_entities_and_relationships(content)
            
            # Add entities as nodes and connect to document
            for entity in entities:
                entity_node_id = f"entity_{doc_id}_{entity['id']}"
                G.add_node(entity_node_id, 
                           label=entity['label'], 
                           type=entity['type'])
                G.add_edge(doc_node_id, entity_node_id, label='contains')
            
            # Add relationships between entities
            for rel in relationships:
                source_id = f"entity_{doc_id}_{rel['source']}"
                target_id = f"entity_{doc_id}_{rel['target']}"
                if source_id in G and target_id in G:
                    G.add_edge(source_id, target_id, 
                               label=rel['label'],
                               weight=rel.get('weight', 1.0))
        
        # Generate a unique ID for the graph
        graph_id = str(uuid.uuid4())
        
        # Generate a name if not provided
        if not graph_name:
            graph_name = f"document_graph_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Save the graph as JSON
        graph_data = {
            'id': graph_id,
            'name': graph_name,
            'created_at': datetime.now().isoformat(),
            'document_ids': [str(doc.get('_id', '')) for doc in documents],
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