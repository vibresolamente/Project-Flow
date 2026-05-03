import React from 'react';
import { motion } from 'framer-motion';
import { 
  Trash2, 
  History, 
  RotateCcw, 
  FileText, 
  User, 
  Clock, 
  ShieldCheck,
  Search,
  Activity
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const GovernanceCenter = () => {
  const { auditLogs, recycleBin, restoreDocument, userRole } = useApp();

  const handleExportCSV = () => {
    if (!auditLogs || auditLogs.length === 0) return;
    
    // Generate CSV string
    const headers = ['ID', 'Time', 'User', 'Action', 'Target'];
    const rows = auditLogs.map(log => [
      log.id,
      new Date(log.time).toISOString(),
      `"${log.user}"`,
      `"${log.action}"`,
      `"${log.target}"`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ProjectFlow_AuditLog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Governance & Compliance Hub</h2>
          <p className="text-muted-foreground font-medium">Tracking lifecycle events, recycle bin recovery, and full audit trails.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleExportCSV}
            className="flex-1 md:flex-none card py-2 px-4 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer border-border shadow-sm"
          >
            <FileText className="text-slate-500" size={18} />
            <span className="text-sm font-bold text-slate-700">Export CSV</span>
          </button>
          <div className="flex-1 md:flex-none card py-2 px-4 flex items-center gap-3">
            <ShieldCheck className="text-primary" size={20} />
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Encryption</p>
              <p className="text-sm font-bold text-emerald-600">AES-256 Active</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* RECYCLE BIN */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Trash2 size={20} className="text-primary" />
            Recycle Bin
          </h3>
          <div className="card p-0 overflow-hidden min-h-[300px]">
            {recycleBin.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-muted-foreground italic text-sm">
                No items in recycle bin.
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recycleBin.map(doc => (
                    <tr key={doc.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-muted-foreground" />
                          <span className="font-medium text-sm text-foreground">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => restoreDocument(doc.id)}
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 justify-end ml-auto"
                        >
                          <RotateCcw size={12} /> Restore
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* AUDIT LOGS */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Activity size={20} className="text-primary" />
            System Audit Trail
          </h3>
          <div className="card p-0 overflow-hidden min-h-[300px] divide-y divide-border">
            {auditLogs.map(log => (
              <div key={log.id} className="px-4 md:px-6 py-4 flex gap-3 md:gap-4 items-start hover:bg-muted/30 transition-colors">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                  {log.user[0]}
                </div>
                <div className="flex-1">
                  <p className="text-xs">
                    <span className="font-bold text-foreground">{log.user}</span>
                    <span className="text-muted-foreground"> performed </span>
                    <span className="font-bold text-primary">{log.action}</span>
                    <span className="text-muted-foreground"> on </span>
                    <span className="font-bold text-foreground">{log.target}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock size={10} /> {new Date(log.time).toLocaleTimeString()} • {new Date(log.time).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full btn bg-muted text-xs font-bold py-3">Download Full Audit Report (PDF)</button>
        </div>
      </div>
    </motion.div>
  );
};

export default GovernanceCenter;
