import os
import json
import networkx as nx
import matplotlib.pyplot as plt
from datetime import datetime
import uuid
from config import Config
from legal_NER.legal_ner import extract_entities_from_judgment_text
import spacy
import re

class KnowledgeGraphService:
    """Service for generating and managing knowledge graphs from documents and chat sessions."""
    
    def __init__(self):
        self.graph_dir = os.path.join("D:/Legal_mind/backend/services/upload_know","graphs")
        os.makedirs(self.graph_dir, exist_ok=True)
    
    # def generate_document_graph(self, documents, graph_name=None, domain="legal"):
    #     """
    #     Generate a knowledge graph from one or more legal documents.
        
    #     Args:
    #         documents (list): List of document objects with content and metadata
    #         graph_name (str, optional): Custom name for the graph. Defaults to None.
    #         domain (str, optional): Domain context for entity extraction. Defaults to "legal".
            
    #     Returns:
    #         dict: Graph data with nodes and edges for visualization
    #     """
    #     import spacy
    #     legal_nlp = spacy.load('en_legal_ner_trf')
    #     preamble_spiltting_nlp = spacy.load('en_core_web_sm')
    #     run_type = 'sent'  # trade off between accuracy and runtime
    #     do_postprocess = True
    #     combined_doc = extract_entities_from_judgment_text(documents[0]["content"], legal_nlp, preamble_spiltting_nlp, run_type, do_postprocess)
    #     doc_data = combined_doc.to_json()
    #     print(combined_doc.ents,'line37 knowledge graph')
    #     # Extract nodes (entities)
    #     nodes = []
    #     node_ids = set()
    #     for ent in combined_doc.ents:
    #         node_id = f"{ent.label_}:{ent.start_char}:{ent.end_char}"
    #         if node_id not in node_ids:
    #             nodes.append({
    #                 "id": node_id,
    #                 "label": ent.text,
    #                 "type": ent.label_
    #             })
    #             node_ids.add(node_id)

    #     # Define possible relation types between entity pairs
    #     entity_relation_map = {
    #         ("PETITIONER", "CASE_NUMBER"): "files",
    #         ("RESPONDENT", "PETITIONER"): "opposes",
    #         ("JUDGE", "COURT"): "presides",
    #         ("LAWYER", "PETITIONER"): "represents",
    #         ("LAWYER", "RESPONDENT"): "represents",
    #         ("JUDGE", "JUDGMENT"): "delivers",
    #         ("STATUTE", "PROVISION"): "contains",
    #         ("PRECEDENT", "JUDGMENT"): "cited_in",
    #         ("ORG", "JUDGMENT"): "mentioned_in",
    #         ("WITNESS", "CASE_NUMBER"): "testifies_in",
    #         ("DATE", "JUDGMENT"): "event_date_of",
    #         ("OTHER_PERSON", "JUDGMENT"): "mentioned_in",
    #         ("GPE", "JUDGMENT"): "location_of",
    #         # Add more as needed
    #     }

    #     # Extract edges (use relation map for labels)
    #     edges = []
    #     for i in range(len(combined_doc.ents) - 1):
    #         source_ent = combined_doc.ents[i]
    #         target_ent = combined_doc.ents[i + 1]
    #         source_id = f"{source_ent.label_}:{source_ent.start_char}:{source_ent.end_char}"
    #         target_id = f"{target_ent.label_}:{target_ent.start_char}:{target_ent.end_char}"
    #         # Determine relation type
    #         relation = entity_relation_map.get((source_ent.label_, target_ent.label_), "related")
    #         edges.append({
    #             "source": source_id,
    #             "target": target_id,
    #             "label": relation
    #         })

    #     # If spaCy custom relations are present, add them as well
    #     if hasattr(combined_doc._, 'relations'):
    #         for rel in combined_doc._.relations:
    #             source = rel.get('source')
    #             target = rel.get('target')
    #             label = rel.get('label', 'related')
    #             if source and target:
    #                 edges.append({
    #                     "source": source,
    #                     "target": target,
    #                     "label": label
    #                 })
    #     # Prepare output for frontend visualization
    #     graph_data = {
    #         "nodes": nodes,
    #         "edges": edges
    #     }
    #     return graph_data
    def generate_document_graph(self, documents, graph_name=None, domain="legal"):
        """
        Generate a comprehensive knowledge graph from legal documents for deeper insights.
        
        Args:
            documents (list): List of document objects with content and metadata
            graph_name (str, optional): Custom name for the graph
            domain (str, optional): Domain context for entity extraction
                
        Returns:
            dict: Graph data with nodes and edges for visualization
        """
        import spacy
        import networkx as nx
        from collections import defaultdict
        
        # Load NER models
        legal_nlp = spacy.load('en_legal_ner_trf')
        preamble_splitting_nlp = spacy.load('en_core_web_sm')
        run_type = 'sent'  # For better accuracy
        do_postprocess = True
        
        # Process document with legal NER
        combined_doc = extract_entities_from_judgment_text(
            documents[0]["content"], 
            legal_nlp, 
            preamble_splitting_nlp, 
            run_type, 
            do_postprocess
        )
        
        # Extract nodes (entities) with enhanced attributes
        nodes = []
        node_ids = {}  # Map to track entity IDs
        entity_categories = defaultdict(list)  # Group entities by type
        
        # Process entities with more context
        for ent in combined_doc.ents:
            # Create a unique identifier using entity type and text to avoid duplicates
            unique_text = f"{ent.text.strip()}".lower()
            node_id = f"{ent.label_}:{hash(unique_text)}"
            
            # Skip if we already have this exact entity
            if node_id in node_ids:
                continue
                
            # Store the ID for this entity text 
            node_ids[node_id] = len(nodes)
            
            # Get context for the entity (text surrounding the entity)
            start_idx = max(0, ent.start_char - 100)
            end_idx = min(len(combined_doc.text), ent.end_char + 100)
            context = combined_doc.text[start_idx:end_idx]
            
            # Create node with rich attributes
            node = {
                "id": node_id,
                "label": ent.text,
                "type": ent.label_,
                "start_char": ent.start_char,
                "end_char": ent.end_char,
                "context": context,
                "paragraph_index": self._get_paragraph_index(combined_doc.text, ent.start_char),
                "section": self._identify_document_section(combined_doc.text, ent.start_char)
            }
            
            nodes.append(node)
            entity_categories[ent.label_].append(node_id)
        
        # Define relationship patterns based on legal domain knowledge
        relationship_patterns = {
            ("JUDGE", "JUDGMENT"): "delivers",
            ("JUDGE", "COURT"): "presides_in",
            ("PETITIONER", "RESPONDENT"): "versus",
            ("LAWYER", "PETITIONER"): "represents",
            ("LAWYER", "RESPONDENT"): "represents",
            ("PRECEDENT", "JUDGMENT"): "cited_in",
            ("STATUTE", "PROVISION"): "contains",
            ("WITNESS", "CASE_NUMBER"): "testifies_in",
            ("PETITIONER", "CASE_NUMBER"): "files",
            ("COURT", "JUDGMENT"): "issues",
            ("DATE", "JUDGMENT"): "date_of",
            ("COURT", "CASE_NUMBER"): "hears",
            ("STATUTE", "JUDGMENT"): "applied_in",
            ("PRECEDENT", "STATUTE"): "interprets",
            ("OTHER_PERSON", "JUDGMENT"): "mentioned_in",
            ("GPE", "JUDGMENT"): "jurisdiction_for"
        }
        
        # Create a graph for community detection and analysis
        G = nx.Graph()
        
        # Add nodes to the graph
        for node in nodes:
            G.add_node(
                node["id"], 
                label=node["label"], 
                type=node["type"], 
                start_char=node["start_char"]
            )
        
        # Extract edges based on multiple methods
        edges = []
        
        # Method 1: Proximity-based relationships
        # Connect entities that appear close to each other
        proximity_threshold = 200  # Characters apart
        for i, node1 in enumerate(nodes):
            for j, node2 in enumerate(nodes[i+1:], i+1):
                if abs(node1["start_char"] - node2["start_char"]) <= proximity_threshold:
                    # Check if we have a predefined relationship
                    rel_type = relationship_patterns.get((node1["type"], node2["type"]))
                    
                    if rel_type:
                        edge = {
                            "source": node1["id"],
                            "target": node2["id"],
                            "label": rel_type,
                            "weight": 1.0,
                            "confidence": 0.8
                        }
                        edges.append(edge)
                        G.add_edge(node1["id"], node2["id"], label=rel_type, weight=1.0)
                        
                    # Also connect entities of the same type that are close
                    elif node1["type"] == node2["type"]:
                        edge = {
                            "source": node1["id"],
                            "target": node2["id"],
                            "label": "related",
                            "weight": 0.7,
                            "confidence": 0.6
                        }
                        edges.append(edge)
                        G.add_edge(node1["id"], node2["id"], label="related", weight=0.7)
        
        # Method 2: Section-based relationships
        # Connect entities that appear in the same document section
        section_entities = defaultdict(list)
        for node in nodes:
            section_entities[node["section"]].append(node["id"])
        
        for section, entities in section_entities.items():
            if len(entities) >= 2:
                for i, entity1 in enumerate(entities):
                    for entity2 in entities[i+1:]:
                        node1_type = next(n["type"] for n in nodes if n["id"] == entity1)
                        node2_type = next(n["type"] for n in nodes if n["id"] == entity2)
                        
                        # Check if we already have this edge
                        if not G.has_edge(entity1, entity2):
                            rel_type = relationship_patterns.get((node1_type, node2_type))
                            if rel_type:
                                edge = {
                                    "source": entity1,
                                    "target": entity2,
                                    "label": rel_type,
                                    "weight": 0.8,
                                    "confidence": 0.7
                                }
                                edges.append(edge)
                                G.add_edge(entity1, entity2, label=rel_type, weight=0.8)
        
        # Method 3: Semantic pattern matching for special relationships
        self._add_semantic_relationships(combined_doc.text, nodes, edges, G)
        
        # Method 4: Type-specific relationships
        self._add_type_specific_relationships(entity_categories, nodes, edges, G)
        
        # Detect communities for clustering
        partition = {}  # Ensure partition is always defined
        if len(G.nodes()) > 2:
            try:
                import community as community_louvain
                partition = community_louvain.best_partition(G)
                nx.set_node_attributes(G, partition, 'community')
                
                # Add community information to nodes
                for i, node in enumerate(nodes):
                    nodes[i]['community'] = partition.get(node['id'], 0)
            except ImportError:
                # Skip community detection if package not available
                pass
        
        # Calculate centrality to identify key entities
        if len(G.nodes()) > 0:
            try:
                centrality = nx.betweenness_centrality(G) 
                nx.set_node_attributes(G, centrality, 'centrality')
                
                # Add centrality scores to nodes
                for i, node in enumerate(nodes):
                    nodes[i]['centrality'] = centrality.get(node['id'], 0)
            except:
                # Default centrality values if calculation fails
                for i, node in enumerate(nodes):
                    nodes[i]['centrality'] = 0.5
        
        # Prepare output for frontend visualization
        graph_data = {
            "nodes": nodes,
            "edges": edges,
            "statistics": {
                "node_count": len(nodes),
                "edge_count": len(edges),
                "entity_type_counts": {ent_type: len(ids) for ent_type, ids in entity_categories.items()},
                "community_count": max(partition.values()) + 1 if partition else 1
            },
            "key_entities": self._extract_key_entities(G)
        }
        
        return graph_data

    def _get_paragraph_index(self, text, char_pos):
        """Identify which paragraph an entity belongs to"""
        paragraphs = text.split('\n\n')
        current_pos = 0
        
        for i, para in enumerate(paragraphs):
            if current_pos <= char_pos < current_pos + len(para):
                return i
            current_pos += len(para) + 2  # +2 for the '\n\n'
        
        return 0  # Default to first paragraph

    def _identify_document_section(self, text, char_pos):
        """Identify which section of the legal document an entity belongs to"""
        sections = [
            "PREAMBLE", "FACTS", "ARGUMENTS", "ISSUES", 
            "ANALYSIS", "REASONING", "JUDGMENT", "CONCLUSION"
        ]
        
        # Simple heuristic: check presence of section keywords before the entity
        text_before = text[:char_pos].upper()
        
        for section in reversed(sections):  # Check from the end to find closest section
            if section in text_before:
                return section
        
        return "BODY"  # Default section

    def _add_semantic_relationships(self, text, nodes, edges, G):
        """Add relationships based on semantic patterns in legal text"""
        # Pattern for "cited by"
        citation_patterns = [
            r"([A-Za-z\s]+)\s+cited\s+([A-Za-z\s]+)",
            r"([A-Za-z\s]+)\s+relies\s+on\s+([A-Za-z\s]+)",
            r"([A-Za-z\s]+)\s+refers\s+to\s+([A-Za-z\s]+)",
            r"as\s+held\s+in\s+([A-Za-z\s]+)"
        ]
        
        # Pattern for "interpreted by"
        interpretation_patterns = [
            r"([A-Za-z\s]+)\s+interpreted\s+([A-Za-z\s]+)",
            r"interpretation\s+of\s+([A-Za-z\s]+)\s+by\s+([A-Za-z\s]+)",
            r"([A-Za-z\s]+)\s+construed\s+([A-Za-z\s]+)"
        ]
        
        # Process semantic patterns
        import re
        for pattern_list, relation_type in [
            (citation_patterns, "cites"),
            (interpretation_patterns, "interprets")
        ]:
            for pattern in pattern_list:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    # Try to find nodes that match the entities in the pattern
                    for i, node1 in enumerate(nodes):
                        if node1["label"] in match.group(0):
                            for j, node2 in enumerate(nodes):
                                if i != j and node2["label"] in match.group(0):
                                    if not G.has_edge(node1["id"], node2["id"]):
                                        edge = {
                                            "source": node1["id"],
                                            "target": node2["id"],
                                            "label": relation_type,
                                            "weight": 0.9,
                                            "confidence": 0.8
                                        }
                                        edges.append(edge)
                                        G.add_edge(node1["id"], node2["id"], label=relation_type, weight=0.9)

    def _add_type_specific_relationships(self, entity_categories, nodes, edges, G):
        """Add relationships specific to legal entity types"""
        # Connect all PROVISIONS to their STATUTE
        if entity_categories["STATUTE"] and entity_categories["PROVISION"]:
            for statute_id in entity_categories["STATUTE"]:
                statute_node = next(n for n in nodes if n["id"] == statute_id)
                
                for provision_id in entity_categories["PROVISION"]:
                    provision_node = next(n for n in nodes if n["id"] == provision_id)
                    
                    # Connect if the provision likely belongs to this statute
                    # (Simple heuristic - check if statute name appears in context)
                    if statute_node["label"].lower() in provision_node["context"].lower():
                        if not G.has_edge(statute_id, provision_id):
                            edge = {
                                "source": statute_id,
                                "target": provision_id,
                                "label": "contains",
                                "weight": 1.0,
                                "confidence": 0.9
                            }
                            edges.append(edge)
                            G.add_edge(statute_id, provision_id, label="contains", weight=1.0)
        
        # Connect PETITIONER and RESPONDENT in the same case
        if entity_categories["PETITIONER"] and entity_categories["RESPONDENT"]:
            for petitioner_id in entity_categories["PETITIONER"]:
                for respondent_id in entity_categories["RESPONDENT"]:
                    if not G.has_edge(petitioner_id, respondent_id):
                        edge = {
                            "source": petitioner_id,
                            "target": respondent_id,
                            "label": "versus",
                            "weight": 1.0,
                            "confidence": 0.95
                        }
                        edges.append(edge)
                        G.add_edge(petitioner_id, respondent_id, label="versus", weight=1.0)
        
        # Connect JUDGES to COURTS
        if entity_categories["JUDGE"] and entity_categories["COURT"]:
            for judge_id in entity_categories["JUDGE"]:
                for court_id in entity_categories["COURT"]:
                    if not G.has_edge(judge_id, court_id):
                        edge = {
                            "source": judge_id,
                            "target": court_id,
                            "label": "presides_in",
                            "weight": 0.9,
                            "confidence": 0.85
                        }
                        edges.append(edge)
                        G.add_edge(judge_id, court_id, label="presides_in", weight=0.9)
        
        # Connect PRECEDENTS to relevant STATUTES
        if entity_categories["PRECEDENT"] and entity_categories["STATUTE"]:
            for precedent_id in entity_categories["PRECEDENT"]:
                precedent_node = next(n for n in nodes if n["id"] == precedent_id)
                
                for statute_id in entity_categories["STATUTE"]:
                    statute_node = next(n for n in nodes if n["id"] == statute_id)
                    
                    # Connect if the statute appears in the precedent's context
                    if statute_node["label"].lower() in precedent_node["context"].lower():
                        if not G.has_edge(precedent_id, statute_id):
                            edge = {
                                "source": precedent_id,
                                "target": statute_id,
                                "label": "interprets",
                                "weight": 0.8,
                                "confidence": 0.7
                            }
                            edges.append(edge)
                            G.add_edge(precedent_id, statute_id, label="interprets", weight=0.8)

    def _extract_key_entities(self, nodes, limit=5):
        """Extract the most important entities in each category based on centrality"""
        # Group nodes by type
        nodes_by_type = {}
        for node in nodes:
            if node["type"] not in nodes_by_type:
                nodes_by_type[node["type"]] = []
            nodes_by_type[node["type"]].append(node)
        
        # Sort each group by centrality and take top N
        key_entities = {}
        for entity_type, entity_nodes in nodes_by_type.items():
            if hasattr(entity_nodes[0], 'centrality'):
                sorted_nodes = sorted(entity_nodes, key=lambda x: x.get("centrality", 0), reverse=True)
            else:
                sorted_nodes = entity_nodes  # If no centrality, use as is
                
            key_entities[entity_type] = sorted_nodes[:limit]
        
        return key_entities

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
                import community as community_louvain
                partition = community_louvain.best_partition(G)
                nx.set_node_attributes(G, partition, 'community')
                
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