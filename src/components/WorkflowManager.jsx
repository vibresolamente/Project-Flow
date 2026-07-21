import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, Clock, FileText, User,
  Activity, ShieldCheck, Zap, ChevronRight, AlertTriangle,
  Play, Settings, RefreshCw, GitBranch, Plus, Trash, ArrowRight, Save, LayoutGrid, Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const INITIAL_NODES = [
  { id: '1', type: 'trigger', title: 'Document Uploaded', x: 50, y: 120, config: { dept: 'All' } },
  { id: '2', type: 'condition', title: 'Sensitivity Check', x: 250, y: 120, config: { value: 'Confidential' } },
  { id: '3', type: 'action', title: 'Route for Approval', x: 450, y: 50, config: { role: 'Manager' } },
  { id: '4', type: 'action', title: 'Auto-Seal in Vault', x: 450, y: 200, config: { duration: '24h' } },
  { id: '5', type: 'notify', title: 'Slack Notification', x: 650, y: 120, config: { channel: '#sec-ops' } }
];

const TEMPLATES = [
  {
    name: 'Standard Manager Consent',
    nodes: [
      { id: '1', type: 'trigger', title: 'Document Uploaded', x: 50, y: 120, config: { dept: 'All' } },
      { id: '2', type: 'action', title: 'Manager Sign-off', x: 280, y: 120, config: { role: 'Manager' } },
      { id: '3', type: 'notify', title: 'Email Roster Alert', x: 500, y: 120, config: { template: 'approved-notice' } }
    ]
  },
  {
    name: 'Zero-Trust Enclave Sealing',
    nodes: [
      { id: '1', type: 'trigger', title: 'Document Uploaded', x: 50, y: 120, config: { dept: 'All' } },
      { id: '2', type: 'condition', title: 'If "Restricted"', x: 250, y: 120, config: { value: 'Restricted' } },
      { id: '3', type: 'action', title: 'Apply Crypto Lock', x: 460, y: 50, config: { strength: 'AES-256' } },
      { id: '4', type: 'notify', title: 'Audit Alert Triggered', x: 680, y: 120, config: { notify: 'Admin' } }
    ]
  }
];

const WorkflowManager = () => {
  const {
    pendingApprovals, approveDocument, rejectDocument,
    pendingRequests, approveRequest, documents, userRole,
    submitForApproval, auditLogs, currentUser, logAction
  } = useApp();

  const [activeSection, setActiveSection] = useState('approvals'); // approvals | builder | submit | requests | history
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Builder State
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [simulationActive, setSimulationActive] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState('Custom Workflow');

  const pendingList = pendingApprovals.filter(a => a.status === 'Pending');
  const resolvedList = pendingApprovals.filter(a => a.status !== 'Pending');
  const draftDocs = documents.filter(d => d.status === 'draft');
  const canApprove = ['Admin', 'Manager'].includes(userRole);

  const handleReject = (id) => {
    rejectDocument(id, rejectReason || 'Requires revision');
    setRejectingId(null);
    setRejectReason('');
  };

  // Node Actions
  const handleNodeClick = (id) => {
    setSelectedNodeId(id);
  };

  const updateNodeConfig = (id, field, value) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, config: { ...n.config, [field]: value } } : n));
  };

  const addBuilderNode = (type) => {
    const title = type === 'trigger' ? 'New Trigger' : type === 'condition' ? 'New Condition' : type === 'action' ? 'New Action' : 'Notify Team';
    const newNode = {
      id: Date.now().toString(),
      type,
      title,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 150,
      config: {}
    };
    setNodes(prev => [...prev, newNode]);
  };

  const deleteNode = (id) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const loadTemplate = (tpl) => {
    setNodes(tpl.nodes);
    setActiveTemplate(tpl.name);
    setSelectedNodeId(null);
    logAction(currentUser?.name, 'Loaded Workflow Template', tpl.name);
  };

  // Live simulator logic
  const runSimulation = () => {
    setSimulationActive(true);
    setSimulationLogs(['Initializing logic nodes...', 'Evaluating trigger condition...']);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step === 1) {
        setSimulationLogs(p => [...p, 'Trigger matched: new draft document.']);
      } else if (step === 2) {
        setSimulationLogs(p => [...p, 'Branch evaluated: sensitivity check complete.']);
      } else if (step === 3) {
        setSimulationLogs(p => [...p, 'Action executed: routed for cryptographic key assignment.']);
      } else if (step === 4) {
        setSimulationLogs(p => [...p, 'Notifications dispatched successfully.']);
      } else {
        setSimulationLogs(p => [...p, 'Simulation finished: 0 faults detected.']);
        setSimulationActive(false);
        clearInterval(interval);
      }
    }, 1000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Workflow Engine</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mt-1">
            Automate approvals, security checks, and document lifecycle triggers
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveSection('builder')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${activeSection === 'builder' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-350'}`}>
            <GitBranch size={13} className="inline mr-1" /> Workflow Builder
          </button>
          <div className="bg-white border border-slate-100 rounded-xl px-4 py-2 shadow-sm flex items-center gap-2">
            <Zap size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Queue: <span className="text-slate-900">{pendingList.length} items</span></span>
          </div>
        </div>
      </div>

      {/* ── TABS NAVIGATION ── */}
      <div className="flex border-b border-slate-100 overflow-x-auto scrollbar-hide whitespace-nowrap bg-white p-2 rounded-2xl shadow-sm gap-1">
        {[
          { key: 'approvals', label: `Approval Queue (${pendingList.length})` },
          { key: 'submit', label: `Submit for Review (${draftDocs.length})` },
          { key: 'requests', label: `Access Requests (${pendingRequests.filter(r => r.status === 'Pending').length})` },
          { key: 'history', label: 'Resolution History' },
        ].map(tab => (
          <button key={tab.key} onClick={() => { setActiveSection(tab.key); setSelectedNodeId(null); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeSection === tab.key ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        
        {/* ── VISUAL BUILDER VIEW ── */}
        {activeSection === 'builder' && (
          <motion.div key="builder" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left sidebar templates & nodes palette */}
            <div className="lg:col-span-1 space-y-6">
              {/* Templates */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Templates</h4>
                <div className="space-y-2">
                  {TEMPLATES.map((t, idx) => (
                    <button key={idx} onClick={() => loadTemplate(t)} className="w-full text-left p-3 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-2xl transition-all">
                      <p className="font-bold text-xs text-slate-800">{t.name}</p>
                      <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold">Deploy instant logic</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Node Types Palette */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">Node Palette</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['trigger', 'condition', 'action', 'notify'].map(type => (
                    <button key={type} onClick={() => addBuilderNode(type)} className="p-3 bg-slate-50 border border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 rounded-2xl text-center transition-all group">
                      <Plus size={16} className="mx-auto text-slate-400 group-hover:text-emerald-600 mb-1" />
                      <span className="text-[9px] font-black uppercase text-slate-600 group-hover:text-emerald-700 tracking-wider">{type}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Canvas Grid */}
            <div className="lg:col-span-2 space-y-4 flex flex-col">
              <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm p-6 relative overflow-hidden h-[420px] flex flex-col justify-between">
                
                {/* SVG Connections Layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  {/* Drawing connections sequentially for mockup flow lines */}
                  {nodes.map((n, i) => {
                    if (i === nodes.length - 1) return null;
                    const next = nodes[i + 1];
                    const sx = n.x + 80;
                    const sy = n.y + 25;
                    const ex = next.x;
                    const ey = next.y + 25;
                    return (
                      <g key={n.id}>
                        <path d={`M ${sx} ${sy} C ${(sx + ex)/2} ${sy}, ${(sx + ex)/2} ${ey}, ${ex} ${ey}`} fill="none" stroke={simulationActive ? '#10B981' : '#E2E8F0'} strokeWidth={3} strokeDasharray={simulationActive ? '8 4' : 'none'} className={simulationActive ? 'animate-dash' : ''} />
                      </g>
                    );
                  })}
                </svg>

                {/* Nodes rendering */}
                <div className="relative flex-1 z-10">
                  {nodes.map(node => (
                    <motion.div key={node.id} drag dragMomentum={false} onDrag={(e, info) => setNodes(p => p.map(n => n.id === node.id ? { ...n, x: n.x + info.delta.x, y: n.y + info.delta.y } : n))} onClick={() => handleNodeClick(node.id)}
                      className={`absolute w-36 p-3 bg-white border rounded-2xl shadow-md cursor-grab active:cursor-grabbing hover:border-slate-350 transition-colors select-none ${selectedNodeId === node.id ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-slate-150'}`}
                      style={{ left: node.x, top: node.y }}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${node.type === 'trigger' ? 'bg-blue-500' : node.type === 'condition' ? 'bg-purple-500' : node.type === 'action' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} className="text-slate-300 hover:text-red-500 transition-colors"><Trash size={10} /></button>
                      </div>
                      <p className="font-extrabold text-[10px] text-slate-800 truncate">{node.title}</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{node.type}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Simulator controls */}
                <div className="relative z-10 flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active: {activeTemplate}</span>
                  <button onClick={runSimulation} disabled={simulationActive} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-md">
                    <Play size={10} fill="white" /> {simulationActive ? 'Running...' : 'Simulate Engine'}
                  </button>
                </div>
              </div>

              {/* Simulation Logger */}
              {simulationLogs.length > 0 && (
                <div className="bg-slate-950 text-emerald-400 rounded-3xl p-5 font-mono text-[10px] space-y-1 shadow-inner h-32 overflow-y-auto">
                  <div className="flex justify-between items-center text-slate-500 mb-2 border-b border-slate-800 pb-1">
                    <span>ENGINE SIMULATION TRANSACTION LOGGER</span>
                    <button onClick={() => setSimulationLogs([])} className="hover:text-white">Clear</button>
                  </div>
                  {simulationLogs.map((log, i) => <p key={i}>&gt; {log}</p>)}
                </div>
              )}
            </div>

            {/* Right node config panel */}
            <div className="lg:col-span-1 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Node Properties</h4>
              {selectedNodeId ? (() => {
                const node = nodes.find(n => n.id === selectedNodeId);
                if (!node) return null;
                return (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Custom Title</label>
                      <input type="text" value={node.title} onChange={e => setNodes(p => p.map(n => n.id === node.id ? { ...n, title: e.target.value } : n))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none" />
                    </div>

                    {node.type === 'trigger' && (
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Department Filter</label>
                        <select value={node.config.dept || 'All'} onChange={e => updateNodeConfig(node.id, 'dept', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none">
                          <option>All</option>
                          <option>Operations</option>
                          <option>Finance</option>
                          <option>Legal</option>
                        </select>
                      </div>
                    )}

                    {node.type === 'condition' && (
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Matching Sensitivity</label>
                        <select value={node.config.value || 'Internal'} onChange={e => updateNodeConfig(node.id, 'value', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none">
                          <option>Public</option>
                          <option>Internal</option>
                          <option>Confidential</option>
                          <option>Restricted</option>
                        </select>
                      </div>
                    )}

                    {node.type === 'action' && (
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Authorized Signee Role</label>
                        <select value={node.config.role || 'Manager'} onChange={e => updateNodeConfig(node.id, 'role', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none">
                          <option>Manager</option>
                          <option>Admin</option>
                          <option>Reviewer</option>
                        </select>
                      </div>
                    )}

                    {node.type === 'notify' && (
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Target Slack Channel</label>
                        <input type="text" value={node.config.channel || '#sec-ops'} onChange={e => updateNodeConfig(node.id, 'channel', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none font-mono" />
                      </div>
                    )}

                    <button onClick={() => { setSelectedNodeId(null); logAction(currentUser?.name, 'Saved Workflow Node Config', node.title); }} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-500/10">
                      Apply Changes
                    </button>
                  </div>
                );
              })() : (
                <p className="text-[10px] text-slate-400 italic">Select a node on the canvas to edit properties.</p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── APPROVAL QUEUE VIEW ── */}
        {activeSection === 'approvals' && (
          <motion.div key="approvals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {!canApprove && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
                <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                <p className="text-xs font-bold text-amber-800">Only Manager/Admin roles can approve documents. Switch roles in the Identity module.</p>
              </div>
            )}
            {pendingList.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center text-slate-400">
                <CheckCircle2 size={40} className="mx-auto mb-4 text-emerald-500 opacity-60" />
                <p className="font-black text-sm uppercase text-slate-800">All Workflows Cleared</p>
                <p className="text-xs text-slate-400 mt-1">No pending documents in approval stages.</p>
              </div>
            ) : (
              pendingList.map(approval => (
                <div key={approval.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{approval.docName}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold flex items-center gap-2 uppercase">
                        <span>Submitted by: {approval.submittedBy}</span>
                        <span>·</span>
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{approval.dept}</span>
                        <span>·</span>
                        <span>{new Date(approval.time).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>

                  {canApprove && rejectingId !== approval.id && (
                    <div className="flex gap-2">
                      <button onClick={() => approveDocument(approval.id)} className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-black uppercase tracking-wider transition-colors">
                        Approve
                      </button>
                      <button onClick={() => setRejectingId(approval.id)} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded-xl text-xs font-black uppercase tracking-wider transition-colors">
                        Reject
                      </button>
                    </div>
                  )}

                  {rejectingId === approval.id && (
                    <div className="w-full md:w-auto flex gap-2">
                      <input autoFocus value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..." className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none" />
                      <button onClick={() => handleReject(approval.id)} className="px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">Reject</button>
                      <button onClick={() => setRejectingId(null)} className="px-3 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">Cancel</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* ── SUBMIT FOR REVIEW VIEW ── */}
        {activeSection === 'submit' && (
          <motion.div key="submit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {draftDocs.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center text-slate-400">
                <FileText size={40} className="mx-auto mb-4 opacity-35" />
                <p className="font-black text-sm uppercase text-slate-800">No Drafts Available</p>
                <p className="text-xs text-slate-400 mt-1">Upload files first in the document staging dashboard.</p>
              </div>
            ) : (
              draftDocs.map(doc => (
                <div key={doc.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-slate-400 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{doc.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold">{doc.dept} · v{doc.version || '1.0'} · {doc.date}</p>
                    </div>
                  </div>
                  <button onClick={() => submitForApproval(doc.id)} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-500/10">
                    Submit Workflow
                  </button>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* ── ACCESS REQUESTS VIEW ── */}
        {activeSection === 'requests' && (
          <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center text-slate-400">
                <ShieldCheck size={40} className="mx-auto mb-4 opacity-35" />
                <p className="font-black text-sm uppercase text-slate-800">No Access Requests</p>
              </div>
            ) : (
              pendingRequests.map(req => (
                <div key={req.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{req.resource}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 font-bold">Requested by: {req.requestedBy} · Reason: {req.justification}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg">{req.status}</span>
                    {req.status === 'Pending' && canApprove && (
                      <div className="flex gap-1.5">
                        <button onClick={() => approveRequest(req.id)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold">Approve</button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* ── HISTORICAL LOGS VIEW ── */}
        {activeSection === 'history' && (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-slate-100 rounded-3xl p-0 overflow-hidden divide-y divide-slate-150 shadow-sm">
            {resolvedList.length === 0 ? (
              <div className="p-16 text-center text-slate-400">
                <Activity size={40} className="mx-auto mb-4 opacity-35" />
                <p className="font-black text-sm uppercase text-slate-800">No history found</p>
              </div>
            ) : (
              resolvedList.map(a => (
                <div key={a.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${a.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {a.status === 'Approved' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{a.docName}</h4>
                      <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase">{a.dept} {a.resolvedAt ? `· ${new Date(a.resolvedAt).toLocaleDateString()}` : ''}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase ${a.status === 'Approved' ? 'text-emerald-600' : 'text-red-600'}`}>{a.status}</span>
                </div>
              ))
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
};

export default WorkflowManager;
