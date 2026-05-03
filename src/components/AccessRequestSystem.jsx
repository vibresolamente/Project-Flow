import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Info,
  Clock,
  Send,
  UserCheck,
  Search,
  Activity,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  History,
  TrendingUp,
  Fingerprint
} from 'lucide-react';

import { useApp } from '../context/AppContext';

const AccessRequestSystem = () => {
  const { requestAccess, pendingRequests, userRole, approveRequest, rejectAccessRequest, userName, systemUsers, departments } = useApp();
  const [step, setStep] = useState('list'); 
  const [targetResource, setTargetResource] = useState('');
  const [justification, setJustification] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [searchQuery, setSearchQuery] = useState('');

  const handleRequest = () => {
    if (!targetResource) return;
    requestAccess(targetResource, `${priority} Priority: ${justification}`);
    setStep('success');
  };

  const filteredRequests = pendingRequests.filter(r => 
    r.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.requestedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = pendingRequests.filter(r => r.status === 'Pending').length;
  const resolvedCount = pendingRequests.filter(r => r.status !== 'Pending').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight flex items-center gap-4 text-slate-900">
             <div className="p-3 bg-slate-900 text-emerald-400 rounded-2xl shadow-2xl rotate-3"><ShieldAlert size={32}/></div>
             IAM Security Portal
          </h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 ml-1 flex items-center gap-2">
            <Fingerprint size={14} className="text-emerald-500" />
            Identity & Access Management Hub • v4.2.1
          </p>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden lg:flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border-2 border-slate-100 shadow-sm">
              <div className="text-right">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Security Level</p>
                 <p className="text-xs font-black text-slate-900 mt-1 uppercase">Level 4: Restricted</p>
              </div>
              <ShieldCheck className="text-emerald-600" size={24} />
           </div>
           {userRole !== 'Admin' && step === 'list' && (
              <button className="btn btn-primary px-10 py-4 shadow-xl shadow-emerald-500/20 group" onClick={() => setStep('request')}>
                <UserPlus size={18} className="transition-transform group-hover:scale-110" />
                Elevate Permissions
              </button>
           )}
        </div>
      </div>

      {/* METRICS STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricCard label="Pending Nodes" value={activeCount} icon={<Clock className="text-amber-500" />} color="amber" />
         <MetricCard label="Audit Resolved" value={resolvedCount} icon={<CheckCircle2 className="text-emerald-500" />} color="emerald" />
         <MetricCard label="Authorized Users" value={systemUsers.length} icon={<UserCheck className="text-slate-500" />} color="slate" />
         <MetricCard label="Risk Index" value="0.04%" icon={<TrendingUp className="text-emerald-400" />} color="emerald" />
      </div>

      <AnimatePresence mode="wait">
        {step === 'list' && (
          <div key="list" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* SEARCH & FILTERS */}
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Search authorization ledger..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-white border-2 border-slate-100 rounded-3xl text-sm font-bold shadow-sm focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500/20 outline-none transition-all"
                />
              </div>

              {/* MAIN QUEUE */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                     <Activity size={14} className="text-emerald-500" />
                     {userRole === 'Admin' ? 'Enterprise Authorization Queue' : 'My Security Requests'}
                   </h3>
                   <div className="h-px flex-1 bg-slate-100 mx-6"></div>
                   <button className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest">View Archives</button>
                </div>

                <div className="card p-0 overflow-hidden divide-y divide-slate-100 border-2 border-slate-100 shadow-2xl rounded-[2.5rem] bg-white">
                  {filteredRequests.length === 0 ? (
                    <div className="p-20 text-center space-y-4">
                       <ShieldCheck className="mx-auto text-slate-100" size={64} />
                       <p className="text-xs font-black text-slate-300 uppercase tracking-widest">End-to-End Encryption Synchronized • No Pending Items</p>
                    </div>
                  ) : (
                    filteredRequests.map(req => (
                      <div key={req.id} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-all group">
                         <div className="flex items-center gap-6">
                            <div className={`h-16 w-16 rounded-3xl flex items-center justify-center shadow-inner ${req.status === 'Pending' ? 'bg-amber-50 text-amber-600' : req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                               {req.status === 'Pending' ? <Lock size={28} /> : req.status === 'Approved' ? <ShieldCheck size={28} /> : <AlertTriangle size={28} />}
                            </div>
                            <div>
                               <div className="flex items-center gap-2">
                                  <p className="text-lg font-black text-slate-900">{req.resource}</p>
                                  {req.justification.includes('High') && <span className="bg-red-50 text-red-600 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest">High Priority</span>}
                               </div>
                               <p className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                                  Requested by <span className="text-slate-900">{req.requestedBy}</span> • {new Date(req.time).toLocaleDateString()}
                               </p>
                               <div className="mt-4 p-3 bg-slate-100/50 rounded-xl border border-slate-200/50">
                                  <p className="text-[10px] text-slate-600 font-bold leading-relaxed">JUSTIFICATION: {req.justification}</p>
                               </div>
                            </div>
                         </div>
                         
                         {userRole === 'Admin' && req.status === 'Pending' ? (
                           <div className="flex gap-3">
                              <button onClick={() => approveRequest(req.id)} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 transition-all hover:-translate-y-1 active:scale-95">
                                 <CheckCircle2 size={16}/> Approve
                              </button>
                              <button onClick={() => rejectAccessRequest(req.id)} className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 border-red-100 hover:bg-red-100 transition-all active:scale-95">
                                 <XCircle size={16}/> Deny
                              </button>
                           </div>
                         ) : (
                           <div className="text-right flex flex-col items-end gap-2">
                              <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : req.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                 {req.status}
                              </div>
                              {req.resolvedAt && <p className="text-[8px] font-black text-slate-300 uppercase">Resolved: {new Date(req.resolvedAt).toLocaleTimeString()}</p>}
                           </div>
                         )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* SIDEBAR WIDGETS */}
            <div className="space-y-8">
              <div className="card bg-slate-900 text-white p-10 shadow-2xl rounded-[3rem] relative overflow-hidden border-none group">
                <div className="absolute -right-10 -top-10 h-40 w-40 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all duration-700"></div>
                <h4 className="font-black text-2xl mb-6 tracking-tight relative z-10 flex items-center gap-3">
                   <ShieldCheck className="text-emerald-400" />
                   IAM Protocols
                </h4>
                <ul className="space-y-6 relative z-10">
                  <ProtocolItem title="Zero-Trust Architecture" desc="Continuous verification of every request payload." />
                  <ProtocolItem title="Just-In-Time Access" desc="Temporary tokens granted for sensitive nodes." />
                  <ProtocolItem title="Immutable Ledger" desc="Every decision is hashed and logged globally." />
                </ul>
              </div>

              <div className="card p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900"><History size={24} /></div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900">Security Insights</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Metrics</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                   <SecurityInsight label="Mean Time to Approval" value="14.2m" trend="down" />
                   <SecurityInsight label="Policy Compliance" value="99.9%" trend="up" />
                </div>

                <button className="w-full py-4 bg-slate-50 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 transition-all flex items-center justify-center gap-2 border border-slate-100">
                   Generate Governance Report <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'request' && (
          <motion.div key="form" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="card max-w-2xl mx-auto p-16 space-y-10 shadow-2xl rounded-[4rem] border-4 border-slate-100 relative overflow-hidden bg-white">
             <div className="absolute top-0 right-0 p-12 opacity-5 text-slate-900 rotate-12"><Lock size={120}/></div>
             <div className="text-center relative z-10">
                <div className="h-24 w-24 rounded-[2rem] bg-slate-900 flex items-center justify-center text-emerald-400 mx-auto mb-8 shadow-2xl shadow-slate-900/30 rotate-3">
                  <Lock size={40} />
                </div>
                <h3 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Elevate Status</h3>
                <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mt-4">Node Authorization Request Protocol</p>
             </div>

             <div className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Target Resource</label>
                      <select value={targetResource} onChange={e=>setTargetResource(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-sm font-black outline-none focus:ring-8 ring-emerald-500/5 focus:border-emerald-500/20 transition-all appearance-none cursor-pointer">
                         <option value="">Select Target Hub...</option>
                         {departments.map(d => <option key={d} value={d}>{d} Library</option>)}
                         <option value="Executive Vault">Executive Vault (Tier-1)</option>
                         <option value="Global Admin Hub">Global Admin Hub (Tier-0)</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Urgency Level</label>
                      <select value={priority} onChange={e=>setPriority(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-sm font-black outline-none focus:ring-8 ring-emerald-500/5 focus:border-emerald-500/20 transition-all appearance-none cursor-pointer">
                         <option>Low</option>
                         <option>Medium</option>
                         <option>High</option>
                         <option>Critical (MFA Triggered)</option>
                      </select>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Professional Justification</label>
                   <textarea value={justification} onChange={e=>setJustification(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-sm font-black h-40 outline-none focus:ring-8 ring-emerald-500/5 focus:border-emerald-500/20 transition-all resize-none placeholder:text-slate-200" placeholder="State your business rationale for this privilege escalation..."></textarea>
                </div>
             </div>

             <div className="flex gap-4 pt-6 relative z-10">
                <button className="flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-white border-2 border-slate-100 text-slate-400 hover:bg-slate-50 transition-all active:scale-95" onClick={() => setStep('list')}>Abort Mission</button>
                <button className="flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-slate-900 text-white shadow-2xl shadow-slate-900/40 transition-all hover:-translate-y-1 active:scale-95 flex justify-center items-center gap-3" onClick={handleRequest}>
                   <Send size={20} className="text-emerald-400" />
                   Transmit Payload
                </button>
             </div>
          </motion.div>
        )}

        {step === 'success' && (
           <motion.div key="success" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-32 card max-w-2xl mx-auto shadow-2xl rounded-[4rem] border-4 border-slate-100 bg-white">
              <div className="h-32 w-32 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mx-auto mb-10 shadow-inner">
                <CheckCircle2 size={72} className="drop-shadow-lg" />
              </div>
              <h3 className="text-5xl font-black tracking-tighter text-slate-900 uppercase">Transmission Sent</h3>
              <p className="text-sm text-slate-500 font-bold mt-6 px-16 leading-relaxed uppercase tracking-widest">
                Your authorization request has been encrypted and transmitted to the Global Admin queue. 
                Permissions will reflect in your identity token upon approval.
              </p>
              <button className="mt-16 bg-slate-900 text-white px-16 py-5 rounded-2xl shadow-2xl shadow-slate-900/30 font-black text-xs uppercase tracking-[0.3em] hover:-translate-y-1 transition-all active:scale-95" onClick={() => setStep('list')}>Return to Portal</button>
           </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const MetricCard = ({ label, value, icon, color }) => (
  <div className="card bg-white border-2 border-slate-100 p-6 rounded-[2rem] flex items-center gap-5 shadow-sm hover:shadow-xl transition-all group">
     <div className={`h-14 w-14 rounded-2xl bg-${color}-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
        {icon}
     </div>
     <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
     </div>
  </div>
);

const ProtocolItem = ({ title, desc }) => (
  <li className="flex gap-4">
     <div className="h-6 w-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-1"><ShieldCheck size={14} /></div>
     <div>
        <p className="text-[11px] font-black text-white uppercase tracking-wider">{title}</p>
        <p className="text-[9px] font-bold text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
     </div>
  </li>
);

const SecurityInsight = ({ label, value, trend }) => (
  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
     <div className="flex items-center gap-2">
        <span className="text-xs font-black text-slate-900">{value}</span>
        {trend === 'up' ? <TrendingUp size={12} className="text-emerald-500" /> : <TrendingUp size={12} className="text-amber-500 rotate-180" />}
     </div>
  </div>
);

export default AccessRequestSystem;
