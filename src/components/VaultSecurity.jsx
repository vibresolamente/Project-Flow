import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';

const VaultSecurity = () => {
  const { documents, updateDocumentVaultStatus, userRole } = useApp();
  
  const [selectedDocId, setSelectedDocId] = useState('');
  const [vaultPassword, setVaultPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (userRole !== 'Admin') {
    return (
      <div className="card bg-red-50 p-10 text-center border-red-200">
        <ShieldAlert size={48} className="mx-auto text-red-600 mb-4" />
        <h3 className="text-xl font-bold text-red-900">Vault Access Denied</h3>
        <p className="text-red-700">The Zero-Trust Policy Engine can only be managed by Global Admins.</p>
      </div>
    );
  }

  const handleApplyLock = (e) => {
    e.preventDefault();
    if (!selectedDocId || !vaultPassword) return;
    updateDocumentVaultStatus(selectedDocId, vaultPassword);
    setSuccessMsg('AES-256 Vault Lock Applied Successfully.');
    setSelectedDocId('');
    setVaultPassword('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-3"><ShieldCheck size={30} className="text-emerald-600"/> Zero-Trust Vault Security</h2>
        <p className="text-muted-foreground font-medium">Apply strict cryptographic passwords to specific documents. Outranks standard RBAC permissions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LOCK APPLICATION FORM */}
        <div className="card border-primary/20 shadow-md">
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-6">
            <Lock className="text-primary" size={20} />
            <h3 className="font-bold text-slate-800">Apply Document Lock</h3>
          </div>
          
          <form onSubmit={handleApplyLock} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Target Document</label>
              <select value={selectedDocId} onChange={e=>setSelectedDocId(e.target.value)} className="w-full border border-border rounded p-3 text-sm outline-none focus:border-primary mt-1 shadow-sm bg-slate-50">
                <option value="" disabled>Select unprotected document...</option>
                {documents.filter(d => !d.vaultLocked).map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.name} ({doc.dept})</option>
                ))}
              </select>
            </div>
            
            <div>
               <label className="text-xs font-bold text-muted-foreground uppercase flex justify-between">
                 Vault Password
                 <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1 rounded">Min 4 chars</span>
               </label>
               <input type="password" value={vaultPassword} onChange={e=>setVaultPassword(e.target.value)} className="w-full border border-border rounded p-3 text-sm outline-none focus:border-primary mt-1 shadow-sm font-mono tracking-widest bg-slate-50" placeholder="e.g. s3cr3t" required minLength={4} />
            </div>

            <AnimatePresence>
              {successMsg && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-emerald-50 text-emerald-700 p-3 rounded text-sm font-bold flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 size={16} /> {successMsg}
                </motion.div>
              )}
            </AnimatePresence>
            
            <button type="submit" className="w-full btn bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 mt-4 flex justify-center items-center gap-2">
               Encrypt & Lock Document
            </button>
          </form>
        </div>

        {/* VAULTED DOCUMENTS REGISTER */}
        <div className="card bg-slate-900 text-slate-300 p-0 overflow-hidden shadow-xl border-slate-700">
           <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <h3 className="font-bold text-white tracking-widest uppercase text-sm">Active Enclaves</h3>
             </div>
           </div>
           <div className="p-4 space-y-2 max-h-[350px] overflow-y-auto">
             {documents.filter(d => d.vaultLocked).length === 0 ? (
               <p className="text-xs text-slate-500 text-center py-10 font-bold uppercase tracking-widest">No vault locks active</p>
             ) : (
               documents.filter(d => d.vaultLocked).map(doc => (
                 <div key={doc.id} className="bg-slate-800/50 p-4 rounded border border-slate-700/50 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <Lock size={16} className="text-emerald-400" />
                     <div>
                       <p className="font-bold text-white text-sm">{doc.name}</p>
                       <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-1">ID: {doc.id.substring(0,8)} | {doc.dept}</p>
                     </div>
                   </div>
                   <div className="px-2 py-1 rounded bg-red-900/40 text-red-400 border border-red-900 text-[10px] uppercase font-bold tracking-widest">
                     Locked
                   </div>
                 </div>
               ))
             )}
           </div>
        </div>

      </div>
    </motion.div>
  );
};

export default VaultSecurity;
