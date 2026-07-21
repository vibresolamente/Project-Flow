import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, Settings, ShieldCheck, Trash2, Edit3, Save, X, Key,
  Shield, Check, UserCheck, ShieldAlert, FileText, Activity, Mail, Lock, Smartphone
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80'
];

const PERMISSIONS = [
  { action: 'Upload & Create Documents', Admin: true, Manager: true, Staff: true, Restricted: false },
  { action: 'Edit Collaborative Canvas', Admin: true, Manager: true, Staff: true, Restricted: true },
  { action: 'Approve & Sign Workflows', Admin: true, Manager: true, Staff: false, Restricted: false },
  { icon: Lock, action: 'Access AES-256 Vault Sealing', Admin: true, Manager: false, Staff: false, Restricted: false },
  { action: 'Delete / Archive Vault Payloads', Admin: true, Manager: true, Staff: false, Restricted: false }
];

const IdentityManager = () => {
  const { systemUsers, registerNewUser, updateUser, deleteUser, updateUserGroups, userRole, logAction, currentUser } = useApp();
  
  const [activeTab, setActiveTab] = useState('roster'); // roster | permissions | invite
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('Staff');
  const [newUserPin, setNewUserPin] = useState('0000');
  
  const [editingUserId, setEditingUserId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPin, setEditPin] = useState('');

  // Bulk Invite
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

  // Selected user for detailed activity panel
  const [selectedUser, setSelectedUser] = useState(null);

  const allDepts = ['Finance', 'Legal', 'HR', 'Ops', 'IT'];

  const handleRegister = (e) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    registerNewUser({
      name: newUserName,
      role: newUserRole,
      pin: newUserPin,
      departments: [],
      avatar: DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)]
    });
    logAction(currentUser?.name, 'Created New System User', newUserName);
    setNewUserName('');
    setNewUserPin('0000');
  };

  const handleBulkInvite = (e) => {
    e.preventDefault();
    if (!bulkCsvText.trim()) return;
    
    const lines = bulkCsvText.split('\n');
    let imported = 0;
    lines.forEach(line => {
      const parts = line.split(',');
      if (parts[0] && parts[0].trim()) {
        registerNewUser({
          name: parts[0].trim(),
          role: parts[1]?.trim() || 'Staff',
          pin: parts[2]?.trim() || '1111',
          departments: [],
          avatar: DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)]
        });
        imported++;
      }
    });

    logAction(currentUser?.name, 'Bulk CSV Imported Users', `${imported} users`);
    setBulkSuccessMsg(`Successfully provisioned ${imported} identities from CSV.`);
    setBulkCsvText('');
    setTimeout(() => setBulkSuccessMsg(''), 4000);
  };

  const startEditing = (user) => {
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditRole(user.role);
    setEditPin(user.pin);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
  };

  const saveEdit = (userId) => {
    updateUser(userId, { name: editName, role: editRole, pin: editPin });
    logAction(currentUser?.name, 'Updated User Settings', editName);
    setEditingUserId(null);
  };

  const toggleGroup = (userId, dept) => {
    const user = systemUsers.find(u => u.id === userId);
    if (!user) return;
    const hasDept = user.departments.includes(dept);
    const newDepts = hasDept 
      ? user.departments.filter(d => d !== dept)
      : [...user.departments, dept];
    updateUserGroups(userId, newDepts);
    logAction(currentUser?.name, 'Toggled User Department Bindings', `${user.name} ➔ ${dept}`);
  };

  if (userRole !== 'Admin') {
    return (
      <div className="max-w-2xl mx-auto text-center p-12 bg-red-50/50 rounded-3xl border border-red-150">
        <ShieldAlert size={48} className="mx-auto text-red-600 mb-4" />
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Access Prohibited</h3>
        <p className="text-sm text-slate-600 mt-2">
          Only Global Security Administrators have write authorization to modify user identity schemas.
        </p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Users size={32} className="text-slate-900" />
            Identity & Roster Governance
          </h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mt-1">
            Manage system clearance keys, dynamic roles, and department matrices
          </p>
        </div>
        <span className="text-[10px] font-black uppercase bg-emerald-50 border border-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <ShieldCheck size={14} /> Control Layer Active
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-white p-2 rounded-2xl shadow-sm gap-1">
        {[
          { key: 'roster', label: 'Identity Roster' },
          { key: 'permissions', label: 'Permission Matrix' },
          { key: 'invite', label: 'Bulk Import' },
        ].map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSelectedUser(null); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === tab.key ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        
        {/* ── ROSTER MANAGEMENT ── */}
        {activeTab === 'roster' && (
          <motion.div key="roster" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Provision User (Left Column) */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <UserPlus className="text-slate-900" size={18} />
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Provision User</h3>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Full Name</label>
                    <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Full name..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none" required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Security Clearance</label>
                    <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold outline-none cursor-pointer">
                      <option value="Admin">Global Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="Staff">General Staff</option>
                      <option value="Restricted">Restricted Contractor</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">PIN Code</label>
                    <input type="text" value={newUserPin} onChange={e => setNewUserPin(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono tracking-widest outline-none" required />
                  </div>
                  <button type="submit" className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-slate-800 transition-all shadow-lg">
                    Provision Token
                  </button>
                </form>
              </div>
            </div>

            {/* Matrix (Right Column) */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Operator Directory</h3>
                  <span className="text-[10px] font-black uppercase bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full">{systemUsers.length} Identities</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 text-[9px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                        <th className="p-5">Operator</th>
                        <th className="p-5">Security Clearance</th>
                        <th className="p-5">Dept Bindings</th>
                        <th className="p-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {systemUsers.map(user => {
                        const avatarUrl = user.avatar || DEFAULT_AVATARS[0];
                        return (
                          <tr key={user.id} onClick={() => setSelectedUser(user)} className="group hover:bg-slate-50/50 transition-colors cursor-pointer">
                            <td className="p-5 flex items-center gap-3">
                              <img src={avatarUrl} className="w-9 h-9 rounded-full object-cover shadow-inner" alt={user.name} />
                              <div>
                                <h4 className="font-extrabold text-sm text-slate-900">{user.name}</h4>
                                <p className="text-[9px] text-slate-400 font-mono mt-0.5 uppercase">ID: {user.id} | Pin: {user.pin}</p>
                              </div>
                            </td>
                            <td className="p-5">
                              {editingUserId === user.id ? (
                                <select value={editRole} onChange={e => setEditRole(e.target.value)} className="bg-white border border-slate-200 rounded p-1.5 text-xs font-bold outline-none" onClick={e => e.stopPropagation()}>
                                  <option value="Admin">Admin</option>
                                  <option value="Manager">Manager</option>
                                  <option value="Staff">Staff</option>
                                  <option value="Restricted">Restricted</option>
                                </select>
                              ) : (
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  user.role === 'Admin' ? 'bg-slate-900 text-white' :
                                  user.role === 'Manager' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  user.role === 'Staff' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                  'bg-amber-50 text-amber-600 border border-amber-100'
                                }`}>
                                  {user.role}
                                </span>
                              )}
                            </td>
                            <td className="p-5" onClick={e => e.stopPropagation()}>
                              <div className="flex gap-1 flex-wrap">
                                {allDepts.map(dept => {
                                  const hasAccess = user.departments?.includes(dept);
                                  return (
                                    <button key={dept} onClick={() => toggleGroup(user.id, dept)}
                                      className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border transition-all ${
                                        hasAccess ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-400'
                                      }`}>
                                      {dept}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="p-5 text-right" onClick={e => e.stopPropagation()}>
                              <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {editingUserId === user.id ? (
                                  <>
                                    <button onClick={() => saveEdit(user.id)} className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700"><Check size={12} /></button>
                                    <button onClick={cancelEditing} className="p-1.5 bg-slate-200 text-slate-600 rounded"><X size={12} /></button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEditing(user)} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded"><Edit3 size={12} /></button>
                                    <button onClick={() => deleteUser(user.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={12} /></button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── PERMISSIONS MATRIX ── */}
        {activeTab === 'permissions' && (
          <motion.div key="permissions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="p-6 bg-slate-50 border-b border-slate-100">
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">FIPS 140-2 System Authorization Matrix</h3>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[9px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                  <th className="p-5">Cryptographic Permission Node</th>
                  <th className="p-5 text-center">Global Admin</th>
                  <th className="p-5 text-center">Manager</th>
                  <th className="p-5 text-center">Staff</th>
                  <th className="p-5 text-center">Restricted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {PERMISSIONS.map((perm, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 font-bold text-slate-800">{perm.action}</td>
                    <td className="p-5 text-center">{perm.Admin ? <Check className="mx-auto text-emerald-600" size={16} /> : '—'}</td>
                    <td className="p-5 text-center">{perm.Manager ? <Check className="mx-auto text-emerald-600" size={16} /> : '—'}</td>
                    <td className="p-5 text-center">{perm.Staff ? <Check className="mx-auto text-emerald-600" size={16} /> : '—'}</td>
                    <td className="p-5 text-center">{perm.Restricted ? <Check className="mx-auto text-emerald-600" size={16} /> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* ── BULK IMPORT ── */}
        {activeTab === 'invite' && (
          <motion.div key="invite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-6 max-w-2xl mx-auto">
            <div>
              <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 mb-1">Bulk CSV Provisioning</h3>
              <p className="text-xs text-slate-500 font-bold">Input users line-by-line format: Name, Role, Pin</p>
            </div>

            <form onSubmit={handleBulkInvite} className="space-y-4">
              <textarea value={bulkCsvText} onChange={e => setBulkCsvText(e.target.value)} rows={6} placeholder="Jane Doe,Manager,2468&#10;John Smith,Staff,1357" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono outline-none" required />
              
              <AnimatePresence>
                {bulkSuccessMsg && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs font-bold">
                    {bulkSuccessMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit" className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all">
                Import Identities
              </button>
            </form>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── USER DETAIL PANEL SLIDEOVER ── */}
      <AnimatePresence>
        {selectedUser && (
          <React.Fragment>
            <div onClick={() => setSelectedUser(null)} className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="fixed top-0 right-0 w-full md:w-[380px] h-full bg-white shadow-2xl z-50 border-l border-slate-100 p-6 flex flex-col justify-between">
              
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator File</span>
                  <button onClick={() => setSelectedUser(null)} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500"><X size={16} /></button>
                </div>

                <div className="text-center space-y-3">
                  <img src={selectedUser.avatar || DEFAULT_AVATARS[0]} className="w-20 h-20 rounded-full object-cover mx-auto shadow-md" alt={selectedUser.name} />
                  <div>
                    <h3 className="text-lg font-black text-slate-950">{selectedUser.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">TOKEN ID: {selectedUser.id}</p>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    selectedUser.role === 'Admin' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>{selectedUser.role}</span>
                </div>

                {/* 2FA & Auth parameters */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Smartphone size={12} className="text-slate-500" /> Security Settings</h4>
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-500 font-bold uppercase tracking-wider">PIN authentication</span><span className="font-mono bg-white border px-2 py-0.5 rounded text-[10px]">ACTIVE</span></div>
                  <div className="flex justify-between items-center text-xs"><span className="text-slate-500 font-bold uppercase tracking-wider">2FA Status</span><span className="text-emerald-600 font-black uppercase text-[10px] flex items-center gap-1"><Shield size={10} /> Enrolled</span></div>
                </div>

                {/* Activity Feed mockup */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Activity size={12} className="text-slate-500" /> Recent Actions</h4>
                  <div className="border-l border-slate-100 pl-4 space-y-4">
                    <div className="text-[11px] relative">
                      <div className="absolute -left-[21px] top-1 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      <p className="font-bold text-slate-800">Assigned cryptolock key</p>
                      <p className="text-[9px] text-slate-400">Just now</p>
                    </div>
                    <div className="text-[11px] relative opacity-60">
                      <div className="absolute -left-[21px] top-1 w-1.5 h-1.5 bg-slate-400 rounded-full" />
                      <p className="font-bold text-slate-800">Opened collaboration mesh</p>
                      <p className="text-[9px] text-slate-400">2 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button onClick={() => deleteUser(selectedUser.id)} className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-black uppercase tracking-wider flex justify-center items-center gap-2">
                  Revoke Credentials
                </button>
              </div>

            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default IdentityManager;
