import React from 'react';
import { Fragrance } from '../types';

interface DetailPanelProps {
  node: Fragrance;
  onClose: () => void;
  darkMode: boolean;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ node, onClose, darkMode }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="relative p-8 pb-6 overflow-hidden">
          <div className="absolute top-0 right-0 p-6">
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all hover:rotate-90"
            >
              ✕
            </button>
          </div>

          <div className="pr-12">
            <div className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-3">
              {node.gender}
            </div>
            <h2 className="text-4xl font-bold font-display text-slate-900 dark:text-white leading-tight tracking-tight">
              {node.name}
            </h2>
            <div className="text-xl font-medium text-slate-400 dark:text-slate-500 mt-1">
              {node.brand}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-8 pb-8 overflow-y-auto space-y-8 custom-scrollbar">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rating</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-amber-500">★ {node.rating.toFixed(1)}</span>
                <span className="text-[10px] text-slate-400 font-medium">/ 5.0</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Country</div>
              <div className="text-lg font-bold text-slate-700 dark:text-slate-200 truncate">{node.country}</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Launch</div>
              <div className="text-lg font-bold text-slate-700 dark:text-slate-200">{node.year || 'Unknown'}</div>
            </div>
          </div>

          {/* Accords Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1 h-3 bg-blue-500 rounded-full"></span>
              Main Accords
            </h4>
            <div className="flex flex-wrap gap-2">
              {node.accords.map((accord) => (
                <span 
                  key={accord} 
                  className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700"
                >
                  {accord}
                </span>
              ))}
            </div>
          </div>

          {/* Notes Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">
                <span>🌿</span> Top Notes
              </div>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 font-medium">
                {node.top_notes.map(note => <li key={note}>• {note}</li>)}
              </ul>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest">
                <span>🌸</span> Heart Notes
              </div>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 font-medium">
                {node.middle_notes.map(note => <li key={note}>• {note}</li>)}
              </ul>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-amber-900 dark:text-amber-500 uppercase tracking-widest">
                <span>🪵</span> Base Notes
              </div>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 font-medium">
                {node.base_notes.map(note => <li key={note}>• {note}</li>)}
              </ul>
            </div>
          </div>

          {/* Perfumers */}
          {node.perfumers.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Creators</div>
              <div className="text-sm text-slate-600 dark:text-slate-300 font-medium italic">
                {node.perfumers.join(', ')}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 pt-0 mt-auto">
          <a
            href={node.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.01] transition-transform shadow-2xl"
          >
            <span>View on Fragrantica</span>
            <span className="text-xl">→</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default DetailPanel;
