import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Lock, Plus, Zap, ShieldCheck, Database, History, X, ChevronRight, Search,
  Grid, List, Kanban, Filter, CheckSquare, Trash2, Check, Download, Info, Calendar, User, Eye, Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const DocumentCenterView = ({ navigate, onUploadClick, setShowViewManager, showViewManager }) => {
  const {
    documents, deleteDocument, userRole, submitForApproval, logAction,
    currentUser, signDocument, addDocument, columnVisibility, setActiveDocId, updateDocumentContent
  } = useApp();

  // View States
  const [layoutMode, setLayoutMode] = useState('list'); // 'list' | 'grid' | 'kanban'
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filters State
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterSensitivity, setFilterSensitivity] = useState('All');

  // Bulk Operations State
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Decryption State
  const [decryptionTarget, setDecryptionTarget] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [decryptionError, setDecryptionError] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('PDF');

  const accessibleGroups = currentUser?.departments || [];

  // Filter Logic
  let filteredDocs = useMemo(() => {
    let base = (userRole === 'Admin' || userRole === 'Manager')
      ? documents
      : documents.filter(d => {
          const isOwner = d.owner === currentUser?.name;
          const isPublic = d.sensitivity === 'Public';
          const inDept = accessibleGroups.includes(d.dept);
          const isAuthorizedRole = d.authorizedRoles ? d.authorizedRoles.includes(userRole) : true;
          return isOwner || isPublic || (inDept && isAuthorizedRole);
        });

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      base = base.filter(d =>
        d.name?.toLowerCase().includes(q) ||
        d.dept?.toLowerCase().includes(q) ||
        d.owner?.toLowerCase().includes(q)
      );
    }

    if (filterDept !== 'All') {
      base = base.filter(d => d.dept === filterDept);
    }
    if (filterStatus !== 'All') {
      base = base.filter(d => d.status?.toLowerCase() === filterStatus.toLowerCase());
    }
    if (filterSensitivity !== 'All') {
      base = base.filter(d => d.sensitivity === filterSensitivity);
    }

    return base;
  }, [documents, searchQuery, filterDept, filterStatus, filterSensitivity, userRole, currentUser, accessibleGroups]);

  // Unique departments & sensitivities for filter dropdowns
  const allDepts = useMemo(() => ['All', ...new Set(documents.map(d => d.dept).filter(Boolean))], [documents]);
  const allSensitivities = useMemo(() => ['All', ...new Set(documents.map(d => d.sensitivity).filter(Boolean))], [documents]);

  const isRestricted = (doc) => !accessibleGroups.includes(doc.dept) && userRole !== 'Admin' && userRole !== 'Manager';

  // Toggle single document selection in bulk mode
  const toggleDocSelection = (id) => {
    setSelectedDocIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocIds.length === filteredDocs.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(filteredDocs.map(d => d.id));
    }
  };

  // Bulk actions
  const handleBulkApprove = () => {
    selectedDocIds.forEach(id => submitForApproval(id));
    setSelectedDocIds([]);
    setIsBulkMode(false);
    logAction(currentUser?.name, 'Bulk Submission for Approval', `${selectedDocIds.length} files`);
  };

  const handleBulkDelete = () => {
    selectedDocIds.forEach(id => deleteDocument(id));
    setSelectedDocIds([]);
    setIsBulkMode(false);
    logAction(currentUser?.name, 'Bulk Deletion', `${selectedDocIds.length} files`);
  };

  // HTML5 Drag and Drop for Kanban Columns
  const handleDragStart = (e, docId) => {
    e.dataTransfer.setData('text/plain', docId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const docId = e.dataTransfer.getData('text/plain');
    if (!docId) return;

    // Find document and check permissions
    const doc = documents.find(d => d.id === docId);
    if (!doc || isRestricted(doc)) return;

    // Simulate state transition: Update document status locally or in AppContext
    // In our context, submitForApproval transitions draft -> review.
    // Let's call standard context operations or directly mutate status for display simulation.
    if (targetStatus === 'review' && doc.status === 'draft') {
      submitForApproval(docId);
      logAction(currentUser?.name, 'Moved to Review via Kanban', doc.name);
    } else if (targetStatus === 'approved' && doc.status === 'review' && (userRole === 'Manager' || userRole === 'Admin')) {
      signDocument(docId);
      logAction(currentUser?.name, 'Signed/Approved via Kanban', doc.name);
    }
  };

  const attemptDecryption = (e) => {
    e.preventDefault();
    if (!decryptionTarget) return;
    if (passwordInput === decryptionTarget.vaultPassword) {
      logAction(currentUser?.name, 'Authorized Vault', decryptionTarget.name);
      setActiveDocId(decryptionTarget.id);
      setDecryptionTarget(null);
      setPasswordInput('');
      navigate('collab');
    } else {
      setDecryptionError(true);
      setTimeout(() => setDecryptionError(false), 2000);
      logAction(currentUser?.name, 'FAILED VAULT DECRAMP ATTEMPT', decryptionTarget.name);
    }
  };

  const getExtension = (name) => {
    const ext = name.split('.').pop().toUpperCase();
    if (ext === 'DOCX' || ext === 'DOC') return 'DOC';
    if (ext === 'XLSX' || ext === 'XLS') return 'XLS';
    return ext.substring(0, 3);
  };

  const getDocColor = (name) => {
    const ext = getExtension(name);
    if (ext === 'XLS') return '#10B981';
    if (ext === 'PDF') return '#EF4444';
    return '#3B82F6';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Document Center</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mt-1">
            Zero-Trust Vault System | Active: {filteredDocs.length} of {documents.length} files
          </p>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap">
          <button className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${isBulkMode ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`} onClick={() => { setIsBulkMode(!isBulkMode); setSelectedDocIds([]); }}>
            {isBulkMode ? 'Exit Bulk Mode' : 'Bulk Select'}
          </button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors" onClick={() => setShowViewManager(true)}>
            Views
          </button>
          <button className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20" onClick={onUploadClick}>
            <Plus size={16} className="inline mr-1" /> New Document
          </button>
        </div>
      </div>

      {/* ── BAR ACTIONS & FILTER ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Layout Selectors & Filters button */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          {[{v:'list',label:<List size={15}/>},{v:'grid',label:<Grid size={15}/>},{v:'kanban',label:<Kanban size={15}/>}].map(item => (
            <button key={item.v} onClick={() => setLayoutMode(item.v)} className={`p-2 rounded-xl transition-all ${layoutMode === item.v ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
              {item.label}
            </button>
          ))}
          <div className="w-px h-5 bg-slate-200 mx-2" />
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${showFilters ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            <Filter size={13} /> Filters
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:border-slate-350 focus:bg-white transition-all shadow-inner"
          />
        </div>
      </div>

      {/* ── ADVANCED FILTERS PANEL ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Department</label>
              <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none cursor-pointer">
                {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Workflow Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none cursor-pointer">
                <option value="All">All States</option>
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="approved">Approved</option>
                <option value="certified">Certified</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Sensitivity</label>
              <select value={filterSensitivity} onChange={e => setFilterSensitivity(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none cursor-pointer">
                {allSensitivities.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BULK OPERATIONS TOP BAR ── */}
      <AnimatePresence>
        {isBulkMode && selectedDocIds.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4 flex-wrap">
            <span className="text-xs font-bold text-slate-300">Selected <span className="text-emerald-400 font-black">{selectedDocIds.length}</span> documents</span>
            <div className="flex gap-2">
              <button onClick={handleBulkApprove} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors">
                <Check size={14} /> Submit / Approve Selected
              </button>
              <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors">
                <Trash2 size={14} /> Delete Selected
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LIST VIEW ── */}
      {layoutMode === 'list' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left min-w-[800px] border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {isBulkMode && <th className="px-6 py-4 w-12"><input type="checkbox" checked={selectedDocIds.length === filteredDocs.length} onChange={handleSelectAll} className="rounded border-slate-300" /></th>}
                <th className="px-6 py-4">Document Name</th>
                {columnVisibility.dept && <th className="px-6 py-4">Dept</th>}
                {columnVisibility.status && <th className="px-6 py-4">Status</th>}
                {columnVisibility.access && <th className="px-6 py-4">Access Level</th>}
                {columnVisibility.owner && <th className="px-6 py-4">Owner</th>}
                {columnVisibility.date && <th className="px-6 py-4">Modified</th>}
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map(doc => {
                const isDocRestricted = isRestricted(doc);
                const isSelected = selectedDocIds.includes(doc.id);
                return (
                  <tr key={doc.id} onClick={() => { if (!isDocRestricted) setSelectedDocId(doc.id); }} className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${isDocRestricted ? 'opacity-40 pointer-events-none' : ''}`}>
                    {isBulkMode && (
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleDocSelection(doc.id)} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <FileText size={18} className="text-slate-400 shrink-0" />
                          {doc.vaultLocked && <Lock size={11} className="text-red-500 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-slate-100" />}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block group-hover:text-emerald-600 transition-colors">{doc.name}</span>
                          <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold mt-1 inline-block">v{doc.version || '1.0'}</span>
                        </div>
                      </div>
                    </td>
                    {columnVisibility.dept && <td className="px-6 py-4 text-slate-600 font-bold">{doc.dept}</td>}
                    {columnVisibility.status && (
                      <td className="px-6 py-4">
                        <span className={`status-badge status-${doc.status}`}>{doc.status}</span>
                      </td>
                    )}
                    {columnVisibility.access && (
                      <td className="px-6 py-4 text-slate-900 font-bold uppercase tracking-wider">
                        {doc.sensitivity || 'Internal'}
                      </td>
                    )}
                    {columnVisibility.owner && <td className="px-6 py-4 text-slate-500 font-bold">{doc.owner || 'System'}</td>}
                    {columnVisibility.date && <td className="px-6 py-4 text-slate-400 font-bold">{doc.date}</td>}
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2.5">
                        {doc.status === 'draft' && (
                          <button onClick={() => submitForApproval(doc.id)} className="hidden group-hover:flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded">
                            <Zap size={12} /> Submit
                          </button>
                        )}
                        <button onClick={() => { if (doc.vaultLocked) setDecryptionTarget(doc); else { setActiveDocId(doc.id); navigate('collab'); } }} className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-black uppercase tracking-wider">
                          Edit
                        </button>
                        <button onClick={() => deleteDocument(doc.id)} className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── GRID VIEW ── */}
      {layoutMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredDocs.map(doc => {
            const ext = getExtension(doc.name);
            const color = getDocColor(doc.name);
            const isSelected = selectedDocIds.includes(doc.id);
            return (
              <div key={doc.id} onClick={() => setSelectedDocId(doc.id)}
                className={`bg-white rounded-3xl border p-5 shadow-sm hover:shadow-md transition-all relative cursor-pointer group flex flex-col justify-between h-56 ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-100'}`}>
                {isBulkMode && (
                  <div className="absolute top-4 left-4" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleDocSelection(doc.id)} className="rounded border-slate-300 text-emerald-600" />
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm" style={{ background: `${color}15`, color }}>{ext}</div>
                  <span className={`status-badge status-${doc.status}`}>{doc.status}</span>
                </div>
                <div className="mt-4">
                  <h4 className="font-bold text-sm text-slate-950 truncate">{doc.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold flex items-center gap-1.5">
                    <span>{doc.dept}</span> · <span>v{doc.version || '1.0'}</span>
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-bold">{doc.owner || 'System'}</span>
                  <span>{doc.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── KANBAN VIEW ── */}
      {layoutMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {['draft', 'review', 'approved', 'certified'].map(status => {
            const columnDocs = filteredDocs.filter(d => (d.status || 'draft') === status);
            return (
              <div key={status} onDragOver={handleDragOver} onDrop={e => handleDrop(e, status)}
                className="bg-slate-50/50 rounded-3xl p-4 border border-slate-100 flex flex-col min-h-[500px]">
                <div className="flex justify-between items-center mb-4 px-1">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full status-${status}`} />
                    {status}
                  </h3>
                  <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-150 px-2 py-0.5 rounded-full">{columnDocs.length}</span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnDocs.map(doc => {
                    const ext = getExtension(doc.name);
                    const color = getDocColor(doc.name);
                    return (
                      <div key={doc.id} draggable={!isRestricted(doc)} onDragStart={e => handleDragStart(e, doc.id)} onClick={() => setSelectedDocId(doc.id)}
                        className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing relative group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-[11px]" style={{ background: `${color}15`, color }}>{ext}</div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-xs text-slate-900 truncate">{doc.name}</h4>
                            <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">{doc.dept}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {columnDocs.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      Drag here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DECRYPTION MODAL ── */}
      <AnimatePresence>
        {decryptionTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 border border-slate-100 text-center relative">
              <button onClick={() => { setDecryptionTarget(null); setPasswordInput(''); }} className="absolute p-2 right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
              <Lock className="mx-auto text-red-500 h-10 w-10 mb-3" />
              <h3 className="font-black text-sm uppercase tracking-widest text-slate-900">Encrypted Payload</h3>
              <p className="text-xs text-slate-400 mt-1">{decryptionTarget.name}</p>
              <form onSubmit={attemptDecryption} className="mt-5 space-y-4">
                <input autoFocus type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className={`w-full bg-slate-50 border ${decryptionError ? 'border-red-500' : 'border-slate-200'} rounded-xl p-3.5 text-center text-lg font-mono tracking-[0.5em] outline-none focus:border-red-500`} placeholder="****" />
                <button type="submit" className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-slate-900/10">DECRYPT</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PREVIEW DRAWER (SLIDE-OVER PANEL FROM RIGHT) ── */}
      <AnimatePresence>
        {selectedDocId && (() => {
          const selectedDoc = documents.find(d => d.id === selectedDocId);
          if (!selectedDoc) return null;
          return (
            <React.Fragment>
              <div onClick={() => setSelectedDocId(null)} className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-sm" />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }}
                className="fixed top-0 right-0 w-full md:w-[420px] h-full bg-white shadow-2xl z-50 border-l border-slate-100 flex flex-col justify-between">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-emerald-600" />
                    <h3 className="font-black text-slate-900 truncate max-w-[220px]" title={selectedDoc.name}>{selectedDoc.name}</h3>
                  </div>
                  <button onClick={() => setSelectedDocId(null)} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X size={18} /></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Metadata */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center text-xs border-b border-slate-150 pb-2"><span className="text-slate-500 font-bold uppercase tracking-wider">Dept</span><span className="font-black text-slate-800">{selectedDoc.dept}</span></div>
                    <div className="flex justify-between items-center text-xs border-b border-slate-150 pb-2"><span className="text-slate-500 font-bold uppercase tracking-wider">Sensitivity</span><span className="font-black text-slate-800">{selectedDoc.sensitivity || 'Internal'}</span></div>
                    <div className="flex justify-between items-center text-xs border-b border-slate-150 pb-2"><span className="text-slate-500 font-bold uppercase tracking-wider">Owner</span><span className="font-black text-slate-800">{selectedDoc.owner || 'System'}</span></div>
                    <div className="flex justify-between items-center text-xs border-b border-slate-150 pb-2"><span className="text-slate-500 font-bold uppercase tracking-wider">Modified</span><span className="font-black text-slate-800">{selectedDoc.date}</span></div>
                    {selectedDoc.signature && (
                      <div className="bg-slate-900 text-slate-300 p-4 rounded-2xl text-[10px] space-y-2 mt-4">
                        <p className="text-emerald-400 font-black uppercase tracking-wider flex items-center gap-1"><ShieldCheck size={12} /> Signed Certificate</p>
                        <p className="font-mono break-all">{selectedDoc.signature}</p>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail / Visualization */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Visualization</h4>
                    <div className="bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 min-h-[160px] flex items-center justify-center relative group p-4 text-center">
                      <div className="space-y-2 text-slate-400">
                        <FileText size={32} className="mx-auto" />
                        <span className="text-[9px] font-black uppercase tracking-widest block">Payload Safe & Scanned</span>
                      </div>
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <button onClick={() => setPreviewDoc(selectedDoc)} className="bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-xl hover:scale-105 transition-transform">Fullscreen View</button>
                      </div>
                    </div>
                  </div>

                  {/* Visual timeline */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><History size={12} /> Version Lineage</h4>
                    <div className="border-l-2 border-slate-100 ml-2 pl-4 space-y-5">
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                        <p className="font-bold text-xs text-slate-800">Version {selectedDoc.version || '1.0'}.0</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Approved & signed by ledger</p>
                      </div>
                      <div className="relative opacity-50">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-slate-400 rounded-full" />
                        <p className="font-bold text-xs text-slate-800">Version 1.0</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Initial draft upload</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="p-6 border-t border-slate-100 space-y-4 bg-slate-50">
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setPreviewDoc(selectedDoc)} className="py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10">
                      <Eye size={14} /> Full View
                    </button>
                    <button onClick={() => { setSelectedDocId(null); if (selectedDoc.vaultLocked) setDecryptionTarget(selectedDoc); else { setActiveDocId(selectedDoc.id); navigate('collab'); } }}
                      className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                      Edit Live
                    </button>
                  </div>
                  <button onClick={() => {
                    const blob = new Blob([selectedDoc.content || ''], { type: 'text/plain' });
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${selectedDoc.name}.txt`; a.click();
                  }} className="w-full py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm">
                    Export Raw Data
                  </button>
                </div>

              </motion.div>
            </React.Fragment>
          );
        })()}
      </AnimatePresence>

      {/* ── FULL SCREEN VIEW MODAL ── */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 lg:p-12">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-4xl h-full rounded-3xl shadow-2xl flex flex-col overflow-hidden">
              <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-emerald-500" />
                  <div>
                    <h3 className="font-bold text-sm leading-none">{previewDoc.name}</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Payload Viewer</p>
                  </div>
                </div>
                <button className="p-1.5 hover:bg-white/10 rounded-full transition-all text-white" onClick={() => setPreviewDoc(null)}><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center">
                <div className="bg-white w-full max-w-[800px] min-h-[1000px] shadow-lg p-16 relative font-serif">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-30deg] text-5xl font-black text-slate-900">PROJECTFLOW KE CONFIDENTIAL</div>
                  <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-start border-b border-slate-900 pb-4">
                      <div>
                        <h1 className="text-2xl font-black text-slate-950 uppercase tracking-tighter">PROJECTFLOW KE</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Enterprise Vault Payload</p>
                      </div>
                      <div className="text-right text-[9px] font-black text-slate-400 space-y-0.5">
                        <p>REF: DOC-{previewDoc.id}</p>
                        <p>DATE: {previewDoc.date}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-slate-900 pb-2">{previewDoc.name.replace(/\.[^/.]+$/, "")}</h2>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 font-mono text-[11px] text-slate-800 leading-relaxed whitespace-pre-wrap min-h-[400px] max-h-[600px] overflow-y-auto">
                        {previewDoc.content || "No content payload detected."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default DocumentCenterView;
