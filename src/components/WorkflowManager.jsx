import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, Clock, FileText, User,
  Activity, ShieldCheck, Zap, ChevronRight, AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const WorkflowManager = () => {
  const {
    pendingApprovals, approveDocument, rejectDocument,
    pendingRequests, approveRequest, documents, userRole,
    submitForApproval, auditLogs
  } = useApp();

  const [activeSection, setActiveSection] = useState('approvals');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const pendingList = pendingApprovals.filter(a => a.status === 'Pending');
  const resolvedList = pendingApprovals.filter(a => a.status !== 'Pending');
  const draftDocs = documents.filter(d => d.status === 'draft');
  const canApprove = ['Admin', 'Manager'].includes(userRole);

  const handleReject = (id) => {
    rejectDocument(id, rejectReason || 'Requires revision');
    setRejectingId(null);
    setRejectReason('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Workflow Engine</h2>
          <p className="text-muted-foreground font-medium text-sm">Document lifecycle management — Input → Processing → Output</p>
        </div>
        <div className="flex gap-3">
          <div className="card py-2 px-4 flex items-center gap-2">
            <Zap size={16} className="text-primary" />
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Pending</p>
              <p className="text-sm font-extrabold text-primary">{pendingList.length} Approvals</p>
            </div>
          </div>
        </div>
      </div>

      {/* SYSTEM FLOW DIAGRAM */}
      <div className="card p-6" style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f0fdf4 100%)' }}>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">🔄 Live System Flow</p>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'Upload', icon: '⬆', color: '#2563EB', desc: 'User uploads file' },
            { label: 'Metadata', icon: '🏷', color: '#7C3AED', desc: 'Tags + classification' },
            { label: 'Review Queue', icon: '⏳', color: '#D97706', desc: 'Pending approval' },
            { label: 'Approve / Reject', icon: '⚡', color: '#1F7A6B', desc: 'Manager decision' },
            { label: 'Published', icon: '✅', color: '#16A34A', desc: 'Visible to users' },
            { label: 'Archive', icon: '📦', color: '#6B7280', desc: 'Long-term storage' },
          ].map((step, i, arr) => (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center gap-1 text-center">
                <div style={{ background: `${step.color}15`, border: `1.5px solid ${step.color}30`, color: step.color, width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  {step.icon}
                </div>
                <p className="text-[10px] font-bold" style={{ color: step.color }}>{step.label}</p>
                <p className="text-[9px] text-muted-foreground">{step.desc}</p>
              </div>
              {i < arr.length - 1 && (
                <ChevronRight size={16} className="text-muted-foreground" style={{ marginBottom: '20px' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* NAV TABS */}
      <div className="flex gap-1 border-b border-border overflow-x-auto scrollbar-hide whitespace-nowrap">
        {[
          { key: 'approvals', label: `Approval Queue (${pendingList.length})` },
          { key: 'submit', label: `Submit for Review (${draftDocs.length} drafts)` },
          { key: 'requests', label: `Access Requests (${pendingRequests.filter(r=>r.status==='Pending').length})` },
          { key: 'history', label: 'Resolved History' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className="pb-3 px-4 text-sm font-semibold transition-colors"
            style={{ borderBottom: activeSection === tab.key ? '2px solid #1F7A6B' : '2px solid transparent', color: activeSection === tab.key ? '#1F7A6B' : '#6B7280' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* APPROVAL QUEUE */}
        {activeSection === 'approvals' && (
          <motion.div key="approvals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {!canApprove && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '1rem 1.5rem' }} className="flex items-center gap-3">
                <AlertTriangle size={18} style={{ color: '#D97706' }} />
                <p className="text-sm font-medium" style={{ color: '#92400E' }}>Only <strong>Admin</strong> or <strong>Manager</strong> roles can approve documents. Switch your role to test this.</p>
              </div>
            )}
            {pendingList.length === 0 ? (
              <div className="card p-16 text-center text-muted-foreground">
                <CheckCircle2 size={40} className="mx-auto mb-4 text-primary" style={{ opacity: 0.4 }} />
                <p className="font-bold">All documents processed</p>
                <p className="text-sm">No pending approvals in the queue.</p>
              </div>
            ) : (
              pendingList.map(approval => (
                <div key={approval.id} className="card p-0 overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                    <div className="flex items-center gap-4">
                      <div style={{ background: '#FFF7ED', color: '#D97706', width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Clock size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{approval.docName}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">Submitted by <strong>{approval.submittedBy}</strong></span>
                          <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }}>{approval.dept}</span>
                          <span className="text-xs text-muted-foreground">{new Date(approval.time).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {canApprove && rejectingId !== approval.id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveDocument(approval.id)}
                          style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', fontWeight: 700, fontSize: '13px', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background='#DCFCE7'}
                          onMouseLeave={e => e.currentTarget.style.background='#F0FDF4'}
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => setRejectingId(approval.id)}
                          style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FEE2E2', fontWeight: 700, fontSize: '13px', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background='#FFE4E6'}
                          onMouseLeave={e => e.currentTarget.style.background='#FEF2F2'}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Rejection reason input */}
                  {rejectingId === approval.id && (
                    <div style={{ background: '#FEF2F2', borderTop: '1px solid #FEE2E2', padding: '1rem 1.5rem' }}>
                      <p className="text-xs font-bold text-destructive mb-2">Enter rejection reason:</p>
                      <div className="flex gap-3">
                        <input
                          autoFocus
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          placeholder="e.g. Missing signatures on section 3..."
                          style={{ flex: 1, background: '#fff', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none' }}
                        />
                        <button onClick={() => handleReject(approval.id)} style={{ background: '#DC2626', color: '#fff', fontWeight: 700, fontSize: '12px', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', border: 'none' }}>Send Back</button>
                        <button onClick={() => setRejectingId(null)} style={{ background: '#F3F4F6', color: '#374151', fontWeight: 700, fontSize: '12px', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', border: 'none' }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* SUBMIT FOR REVIEW */}
        {activeSection === 'submit' && (
          <motion.div key="submit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm text-muted-foreground">Select a draft document to submit for manager approval. This triggers the approval workflow.</p>
            {draftDocs.length === 0 ? (
              <div className="card p-16 text-center text-muted-foreground">
                <FileText size={40} className="mx-auto mb-4 text-primary" style={{ opacity: 0.4 }} />
                <p className="font-bold">No draft documents</p>
                <p className="text-sm">Upload a document first via the Upload Center.</p>
              </div>
            ) : (
              draftDocs.map(doc => (
                <div key={doc.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-bold text-sm">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.dept} • v{doc.version} • {doc.date}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => submitForApproval(doc.id)}
                    style={{ background: '#1F7A6B', color: '#fff', fontWeight: 700, fontSize: '12px', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', border: 'none', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => e.currentTarget.style.background='#165a4f'}
                    onMouseLeave={e => e.currentTarget.style.background='#1F7A6B'}
                  >
                    ⚡ Submit for Approval
                  </button>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* ACCESS REQUESTS */}
        {activeSection === 'requests' && (
          <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="card p-16 text-center text-muted-foreground">
                <ShieldCheck size={40} className="mx-auto mb-4 text-primary" style={{ opacity: 0.4 }} />
                <p className="font-bold">No access requests</p>
                <p className="text-sm">Submit a request from the Access & Governance module.</p>
              </div>
            ) : (
              pendingRequests.map(req => (
                <div key={req.id} className="card flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{req.resource}</p>
                    <p className="text-xs text-muted-foreground mt-1">Requested by <strong>{req.requestedBy}</strong> • {req.justification}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{
                      background: req.status === 'Approved' ? '#F0FDF4' : '#FFF7ED',
                      color: req.status === 'Approved' ? '#16A34A' : '#D97706',
                      fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px',
                      border: `1px solid ${req.status === 'Approved' ? '#BBF7D0' : '#FDE68A'}`
                    }}>{req.status}</span>
                    {req.status === 'Pending' && canApprove && (
                      <button onClick={() => approveRequest(req.id)} style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', fontWeight: 700, fontSize: '12px', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer' }}>Grant</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* RESOLUTION HISTORY */}
        {activeSection === 'history' && (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-0 overflow-hidden">
            {resolvedList.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground">
                <Activity size={40} className="mx-auto mb-4" style={{ opacity: 0.3 }} />
                <p className="font-bold">No resolved workflows yet</p>
              </div>
            ) : (
              <div>
                {resolvedList.map(a => (
                  <div key={a.id} className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <div className="flex items-center gap-3">
                      <div style={{ background: a.status === 'Approved' ? '#F0FDF4' : '#FEF2F2', color: a.status === 'Approved' ? '#16A34A' : '#DC2626', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {a.status === 'Approved' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{a.docName}</p>
                        <p className="text-xs text-muted-foreground">{a.dept} • {a.status} {a.resolvedAt ? `• ${new Date(a.resolvedAt).toLocaleDateString()}` : ''}</p>
                        {a.reason && <p className="text-xs" style={{ color: '#DC2626', marginTop: '2px' }}>Reason: {a.reason}</p>}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: a.status === 'Approved' ? '#16A34A' : '#DC2626' }}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WorkflowManager;
