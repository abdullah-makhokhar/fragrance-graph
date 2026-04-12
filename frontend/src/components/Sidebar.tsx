import React, { useState } from 'react';
import { GraphData, Filters } from '../types';

interface SidebarProps {
  graphData: GraphData;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefresh: () => void;
  onClearFilters: () => void;
  filteredCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  fragranceCount: number;
  onFragranceCountChange: (count: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  graphData,
  filters,
  setFilters,
  searchQuery,
  setSearchQuery,
  onRefresh,
  onClearFilters,
  filteredCount,
  darkMode,
  onToggleDarkMode,
  fragranceCount,
  onFragranceCountChange,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'filter'>('search');
  const [expandedSection, setExpandedSection] = useState<string | null>('brands');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const toggleFilter = (key: keyof Filters, value: any) => {
    const currentSet = filters[key] as Set<any>;
    const newSet = new Set(currentSet);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setFilters({ ...filters, [key]: newSet });
  };

  const { attributes } = graphData.metadata;

  return (
    <div className="w-80 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl z-20 overflow-hidden">
      {/* App Header */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-display tracking-tight">
              Fragrance Spider
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">
                {filteredCount} Active Nodes
              </span>
            </div>
          </div>
          <button
            onClick={onToggleDarkMode}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-lg"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="px-6 flex gap-1 mb-4">
        {[
          { id: 'search', icon: '🔍', label: 'Search' },
          { id: 'filter', icon: '⚡', label: 'Filters' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-8 custom-scrollbar">
        {activeTab === 'search' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="relative group">
              <input
                type="text"
                placeholder="Find a fragrance..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40">🔍</span>
            </div>

            <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl border border-blue-100/50 dark:border-blue-900/30">
              <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">Discovery Tips</h4>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 opacity-60 mt-0.5">•</span>
                  Try brands like <strong className="text-slate-900 dark:text-slate-200">"Chanel"</strong> or <strong className="text-slate-900 dark:text-slate-200">"Dior"</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 opacity-60 mt-0.5">•</span>
                  Search notes like <strong className="text-slate-900 dark:text-slate-200">"vanilla"</strong> or <strong className="text-slate-900 dark:text-slate-200">"oud"</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 opacity-60 mt-0.5">•</span>
                  <strong className="text-blue-600 dark:text-blue-400">Search highlights</strong> matches instead of hiding nodes!
                </li>
              </ul>
            </div>
            
            <button
               onClick={onRefresh}
               className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
            >
              Regenerate Layout
            </button>

            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
               <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Graph Density</h4>
                  <span className="text-blue-600 font-bold text-sm">{fragranceCount} Nodes</span>
               </div>
               <input
                 type="range"
                 min="50"
                 max="500"
                 step="50"
                 value={fragranceCount}
                 onChange={e => onFragranceCountChange(parseInt(e.target.value))}
                 className="w-full accent-blue-600"
               />
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            {/* Filter Sections */}
            {[
              { id: 'brands', label: 'Brands', attr: attributes.brands },
              { id: 'genders', label: 'Gender', attr: attributes.genders },
              { id: 'seasons', label: 'Season', attr: attributes.seasons },
              { id: 'occasions', label: 'Occasion', attr: attributes.occasions },
              { id: 'accords', label: 'Accords', attr: attributes.accords },
            ].map((section) => (
              <div key={section.id} className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50">
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full px-4 py-3 flex justify-between items-center transition-all ${
                    expandedSection === section.id ? 'bg-slate-50 dark:bg-slate-800' : ''
                  }`}
                >
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{section.label}</span>
                  <span className={`text-[10px] transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`}>▼</span>
                </button>
                
                {expandedSection === section.id && (
                  <div className="p-4 pt-0 max-h-60 overflow-y-auto">
                    <div className="flex flex-wrap gap-2 mt-3">
                      {(section.attr || []).slice(0, 100).map((val: any) => (
                        <button
                          key={val}
                          onClick={() => toggleFilter(section.id as any, val)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border ${
                            (filters[section.id as keyof Filters] as Set<any>).has(val)
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Price Slider */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 font-display">
               <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Price Range (Avg)</h4>
                  <span className="text-blue-600 font-extrabold text-sm">${filters.priceRange[1]}</span>
               </div>
               <input
                 type="range"
                 min="0"
                 max="500"
                 step="10"
                 value={filters.priceRange[1]}
                 onChange={e => setFilters({ ...filters, priceRange: [0, parseInt(e.target.value)] })}
                 className="w-full accent-blue-600 h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700"
               />
               <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  <span>$0</span>
                  <span>$500+</span>
               </div>
            </div>

            {/* Rating Slider */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
               <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Min Rating</h4>
                  <span className="text-blue-600 font-bold text-sm">★ {filters.minRating.toFixed(1)}</span>
               </div>
               <input
                 type="range"
                 min="0"
                 max="5"
                 step="0.1"
                 value={filters.minRating}
                 onChange={e => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                 className="w-full accent-blue-600"
               />
            </div>
          </div>
        )}
      </div>

      {/* Global Actions */}
      <div className="p-6 pt-4 border-t border-slate-200 dark:border-slate-800 glass">
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-500 transition-colors uppercase tracking-widest"
          >
            <span>↺</span> Reset All Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
