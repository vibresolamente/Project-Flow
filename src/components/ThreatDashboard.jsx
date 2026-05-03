import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Activity, Globe, Lock, AlertTriangle, CheckCircle2, Terminal } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ThreatDashboard = () => {
  const { threatAlerts, auditLogs, userRole, lastHash } = useApp();

  if (userRole !== 'Admin') {
    return (
      <div className="card bg-red-50 p-16 text-center border-red-200">
        <ShieldAlert size={48} className="mx-auto text-red-600 mb-4" />
        <h3 className="text-2xl font-bold text-red-900">Restricted Access</h3>
        <p className="text-red-700 max-w-md mx-auto font-medium">The Threat Intelligence Center is restricted to Global Administrators. Please contact the security authority.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <ShieldAlert size={32} className="text-red-600" />
            Security Intelligence Center
          </h2>
          <p className="text-muted-foreground font-medium mt-1">Real-time threat monitoring and cryptographic audit ledger.</p>
        </div>
        <div className="flex gap-3">
           <div className="bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 flex items-center gap-3 shadow-xl">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <div className="text-[10px] font-mono">
                 <p className="text-slate-500 uppercase tracking-tighter">Chain Head</p>
                 <p className="font-bold text-emerald-400">0x{lastHash.substring(0, 12)}...</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* THREAT ALERTS FEED */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-0 overflow-hidden border-red-100 shadow-lg">
             <div className="bg-red-600 p-4 text-white flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                  <Activity size={16} /> Live Threat Stream
                </h3>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">AUTO-UPDATE ACTIVE</span>
             </div>
             <div className="divide-y divide-border">
                {threatAlerts.map(alert => (
                  <div key={alert.id} className="p-4 flex gap-4 items-start hover:bg-red-50/30 transition-colors">
                     <div className={`mt-1 p-1.5 rounded-full ${alert.type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                        {alert.type === 'danger' ? <AlertTriangle size={14} /> : <Terminal size={14} />}
                     </div>
                     <div>
                        <p className={`text-sm font-bold ${alert.type === 'danger' ? 'text-red-900' : 'text-slate-700'}`}>{alert.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 font-semibold uppercase">{new Date(alert.time).toLocaleTimeString()}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="card bg-slate-50 border-dashed border-slate-300">
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-4 flex items-center gap-2"><Globe size={14} /> Global Ingress Map</h4>
                <div className="h-40 bg-slate-200 rounded-lg relative overflow-hidden flex items-center justify-center">
                   <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent animate-pulse"></div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Regional Scanning...</p>
                   {/* Simplified visual markers */}
                   <div className="absolute top-1/4 left-1/3 h-2 w-2 rounded-full bg-emerald-500"></div>
                   <div className="absolute bottom-1/3 right-1/4 h-2 w-2 rounded-full bg-red-500 animate-ping"></div>
                </div>
             </div>
             <div className="card bg-slate-900 text-white border-slate-700 shadow-2xl">
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-4 flex items-center gap-2"><Lock size={14} /> Vault Entropy</h4>
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Encryption Strength</span>
                      <span className="text-xl font-bold text-emerald-400">256-bit</span>
                   </div>
                   <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} className="h-full bg-emerald-500" />
                   </div>
                   <p className="text-[10px] text-slate-500 leading-relaxed font-medium">AES-GCM Authenticated Encryption is active across all regional SharePoint nodes.</p>
                </div>
             </div>
          </div>
        </div>

        {/* IMMUTABLE LEDGER SIDEBAR */}
        <div className="space-y-6">
           <div className="card p-0 overflow-hidden bg-white shadow-xl">
              <div className="bg-slate-900 p-4 text-white">
                 <h3 className="font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                   <Terminal size={16} className="text-emerald-400"/> Cryptographic Ledger
                 </h3>
              </div>
              <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide">
                 {auditLogs.map((log, idx) => (
                   <div key={log.id} className="relative pl-4 border-l-2 border-slate-100 py-1">
                      <div className="absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white"></div>
                      <p className="text-[10px] font-extrabold text-slate-800 uppercase">{log.action}</p>
                      <p className="text-[10px] text-muted-foreground truncate" title={log.target}>{log.target}</p>
                      <div className="mt-2 bg-slate-50 p-2 rounded text-[8px] font-mono text-slate-400 break-all leading-tight border border-slate-100">
                         HASH: {log.hash}
                         <div className="mt-1 flex items-center gap-1 text-emerald-600 font-bold uppercase">
                            <CheckCircle2 size={8}/> Verified Integrity
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ThreatDashboard;
