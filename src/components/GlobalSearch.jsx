import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, FileText, ChevronRight, Lock, Activity, 
  Filter, Calendar, User, Hash, Sparkles, X, LayoutGrid, List
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const GlobalSearch = ({ navigate }) => {
  const { documents, userRole, auditLogs, setActiveDocId } = useApp();
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  // RBAC: Restricted users can't see 'Legal' documents
  const accessibleDocs = userRole === 'Restricted' 
    ? documents.filter(d => d.dept !== 'Legal') 
    : documents;

  const results = useMemo(() => {
    if (!query.trim()) return [];
    
    return accessibleDocs.filter(doc => {
      const q = query.toLowerCase();
      const matchName = doc.name.toLowerCase().includes(q);
      const matchDept = doc.dept.toLowerCase().includes(q);
      const matchOwner = doc.owner?.toLowerCase().includes(q) || false;
      const matchContent = doc.content?.toLowerCase().includes(q) || doc.textContent?.toLowerCase().includes(q) || false;
      
      const textMatch = matchName || matchDept || matchOwner || matchContent;
      
      if (!textMatch) return false;
      
      if (filterType === 'Documents') return true;
      if (filterType === 'Drafts') return doc.status === 'draft';
      if (filterType === 'Approved') return doc.status === 'approved';
      if (filterType === 'Sensitive') return doc.sensitivity === 'Confidential' || doc.sensitivity === 'Highly Confidential';
      
      return true; // 'All'
    });
  }, [query, filterType, accessibleDocs]);

  const handleOpenDoc = (id) => {
    setActiveDocId(id);
    navigate('collab');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-8 p-4 md:p-8"
    >
      {/* PREMIUM SEARCH HEADER */}
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
          <Sparkles size={12} /> AI-Powered Discovery Engine
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Search Everything</h2>
        <p className="text-slate-500 text-sm max-w-xl mx-auto font-medium leading-relaxed">
          Access high-fidelity documents, real-time collaboration nodes, and system archives from a single interface.
        </p>
      </div>

      {/* SEARCH BOX */}
      <div className="relative group">
        <div className="absolute inset-0 bg-emerald-500/5 blur-2xl rounded-[3rem] opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
        <div className="card p-4 shadow-2xl relative rounded-[2rem] border-2 border-slate-900 overflow-hidden bg-white z-10 transition-all group-focus-within:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
              <Search size={24} />
            </div>
            <input 
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents, content, or collaborators..."
              className="flex-1 bg-transparent py-4 outline-none text-xl font-black text-slate-900 placeholder:text-slate-300"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
            )}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${showFilters ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              <Filter size={14} /> Filter
            </button>
          </div>
          
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-slate-100 mt-4 pt-4 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Status:</div>
                  {['All', 'Approved', 'Drafts', 'Sensitive'].map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        filterType === type 
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                  <div className="ml-auto flex gap-2">
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400'}`}><List size={16}/></button>
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400'}`}><LayoutGrid size={16}/></button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RESULTS */}
      <AnimatePresence mode="wait">
        {query ? (
          <motion.div 
            key="results"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between px-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Found {results.length} results for "{query}"
              </h3>
            </div>
            
            {results.length === 0 ? (
              <div className="card py-24 text-center rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white/50">
                <Search className="mx-auto text-slate-200 h-16 w-16 mb-4" />
                <h4 className="text-lg font-black text-slate-900 mb-2">No Matches Found</h4>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'}>
                {results.map(doc => (
                  <motion.div 
                    layout
                    key={doc.id} 
                    onClick={() => handleOpenDoc(doc.id)}
                    className={`group cursor-pointer transition-all ${
                      viewMode === 'grid' 
                        ? 'bg-white p-6 rounded-[2rem] border-2 border-slate-100 hover:border-slate-900 hover:shadow-2xl' 
                        : 'bg-white p-5 rounded-2xl border-2 border-slate-50 hover:border-slate-900 hover:shadow-lg flex items-center justify-between'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                        <FileText size={24} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-base text-slate-900 truncate group-hover:text-emerald-600 transition-colors">{doc.name}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{doc.dept}</span>
                          <span className="text-[9px] font-bold text-slate-400">{doc.owner || 'System'}</span>
                          {doc.sensitivity === 'Confidential' && <span className="flex items-center gap-1 text-[9px] font-black text-red-500 uppercase"><Lock size={10} /> Secure</span>}
                        </div>
                      </div>
                    </div>
                    {viewMode === 'list' && (
                      <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${doc.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {doc.status}
                        </div>
                        <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="suggestions"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="pt-12 grid grid-cols-1 md:grid-cols-2 gap-10"
          >
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                <Activity size={14} className="text-emerald-500" /> Recent Activity
              </h3>
              <div className="space-y-4">
                {auditLogs.slice(0, 4).map(log => (
                  <div key={log.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><RefreshCcw size={16} /></div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">{log.user}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{log.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                 <Calendar size={14} className="text-blue-500" /> Smart Suggestions
               </h3>
               <div className="flex flex-wrap gap-3">
                 {['Financial Reports', 'Legal Briefs', 'Personnel Data', 'Q3 Roadmaps', 'Security Audits', 'Stakeholder Deck'].map(tag => (
                   <button key={tag} onClick={() => setQuery(tag)} className="px-5 py-3 rounded-2xl bg-white border-2 border-slate-100 text-xs font-black text-slate-600 hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                     {tag}
                   </button>
                 ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default GlobalSearch;
