import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, UserPlus, CheckCircle2, XCircle, Lock, Info, Clock, Send,
  UserCheck, Search, Activity, ArrowRight, ShieldCheck, AlertTriangle, History,
  TrendingUp, Fingerprint, Kanban, List, MessageSquare, ChevronRight, X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const AccessRequestSystem = () => {
  const {
    requestAccess, pendingRequests, userRole, approveRequest, rejectAccessRequest,
    userName, systemUsers, departments, logAction, currentUser
  } = useApp();

  const [step, setStep] = useState('list'); // list | request | success
  const [layoutMode, setLayoutMode] = useState('kanban'); // kanban | list
  const [selectedReq, setSelectedReq] = useState(null); // Gmail thread style detail view
  
  // New Request Form
  const [targetResource, setTargetResource] = useState('');
  const [justification, setJustification] = useState('');
  const [priority, setPriority] = useState('Medium');

  // Approval Modal with reason comment
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [decisionReason, setDecisionReason] = useState('');
  const [actionTargetReqId, setActionTargetReqId] = useState(null);
  const [actionType, setActionType] = useState('approve'); // approve | reject

  const handleRequest = () => {
    if (!targetResource) return;
    requestAccess(targetResource, `[${priority} Priority] SLA-2h: ${justification}`);
    logAction(currentUser?.name, 'Created Access Request', targetResource);
    setStep('success');
  };

  const handleDecision = (e) => {
    e.preventDefault();
    if (!actionTargetReqId) return;

    if (actionType === 'approve') {
      approveRequest(actionTargetReqId);
      logAction(currentUser?.name, `Approved Access Request (${decisionReason || 'No comment'})`, actionTargetReqId);
    } else {
      rejectAccessRequest(actionTargetReqId);
      logAction(currentUser?.name, `Rejected Access Request (${decisionReason || 'No comment'})`, actionTargetReqId);
    }

    setShowApprovalModal(false);
    setDecisionReason('');
    setActionTargetReqId(null);
    setSelectedReq(null);
  };

  // Mock SLA calculation: SLA is 2 hours. If more than 2 hours elapsed, show "Overdue"
  const getSLAInfo = (reqTime) => {
    const elapsedHrs = (Date.now() - new Date(reqTime).getTime()) / 3600000;
    if (elapsedHrs > 2) {
      return { isOverdue: true, label: `Overdue by ${Math.floor(elapsedHrs - 2)}h` };
    }
    return { isOverdue: false, label: 'SLA Active (2h limit)' };
  };

  // Priority parser
  const getPriorityInfo = (justification = '') => {
    if (justification.includes('High')) return { color: 'bg-red-50 text-red-600 border-red-150', text: 'High' };
    if (justification.includes('Critical')) return { color: 'bg-rose-100 text-rose-700 border-rose-200', text: 'Critical' };
    return { color: 'bg-slate-50 text-slate-600 border-slate-150', text: 'Normal' };
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12">
      
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldAlert size={32} className="text-slate-900" />
            IAM Access Request Desk
          </h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mt-1">
            Zero-Trust Escalations, Just-In-Time access controls & SLA workflows
          </p>
        </div>
        <div className="flex gap-2">
          {userRole !== 'Admin' && step === 'list' && (
            <button onClick={() => setStep('request')} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2">
              <UserPlus size={14} /> Request Access
            </button>
          )}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {[{v:'kanban',label:<Kanban size={13}/>},{v:'list',label:<List size={13}/>}].map(l => (
              <button key={l.v} onClick={() => setLayoutMode(l.v)} className={`p-2 rounded-lg transition-all ${layoutMode === l.v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* ── QUEUE / MAIN WORKSPACE ── */}
        {step === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Queue Panel */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Kanban Column View */}
              {layoutMode === 'kanban' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {['Pending', 'Approved', 'Rejected'].map(status => {
                    const colReqs = pendingRequests.filter(r => r.status === status);
                    return (
                      <div key={status} className="bg-slate-50/50 rounded-3xl p-4 border border-slate-100 flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center mb-4 px-1">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{status} Queue</h4>
                          <span className="text-[9px] font-black bg-white border border-slate-150 text-slate-600 px-2 py-0.5 rounded-full">{colReqs.length}</span>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto">
                          {colReqs.map(req => {
                            const priorityInfo = getPriorityInfo(req.justification);
                            const sla = getSLAInfo(req.time);
                            return (
                              <div key={req.id} onClick={() => setSelectedReq(req)}
                                className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group ${selectedReq?.id === req.id ? 'ring-2 ring-emerald-500 border-emerald-500' : ''}`}>
                                <h5 className="font-extrabold text-xs text-slate-900">{req.resource}</h5>
                                <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase truncate">BY: {req.requestedBy}</p>
                                
                                <div className="mt-3 flex justify-between items-center text-[8px] font-black uppercase">
                                  <span className={`px-1.5 py-0.5 rounded border ${priorityInfo.color}`}>{priorityInfo.text}</span>
                                  {req.status === 'Pending' && (
                                    <span className={sla.isOverdue ? 'text-red-500 font-extrabold animate-pulse' : 'text-slate-400'}>{sla.label}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {colReqs.length === 0 && (
                            <p className="text-center py-10 text-[9px] font-black text-slate-400 uppercase tracking-widest">No Items</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* List View */}
              {layoutMode === 'list' && (
                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100">
                  {pendingRequests.map(req => {
                    const priorityInfo = getPriorityInfo(req.justification);
                    const sla = getSLAInfo(req.time);
                    return (
                      <div key={req.id} onClick={() => setSelectedReq(req)} className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors">
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900">{req.resource}</h4>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Operator: {req.requestedBy} · Requested: {new Date(req.time).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase ${priorityInfo.color}`}>{priorityInfo.text}</span>
                          <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg ${req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{req.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Gmail/Detail Style View */}
            <div className="lg:col-span-1 bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm flex flex-col justify-between h-[450px]">
              {selectedReq ? (
                <div className="flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="font-black text-sm text-slate-950">{selectedReq.resource}</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">REQUEST CODE: #{selectedReq.id}</p>
                      </div>
                      <span className="text-[8px] bg-slate-900 text-white font-black px-2 py-0.5 rounded uppercase tracking-widest">{selectedReq.status}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] text-slate-600 font-bold">
                        <span className="text-slate-400 uppercase tracking-widest text-[8px] font-black block">Justification details</span>
                        <p className="bg-slate-50 border border-slate-150 rounded-xl p-3 mt-1.5 leading-relaxed">{selectedReq.justification}</p>
                      </div>
                      <div className="text-[10px] text-slate-600 font-bold">
                        <span className="text-slate-400 uppercase tracking-widest text-[8px] font-black block">Origin Operator</span>
                        <p className="font-extrabold text-slate-800 mt-1">{selectedReq.requestedBy}</p>
                      </div>
                    </div>
                  </div>

                  {userRole === 'Admin' && selectedReq.status === 'Pending' && (
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                      <button onClick={() => { setActionTargetReqId(selectedReq.id); setActionType('approve'); setShowApprovalModal(true); }} className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/10">Approve</button>
                      <button onClick={() => { setActionTargetReqId(selectedReq.id); setActionType('reject'); setShowApprovalModal(true); }} className="py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-500/10">Deny</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-20 text-slate-400 my-auto">
                  <Fingerprint size={32} className="mx-auto opacity-20 mb-3" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Select request to inspect thread details</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── REQUEST PRIVILEGE ESCALATION FORM ── */}
        {step === 'request' && (
          <motion.div key="form" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="bg-white border border-slate-100 shadow-sm rounded-[2.5rem] p-8 max-w-xl mx-auto space-y-6">
            <div className="text-center">
              <Lock size={32} className="mx-auto text-slate-900 mb-2" />
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Privilege Escalation Request</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">FIPS System Security Level Elevation Protocol</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Target resource hub</label>
                <select value={targetResource} onChange={e => setTargetResource(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-bold outline-none cursor-pointer">
                  <option value="">Select Resource...</option>
                  {departments.map(d => <option key={d} value={d}>{d} Library</option>)}
                  <option value="Secure Enclave">Secure Enclave Vault</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Justification priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-bold outline-none cursor-pointer">
                  <option>Normal</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Business justification</label>
                <textarea value={justification} onChange={e => setJustification(e.target.value)} rows={4} placeholder="State logic for privilege override..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none resize-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => setStep('list')} className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all">Abort</button>
              <button onClick={handleRequest} className="py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">Transmit</button>
            </div>
          </motion.div>
        )}

        {/* ── SUCCESS SCREEN ── */}
        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-100 shadow-sm rounded-[2.5rem] p-16 text-center max-w-xl mx-auto space-y-6">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner"><CheckCircle2 size={44} /></div>
            <h3 className="text-2xl font-black text-slate-900 uppercase">Transmission Successful</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider leading-relaxed px-6">
              Your security payload has been transmitted to global admin console. You will be notified on status override.
            </p>
            <button onClick={() => setStep('list')} className="px-10 py-3.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow-lg">Return to Desk</button>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── DECISION REASON MODAL ── */}
      <AnimatePresence>
        {showApprovalModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 border border-slate-100 relative">
              <button onClick={() => setShowApprovalModal(false)} className="absolute p-2 right-4 top-4 text-slate-400 hover:text-slate-650 transition-colors"><X size={18} /></button>
              <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 mb-1">{actionType === 'approve' ? 'Approve Access Request' : 'Deny Access Request'}</h3>
              <p className="text-xs text-slate-400">Append governance comment to ledger action.</p>
              
              <form onSubmit={handleDecision} className="mt-5 space-y-4">
                <input autoFocus type="text" value={decisionReason} onChange={e => setDecisionReason(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-bold outline-none" placeholder="Reason (optional)" />
                <button type="submit" className={`w-full py-3.5 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl ${actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10' : 'bg-red-600 hover:bg-red-700 shadow-red-500/10'}`}>
                  Seal Decision
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default AccessRequestSystem;
