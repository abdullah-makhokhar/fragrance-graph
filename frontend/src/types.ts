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
  seasons: string[];
  occasions: string[];
  price: number;
  url: string;
}

export interface Link {
  source: string | any;
  target: string | any;
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
      seasons: string[];
      occasions: string[];
    };
    generated_at: string;
  };
}

export interface Filters {
  brands: Set<string>;
  genders: Set<string>;
  accords: Set<string>;
  seasons: Set<string>;
  occasions: Set<string>;
  minRating: number;
  maxRating: number;
  priceRange: [number, number];
  years: Set<number>;
}

export const DEFAULT_FILTERS: Filters = {
  brands: new Set(),
  genders: new Set(),
  accords: new Set(),
  seasons: new Set(),
  occasions: new Set(),
  minRating: 0,
  maxRating: 5,
  priceRange: [0, 500],
  years: new Set(),
};
