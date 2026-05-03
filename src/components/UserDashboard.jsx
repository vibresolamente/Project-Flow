import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Globe,
  History,
  Activity
} from 'lucide-react';

import { useApp } from '../context/AppContext';

const UserDashboard = () => {
  const { documents, userRole, auditLogs, pendingRequests, currentUser } = useApp();

  // Personal metrics based on real data
  const myDocs = documents.filter(d => d.owner === currentUser?.name);
  const myDocsCount = myDocs.length;
  const pendingReviewsCount = pendingRequests.filter(r => r.status === 'Pending').length;
  const completedTasks = auditLogs.filter(log => log.user === currentUser?.name).length;

  const getExtension = (name) => {
    const parts = name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Personal Dashboard</h2>
          <p className="text-muted-foreground font-medium text-sm">Welcome back, {currentUser?.name || 'User'}. Your regional summary is ready.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="card flex-1 md:flex-none py-2 px-4 flex items-center gap-3">
            <UserCheck className="text-primary" size={20} />
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">User Role</p>
              <p className="text-sm font-bold text-primary">{userRole}</p>
            </div>
          </div>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<FileText />} label="My Documents" value={myDocsCount.toString()} sub={`${myDocs.filter(d => d.status === 'draft').length} active drafts`} color="text-primary" />
        <StatCard icon={<CheckCircle2 />} label="Audit Actions" value={completedTasks.toString()} sub="Verified logs" color="text-emerald-600" />
        <StatCard icon={<AlertCircle />} label="Pending Reviews" value={pendingReviewsCount.toString()} sub="Workflow queue" color="text-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MY RECENT DOCUMENTS */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">My Recent Documents</h3>
            <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">View All →</button>
          </div>
          <div className="card p-0 overflow-hidden divide-y divide-border border-2 border-slate-50 shadow-sm">
            {myDocs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <p className="text-sm italic">No personal documents found in the vault.</p>
              </div>
            ) : (
              myDocs.slice(0, 5).map(doc => (
                <DashboardDocItem 
                  key={doc.id}
                  name={doc.name} 
                  status={doc.status} 
                  date={doc.date} 
                  type={getExtension(doc.name)} 
                />
              ))
            )}
          </div>

          {/* PUBLIC SYSTEM LIBRARY */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Public System Library</h3>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded">Open Access</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.filter(d => d.sensitivity === 'Public').length === 0 ? (
                <div className="col-span-full p-8 border-2 border-dashed border-slate-100 rounded-[2rem] text-center text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  No public assets shared
                </div>
              ) : (
                documents.filter(d => d.sensitivity === 'Public').slice(0, 4).map(doc => (
                  <div key={doc.id} className="card p-5 hover:border-emerald-500 transition-all cursor-pointer flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{doc.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">{doc.dept} • {doc.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SYSTEM FLOW GUIDE */}
          <div className="mt-8 p-8 bg-slate-900 rounded-[2rem] text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp size={100}/></div>
             <h3 className="text-xl font-black mb-6 flex items-center gap-2">
               <ShieldCheck className="text-emerald-400" size={24}/>
               System Governance Roadmap
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                <div className="absolute top-1/2 left-0 w-full h-px bg-white/10 hidden md:block -translate-y-1/2 z-0"></div>
                <FlowStep step="01" label="Upload" desc="Store Draft" icon={<FileText size={14}/>}/>
                <FlowStep step="02" label="Submit" desc="Pending Review" icon={<Clock size={14}/>}/>
                <FlowStep step="03" label="Approve" desc="Live Node" icon={<CheckCircle2 size={14}/>}/>
                <FlowStep step="04" label="Certify" desc="Signed Record" icon={<UserCheck size={14}/>}/>
             </div>
             <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Navigation Guide:</p>
                <div className="flex gap-4">
                   <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> <span className="text-[10px] font-black uppercase">Document Center</span></div>
                   <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> <span className="text-[10px] font-black uppercase">Identity Hub</span></div>
                   <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div> <span className="text-[10px] font-black uppercase">Governance Queue</span></div>
                </div>
             </div>
          </div>
        </div>

        {/* MY TASKS / NOTIFICATIONS */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Action Items</h3>
          <div className="space-y-3">
            {pendingRequests.filter(r => r.status === 'Pending').length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-100 rounded-[2rem] text-center text-[10px] text-slate-400 font-black uppercase tracking-widest">
                All workflows clear
              </div>
            ) : (
              pendingRequests.filter(r => r.status === 'Pending').slice(0, 3).map(req => (
                <TaskCard key={req.id} title={`Review: ${req.resource}`} status="Pending" time={req.time} />
              ))
            )}
            <TaskCard title="Identity Audit - Nairobi Hub" status="System" time="Recurring" />
            <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 mt-6">
               <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-2 flex items-center gap-1"><ShieldCheck size={12}/> Security Tip</h4>
               <p className="text-[10px] leading-relaxed text-emerald-800 font-medium italic">Restricted documents can be requested via the 'Access & Governance' tab for Admin approval.</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FlowStep = ({ step, label, desc, icon }) => (
  <div className="relative z-10 flex flex-col items-center text-center">
     <div className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center font-black text-xs mb-3 shadow-lg">
        {icon}
     </div>
     <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
     <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter mt-1">{desc}</p>
  </div>
);

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`h-12 w-12 rounded bg-muted flex items-center justify-center ${color}`}>
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <div>
      <p className="text-xs font-bold text-muted-foreground uppercase">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-[10px] font-medium text-emerald-600">{sub}</span>
      </div>
    </div>
  </div>
);

const DashboardDocItem = ({ name, status, date, type }) => (
  <div className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer">
    <div className="flex items-center gap-3">
      <FileText size={18} className="text-muted-foreground" />
      <div>
        <p className="text-sm font-bold">{name}</p>
        <p className="text-[10px] text-muted-foreground uppercase">{type} • {date}</p>
      </div>
    </div>
    <span className={`status-badge status-${status}`}>
      {status}
    </span>
  </div>
);

const TaskCard = ({ title, status, time }) => (
  <div className="card p-4 hover:border-primary transition-all cursor-pointer">
    <div className="flex justify-between items-start mb-2">
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
        status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
        status === 'System' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
      }`}>
        {status}
      </span>
      <span className="text-[10px] text-muted-foreground">{time}</span>
    </div>
    <p className="text-sm font-bold text-foreground">{title}</p>
    <div className="flex items-center gap-1 text-primary text-[10px] font-bold mt-3">
      Review Now <ChevronRight size={12} />
    </div>
  </div>
);

export default UserDashboard;
