import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, FileText, ChevronRight, Lock, Activity, ArrowRight, ShieldCheck, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const DepartmentView = ({ navigate, onUploadClick }) => {
  const { documents, userRole, departments, addDepartment, updateDepartment, deleteDepartment } = useApp();
  
  // State for selected hub
  const [activeHub, setActiveHub] = useState(departments[0] || 'Ops'); 
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [editingDept, setEditingDept] = useState(null);
  const [editName, setEditName] = useState('');

  // RBAC validation: Restricted users can't enter Legal
  const isAccessDenied = userRole === 'Restricted' && activeHub === 'Legal';

  // Filter docs for current hub
  const hubDocs = useMemo(() => {
    return documents.filter(d => d.dept === activeHub);
  }, [documents, activeHub]);
  
  const approvedDocs = hubDocs.filter(d => d.status === 'approved');
  const draftDocs = hubDocs.filter(d => d.status === 'draft');

  const handleAddDept = (e) => {
    e.preventDefault();
    if (newDeptName) {
      addDepartment(newDeptName);
      setNewDeptName('');
    }
  };

  const handleEditDept = (e) => {
    e.preventDefault();
    if (editName && editingDept) {
      updateDepartment(editingDept, editName);
      if (activeHub === editingDept) setActiveHub(editName);
      setEditingDept(null);
      setEditName('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <Users size={28} className="text-primary" />
            Team Sites (Hubs)
          </h2>
          <p className="text-muted-foreground font-medium mt-1 text-sm">Isolated, secure departmental workspaces</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={onUploadClick}
            className="flex-1 md:flex-none btn border border-border bg-white hover:bg-muted"
          >
            <Plus size={18} />
            New Document
          </button>
          {userRole === 'Admin' && (
            <button 
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className={`flex-1 md:flex-none btn ${showAdminPanel ? 'bg-slate-200 text-slate-700' : 'btn-primary'}`}
            >
              {showAdminPanel ? 'Close' : 'Manage Depts'}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAdminPanel && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="card bg-slate-50 border-dashed border-2 border-primary/20 p-6 space-y-6 mb-8">
              <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest mb-2">
                <ShieldCheck size={16} /> Admin Department Control
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold">Add New Workspace</h4>
                  <form onSubmit={handleAddDept} className="flex gap-2">
                    <input 
                      type="text" 
                      value={newDeptName}
                      onChange={e => setNewDeptName(e.target.value)}
                      placeholder="e.g. Research"
                      className="flex-1 bg-white border border-border rounded px-3 py-2 text-sm focus:border-primary outline-none"
                    />
                    <button type="submit" className="btn btn-primary px-4"><Plus size={16} /></button>
                  </form>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold">Existing Hubs</h4>
                  <div className="space-y-2">
                    {departments.map(dept => (
                      <div key={dept} className="flex items-center justify-between bg-white p-2 rounded border border-border">
                        {editingDept === dept ? (
                          <form onSubmit={handleEditDept} className="flex-1 flex gap-2">
                            <input 
                              autoFocus
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              className="flex-1 text-sm border-none focus:ring-0 p-0 font-bold"
                            />
                            <button type="submit" className="text-emerald-600"><Plus size={14} /></button>
                            <button type="button" onClick={() => setEditingDept(null)} className="text-slate-400"><X size={14} /></button>
                          </form>
                        ) : (
                          <>
                            <span className="text-sm font-bold">{dept}</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => { setEditingDept(dept); setEditName(dept); }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-primary transition-colors"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => { if(confirm(`Delete ${dept}? All docs will remain but lose their link.`)) deleteDepartment(dept); }}
                                className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DEPARTMENT SELECTOR TABS */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border scrollbar-hide">
        {departments.map(dept => (
          <button
            key={dept}
            onClick={() => setActiveHub(dept)}
            className={`px-4 py-2.5 rounded-t-lg font-bold text-sm transition-all relative whitespace-nowrap flex-shrink-0 ${
              activeHub === dept 
                ? 'bg-primary text-white bg-opacity-100' 
                : 'bg-muted text-muted-foreground hover:bg-slate-200'
            }`}
          >
            {dept}
            {activeHub === dept && (
              <span className="absolute bottom-0 left-0 w-full h-1 bg-emerald-600 rounded-t"></span>
            )}
            {(userRole === 'Restricted' && dept === 'Legal') && (
              <Lock size={12} className="inline ml-2 -mt-1 text-red-500" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {isAccessDenied ? (
          <motion.div 
            key="denied"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card bg-red-50 border-red-200 p-16 text-center space-y-4"
          >
            <ShieldCheck size={48} className="mx-auto text-red-600" />
            <h3 className="text-2xl font-bold text-red-900">Access Restricted</h3>
            <p className="text-red-700 max-w-md mx-auto">
              Your current role ({userRole}) does not have permission to view the {activeHub} Team Site. 
              This area contains strictly confidential metadata.
            </p>
            <button className="btn bg-red-600 text-white font-bold px-8 mt-4 hover:bg-red-700" onClick={() => setActiveHub(departments[0] || 'Ops')}>
              Return to Safety
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key={activeHub}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* HUB HEADER STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card border-l-4 border-l-primary p-6">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Total {activeHub} Docs</p>
                <p className="text-3xl font-extrabold text-slate-800">{hubDocs.length}</p>
              </div>
              <div className="card border-l-4 border-l-emerald-600 p-6">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Published Files</p>
                <p className="text-3xl font-extrabold text-emerald-700">{approvedDocs.length}</p>
              </div>
              <div className="card border-l-4 border-l-amber-500 p-6">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Drafts in Progress</p>
                <p className="text-3xl font-extrabold text-amber-700">{draftDocs.length}</p>
              </div>
            </div>

            {/* HUB CONTENT */}
            <div className="card p-0 overflow-hidden text-sm">
               <div className="p-4 bg-slate-50 border-b border-border flex items-center justify-between">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                   <Activity size={18} className="text-primary"/> Recent Library Activity
                 </h3>
                 <button onClick={() => navigate('docs')} className="text-primary font-bold text-xs flex items-center gap-1 hover:underline">
                   View Full Library <ArrowRight size={12} />
                 </button>
               </div>
               
               {hubDocs.length === 0 ? (
                 <div className="p-10 text-center text-muted-foreground">
                   No documents found in the {activeHub} team site.
                 </div>
               ) : (
                 <div className="divide-y divide-border">
                   {hubDocs.map(doc => (
                      <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded shrink-0 ${doc.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            <FileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{doc.name}</p>
                            <p className="text-xs text-muted-foreground hidden sm:block">Uploaded {doc.date} • Created by {doc.owner}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4 shrink-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden md:block">{doc.sensitivity}</span>
                          <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-bold capitalize ${doc.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            {doc.status}
                          </span>
                        </div>
                      </div>
                   ))}
                 </div>
               )}
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DepartmentView;
