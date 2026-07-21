import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, HelpCircle, FileText, Video, Search, ChevronRight, ExternalLink,
  MessageSquare, Globe, Zap, ShieldCheck, ThumbsUp, ThumbsDown, Plus, Heading1, Heading2,
  List, Code, Quote, Trash2, ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const INITIAL_ARTICLES = [
  {
    id: '1',
    category: 'Guide',
    title: 'ProjectFlow v2.0 Ingest Protocol',
    content: '# Core Ingest Protocol\nEvery file entering the system is evaluated by the zero-trust engine.\n\n## Cryptographic Hash Assignment\nUpon landing in SharePoint, files receive a unique SHA-256 validation identifier.\n\n## AD Department Routing\nAccess boundaries are automatically established at point of ingest.',
    ratingUp: 12,
    ratingDown: 0
  },
  {
    id: '2',
    category: 'Policies',
    title: 'ISO 27001 Cryptographic Guidelines',
    content: '# ISO 27001 Key Governance\nStandard Operating Procedures for key generation and vault enclaves.\n\n## Enclave Sealing\nEnsure passwords contain sufficient entropy to bypass brute-force vectors.',
    ratingUp: 8,
    ratingDown: 1
  }
];

const KnowledgeBase = () => {
  const { userRole, currentUser, logAction } = useApp();

  const [articles, setArticles] = useState(INITIAL_ARTICLES);
  const [activeCat, setActiveCat] = useState('Guide');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Article Editor State
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // Selected article detail view
  const [viewArticleId, setViewArticleId] = useState(INITIAL_ARTICLES[0].id);

  const activeArticle = useMemo(() => {
    return articles.find(a => a.id === viewArticleId) || articles[0];
  }, [articles, viewArticleId]);

  // Filtering based on search and category
  const filteredArticles = useMemo(() => {
    let base = articles;
    if (activeCat) {
      base = base.filter(a => a.category === activeCat);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      base = base.filter(a => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q));
    }
    return base;
  }, [articles, activeCat, searchQuery]);

  // Table of Contents generator based on markdown headers
  const tableOfContents = useMemo(() => {
    if (!activeArticle) return [];
    const lines = activeArticle.content.split('\n');
    return lines
      .filter(line => line.startsWith('#'))
      .map(line => {
        const level = line.match(/^#+/)[0].length;
        const text = line.replace(/^#+\s*/, '');
        return { level, text };
      });
  }, [activeArticle]);

  // Rating actions
  const handleRate = (id, direction) => {
    setArticles(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          ratingUp: direction === 'up' ? a.ratingUp + 1 : a.ratingUp,
          ratingDown: direction === 'down' ? a.ratingDown + 1 : a.ratingDown
        };
      }
      return a;
    }));
    logAction(currentUser?.name, `Rated article ${direction}`, id);
  };

  // Add Notion Slash command mockups
  const insertSlashCommand = (cmd) => {
    const markdownMap = {
      h1: '\n# New Header 1\n',
      h2: '\n## New Header 2\n',
      list: '\n- List item 1\n- List item 2\n',
      code: '\n```javascript\n// code block\n```\n',
      quote: '\n> Secure Enclave Warning Quote\n'
    };
    setNewContent(p => p + (markdownMap[cmd] || ''));
  };

  const handleSaveArticle = () => {
    if (!newTitle.trim()) return;

    if (editingArticleId) {
      // Edit
      setArticles(prev => prev.map(a => a.id === editingArticleId ? { ...a, title: newTitle, content: newContent } : a));
      logAction(currentUser?.name, 'Edited Knowledge Article', newTitle);
      setEditingArticleId(null);
    } else {
      // Create new
      const nId = Date.now().toString();
      const nArt = {
        id: nId,
        category: activeCat,
        title: newTitle,
        content: newContent || '# New Article',
        ratingUp: 0,
        ratingDown: 0
      };
      setArticles(prev => [...prev, nArt]);
      setViewArticleId(nId);
      logAction(currentUser?.name, 'Created Knowledge Article', newTitle);
    }
    setNewTitle('');
    setNewContent('');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12">
      
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <BookOpen size={32} className="text-slate-900" />
            Knowledge Hub
          </h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mt-1">
            Notion-style wikis, Standard Operating Procedures, and corporate audit logs
          </p>
        </div>
        <button onClick={() => { setEditingArticleId('new'); setNewTitle(''); setNewContent(''); }}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-slate-900/10">
          <Plus size={14} /> Create Article
        </button>
      </div>

      {/* ── SEARCH CONTAINER ── */}
      <div className="bg-slate-900 p-8 rounded-[2rem] text-white relative overflow-hidden shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-xl space-y-4">
          <h3 className="text-xl font-black tracking-tight">Search Knowledge Ledger</h3>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search policies, SOPs, training manuals..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold outline-none placeholder:text-white/40 focus:bg-white focus:text-slate-900 transition-colors"
            />
          </div>
        </div>
        <BookOpen className="absolute -right-16 -bottom-16 h-72 w-72 text-white/5 rotate-12 pointer-events-none" />
      </div>

      {/* ── MAIN WORKSPACE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Category Tree Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Categories</h4>
            <div className="space-y-1">
              {['Guide', 'Policies', 'SOPs', 'Training'].map(cat => (
                <button key={cat} onClick={() => { setActiveCat(cat); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    activeCat === cat ? 'bg-slate-100 text-slate-900' : 'text-slate-450 hover:bg-slate-50'
                  }`}>
                  <span>{cat}</span>
                  <ChevronRight size={13} className={activeCat === cat ? 'text-slate-900' : 'text-slate-300'} />
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 bg-red-50 border border-red-100 rounded-3xl space-y-2">
            <h4 className="text-[10px] font-black text-red-800 uppercase tracking-widest">Incident Escalation</h4>
            <p className="text-[9px] text-red-600 font-bold uppercase leading-relaxed">Immediate secure line for operational anomalies.</p>
            <button className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors">Emergency Comms</button>
          </div>
        </div>

        {/* Article Workspace (Center and Right columns) */}
        <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Article Contents/Notion Editor (2 cols) */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between min-h-[450px]">
            
            {/* ARTICLE DISPLAY MODE */}
            {editingArticleId === null ? (
              activeArticle ? (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-xl font-black text-slate-950 leading-tight">{activeArticle.title}</h3>
                        <p className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded mt-1.5 inline-block uppercase tracking-wider">{activeArticle.category}</p>
                      </div>
                      <button onClick={() => { setEditingArticleId(activeArticle.id); setNewTitle(activeArticle.title); setNewContent(activeArticle.content); }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
                        <Edit3 size={15} />
                      </button>
                    </div>

                    <div className="prose prose-slate max-w-none text-xs leading-relaxed whitespace-pre-wrap font-sans text-slate-750 font-medium">
                      {activeArticle.content}
                    </div>
                  </div>

                  {/* Ratings */}
                  <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-6">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Was this guide helpful?</span>
                    <div className="flex items-center gap-3 text-xs font-black text-slate-600">
                      <button onClick={() => handleRate(activeArticle.id, 'up')} className="flex items-center gap-1.5 hover:text-slate-900"><ThumbsUp size={13} /> {activeArticle.ratingUp}</button>
                      <button onClick={() => handleRate(activeArticle.id, 'down')} className="flex items-center gap-1.5 hover:text-slate-900"><ThumbsDown size={13} /> {activeArticle.ratingDown}</button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center py-20 text-slate-400 italic text-xs">No article selected.</p>
              )
            ) : (
              /* NOTION-STYLE ARTICLE EDITOR MODE */
              <div className="space-y-5 flex-grow flex flex-col">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{editingArticleId === 'new' ? 'New Article Draft' : 'Edit Article Draft'}</span>
                  <button onClick={() => setEditingArticleId(null)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><X size={16} /></button>
                </div>

                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Article Title" className="w-full text-lg font-black outline-none border-b border-transparent focus:border-slate-100 pb-2" />
                
                {/* Notion format toolbar shortcuts */}
                <div className="flex items-center gap-1 bg-slate-50 p-1.5 border border-slate-150 rounded-xl shrink-0">
                  <button onClick={() => insertSlashCommand('h1')} title="Heading 1" className="p-1 hover:bg-white rounded"><Heading1 size={13} /></button>
                  <button onClick={() => insertSlashCommand('h2')} title="Heading 2" className="p-1 hover:bg-white rounded"><Heading2 size={13} /></button>
                  <button onClick={() => insertSlashCommand('list')} title="Bullet List" className="p-1 hover:bg-white rounded"><List size={13} /></button>
                  <button onClick={() => insertSlashCommand('code')} title="Code Block" className="p-1 hover:bg-white rounded"><Code size={13} /></button>
                  <button onClick={() => insertSlashCommand('quote')} title="Quote Block" className="p-1 hover:bg-white rounded"><Quote size={13} /></button>
                </div>

                <textarea value={newContent} onChange={e => setNewContent(e.target.value)} rows={12} placeholder="Write contents... Use slash commands formatting shortcuts above." className="w-full flex-grow bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono outline-none resize-none" />

                <button onClick={handleSaveArticle} className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all">
                  Seal Article to Hub
                </button>
              </div>
            )}

          </div>

          {/* Table of Contents & Related Panel (1 col) */}
          <div className="lg:col-span-1 bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm space-y-6">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Table of Contents</h4>
              <div className="space-y-2">
                {tableOfContents.map((toc, idx) => (
                  <p key={idx} style={{ pl: `${(toc.level - 1) * 3}px` }} className={`text-[10px] font-bold ${toc.level === 1 ? 'text-slate-800' : 'text-slate-450'}`}>
                    {toc.text}
                  </p>
                ))}
                {tableOfContents.length === 0 && <p className="text-[10px] text-slate-400 italic">No headings in document.</p>}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Related Guides</h4>
              <div className="space-y-3">
                {articles.filter(a => a.category === activeCat && a.id !== viewArticleId).map(rel => (
                  <button key={rel.id} onClick={() => setViewArticleId(rel.id)} className="w-full text-left p-3 bg-slate-50 border border-slate-150 rounded-2xl hover:border-slate-250 transition-all flex justify-between items-center group">
                    <span className="font-bold text-[10px] text-slate-700 truncate max-w-[130px]">{rel.title}</span>
                    <ArrowRight size={12} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

    </motion.div>
  );
};

export default KnowledgeBase;