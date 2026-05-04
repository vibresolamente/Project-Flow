import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Users, Hash, Command, X, ArrowRight, Zap, Shield } from 'lucide-react';
import { useApp } from '../context/AppContext';

const CommandPalette = ({ isOpen, onClose }) => {
  const { documents, systemUsers, groups, setActiveDocId, setActiveTab } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ docs: [], users: [], groups: [] });

  useEffect(() => {
    if (!query) {
      setResults({ docs: [], users: [], groups: [] });
      return;
    }

    const q = query.toLowerCase();
    setResults({
      docs: documents.filter(d => d.name.toLowerCase().includes(q)).slice(0, 5),
      users: systemUsers.filter(u => u.name.toLowerCase().includes(q)).slice(0, 5),
      groups: groups.filter(g => g.name.toLowerCase().includes(q)).slice(0, 5),
    });
  }, [query, documents, systemUsers, groups]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : onClose(true); // Toggle logic handled by parent
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] px-6 bg-slate-900/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200"
      >
        <div className="p-6 border-b border-slate-100 flex items-center gap-4">
          <Search size={24} className="text-slate-400" />
          <input 
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents, people, or commands... (Ctrl+K)"
            className="flex-1 bg-transparent border-none outline-none text-lg font-black text-slate-900 placeholder:text-slate-300"
          />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl">
             <span className="text-[10px] font-black text-slate-400 uppercase">ESC to close</span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 scrollbar-hide">
          {!query && (
            <div className="p-8 text-center">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200"><Command size={32} /></div>
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Global Ingest Node Ready</p>
               <p className="text-[10px] font-bold text-slate-300 mt-2">Start typing to search the whole ProjectFlow KE ecosystem.</p>
            </div>
          )}

          {query && (
            <div className="space-y-6">
              {/* Documents */}
              {results.docs.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Documents</p>
                  <div className="space-y-1">
                    {results.docs.map(doc => (
                      <button key={doc.id} onClick={() => { setActiveDocId(doc.id); setActiveTab('portal'); onClose(); }} className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 group transition-all">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform"><FileText size={20} /></div>
                        <div className="flex-1 text-left">
                           <p className="text-xs font-black text-slate-900">{doc.name}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">{doc.dept} • v{doc.version}</p>
                        </div>
                        <ArrowRight size={16} className="text-slate-200 group-hover:text-emerald-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Groups */}
              {results.groups.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Workspaces</p>
                  <div className="space-y-1">
                    {results.groups.map(g => (
                      <button key={g.id} onClick={() => { setActiveTab('portal'); onClose(); }} className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 group transition-all">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Users size={20} /></div>
                        <div className="flex-1 text-left">
                           <p className="text-xs font-black text-slate-900">{g.name}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">{g.members.length} Members • {g.privacy}</p>
                        </div>
                        <ArrowRight size={16} className="text-slate-200 group-hover:text-blue-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Quick Commands</p>
                <div className="grid grid-cols-2 gap-2">
                   <button onClick={() => { setActiveTab('vault'); onClose(); }} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl hover:bg-slate-900 hover:text-white transition-all group">
                      <Shield size={16} className="text-slate-400 group-hover:text-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-tight">Access Vault</span>
                   </button>
                   <button onClick={() => { setActiveTab('workflows'); onClose(); }} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl hover:bg-slate-900 hover:text-white transition-all group">
                      <Zap size={16} className="text-slate-400 group-hover:text-amber-400" />
                      <span className="text-[10px] font-black uppercase tracking-tight">Active Workflows</span>
                   </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
           <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase"><span className="px-1 py-0.5 bg-white border border-slate-200 rounded shadow-sm text-slate-900">↑↓</span> to navigate</div>
              <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase"><span className="px-1 py-0.5 bg-white border border-slate-200 rounded shadow-sm text-slate-900">ENTER</span> to select</div>
           </div>
           <div className="text-[9px] font-black text-slate-300 uppercase">ProjectFlow Search Engine v4.0</div>
        </div>
      </motion.div>
    </div>
  );
};

export default CommandPalette;
