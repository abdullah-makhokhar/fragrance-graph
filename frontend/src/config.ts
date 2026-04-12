/**
 * Fragrance Spider - Global Configuration
 * 
 * This file contains all the tunable parameters for the visualization,
 * physics, and aesthetics of the Fragrance Spider project.
 */

export const CONFIG = {
  // Graph Physics (D3 Force Simulation)
  physics: {
    linkDistanceBase: 120,    // Base distance between nodes
    linkDistanceWeight: 80,   // How much similarity weight affects distance
    linkStrength: 0.5,        // Strength of the link force (0-1)
    chargeStrength: -4000,     // Repulsion force between nodes (negative = repels)
    chargeMaxDistance: 10000,  // Max distance for repulsion to act
    centerStrength: 0.5,      // Strength of force pulling to center
    collisionRadiusPlus: 8,   // Extra padding around nodes for collision
    velocityDecay: 0.4,       // Friction (0-1, higher = slower movement)
  },

  // Visual Aesthetics (Colors & Styling)
  style: {
    // Cluster colors (mapping accord name to hex color)
    clusterColors: {
      'rose': '#F43F5E',
      'citrus': '#F59E0B',
      'woody': '#78350F',
      'floral': '#EC4899',
      'fruity': '#8B5CF6',
      'white floral': '#FDA4AF',
      'aromatic': '#06B6D4',
      'fresh': '#10B981',
      'sweet': '#FCD34D',
      'vanilla': '#FDE68A',
      'amber': '#D97706',
      'earthy': '#4B5563',
      'musky': '#94A3B8',
      'leather': '#1E293B',
      'green': '#22C55E',
      'oud': '#581C87',
      'herbal': '#65A30D',
      'spicy': '#EF4444',
      'powdery': '#DDD6FE',
      'fresh spicy': '#2DD4BF',
      'warm spicy': '#B45309',
      'aquatic': '#3B82F6',
      'ozonic': '#60A5FA',
      'aldehydic': '#CBD5E1',
      'smoky': '#475569',
      'animalic': '#7C2D12',
      'metallic': '#94A3B8',
      'mineral': '#94A3B8',
      'unclassified': '#94A3B8',
    } as Record<string, string>,

    // Theme colors
    light: {
      bg: '#ffffff',
      linkDefault: '#b5b5b5ff',
      linkHover: '#F59E0B',
      text: '#1e293b',
      border: '#e2e8f0',
    },
    dark: {
      bg: '#0f172a',
      linkDefault: '#334155',
      linkHover: '#FBBF24',
      text: '#f1f5f9',
      border: '#1e293b',
    }
  },

  // Interaction Settings
  interaction: {
    zoomExtent: [0.05, 6] as [number, number], // Min and Max zoom levels
    magnificationRadius: 100,                 // Distance at which dock effect starts
    magnificationStrength: 1.5,               // Max size multiplier at cursor
    clickPickRadius: 25,                      // Mouse sensitivity for picking nodes
    labelZoomThreshold: 1.2,                  // Zoom level at which labels appear
  },

  // Node Sizing Constants
  node: {
    baseSize: 5,
    connectivityMultiplier: 2,
    ratingMultiplier: 3,
  },

  // Data & Filtering Defaults
  defaults: {
    fragranceCount: 200,      // Initial number of nodes to show
    minRating: 0,             // Default minimum rating filter
    maxRating: 5,             // Default maximum rating filter
    defaultDarkMode: true,    // Start in dark mode by default
    initialZoom: 0.1,        // Much more zoomed out by default
  }
};

export const DEFAULT_FILTERS = {
  brands: new Set<string>(),
  genders: new Set<string>(),
  accords: new Set<string>(),
  minRating: CONFIG.defaults.minRating,
  maxRating: CONFIG.defaults.maxRating,
  years: new Set<number>(),
};
