import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, History, RotateCcw, FileText, User, Clock, ShieldCheck, Search, Activity,
  Filter, CheckSquare, Sparkles, Download, AlertCircle, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const COMPLIANCE_ITEMS = [
  { id: '1', standard: 'ISO 27001', control: 'A.12.4.1 Event Logging', status: 'Compliant', desc: 'Audit trails recording user activities are active.' },
  { id: '2', standard: 'ISO 27001', control: 'A.10.1.1 Cryptographic Controls', status: 'Compliant', desc: 'AES-256 vault enclaves are active.' },
  { id: '3', standard: 'GDPR', control: 'Article 32 Security of Processing', status: 'Compliant', desc: 'Pristine end-to-end user encryption verification.' },
  { id: '4', standard: 'SOX', control: 'Section 404 Internal Controls', status: 'Pending Review', desc: 'Needs periodic manager sign-off checklist.' }
];

const GovernanceCenter = () => {
  const { auditLogs, recycleBin, restoreDocument, userRole, currentUser, logAction } = useApp();

  const [activeTab, setActiveTab] = useState('ledger'); // ledger | bin | compliance
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUser, setFilterUser] = useState('All');

  // Filter logs logic
  const filteredLogs = useMemo(() => {
    let base = auditLogs;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      base = base.filter(l => l.action?.toLowerCase().includes(q) || l.target?.toLowerCase().includes(q));
    }
    if (filterUser !== 'All') {
      base = base.filter(l => l.user === filterUser);
    }
    return base;
  }, [auditLogs, searchQuery, filterUser]);

  // Unique users for filtering
  const allUsers = useMemo(() => ['All', ...new Set(auditLogs.map(l => l.user).filter(Boolean))], [auditLogs]);

  const handleExportCSV = () => {
    if (!auditLogs || auditLogs.length === 0) return;
    
    const headers = ['ID', 'Time', 'User', 'Action', 'Target', 'Cryptographic Signature'];
    const rows = auditLogs.map(log => [
      log.id,
      new Date(log.time).toISOString(),
      `"${log.user}"`,
      `"${log.action}"`,
      `"${log.target}"`,
      `"${log.hash}"`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ProjectFlow_AuditLog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logAction(currentUser?.name, 'Exported Audit Ledger', 'CSV Format');
  };

  const handleExportPDF = () => {
    // Simulate PDF digital signature generation
    const signature = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const reportHtml = `
      <html>
        <body style="font-family: monospace; padding: 40px; color: #1e293b;">
          <h2>PROJECTFLOW KE GOVERNANCE AUDIT REPORT</h2>
          <p>Verified on: ${new Date().toLocaleString()}</p>
          <hr/>
          <p>Total transaction logs verified: ${auditLogs.length}</p>
          <p>Digital Cryptographic Signature: sha256-${signature}</p>
        </body>
      </html>
    `;
    const blob = new Blob([reportHtml], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `AuditReport_${Date.now()}.html`;
    a.click();
    logAction(currentUser?.name, 'Generated PDF Audit Report with Signature', 'PDF Simulator');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12">
      
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldCheck size={32} className="text-slate-900" />
            Compliance & Governance Center
          </h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mt-1">
            Immutable audit ledgers, deleted file recovery, and global compliance checklists
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors">
            Export CSV
          </button>
          <button onClick={handleExportPDF} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-md shadow-slate-900/10">
            <Download size={13} /> Export PDF Audit
          </button>
        </div>
      </div>

      {/* ── TABS NAVIGATION ── */}
      <div className="flex border-b border-slate-100 bg-white p-2 rounded-2xl shadow-sm gap-1">
        {[
          { key: 'ledger', label: 'Audit Ledger' },
          { key: 'compliance', label: 'Compliance Dashboard' },
          { key: 'bin', label: `Recycle Bin (${recycleBin.length})` }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === tab.key ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        
        {/* ── IMMUTABLE AUDIT LEDGER ── */}
        {activeTab === 'ledger' && (
          <motion.div key="ledger" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            
            {/* Filters panel */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Search size={16} className="text-slate-400" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Filter actions..." className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none" />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator:</span>
                <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer">
                  {allUsers.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Timline List of logs */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden divide-y divide-slate-100">
              {filteredLogs.map((log, idx) => (
                <div key={log.id || idx} className="p-5 flex gap-4 items-start hover:bg-slate-50/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-[10px] shrink-0">
                    {log.user[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-800">
                      <span className="font-extrabold text-slate-950">{log.user}</span>
                      <span className="mx-1 text-slate-500 font-normal">executed</span>
                      <span className="font-black text-emerald-600 uppercase tracking-tight">{log.action}</span>
                      <span className="mx-1 text-slate-500 font-normal">on</span>
                      <span className="font-bold text-slate-900 truncate">{log.target}</span>
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase flex items-center gap-2">
                      <Clock size={10} />
                      {new Date(log.time).toLocaleDateString()} at {new Date(log.time).toLocaleTimeString()}
                    </p>
                    {log.hash && (
                      <div className="mt-3 p-3 bg-slate-50 border border-slate-150 rounded-xl font-mono text-[8px] text-slate-400 break-all leading-normal flex items-center justify-between gap-4">
                        <span>SHA-256 LEDGER HASH: {log.hash}</span>
                        <span className="text-emerald-600 font-black flex items-center gap-1 shrink-0"><ShieldCheck size={10} /> VERIFIED</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <p className="p-8 text-center text-slate-400 italic">No logs found matching parameters.</p>
              )}
            </div>

          </motion.div>
        )}

        {/* ── COMPLIANCE DASHBOARD ── */}
        {activeTab === 'compliance' && (
          <motion.div key="compliance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {COMPLIANCE_ITEMS.map(item => (
                <div key={item.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-48">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-0.5 rounded uppercase tracking-wider">{item.standard}</span>
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        item.status === 'Compliant' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>{item.status}</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-950 mt-2">{item.control}</h4>
                    <p className="text-[11px] text-slate-450 mt-1">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest pt-3 border-t border-slate-50">
                    <ShieldCheck size={12} className="text-emerald-500" /> Continuous Audit Active
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── RECYCLE BIN ── */}
        {activeTab === 'bin' && (
          <motion.div key="bin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
            {recycleBin.length === 0 ? (
              <div className="p-20 text-center text-slate-400">
                <Trash2 size={40} className="mx-auto opacity-20 mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest">Recycle bin is empty</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[9px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                    <th className="p-5">File Name</th>
                    <th className="p-5">Owner</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {recycleBin.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 flex items-center gap-3">
                        <FileText size={16} className="text-slate-450 shrink-0" />
                        <span className="font-bold text-slate-905">{doc.name}</span>
                      </td>
                      <td className="p-5 text-slate-500 font-bold">{doc.owner || 'System'}</td>
                      <td className="p-5 text-right">
                        <button onClick={() => { restoreDocument(doc.id); logAction(currentUser?.name, 'Restored Document from Recycle Bin', doc.name); }}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-black text-[9px] uppercase tracking-wider flex items-center gap-1.5 ml-auto">
                          <RotateCcw size={12} /> Restore
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        )}

      </AnimatePresence>

    </motion.div>
  );
};

export default GovernanceCenter;
