import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, FileText, ChevronRight, Lock, Activity, ArrowRight, ShieldCheck,
  Plus, Edit2, Trash2, X, MessageSquare, Send, BarChart2, Briefcase, Award
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const DEFAULT_MEMBERS = {
  Finance: [
    { name: 'Alamina K.', role: 'Chief Finance Officer', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' },
    { name: 'David M.', role: 'Senior Accountant', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' }
  ],
  Legal: [
    { name: 'Sylvia W.', role: 'General Legal Counsel', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' }
  ],
  HR: [
    { name: 'Grace N.', role: 'HR Operations Lead', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80' }
  ],
  Ops: [
    { name: 'Joseph O.', role: 'Operations Manager', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80' }
  ]
};

const DepartmentView = ({ navigate, onUploadClick }) => {
  const { documents, userRole, departments, addDepartment, updateDepartment, deleteDepartment, currentUser, logAction } = useApp();
  
  const [activeHub, setActiveHub] = useState(departments[0] || 'Ops'); 
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [editingDept, setEditingDept] = useState(null);
  const [editName, setEditName] = useState('');

  // Department local chat state
  const [chats, setChats] = useState({
    Finance: [{ user: 'Alamina K.', message: 'End of Q3 balance ledger is sealed.', time: '10:14 AM' }],
    Ops: [{ user: 'Joseph O.', message: 'Operations checklists have been updated in the cloud.', time: '09:30 AM' }]
  });
  const [chatInput, setChatInput] = useState('');

  // Access Denied configuration
  const isAccessDenied = userRole === 'Restricted' && activeHub === 'Legal';

  const hubDocs = useMemo(() => documents.filter(d => d.dept === activeHub), [documents, activeHub]);
  const approvedDocs = hubDocs.filter(d => d.status === 'approved');
  const draftDocs = hubDocs.filter(d => d.status === 'draft');

  const handleAddDept = (e) => {
    e.preventDefault();
    if (newDeptName) {
      addDepartment(newDeptName);
      logAction(currentUser?.name, 'Created Department Site', newDeptName);
      setNewDeptName('');
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = {
      user: currentUser?.name || 'Administrator',
      message: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChats(prev => ({
      ...prev,
      [activeHub]: [...(prev[activeHub] || []), msg]
    }));
    setChatInput('');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12">
      
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Users size={32} className="text-slate-900" />
            Department Team Sites
          </h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mt-1">
            Isolated departmental vaults, organizational tree, and private team logs
          </p>
        </div>
        <div className="flex gap-2">
          {userRole === 'Admin' && (
            <button onClick={() => setShowAdminPanel(!showAdminPanel)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase border transition-all ${showAdminPanel ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-350'}`}>
              Manage Hubs
            </button>
          )}
          <button onClick={onUploadClick} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20">
            <Plus size={16} className="inline mr-1" /> New Document
          </button>
        </div>
      </div>

      {/* ── MANAGE DEPARTMENTS PANEL ── */}
      <AnimatePresence>
        {showAdminPanel && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-sm">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Provision New Team Site</h4>
                <form onSubmit={handleAddDept} className="flex gap-2">
                  <input type="text" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="e.g., Quality Control" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none" required />
                  <button type="submit" className="px-4 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"><Plus size={16} /></button>
                </form>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Hubs Registry</h4>
                <div className="grid grid-cols-2 gap-2">
                  {departments.map(dept => (
                    <div key={dept} className="flex justify-between items-center bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold">
                      <span>{dept}</span>
                      <button onClick={() => deleteDepartment(dept)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SELECTOR HIERARCHY TABS ── */}
      <div className="flex gap-1 border-b border-slate-100 bg-white p-2 rounded-2xl shadow-sm overflow-x-auto scrollbar-hide whitespace-nowrap">
        {departments.map(dept => (
          <button key={dept} onClick={() => setActiveHub(dept)}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeHub === dept ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'
            }`}>
            {dept}
            {userRole === 'Restricted' && dept === 'Legal' && <Lock size={12} className="text-red-400 shrink-0" />}
          </button>
        ))}
      </div>

      {/* ── CORE DEPARTMENT VIEW CONTENT ── */}
      <AnimatePresence mode="wait">
        {isAccessDenied ? (
          <motion.div key="denied" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-150 rounded-[2rem] p-16 text-center space-y-4">
            <Lock size={44} className="mx-auto text-red-600" />
            <h3 className="text-xl font-black text-slate-900">Enclave Restricted</h3>
            <p className="text-xs text-slate-500 font-bold max-w-sm mx-auto uppercase tracking-wide">
              General contractors cannot enter legal vaults due to Active Zero-Trust Policies.
            </p>
            <button className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase rounded-xl shadow-lg" onClick={() => setActiveHub(departments[0])}>
              Return to Safety
            </button>
          </motion.div>
        ) : (
          <motion.div key={activeHub} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><FileText size={20} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Library Size</p>
                  <h4 className="text-2xl font-black text-slate-900 mt-0.5">{hubDocs.length} Documents</h4>
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><ShieldCheck size={20} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Published Node</p>
                  <h4 className="text-2xl font-black text-slate-900 mt-0.5">{approvedDocs.length} Approved</h4>
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><Activity size={20} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Draft Queue</p>
                  <h4 className="text-2xl font-black text-slate-900 mt-0.5">{draftDocs.length} Drafts</h4>
                </div>
              </div>
            </div>

            {/* Org Tree chart and members roster */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Members (Roster list) */}
              <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm col-span-1 space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Members</h4>
                <div className="space-y-3">
                  {(DEFAULT_MEMBERS[activeHub] || []).map((m, idx) => (
                    <div key={idx} className="flex items-center gap-3.5 p-2 hover:bg-slate-50 rounded-2xl">
                      <img src={m.avatar} className="w-10 h-10 rounded-full object-cover shadow-inner" alt={m.name} />
                      <div>
                        <h5 className="font-extrabold text-xs text-slate-900">{m.name}</h5>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{m.role}</p>
                      </div>
                    </div>
                  ))}
                  {(DEFAULT_MEMBERS[activeHub] || []).length === 0 && (
                    <p className="text-[10px] text-slate-400 italic">No assigned operators in this enclave.</p>
                  )}
                </div>
              </div>

              {/* Chat & private Team Logs */}
              <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm col-span-2 flex flex-col justify-between h-[320px]">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Enclave Secure Log Ticker</h4>
                  <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                    {(chats[activeHub] || []).map((c, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-150 p-3 rounded-2xl space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-800">{c.user}</span>
                          <span className="text-[9px] text-slate-400">{c.time}</span>
                        </div>
                        <p className="text-xs text-slate-700 font-bold leading-normal">{c.message}</p>
                      </div>
                    ))}
                    {(chats[activeHub] || []).length === 0 && (
                      <p className="text-[10px] text-slate-400 italic py-6 text-center">No team messages registered.</p>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSendChat} className="flex gap-2 border-t border-slate-100 pt-4">
                  <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type private department note..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none" />
                  <button type="submit" className="w-10 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center transition-colors"><Send size={14} /></button>
                </form>
              </div>

            </div>

            {/* Department Documents table */}
            <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Enclave Library Directory</h4>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {hubDocs.map(doc => (
                  <div key={doc.id} className="p-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded text-slate-600"><FileText size={16} /></div>
                      <div>
                        <h5 className="font-extrabold text-slate-800">{doc.name}</h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">OWNER: {doc.owner} · DATE: {doc.date}</p>
                      </div>
                    </div>
                    <span className={`status-badge status-${doc.status}`}>{doc.status}</span>
                  </div>
                ))}
                {hubDocs.length === 0 && (
                  <p className="p-8 text-center text-slate-400 italic">No files in directory.</p>
                )}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default DepartmentView;
