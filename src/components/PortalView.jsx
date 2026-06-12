import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, History, Activity, FolderLock, Rocket, ArrowRightLeft, Users, Zap, FileBadge, ShieldAlert, ChevronRight 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const StatStrip = ({ label, value, note, color }) => (
  <div className="card flex items-center gap-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-850" style={{ borderLeft: `4px solid ${color}` }}>
    <div>
      <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-950 dark:text-white leading-none">{value}</p>
      <p className="text-[10px] font-bold text-slate-900 dark:text-slate-400 mt-1 uppercase tracking-tight">{note}</p>
    </div>
  </div>
);

const PredictiveAction = ({ icon, label, desc, onClick }) => (
  <button onClick={onClick} className="flex-1 text-left p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-950 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all group shadow-md shadow-slate-900/5">
     <div className="flex items-center gap-3 mb-2">
        <div className="text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">{React.cloneElement(icon, { size: 16 })}</div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-950 dark:text-white">{label}</span>
     </div>
     <p className="text-[11px] font-bold text-slate-800 dark:text-slate-300 leading-snug">{desc}</p>
  </button>
);

const ModuleCard = ({ icon, title, desc, count, badge, onClick }) => (
  <div 
    className="card cursor-pointer group animate-slide-up"
    onClick={onClick}
  >
    <div className="flex justify-between items-start mb-4">
      <div style={{ background: 'rgba(31,122,107,0.08)', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1F7A6B', transition: 'all 0.2s' }}>
        {React.cloneElement(icon, { size: 22 })}
      </div>
      <div className="flex gap-2 items-center">
        {badge && <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">{badge}</span>}
        {count && <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{count}</span>}
      </div>
    </div>
    <h4 className="font-bold text-base mb-1">{title}</h4>
    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
  </div>
);

const RecentDocItem = ({ name, time, type, dept, onClick }) => {
  const typeColors = { XLS: '#16A34A', PDF: '#DC2626', DOC: '#2563EB', ZIP: '#6B7280' };
  const color = typeColors[type] || '#1F7A6B';
  return (
    <div onClick={onClick} className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center gap-3">
        <div style={{ background: `${color}15`, color, width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>
          {type}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-950 dark:text-white">{name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {dept && <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded">{dept}</span>}
            <span className="text-xs text-slate-700 dark:text-slate-400 font-semibold">{time}</span>
          </div>
        </div>
      </div>
      <ChevronRight size={14} className="text-slate-950 dark:text-slate-400" />
    </div>
  );
};

const ActivityItem = ({ user, action, target, time }) => {
  const actionColors = { Approved: '#16A34A', Uploaded: '#2563EB', 'Auto-archived': '#6B7280', Deleted: '#DC2626', Requested: '#D97706' };
  const color = actionColors[action] || '#1F7A6B';
  return (
    <div className="px-6 py-4 flex gap-3 items-start border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-black">
        {user[0]}
      </div>
      <div className="flex-1 text-left">
        <p className="text-xs text-slate-950 dark:text-slate-200">
          <span className="font-bold">{user}</span>
          <span style={{ color, fontWeight: 805, margin: '0 4px' }}>{action}</span>
          <span className="font-bold">{target}</span>
        </p>
        {time && <p className="text-[10px] text-slate-700 dark:text-slate-400 font-semibold mt-0.5">{time}</p>}
      </div>
    </div>
  );
};

const PortalView = ({ navigate, onUploadClick }) => {
  const { documents, auditLogs, pendingApprovalCount, systemUsers } = useApp();

  const totalDocs = documents.length;
  const recentDocs = documents.slice(0, 5);
  const recentLogs = auditLogs.slice(0, 5);
  const activeUsersCount = Math.floor(systemUsers.length * 2.5 + Math.random() * 5);

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

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
      {/* HERO BANNER */}
      <div className="relative p-10 md:p-16 rounded-[2rem] hero-gradient text-white overflow-hidden shadow-2xl border-2 border-slate-950 dark:border-slate-800" style={{ borderRadius: '24px' }}>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black mb-6 uppercase tracking-widest bg-slate-950/40 border-2 border-emerald-400/40 text-emerald-300">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
            Secure Enterprise Platform — Active
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            ProjectFlow KE
          </h2>
          <p className="text-emerald-100 text-base md:text-lg font-bold mb-8 max-w-lg leading-relaxed" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
            Centralized document governance for Kenyan enterprises. Powered by SharePoint, secured by zero-trust protocols.
          </p>
          <div className="flex gap-4 flex-wrap">
            <button 
              className="px-8 py-3 rounded-xl font-black transition-all hover:scale-105 active:scale-95 shadow-xl" 
              style={{ 
                color: '#1F7A6B', 
                backgroundColor: '#FFFFFF', 
                border: '2px solid #FFFFFF',
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                cursor: 'pointer'
              }} 
              onClick={() => navigate('docs')}
            >
              📂 Documents
            </button>
            <button 
              className="px-8 py-3 rounded-xl font-black hover:bg-white/20 transition-all border-2 border-white text-white active:scale-95 shadow-xl" 
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                cursor: 'pointer'
              }} 
              onClick={onUploadClick}
            >
              ⬆ Upload
            </button>
          </div>
        </div>
        <ShieldCheck className="absolute -right-12 -bottom-12 h-64 w-64 rotate-12 opacity-5 text-white" />
      </div>

      {/* PREDICTIVE ACTIONS (SMART FEED) */}
      <div className="flex flex-col md:flex-row gap-4">
         {pendingApprovalCount > 0 && (
           <PredictiveAction 
             icon={<Zap />} 
             label="Workflow Action" 
             desc={`You have ${pendingApprovalCount} document(s) awaiting approval in the engine.`} 
             onClick={() => navigate('workflows')}
           />
         )}
         <PredictiveAction 
           icon={<ShieldAlert />} 
           label="Security Review" 
           desc="No unauthorized access attempts detected in the last 24 hours." 
           onClick={() => navigate('governance')}
         />
         <PredictiveAction 
           icon={<FileBadge />} 
           label="Compliance" 
           desc="System integrity verification pass completed. All nodes synchronized." 
           onClick={() => navigate('testing')}
         />
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatStrip label="Total Documents" value={totalDocs.toString()} note="System-wide" color="#1F7A6B" />
        <StatStrip label="Active Users" value={activeUsersCount.toString()} note="Online now" color="#059669" />
        <StatStrip label="Pending Workflow" value={pendingApprovalCount.toString()} note="Needs action" color="#D97706" />
        <StatStrip label="Ledger Integrity" value="100%" note="Verified Node" color="#2563EB" />
      </div>

      {/* CORE MODULES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ModuleCard icon={<FolderLock />} title="Vault" desc="Encrypted file access" badge="Secure" onClick={() => navigate('docs')} />
        <ModuleCard icon={<Rocket />} title="Collab" desc="Live team editing" onClick={() => navigate('collab')} />
        <ModuleCard icon={<ArrowRightLeft />} title="Transfer" desc="Large file sharing" onClick={() => navigate('transfer')} />
        <ModuleCard icon={<Users />} title="Depts" desc="Team workspaces" onClick={() => navigate('depts')} />
      </div>

      {/* FEED SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-950 dark:text-slate-200 flex items-center gap-2">
            <History size={16} /> Recent Documents
          </h3>
          <div className="card p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            {recentDocs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No documents found.</div>
            ) : (
              recentDocs.map(doc => (
                <RecentDocItem 
                  key={doc.id} 
                  name={doc.name} 
                  time={doc.date} 
                  type={getExtension(doc.name)} 
                  dept={doc.dept} 
                  onClick={() => {
                    setActiveDocId(doc.id);
                    navigate('collab');
                  }}
                />
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-950 dark:text-slate-200 flex items-center gap-2">
            <Activity size={16} /> Activity Stream
          </h3>
          <div className="card p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            {recentLogs.length === 0 ? (
               <div className="p-8 text-center text-slate-500 text-sm">No recent activity.</div>
            ) : (
              recentLogs.map(log => (
                <ActivityItem key={log.id} user={log.user} action={log.action} target={log.target} time={timeAgo(log.time)} />
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PortalView;
