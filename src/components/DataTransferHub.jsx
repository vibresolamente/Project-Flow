import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  User, 
  FileText, 
  ArrowRightLeft, 
  ShieldCheck, 
  Share2, 
  Search,
  CheckCircle2,
  Users
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const DataTransferHub = () => {
  const { documents, currentUser, systemUsers, logAction, pushNotification, transferDocument } = useApp();
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const users = (systemUsers || []).filter(u => u.name !== currentUser?.name);

  const filteredDocs = documents.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTransfer = () => {
    if (!selectedDoc || !recipient) return;
    setIsTransferring(true);
    
    setTimeout(() => {
      transferDocument(selectedDoc.id, recipient);
      logAction(currentUser?.name || 'System', `Initiated Data Transfer`, `${selectedDoc.name} → ${recipient}`);
      pushNotification('access', `Document "${selectedDoc.name}" has been transferred to ${recipient} for review.`, selectedDoc.id);
      setIsTransferring(false);
      setSelectedDoc(null);
      setRecipient('');
      alert(`P2P Transfer Complete: ${selectedDoc.name} shared with ${recipient}`);
    }, 1500);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <ArrowRightLeft className="text-emerald-600" size={32} />
            Enterprise Data Transfer Hub
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Secure Inter-User Payload Exchange Node</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
           <Users className="text-emerald-600" size={24} />
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Live Nodes</p>
              <p className="text-sm font-black">4 Active Collaborators</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* STEP 1: SELECT ASSET */}
        <div className="card space-y-6 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">01</div>
            <h3 className="text-lg font-bold">Select Asset</h3>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search local vault..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 ring-emerald-500/5 outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px] pr-2 scrollbar-hide">
            {filteredDocs.map(doc => (
              <div 
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedDoc?.id === doc.id ? 'border-emerald-600 bg-emerald-50 shadow-md' : 'border-slate-100 hover:border-slate-300'}`}
              >
                <div className="flex items-center gap-3">
                  <FileText className={selectedDoc?.id === doc.id ? 'text-emerald-600' : 'text-slate-400'} size={20} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{doc.name}</p>
                    <p className="text-[9px] text-slate-400 uppercase font-black">{doc.dept} • {doc.sensitivity}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 2: SELECT RECIPIENT */}
        <div className="card space-y-6 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">02</div>
            <h3 className="text-lg font-bold">Select Recipient</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px] pr-2 scrollbar-hide">
            {users.map(user => (
              <div 
                key={user.id}
                onClick={() => setRecipient(user.name)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${recipient === user.name ? 'border-emerald-600 bg-emerald-50 shadow-md' : 'border-slate-100 hover:border-slate-300'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${recipient === user.name ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{user.name}</p>
                    <p className="text-[9px] text-slate-400 uppercase font-black">{user.dept} • {user.role}</p>
                  </div>
                  {recipient === user.name && <CheckCircle2 className="ml-auto text-emerald-600" size={20} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 3: TRANSFER PROTOCOL */}
        <div className="card space-y-8 bg-slate-900 text-white border-slate-900">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">03</div>
            <h3 className="text-lg font-bold">Transfer Protocol</h3>
          </div>

          <div className="space-y-6">
            <div className="p-5 bg-white/5 rounded-2xl border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Share2 size={60} /></div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4">Payload Summary</p>
              
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Source:</span>
                  <span className="text-xs font-black">{currentUser?.name || 'Local Host'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Asset:</span>
                  <span className="text-xs font-black text-emerald-400 truncate max-w-[150px]">{selectedDoc?.name || '---'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Target:</span>
                  <span className="text-xs font-black">{recipient || '---'}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-xl flex items-center gap-3">
               <ShieldCheck className="text-emerald-400 shrink-0" size={20} />
               <p className="text-[9px] font-bold text-emerald-100 uppercase tracking-wide leading-relaxed">
                 End-to-end encryption active. Asset will be shared via secure P2P node.
               </p>
            </div>

            <button 
              onClick={handleTransfer}
              disabled={!selectedDoc || !recipient || isTransferring}
              className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest transition-all ${!selectedDoc || !recipient || isTransferring ? 'bg-white/10 text-white/20 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-xl shadow-emerald-900/50 active:scale-95'}`}
            >
              {isTransferring ? (
                <div className="flex items-center gap-3">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   Syncing Nodes...
                </div>
              ) : (
                <>
                  <Send size={18} />
                  Initiate P2P Transfer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTransferHub;
