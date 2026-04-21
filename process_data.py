"""
Data preprocessing script for fragrance graph visualization.
Processes fragrance data, calculates similarity, and generates graph structure.
"""

import pandas as pd
import json
import numpy as np
from typing import List, Dict, Set, Tuple
from collections import defaultdict
import sys

# Configuration
TOP_N_FRAGRANCES = 500  # Number of top fragrances by rating count (configurable)
MIN_SIMILARITY = 0.01   # Minimum similarity threshold - connect if ANY accord shared
MAX_CONNECTIONS_PER_NODE = 8  # Limit connections to reduce messiness


def load_data(csv_path: str) -> pd.DataFrame:
    """Load fragrance data from CSV."""
    try:
        # Try different encodings
        encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']
        df = None
        for encoding in encodings:
            try:
                df = pd.read_csv(csv_path, delimiter=';', encoding=encoding)
                print(f"✓ Loaded {len(df)} fragrances from {csv_path} (encoding: {encoding})")
                return df
            except:
                continue
        
        if df is None:
            raise Exception("Could not load CSV with any encoding")
    except Exception as e:
        print(f"✗ Error loading data: {e}")
        sys.exit(1)


def clean_accords(accord_str: str) -> Set[str]:
    """Extract and clean accords from a string."""
    if pd.isna(accord_str) or accord_str == '':
        return set()
    
    # Split by semicolon, strip whitespace, remove empty strings, lowercase
    accords = set()
    for accord in str(accord_str).split(';'):
        accord = accord.replace('-', ' ').strip().lower()
        if accord and accord != 'unknown':
            accords.add(accord)
    return accords


def clean_notes(notes_str: str) -> Set[str]:
    """Extract and clean notes from a string (Top, Middle, Base)."""
    if pd.isna(notes_str) or notes_str == '':
        return set()
    
    # Split by comma, strip whitespace, remove empty strings, lowercase
    notes = set()
    for note in str(notes_str).split(','):
        note = note.replace('-', ' ').strip().lower()
        if note and note != 'unknown':
            notes.add(note)
    return notes


def extract_all_attributes(df: pd.DataFrame) -> Dict:
    """Extract unique values for all filterable attributes."""
    attributes = {
        'brands': sorted(df['Brand'].dropna().unique().tolist()),
        'genders': sorted(df['Gender'].dropna().unique().tolist()),
        'years': sorted([int(y) for y in df['Year'].dropna() if str(y).isdigit()]),
        'accords': set(),
        'notes': set(),
        'countries': sorted(df['Country'].dropna().unique().tolist()),
        'seasons': ['Spring', 'Summer', 'Autumn', 'Winter'],
        'occasions': ['Office', 'Casual', 'Date Night', 'Formal', 'Night Out']
    }
    
    # Collect all unique accords and notes
    for col in ['mainaccord1', 'mainaccord2', 'mainaccord3', 'mainaccord4', 'mainaccord5']:
        for accord in df[col].dropna().unique():
            attributes['accords'].update(clean_accords(str(accord)))
    
    for col in ['Top', 'Middle', 'Base']:
        for notes_str in df[col].dropna().unique():
            attributes['notes'].update(clean_notes(str(notes_str)))
    
    attributes['accords'] = sorted(list(attributes['accords']))
    attributes['notes'] = sorted(list(attributes['notes']))
    
    return attributes


def select_top_fragrances(df: pd.DataFrame, n: int = TOP_N_FRAGRANCES) -> pd.DataFrame:
    """Select top N fragrances by rating count."""
    df_top = df.nlargest(n, 'Rating Count').reset_index(drop=True)
    print(f"✓ Selected top {len(df_top)} fragrances by rating count")
    return df_top


def calculate_similarity(accords_a: Set[str], accords_b: Set[str]) -> float:
    """
    Calculate Jaccard similarity between two sets of accords.
    Returns a value between 0 and 1.
    """
    if not accords_a and not accords_b:
        return 0.0
    
    intersection = len(accords_a & accords_b)
    union = len(accords_a | accords_b)
    
    return intersection / union if union > 0 else 0.0


def build_graph_structure(df: pd.DataFrame) -> Tuple[List[Dict], List[Dict]]:
    """
    Build nodes and edges for the graph.
    Uses accords as the basis for similarity.
    Limits connections and adds cluster labels.
    """
    nodes = []
    edges = []
    
    # Extract accordion data for each fragrance
    fragrance_accords = []
    for idx, row in df.iterrows():
        accords = set()
        for col in ['mainaccord1', 'mainaccord2', 'mainaccord3', 'mainaccord4', 'mainaccord5']:
            accords.update(clean_accords(row[col]))
        
        fragrance_accords.append(accords)
        
        # Determine cluster (primary accord)
        cluster = list(accords)[0] if accords else 'unclassified'
        
        # New Enriched Data
        seasons = assign_seasons(accords)
        notes = set(list(clean_notes(row['Top'])) + list(clean_notes(row['Middle'])) + list(clean_notes(row['Base'])))
        occasions = assign_occasions(accords, notes)
        price = assign_price(row['Brand'])
        
        node = {
            'id': f"fragrance_{idx}",
            'index': idx,
            'name': row['Perfume'],
            'brand': row['Brand'],
            'country': row['Country'],
            'gender': row['Gender'],
            'rating': float(row['Rating Value'].replace(',', '.')) if pd.notna(row['Rating Value']) else 0,
            'rating_count': int(row['Rating Count']) if pd.notna(row['Rating Count']) else 0,
            'year': int(row['Year']) if pd.notna(row['Year']) and str(row['Year']).isdigit() else None,
            'accords': sorted(list(accords)),
            'top_notes': sorted(list(clean_notes(row['Top']))),
            'middle_notes': sorted(list(clean_notes(row['Middle']))),
            'base_notes': sorted(list(clean_notes(row['Base']))),
            'perfumers': [p.strip() for p in str(row['Perfumer1']).split(',') if p and p != 'unknown'],
            'cluster': cluster,
            'seasons': seasons,
            'occasions': occasions,
            'price': price,
            'url': row['url']
        }
        nodes.append(node)
    
    # Build edges based on accord overlap
    connection_count = defaultdict(int)  # Track connections per node
    edge_list = []  # Temporary list for sorting
    
    for i in range(len(fragrance_accords)):
        for j in range(i + 1, len(fragrance_accords)):
            shared_accords = fragrance_accords[i] & fragrance_accords[j]
            if len(shared_accords) > 0:  # Connect if ANY accords are shared
                similarity = calculate_similarity(fragrance_accords[i], fragrance_accords[j])
                edge_list.append({
                    'source': i,
                    'target': j,
                    'weight': round(similarity, 3),
                    'similarity': f"{len(shared_accords)} shared accord{'s' if len(shared_accords) > 1 else ''}"
                })
    
    # Sort edges by similarity (descending)
    edge_list.sort(key=lambda x: x['weight'], reverse=True)
    
    # Add edges respecting max connections per node
    for edge in edge_list:
        if (connection_count[edge['source']] < MAX_CONNECTIONS_PER_NODE and
            connection_count[edge['target']] < MAX_CONNECTIONS_PER_NODE):
            edges.append(edge)
            connection_count[edge['source']] += 1
            connection_count[edge['target']] += 1
    
    # Ensure connectivity for isolated nodes
    adjacency = defaultdict(set)
    for edge in edges:
        adjacency[edge['source']].add(edge['target'])
        adjacency[edge['target']].add(edge['source'])
    
    for i in range(len(nodes)):
        if i not in adjacency or len(adjacency[i]) == 0:
            # Find closest fragrance
            best_j = -1
            best_similarity = -1
            for j in range(len(nodes)):
                if i != j:
                    sim = calculate_similarity(fragrance_accords[i], fragrance_accords[j])
                    if sim > best_similarity:
                        best_similarity = sim
                        best_j = j
            
            if best_j >= 0:
                shared_accords = fragrance_accords[i] & fragrance_accords[best_j]
                edge = {
                    'source': min(i, best_j),
                    'target': max(i, best_j),
                    'weight': round(best_similarity, 3),
                    'similarity': f"{len(shared_accords)} shared accord{'s' if len(shared_accords) > 1 else ''}"
                }
                # Check for duplicate
                is_duplicate = any(
                    (e['source'] == edge['source'] and e['target'] == edge['target']) or
                    (e['target'] == edge['source'] and e['source'] == edge['target'])
                    for e in edges
                )
                if not is_duplicate:
                    edges.append(edge)
    
    return nodes, edges


def assign_seasons(accords: Set[str]) -> List[str]:
    """Assign multiple seasons based on accords."""
    accords_lower = set(a.lower() for a in accords)
    seasons = []
    
    season_map = {
        'Winter': {'woody', 'leather', 'oud', 'vanilla', 'amber', 'warm spicy', 'smoky', 'animalic', 'cinnamon'},
        'Summer': {'citrus', 'fresh', 'aquatic', 'ozonic', 'fruity', 'tropical', 'coconut', 'sea water'},
        'Spring': {'floral', 'white floral', 'fresh', 'green', 'herbal', 'rose', 'lily-of-the-valley'},
        'Autumn': {'amber', 'warm spicy', 'woody', 'earthy', 'powdery', 'tobacco', 'patchouli', 'honey'},
    }
    
    for season, season_accords in season_map.items():
        if len(accords_lower & season_accords) >= 1:
            seasons.append(season)
            
    return seasons if seasons else ['Any']


def assign_occasions(accords: Set[str], notes: Set[str]) -> List[str]:
    """Assign occasions based on accords and notes."""
    all_traits = set(a.lower() for a in accords) | set(n.lower() for n in notes)
    occasions = []
    
    occasion_map = {
        'Office': {'fresh', 'citrus', 'musky', 'clean', 'soapy', 'light', 'white floral', 'tea'},
        'Date Night': {'sweet', 'vanilla', 'amber', 'warm spicy', 'rose', 'floral', 'powdery', 'chocolate'},
        'Night Out': {'oud', 'leather', 'intense', 'smoky', 'animalic', 'tobacco', 'boozy', 'incense'},
        'Casual': {'fruity', 'citrus', 'fresh', 'green', 'aquatic', 'aromatic', 'mint'},
        'Formal': {'woody', 'floral', 'musky', 'powdery', 'aldehydic', 'iris', 'sandalwood'},
    }
    
    for occasion, traits in occasion_map.items():
        if len(all_traits & traits) >= 1:
            occasions.append(occasion)
            
    return occasions if occasions else ['Daily Wear']


def assign_price(brand: str) -> float:
    """Estimate average price based on brand prestige."""
    brand = str(brand).lower()
    
    # Niche / Ultra-Premium
    if any(b in brand for b in ['xerjoff', 'roja', 'amouage', 'creed', 'boadicea', 'micallef', 'bond no', 'penhaligon', 'kilian', 'frederic malle', 'clive christian']):
        return round(np.random.uniform(250, 450), 2)
    
    # Designer High-End
    if any(b in brand for b in ['chanel', 'dior', 'tom ford', 'hermes', 'guerlain', 'ysl', 'yves saint', 'armani', 'prada', 'valentino', 'viktor', 'mugler']):
        return round(np.random.uniform(120, 220), 2)
    
    # Designer Mid-Range
    if any(b in brand for b in ['boss', 'hugo', 'ck', 'calvin klein', 'paco rabanne', 'dolce', 'gucci', 'versace', 'givenchy', 'burberry', 'lancome', 'montblanc']):
        return round(np.random.uniform(70, 130), 2)
    
    # Affordable / Mass Market
    if any(b in brand for b in ['avon', 'zara', 'nautica', 'davidoff', 'bath-body', 'lattafa', 'armaf', 'rasasi', 'brocard', 'faberlic', 'jeanne arthes', 'oriflame', 'natura']):
        return round(np.random.uniform(15, 55), 2)
    
    return round(np.random.uniform(40, 90), 2)  # Default average designer price


def calculate_cluster_statistics(nodes: List[Dict]) -> Dict:
    """Calculate statistics for each cluster."""
    clusters = defaultdict(list)
    for node in nodes:
        clusters[node['cluster']].append(node)
    
    stats = {}
    for cluster, cluster_nodes in clusters.items():
        stats[cluster] = {
            'count': len(cluster_nodes),
            'avg_rating': round(np.mean([n['rating'] for n in cluster_nodes]), 2),
            'brands': len(set(n['brand'] for n in cluster_nodes))
        }
    
    return stats


def save_graph_data(nodes: List[Dict], edges: List[Dict], attributes: Dict, 
                    output_path: str = 'frontend/public/graph_data.json'):
    """Save graph data to JSON file."""
    graph_data = {
        'nodes': nodes,
        'links': edges,
        'metadata': {
            'total_fragrances': len(nodes),
            'total_connections': len(edges),
            'clusters': calculate_cluster_statistics(nodes),
            'attributes': attributes,
            'generated_at': pd.Timestamp.now().isoformat()
        }
    }
    
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(graph_data, f, ensure_ascii=False, indent=2)
        print(f"✓ Saved graph data to {output_path}")
        return True
    except Exception as e:
        print(f"✗ Error saving graph data: {e}")
        return False


def main():
    """Main execution function."""
    global TOP_N_FRAGRANCES
    
    # Allow command-line argument for TOP_N
    if len(sys.argv) > 1:
        try:
            TOP_N_FRAGRANCES = int(sys.argv[1])
        except ValueError:
            print(f"Warning: Invalid TOP_N value. Using default {TOP_N_FRAGRANCES}")
    
    print("=" * 60)
    print("Fragrance Data Preprocessing Pipeline")
    print("=" * 60)
    
    # Load data
    df = load_data('data/fra_cleaned.csv')
    
    # Select top fragrances
    df_top = select_top_fragrances(df, TOP_N_FRAGRANCES)
    
    # Apply text formatting
    if 'Brand' in df_top.columns:
        df_top['Brand'] = df_top['Brand'].astype(str).str.replace('-', ' ').str.title()
    if 'Perfume' in df_top.columns:
        df_top['Perfume'] = df_top['Perfume'].astype(str).str.replace('-', ' ').str.title()
    
    # Extract attributes for filters
    print("Extracting fragrance attributes...")
    attributes = extract_all_attributes(df_top)
    print(f"  - {len(attributes['brands'])} brands")
    print(f"  - {len(attributes['accords'])} unique accords")
    print(f"  - {len(attributes['notes'])} unique notes")
    
    # Build graph structure
    print("Building graph structure...")
    nodes, edges = build_graph_structure(df_top)
    print(f"  - {len(nodes)} nodes (fragrances)")
    print(f"  - {len(edges)} edges (connections)")
    
    # Calculate density
    max_possible_edges = len(nodes) * (len(nodes) - 1) / 2
    density = len(edges) / max_possible_edges if max_possible_edges > 0 else 0
    print(f"  - Graph density: {density:.2%}")
    
    # Save to JSON
    print("Saving processed data...")
    save_graph_data(nodes, edges, attributes)
    
    print("=" * 60)
    print("Data preprocessing completed successfully!")
    print(f"Processed {TOP_N_FRAGRANCES} fragrances")
    print("=" * 60)


if __name__ == '__main__':
    main()
