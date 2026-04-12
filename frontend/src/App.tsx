import React, { useState, useEffect } from 'react';
import GraphVisualization from './components/GraphVisualization';
import Sidebar from './components/Sidebar';
import DetailPanel from './components/DetailPanel';
import './App.css';
import { Fragrance, GraphData, Filters } from './types';
import { CONFIG, DEFAULT_FILTERS } from './config';

function App() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [filteredData, setFilteredData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<Fragrance | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [darkMode, setDarkMode] = useState(CONFIG.defaults.defaultDarkMode);
  const [fragranceCount, setFragranceCount] = useState(CONFIG.defaults.fragranceCount);
  const [spotlightNode, setSpotlightNode] = useState<Fragrance | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());

  const handleNodeSelect = (node: Fragrance | null) => {
    setSelectedNode(node);
  };

  const handleSpotlight = (node: Fragrance | null) => {
    setSpotlightNode(node);
    if (node) {
      setSelectedNode(null); // Clear selection when entering spotlight
    }
  };

  // Load graph data
  useEffect(() => {
    const loadGraphData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/graph_data.json');
        if (!response.ok) throw new Error('Failed to load graph data');
        const data: GraphData = await response.json();
        setGraphData(data);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Error loading graph data: ${errorMessage}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadGraphData();
  }, []);

  // Helper to get ID from source/target which could be index, object, or ID string
  const getId = (ref: any, nodes: Fragrance[]) => {
    if (typeof ref === 'object' && ref !== null) return ref.id;
    if (typeof ref === 'number') return nodes[ref]?.id;
    return ref;
  };

  // Apply filters and search
  useEffect(() => {
    if (!graphData) return;

    // 1. Initial pool based on count
    let pool = [...graphData.nodes].sort((a, b) => b.rating_count - a.rating_count).slice(0, fragranceCount);

    // 2. Spotlight Filter (if active)
    if (spotlightNode) {
      const neighborIds = new Set<string>();
      neighborIds.add(spotlightNode.id);
      
      graphData.links.forEach(link => {
        const sId = getId(link.source, graphData.nodes);
        const tId = getId(link.target, graphData.nodes);
        if (sId === spotlightNode.id) neighborIds.add(tId);
        if (tId === spotlightNode.id) neighborIds.add(sId);
      });

      const spotlightNodes = graphData.nodes.filter(n => neighborIds.has(n.id));
      const spotlightLinks = graphData.links.filter(link => {
        const sId = getId(link.source, graphData.nodes);
        const tId = getId(link.target, graphData.nodes);
        return neighborIds.has(sId) && neighborIds.has(tId);
      }).map(link => ({
        ...link,
        source: getId(link.source, graphData.nodes),
        target: getId(link.target, graphData.nodes)
      }));

      setFilteredData({
        ...graphData,
        nodes: spotlightNodes,
        links: spotlightLinks,
      });
      setHighlightedIds(new Set()); // No highlighting in spotlight mode
      return;
    }

    // 3. Hard Filters (Remove nodes)
    let hardFiltered = pool.filter(node => {
      if (filters.brands.size > 0 && !filters.brands.has(node.brand)) return false;
      if (filters.genders.size > 0 && !filters.genders.has(node.gender)) return false;
      if (node.rating < filters.minRating || node.rating > filters.maxRating) return false;
      if (filters.years.size > 0 && node.year && !filters.years.has(node.year)) return false;
      return true;
    });

    // 4. Soft Filters / Highlighting (Dim nodes)
    const matchesSearch = (node: Fragrance) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        node.name.toLowerCase().includes(query) ||
        node.brand.toLowerCase().includes(query) ||
        node.accords.some(a => a.toLowerCase().includes(query)) ||
        node.country.toLowerCase().includes(query)
      );
    };

    const matchesAttributes = (node: Fragrance) => {
      if (filters.seasons.size > 0 && !node.seasons.some(s => filters.seasons.has(s))) return false;
      if (filters.occasions.size > 0 && !node.occasions.some(o => filters.occasions.has(o))) return false;
      if (node.price < filters.priceRange[0] || node.price > filters.priceRange[1]) return false;
      if (filters.accords.size > 0 && !node.accords.some(a => filters.accords.has(a))) return false;
      return true;
    };

    const isSoftFiltering = searchQuery !== '' || filters.seasons.size > 0 || filters.occasions.size > 0 || filters.accords.size > 0 || filters.priceRange[0] > 0 || filters.priceRange[1] < 500;
    
    const highlights = new Set<string>();
    if (isSoftFiltering) {
      hardFiltered.forEach(node => {
        if (matchesSearch(node) && matchesAttributes(node)) {
          highlights.add(node.id);
        }
      });
    }

    const hardFilteredIds = new Set(hardFiltered.map(n => n.id));
    const filteredLinks = graphData.links
      .filter(link => {
        const sourceId = getId(link.source, graphData.nodes);
        const targetId = getId(link.target, graphData.nodes);
        return sourceId && targetId && hardFilteredIds.has(sourceId) && hardFilteredIds.has(targetId);
      })
      .map(link => ({
        ...link,
        source: getId(link.source, graphData.nodes),
        target: getId(link.target, graphData.nodes)
      }));

    setFilteredData({
      ...graphData,
      nodes: hardFiltered.map(n => ({ ...n })),
      links: filteredLinks,
    });
    setHighlightedIds(isSoftFiltering ? highlights : new Set());

  }, [graphData, filters, searchQuery, fragranceCount, spotlightNode]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setSelectedNode(null);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950 font-display">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Fragrance Spider</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Summoning the fragrance universe...</p>
        </div>
      </div>
    );
  }

  if (error || !graphData) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950 font-display">
        <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Error Loading Data</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">{error}</p>
          <button onClick={() => window.location.reload()} className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl hover:scale-105 transition-all shadow-xl">Retry Loading</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${darkMode ? 'dark' : ''} overflow-hidden font-sans`}>
      <Sidebar
        graphData={graphData}
        filters={filters}
        setFilters={setFilters}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onRefresh={handleRefresh}
        onClearFilters={handleClearFilters}
        filteredCount={filteredData?.nodes.length || 0}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        fragranceCount={fragranceCount}
        onFragranceCountChange={setFragranceCount}
      />

      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-950 relative">
        <div className="flex-1 relative overflow-hidden">
          {filteredData && (
            <GraphVisualization
              refreshKey={refreshKey}
              data={filteredData}
              selectedNode={selectedNode}
              onNodeSelect={handleNodeSelect}
              darkMode={darkMode}
              highlightedIds={highlightedIds}
              isSpotlightMode={!!spotlightNode}
            />
          )}
        </div>

        {spotlightNode && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-5 duration-500">
            <button 
              onClick={() => setSpotlightNode(null)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
            >
              <span className="text-lg">✕</span>
              Exit Spotlight: {spotlightNode.name}
            </button>
          </div>
        )}

        <div className="absolute top-6 right-6 px-5 py-3 glass rounded-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-4 duration-500 pointer-events-none">
           <div className="flex items-center gap-6">
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Loaded</span>
                 <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{filteredData?.nodes.length}</span>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Connections</span>
                 <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{filteredData?.links.length}</span>
              </div>
           </div>
        </div>
      </div>

      {selectedNode && (
        <DetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          darkMode={darkMode}
          onSpotlight={handleSpotlight}
        />
      )}
    </div>
  );
}

export default App;
