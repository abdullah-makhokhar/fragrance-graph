// Shared type definitions for the application

export interface FragranceNode extends Fragrance {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}

export interface Fragrance {
  id: string;
  index: number;
  name: string;
  brand: string;
  country: string;
  gender: string;
  rating: number;
  rating_count: number;
  year: number | null;
  accords: string[];
  top_notes: string[];
  middle_notes: string[];
  base_notes: string[];
  perfumers: string[];
  cluster: string;
  url: string;
}

export interface Link {
  source: number | Fragrance;
  target: number | Fragrance;
  weight: number;
  similarity: string;
}

export interface GraphData {
  nodes: Fragrance[];
  links: Link[];
  metadata: {
    total_fragrances: number;
    total_connections: number;
    clusters: Record<string, any>;
    attributes: {
      brands: string[];
      genders: string[];
      accords: string[];
      years: number[];
    };
  };
}

export interface Filters {
  brands: Set<string>;
  genders: Set<string>;
  accords: Set<string>;
  minRating: number;
  maxRating: number;
  years: Set<number>;
}

export const DEFAULT_FILTERS: Filters = {
  brands: new Set(),
  genders: new Set(),
  accords: new Set(),
  minRating: 0,
  maxRating: 5,
  years: new Set(),
};
