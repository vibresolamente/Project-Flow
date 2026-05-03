import React from 'react';
import { motion } from 'framer-motion';
import { X, Check, Layout, Columns } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ViewManager = ({ onClose }) => {
  const { columnVisibility, setColumnVisibility } = useApp();

  const toggleColumn = (key) => {
    setColumnVisibility(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const columns = [
    { key: 'dept', label: 'Department', desc: 'Show the originating department' },
    { key: 'status', label: 'Workflow Status', desc: 'Show current approval stage' },
    { key: 'access', label: 'Access Level', desc: 'Show document sensitivity and permissions' },
    { key: 'owner', label: 'Owner', desc: 'Show the primary document custodian' },
    { key: 'date', label: 'Modified Date', desc: 'Show the last synchronization timestamp' },
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.95, opacity: 0 }} 
        className="card w-full max-w-md shadow-2xl p-0 overflow-hidden font-sans"
      >
        <div className="bg-slate-900 p-6 text-center text-white border-b border-slate-800 relative">
          <button onClick={onClose} className="absolute py-2 px-3 right-0 top-0 text-white/50 hover:bg-white/10 transition-colors"><X size={16} /></button>
          <Columns className="mx-auto text-emerald-400 h-10 w-10 mb-3" />
          <h3 className="font-bold tracking-widest uppercase text-sm">View Governance</h3>
          <p className="text-xs text-slate-400 mt-1">Configure regional SharePoint display metadata</p>
        </div>
        
        <div className="p-6 bg-white space-y-4">
          <div className="space-y-2">
            {columns.map(col => (
              <div 
                key={col.key} 
                onClick={() => toggleColumn(col.key)}
                className={`p-4 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${columnVisibility[col.key] ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white opacity-60'}`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">{col.label}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{col.desc}</span>
                </div>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${columnVisibility[col.key] ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-transparent border border-slate-200'}`}>
                   <Check size={14} strokeWidth={3} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex gap-2">
            <button 
              onClick={onClose}
              className="flex-1 btn btn-primary py-3 font-bold uppercase tracking-widest text-xs"
            >
              Apply View Configuration
            </button>
          </div>
        </div>
        
        <div className="bg-slate-50 p-3 text-center border-t border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
           Settings persisted to local workstation
        </div>
      </motion.div>
    </div>
  );
};

export default ViewManager;
