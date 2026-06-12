import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Lock, Plus, Zap, ShieldCheck, Database, History, X, ChevronRight, Search
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const DocRow = ({ id, name, dept, status, access, sensitivity, owner, version, date, hasLock, vaultLocked, vaultPassword, onDelete, isRestricted, submitForApproval, onSelect, onLiveEdit, logAction, userRole, onSign, columnVisibility }) => (
  <tr onClick={() => { if (!isRestricted && onSelect) onSelect(); }} className={`hover:bg-muted/30 transition-colors group cursor-pointer text-sm ${isRestricted ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <FileText size={18} className="text-muted-foreground shrink-0" />
          {vaultLocked && <Lock size={12} className="text-red-500 absolute -bottom-1 -right-1 bg-red-50 rounded-full" />}
        </div>
        <div>
          <span className="font-bold text-foreground block">{name}</span>
          <div className="flex gap-2 items-center mt-1">
            {!columnVisibility.owner && owner && <span className="text-[10px] text-muted-foreground font-semibold">Owner: {owner}</span>}
            {version && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold">v{version}</span>}
          </div>
        </div>
      </div>
    </td>
    {columnVisibility.dept && <td className="px-6 py-4 text-muted-foreground font-semibold text-xs">{dept}</td>}
    {columnVisibility.status && (
      <td className="px-6 py-4">
        <span className={`status-badge status-${status}`}>{status}</span>
      </td>
    )}
    {columnVisibility.access && (
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground uppercase tracking-wider">
            {(hasLock || isRestricted) && <Lock size={12} className="text-destructive shrink-0" />}
            {isRestricted ? 'LOCKED (Restricted Role)' : (sensitivity || access)}
          </div>
        </div>
      </td>
    )}
    {columnVisibility.owner && (
      <td className="px-6 py-4 text-muted-foreground font-semibold text-xs">
        {owner || 'System'}
      </td>
    )}
    {columnVisibility.date && (
      <td className="px-6 py-4 text-muted-foreground font-semibold text-xs">
        {date}
      </td>
    )}
    <td className="px-6 py-4 text-right">
      <div className="flex items-center justify-end gap-3">
        {status === 'draft' && !isRestricted && (
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); submitForApproval(); }}
              className="hidden group-hover:flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded transition-colors"
            >
              <Zap size={14} /> Submit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLiveEdit({ id, name, vaultLocked, vaultPassword });
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#185ABD] hover:bg-[#103F85] px-3 py-1.5 rounded transition-colors shadow-sm"
            >
              <span className="font-serif italic font-medium">W</span> Live Edit
            </button>
          </div>
        )}

        {status === 'review' && !isRestricted && (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLiveEdit({ id, name, vaultLocked, vaultPassword });
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#185ABD] hover:bg-[#103F85] px-3 py-1.5 rounded transition-colors shadow-sm"
            >
              <span className="font-serif italic font-medium">W</span> Live Edit
            </button>
          </div>
        )}

        {status === 'approved' && !isRestricted && (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLiveEdit({ id, name, vaultLocked, vaultPassword });
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#185ABD] hover:bg-[#103F85] px-3 py-1.5 rounded transition-colors shadow-sm"
            >
              <span className="font-serif italic font-medium">W</span> Live Edit
            </button>
            {(userRole === 'Manager' || userRole === 'Admin') && (
              <button
                onClick={(e) => { e.stopPropagation(); onSign(); }}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded transition-colors shadow-sm border border-slate-700"
                title="Apply Digital Signature"
              >
                <ShieldCheck size={14} className="text-emerald-400" /> Sign
              </button>
            )}
          </div>
        )}

        {status === 'certified' && !isRestricted && (
          <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 uppercase tracking-tighter">
            <ShieldCheck size={12} /> Certified
          </div>
        )}

        {!isRestricted && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 hover:bg-red-50 text-muted-foreground hover:text-red-600 rounded transition-colors opacity-0 group-hover:opacity-100"
            title="Delete (Move to Recycle Bin)"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </td>
  </tr>
);

const DocumentCenterView = ({ navigate, onUploadClick, setShowViewManager, showViewManager }) => {
  const { documents, deleteDocument, userRole, submitForApproval, logAction, currentUser, signDocument, addDocument, columnVisibility, setActiveDocId } = useApp();
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [decryptionTarget, setDecryptionTarget] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [decryptionError, setDecryptionError] = useState(false);
  const [viewMode, setViewMode] = useState('all');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState('PDF');
  const [searchQuery, setSearchQuery] = useState('');

  const accessibleGroups = currentUser?.departments || [];

  let filteredDocs = (userRole === 'Admin' || userRole === 'Manager')
    ? documents
    : documents.filter(d => {
      const isOwner = d.owner === currentUser?.name;
      const isPublic = d.sensitivity === 'Public';
      const inDept = accessibleGroups.includes(d.dept);
      const isAuthorizedRole = d.authorizedRoles ? d.authorizedRoles.includes(userRole) : true;
      return isOwner || isPublic || (inDept && isAuthorizedRole);
    });

  if (viewMode === 'mine') {
    filteredDocs = filteredDocs.filter(d => d.owner === currentUser?.name);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredDocs = filteredDocs.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.dept.toLowerCase().includes(q) ||
      d.owner?.toLowerCase().includes(q)
    );
  }

  const isRestricted = (doc) => !accessibleGroups.includes(doc.dept) && userRole !== 'Admin' && userRole !== 'Manager';
  const selectedDoc = documents.find(d => d.id === selectedDocId);

  const attemptDecryption = (e) => {
    e.preventDefault();
    if (!decryptionTarget) return;
    if (passwordInput === decryptionTarget.vaultPassword) {
      logAction(currentUser?.name, 'Successfully Authorized Vault', decryptionTarget.name);
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Document Center</h2>
          <p className="text-muted-foreground font-medium text-sm">Organization-wide file governance | Showing {filteredDocs.length} files</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none btn border border-border bg-white hover:bg-muted" onClick={() => setShowViewManager(true)}>Manage Views</button>
          <button className="flex-1 md:flex-none btn btn-primary" onClick={onUploadClick}><Plus size={18} /> New Document</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center border-b border-border pb-1">
        <div className="flex gap-4 md:gap-6 text-sm font-bold overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button className={`pb-3 border-b-2 transition-all ${viewMode === 'all' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`} onClick={() => setViewMode('all')}>All Documents</button>
          <button className={`pb-3 border-b-2 transition-all ${viewMode === 'mine' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`} onClick={() => setViewMode('mine')}>My Documents</button>
          <button className="pb-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground" onClick={() => navigate('depts')}>By Department</button>
        </div>

        <div className="relative w-full md:w-64 mb-2 md:mb-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search vault..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/50 border border-transparent focus:border-primary/30 focus:bg-white rounded-full py-2 pl-9 pr-4 text-xs font-bold outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      <div className="card p-0 overflow-x-auto border-none md:border md:rounded-lg">
        <table className="w-full text-left min-w-[800px] md:min-w-0">
          <thead>
            <tr className="bg-muted/50 text-[10px] font-bold uppercase text-muted-foreground tracking-widest border-b border-border">
              <th className="px-6 py-4">Document Name</th>
              {columnVisibility.dept && <th className="px-6 py-4">Dept</th>}
              {columnVisibility.status && <th className="px-6 py-4">Status</th>}
              {columnVisibility.access && <th className="px-6 py-4">Access Level</th>}
              {columnVisibility.owner && <th className="px-6 py-4">Owner</th>}
              {columnVisibility.date && <th className="px-6 py-4">Modified Date</th>}
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredDocs.map(doc => (
              <DocRow
                key={doc.id} {...doc}
                onDelete={() => deleteDocument(doc.id)}
                isRestricted={isRestricted(doc)}
                submitForApproval={() => submitForApproval(doc.id)}
                onSign={() => signDocument(doc.id)}
                onSelect={() => isRestricted(doc) ? navigate('access') : setSelectedDocId(doc.id)}
                onLiveEdit={(docDetails) => {
                  if (docDetails.vaultLocked) {
                    setDecryptionTarget(docDetails);
                  } else {
                    logAction(currentUser?.name, 'Opened in Word Online', docDetails.name);
                    setActiveDocId(docDetails.id);
                    navigate('collab');
                  }
                }}
                logAction={logAction} userRole={userRole} columnVisibility={columnVisibility}
              />
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {decryptionTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="card w-full max-w-sm shadow-2xl p-0 overflow-hidden font-sans border-slate-700 bg-white">
              <div className="bg-slate-900 p-6 text-center text-white border-b border-slate-800 relative">
                <button onClick={() => { setDecryptionTarget(null); setPasswordInput(''); }} className="absolute p-2 right-2 top-2 text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
                <Lock className="mx-auto text-red-500 h-10 w-10 mb-3 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                <h3 className="font-bold tracking-widest uppercase text-sm">Encrypted Payload</h3>
                <p className="text-xs text-slate-400 mt-1">{decryptionTarget.name}</p>
              </div>
              <form onSubmit={attemptDecryption} className="p-6 space-y-4 bg-slate-50">
                <p className="text-xs text-slate-500 text-center font-bold tracking-wide uppercase px-4">Provide secondary cryptographic PIN to access document.</p>
                <input autoFocus type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className={`w-full bg-white border ${decryptionError ? 'border-red-500 animate-shake' : 'border-slate-300'} rounded p-3 text-center text-lg font-mono tracking-[0.5em] outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 shadow-inner`} placeholder="****" />
                <button type="submit" className="w-full btn bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-widest uppercase text-sm py-3">DECRYPT</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDoc && (
          <React.Fragment>
            <div onClick={() => setSelectedDocId(null)} className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%', opacity: 0.5 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0.5 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 w-full md:w-[400px] h-full bg-white shadow-2xl z-50 border-l border-border flex flex-col">
              <div className="p-6 border-b border-border flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded"><FileText size={20} /></div>
                  <h3 className="font-extrabold text-lg text-slate-800 line-clamp-1" title={selectedDoc.name}>{selectedDoc.name}</h3>
                </div>
                <button onClick={() => setSelectedDocId(null)} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-600 transition-colors"><X size={16} /></button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-8">
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Metadata Info</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-border pb-2"><span className="text-slate-500 font-medium">Department</span><span className="font-bold">{selectedDoc.dept}</span></div>
                    <div className="flex justify-between border-b border-border pb-2"><span className="text-slate-500 font-medium">Sensitivity</span><span className="font-bold flex gap-1 items-center">{selectedDoc.sensitivity === 'Confidential' || selectedDoc.sensitivity === 'Restricted' ? <Lock size={12} className="text-red-500" /> : null}{selectedDoc.sensitivity || 'Internal'}</span></div>
                    <div className="flex justify-between border-b border-border pb-2"><span className="text-slate-500 font-medium">Owner</span><span className="font-bold">{selectedDoc.owner || 'System'}</span></div>
                    <div className="flex justify-between border-b border-border pb-2"><span className="text-slate-500 font-medium">Upload Date</span><span className="font-bold">{selectedDoc.date}</span></div>
                    <div className="flex justify-between border-b border-border pb-2"><span className="text-slate-500 font-medium">System Status</span><span className={`px-2 rounded text-xs font-bold capitalize ${selectedDoc.status === 'certified' ? 'bg-primary text-white' : selectedDoc.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{selectedDoc.status}</span></div>
                    {selectedDoc.signature && (
                      <div className="bg-slate-900 text-white p-3 rounded mt-4 border border-slate-700">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1"><ShieldCheck size={12} /> Digital Certificate</p>
                        <p className="text-xs font-mono break-all">{selectedDoc.signature}</p>
                        <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold">Signed by {selectedDoc.certifiedBy} on {new Date(selectedDoc.certifiedAt).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Asset Visualization</h4>
                  <div className="bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner min-h-[140px] flex items-center justify-center relative group">
                    {selectedDoc.content?.startsWith('data:image/') ? (
                      <img src={selectedDoc.content} className="w-full h-full object-cover" alt="Preview" />
                    ) : selectedDoc.content?.startsWith('data:application/pdf') ? (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <FileText size={32} />
                        <span className="text-[10px] font-black uppercase">PDF Payload Active</span>
                      </div>
                    ) : (
                      <div className="p-4 text-[10px] font-mono text-slate-400 line-clamp-6 text-center leading-relaxed">
                        {selectedDoc.content || 'Initializing Bitstream...'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <button onClick={() => setPreviewDoc(selectedDoc)} className="bg-white text-slate-900 px-4 py-2 rounded-lg text-[10px] font-black uppercase shadow-xl hover:scale-105 transition-transform">Initialize Full View</button>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><History size={14} /> Version Lineage</h4>
                  <div className="border-l-2 border-border ml-2 pl-4 relative space-y-6">
                    {selectedDoc.version >= 2 && (
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-4 ring-emerald-50"></div>
                        <p className="font-bold text-sm text-slate-800">Version {selectedDoc.version}.0 <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] ml-2">Current</span></p>
                        <p className="text-xs text-muted-foreground mt-0.5">Approved by workflow engine</p>
                      </div>
                    )}
                    <div className="relative opacity-60">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-slate-400 rounded-full ring-4 ring-slate-100"></div>
                      <p className="font-bold text-sm text-slate-800">Version 1.0</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Initial draft upload by {selectedDoc.owner || 'System'}</p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="bg-slate-50 p-6 space-y-4 border-t border-border">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Select Export Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {['PDF', 'DOCX', 'XLSX'].map(fmt => (
                    <button key={fmt} onClick={() => setDownloadFormat(fmt)} className={`py-2 text-[10px] font-black rounded border transition-all ${downloadFormat === fmt ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>{fmt}</button>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button className="flex-1 btn bg-emerald-600 hover:bg-emerald-700 text-white flex justify-center items-center gap-2 py-3.5 font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20" onClick={() => setPreviewDoc(selectedDoc)}><FileText size={16} /> View Full</button>
                    {!isRestricted(selectedDoc) && selectedDoc.status !== 'certified' && (
                      <button className="flex-1 btn bg-[#185ABD] hover:bg-[#103F85] text-white flex justify-center items-center gap-2 py-3.5 font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20" onClick={() => {
                        setSelectedDocId(null);
                        if (selectedDoc.vaultLocked) {
                          setDecryptionTarget(selectedDoc);
                        } else {
                          logAction(currentUser?.name, 'Opened in Word Online', selectedDoc.name);
                          setActiveDocId(selectedDoc.id);
                          navigate('collab');
                        }
                      }}><span className="font-serif italic font-medium">W</span> Live Edit</button>
                    )}
                  </div>
                  <button className="w-full btn btn-primary flex justify-center items-center gap-2 py-3.5 shadow-lg font-black text-xs uppercase tracking-widest" onClick={() => {
                    const baseName = selectedDoc.name.split('.')[0];
                    const isWrappedBinary = selectedDoc.content?.includes('[BINARY ASSET DETECTED]');
                    const isOriginalBinary = selectedDoc.content?.startsWith('data:') || isWrappedBinary;
                    const isVaultProtected = selectedDoc.hasLock && selectedDoc.vaultPassword;

                    let downloadUrl = selectedDoc.content;
                    if (isWrappedBinary) {
                      const match = downloadUrl.match(/src="(data:[^"]+)"/);
                      if (match) downloadUrl = match[1];
                    }

                    if (isVaultProtected) {
                      const envelopeHtml = `<!DOCTYPE html><html><head><title>Secure Envelope - ${selectedDoc.name}</title><style>body { font-family: 'Inter', sans-serif; background: #0F172A; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; } .card { background: #1E293B; padding: 2.5rem; border-radius: 16px; border: 1px solid #334155; text-align: center; width: 400px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); } .icon { background: #1F7A6B; width: 64px; height: 64px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; } h1 { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.5rem; } p { color: #94A3B8; font-size: 0.875rem; margin-bottom: 2rem; } input { width: 100%; background: #0F172A; border: 1px solid #334155; padding: 0.75rem; border-radius: 8px; color: white; margin-bottom: 1rem; outline: none; box-sizing: border-box; } button { width: 100%; background: #1F7A6B; color: white; border: none; padding: 0.75rem; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; } button:hover { background: #2a9d8a; } .error { color: #EF4444; font-size: 12px; margin-top: 1rem; display: none; } #content { display: none; }</style></head><body><div class="card" id="login"><div class="icon">🔒</div><h1>Secure Node</h1><p>Enter the security password to decrypt.</p><input type="password" id="pass" placeholder="Enter Password"><button onclick="decrypt()">Access Document</button><div id="error" class="error">Invalid decryption key.</div></div><div id="content">${downloadUrl}</div><script>function decrypt() { const pass = document.getElementById('pass').value; if (pass === "${selectedDoc.vaultPassword}") { const content = document.getElementById('content').innerHTML; if (content.startsWith('data:')) { const link = document.createElement('a'); link.href = content; link.download = "${selectedDoc.name}"; link.click(); } else { document.body.innerHTML = '<div style="padding: 40px; font-family: monospace; white-space: pre-wrap; background: white; color: black; min-height: 100vh;">' + content + '</div>'; } } else { document.getElementById('error').style.display = 'block'; } }</script></body></html>`;
                      const blob = new Blob([envelopeHtml], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = `[SECURE]_${selectedDoc.name}.html`; a.click();
                      logAction(currentUser?.name, `Exported Secure Envelope`, selectedDoc.name); return;
                    }

                    if (isOriginalBinary) {
                      const a = document.createElement('a'); a.href = downloadUrl; a.download = selectedDoc.name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
                      logAction(currentUser?.name, `Exported Original Binary`, selectedDoc.name); return;
                    }

                    const pdfContent = `<html><body style="font-family:serif;padding:50px;"><div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);opacity:0.1;font-size:80px;z-index:-1;">PROJECTFLOW KE</div><h1>${selectedDoc.name}</h1><p>Owner: ${selectedDoc.owner} | Date: ${selectedDoc.date}</p><hr/><div style="white-space:pre-wrap;">${selectedDoc.content}</div></body></html>`;
                    const blob = new Blob([pdfContent], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `[${downloadFormat}_SECURE]_${baseName}.html`; a.click();
                    logAction(currentUser?.name, `Exported as ${downloadFormat}`, selectedDoc.name);
                  }}><Database size={16} /> Export</button>
                </div>
              </div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 lg:p-12">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-4xl h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-600 rounded"><FileText size={20} /></div>
                  <div><h3 className="font-bold text-sm leading-none">{previewDoc.name}</h3><p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Full Document Node</p></div>
                </div>
                <button className="p-2 hover:bg-white/10 rounded-full transition-all" onClick={() => setPreviewDoc(null)}><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto bg-slate-200 p-8 flex justify-center">
                <div className="bg-white w-full max-w-[800px] min-h-[1000px] shadow-lg p-16 font-serif relative">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-35deg] text-6xl font-black text-slate-900 uppercase">PROJECTFLOW KE - CONFIDENTIAL</div>
                  <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                      <div className="space-y-1"><h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">PROJECTFLOW KE</h1><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Enterprise Document Governance</p></div>
                      <div className="text-right text-[10px] font-bold text-slate-400 space-y-0.5"><p>REF: DOC-{previewDoc.id}</p><p>DATE: {previewDoc.date}</p><p>DEPT: {previewDoc.dept}</p></div>
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-xl font-black text-slate-900 border-b-2 border-slate-900 pb-4 uppercase tracking-tight">{previewDoc.name.replace(/\.[^/.]+$/, "")}</h2>
                      <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-inner text-slate-800 leading-relaxed whitespace-pre-wrap font-mono text-[11px] min-h-[400px] max-h-[600px] overflow-y-auto scrollbar-hide">
                        {previewDoc.content || "NO PAYLOAD DETECTED"}
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
