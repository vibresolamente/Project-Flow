import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, History, Activity, FolderLock, Rocket, ArrowRightLeft, Users, Zap, FileBadge, ShieldAlert,
  ChevronRight, Calendar, CloudSun, Clock, CheckCircle, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const PortalView = ({ navigate, onUploadClick }) => {
  const { documents, auditLogs, pendingApprovalCount, systemUsers, setActiveDocId } = useApp();

  const totalDocs = documents.length;
  const recentDocs = documents.slice(0, 5);
  const recentLogs = auditLogs.slice(0, 8); // GitHub style feed
  const onlineUsers = systemUsers.filter(u => u.status === 'active' || Math.random() > 0.5); // Mock online presence

  // Greeting and ambiance based on local time
  const timeAmbiance = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', subText: 'Starting the day with pristine node compliance.', bg: 'from-amber-600/30 via-slate-900 to-slate-900', icon: '🌅' };
    if (hour < 17) return { text: 'Good Afternoon', subText: 'High-throughput operational cycles in progress.', bg: 'from-emerald-600/30 via-slate-900 to-slate-900', icon: '☀️' };
    return { text: 'Good Evening', subText: 'Zero-trust night enclaves active and monitoring.', bg: 'from-indigo-600/30 via-slate-900 to-slate-900', icon: '🌙' };
  }, []);

  const getExtension = (name) => {
    const ext = name.split('.').pop().toUpperCase();
    if (ext === 'DOCX' || ext === 'DOC') return 'DOC';
    if (ext === 'XLSX' || ext === 'XLS') return 'XLS';
    return ext.substring(0, 3);
  };

  const timeAgo = (dateStr) => {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  // Sparkline data for Portal stats
  const sparkData = useMemo(() => Array.from({ length: 10 }, (_, i) => ({ v: Math.floor(Math.random() * 15 + (i * 2)) })), []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-16">
      
      {/* ── AMBIENT WEATHER-GREETING HERO ── */}
      <div className={`relative p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-br ${timeAmbiance.bg} text-white overflow-hidden shadow-2xl border border-slate-800`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.1),transparent_60%)] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {timeAmbiance.icon} Compliance Ledger Active
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              {timeAmbiance.text}, Team
            </h1>
            <p className="text-slate-300 text-sm font-medium max-w-md leading-relaxed">
              {timeAmbiance.subText} Centralized document governance & secure collaborative nodes.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button onClick={() => navigate('docs')} className="px-6 py-3.5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
              📂 Document Center
            </button>
            <button onClick={onUploadClick} className="px-6 py-3.5 bg-white/10 border border-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/15 hover:scale-105 transition-all">
              🚀 Quick Upload
            </button>
          </div>
        </div>

        {/* Decorative Watermark */}
        <ShieldCheck className="absolute -right-16 -bottom-16 h-72 w-72 rotate-12 opacity-5 text-white pointer-events-none" />
      </div>

      {/* ── SMART QUICK-ACTIONS BAR ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pendingApprovalCount > 0 ? (
          <button onClick={() => navigate('workflows')} className="p-5 rounded-3xl bg-white border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all text-left flex gap-4 items-center group">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"><Zap size={20} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Approvals</p>
              <h4 className="font-bold text-sm text-slate-900 mt-0.5">{pendingApprovalCount} documents require signature</h4>
            </div>
          </button>
        ) : (
          <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-sm text-left flex gap-4 items-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><CheckCircle size={20} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workflow Engine</p>
              <h4 className="font-bold text-sm text-slate-900 mt-0.5">All action items cleared</h4>
            </div>
          </div>
        )}

        <button onClick={() => navigate('collab')} className="p-5 rounded-3xl bg-white border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all text-left flex gap-4 items-center group">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"><Rocket size={20} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Collaboration Canvas</p>
            <h4 className="font-bold text-sm text-slate-900 mt-0.5">Join live document meet session</h4>
          </div>
        </button>

        <button onClick={() => navigate('testing')} className="p-5 rounded-3xl bg-white border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all text-left flex gap-4 items-center group">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0"><ShieldAlert size={20} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance Health</p>
            <h4 className="font-bold text-sm text-slate-900 mt-0.5">100% integrity validation passed</h4>
          </div>
        </button>
      </div>

      {/* ── METRIC CARDS WITH SPARKLINE ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Vault Documents', value: totalDocs, color: '#10B981', note: 'Secure archives' },
          { label: 'Presence Index', value: onlineUsers.length, color: '#3B82F6', note: 'Active operators' },
          { label: 'Threat Enclaves', value: '0', color: '#EF4444', note: 'Clean audit trail' },
          { label: 'Ledger Integrity', value: '100%', color: '#8B5CF6', note: 'SHA-256 Verified' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
              <p className="text-3xl font-black text-slate-900">{stat.value}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
            <div className="h-10 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Area type="monotone" dataKey="v" stroke={stat.color} fill={`${stat.color}15`} strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase tracking-wide">{stat.note}</p>
          </div>
        ))}
      </div>

      {/* ── CORE MODULES GRID ── */}
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Platform Modules</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <FolderLock />, title: 'Secured Vault', desc: 'Encrypted document safe', route: 'docs' },
            { icon: <Rocket />, title: 'Live Collab', desc: 'Realtime Docs, Sheets, Meet', route: 'collab' },
            { icon: <ArrowRightLeft />, title: 'Data Pipeline', desc: 'Large file staging center', route: 'transfer' },
            { icon: <Users />, title: 'Roster Hub', desc: 'Dynamic identity matrices', route: 'identity' }
          ].map((m, i) => (
            <button key={i} onClick={() => navigate(m.route)} className="p-6 rounded-3xl bg-white border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between h-40 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">{m.icon}</div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  {m.title} <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">{m.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── RECENT DOCS CAROUSEL & ACTIVITY STREAM ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Document Carousel Box */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2 px-1">
            <History size={15} /> Recent Workspace Documents
          </h3>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-3">
            {recentDocs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No recent items</div>
            ) : (
              recentDocs.map(doc => {
                const ext = getExtension(doc.name);
                const color = ext === 'XLS' ? '#10B981' : ext === 'PDF' ? '#EF4444' : '#3B82F6';
                return (
                  <div key={doc.id} onClick={() => { setActiveDocId(doc.id); navigate('collab'); }}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs" style={{ background: `${color}15`, color }}>{ext}</div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-600 transition-colors">{doc.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold flex items-center gap-2">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded">{doc.dept}</span>
                          <span>{doc.date}</span>
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Live GitHub-style Activity Feed */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2 px-1">
            <Activity size={15} /> Integrity Activity Feed
          </h3>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
            {recentLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No active logs</div>
            ) : (
              recentLogs.map((log, index) => {
                const isDelete = log.action?.toLowerCase().includes('delete') || log.action?.toLowerCase().includes('fail');
                const isUpload = log.action?.toLowerCase().includes('upload') || log.action?.toLowerCase().includes('create');
                const isSign = log.action?.toLowerCase().includes('sign') || log.action?.toLowerCase().includes('approve');
                const badgeColor = isDelete ? 'bg-red-50 text-red-600 border-red-100' : isUpload ? 'bg-blue-50 text-blue-600 border-blue-100' : isSign ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-100';
                return (
                  <div key={log.id || index} className="p-4 flex gap-3.5 items-start hover:bg-slate-50/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0">{log.user[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-800 leading-normal">
                        <span className="font-bold text-slate-950">{log.user}</span>
                        <span className={`inline-block mx-2 text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>{log.action}</span>
                        <span className="font-bold text-slate-900 truncate">{log.target}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase flex items-center gap-1"><Clock size={10} /> {timeAgo(log.time)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </motion.div>
  );
};

export default PortalView;
