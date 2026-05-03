import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Settings, ShieldCheck, Trash2, Edit3, Save, X, Key } from 'lucide-react';
import { useApp } from '../context/AppContext';

const IdentityManager = () => {
  const { systemUsers, registerNewUser, updateUser, deleteUser, updateUserGroups, userRole } = useApp();
  
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('Staff');
  const [newUserPin, setNewUserPin] = useState('0000');
  
  const [editingUserId, setEditingUserId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPin, setEditPin] = useState('');

  const allDepts = ['Finance', 'Legal', 'HR', 'Ops', 'IT'];

  const handleRegister = (e) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    registerNewUser({ name: newUserName, role: newUserRole, pin: newUserPin, departments: [] });
    setNewUserName('');
    setNewUserPin('0000');
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
  };

  if (userRole !== 'Admin') {
    return (
      <div className="card bg-red-50 p-10 text-center border-red-200">
        <ShieldCheck size={48} className="mx-auto text-red-600 mb-4" />
        <h3 className="text-xl font-bold text-red-900">Privilege Escalation Blocked</h3>
        <p className="text-red-700">Only Global Admins can access the Identity & Group Management Hub.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg"><Users size={24}/></div>
            Identity Lifecycle Manager
          </h2>
          <p className="text-muted-foreground font-medium text-sm mt-1">Manage system-wide user credentials, security roles, and department bindings.</p>
        </div>
        <div className="bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 flex items-center gap-2">
           <ShieldCheck className="text-emerald-600" size={16}/>
           <span className="text-[10px] font-black uppercase text-emerald-800 tracking-widest">Admin Control Layer Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* NEW USER PROVISIONING */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card bg-white border-2 border-slate-100 shadow-xl rounded-3xl overflow-hidden">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center gap-3">
              <UserPlus className="text-slate-900" size={20} />
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Provision User</h3>
            </div>
            <form onSubmit={handleRegister} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Identity Name</label>
                <input type="text" value={newUserName} onChange={e=>setNewUserName(e.target.value)} placeholder="Enter full name..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-4 ring-slate-100 mt-1 transition-all" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Security Clearance</label>
                <select value={newUserRole} onChange={e=>setNewUserRole(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-4 ring-slate-100 mt-1 transition-all appearance-none cursor-pointer">
                  <option value="Admin">Global Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Staff">General Staff</option>
                  <option value="Restricted">Restricted Contractor</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Vault Auth PIN</label>
                <div className="relative">
                  <input type="text" value={newUserPin} onChange={e=>setNewUserPin(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-mono tracking-[0.4em] outline-none focus:ring-4 ring-slate-100 mt-1 pl-10" required />
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all active:scale-95 flex justify-center items-center gap-2 mt-4">
                Deploy Identity
              </button>
            </form>
          </div>

          <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
             <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-2">Governance Notice</h4>
             <p className="text-[10px] leading-relaxed text-amber-800 font-medium italic">Provisioning a new identity creates a persistent audit entry in the immutable ledger. Access logs will be bound to this ID immediately.</p>
          </div>
        </div>

        {/* IDENTITY MANAGEMENT MATRIX */}
        <div className="lg:col-span-3 space-y-6">
           <div className="card p-0 shadow-2xl rounded-3xl overflow-hidden border-2 border-slate-100">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                 <div className="flex items-center gap-3">
                   <Settings className="text-emerald-400" size={20} />
                   <h3 className="font-black text-xs uppercase tracking-[0.3em]">Identity Governance Matrix</h3>
                 </div>
                 <span className="text-[10px] font-black uppercase bg-white/10 px-3 py-1 rounded-full">{systemUsers.length} Active Nodes</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                      <th className="p-6">Member Identity</th>
                      <th className="p-6">Role / Access</th>
                      <th className="p-6">Department Bindings</th>
                      <th className="p-6 text-right">Commands</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {systemUsers.map(user => (
                      <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="p-6">
                          {editingUserId === user.id ? (
                            <input 
                              type="text" 
                              value={editName} 
                              onChange={e => setEditName(e.target.value)} 
                              className="bg-white border border-slate-200 rounded p-2 font-bold text-sm outline-none w-full"
                            />
                          ) : (
                            <div>
                              <p className="font-black text-slate-900 text-base">{user.name}</p>
                              <p className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {user.id} | PIN: {user.pin}</p>
                            </div>
                          )}
                        </td>
                        <td className="p-6">
                          {editingUserId === user.id ? (
                            <select 
                              value={editRole} 
                              onChange={e => setEditRole(e.target.value)} 
                              className="bg-white border border-slate-200 rounded p-2 text-xs font-bold outline-none"
                            >
                              <option value="Admin">Admin</option>
                              <option value="Manager">Manager</option>
                              <option value="Staff">Staff</option>
                              <option value="Restricted">Restricted</option>
                            </select>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              user.role === 'Admin' ? 'bg-slate-900 text-white' : 
                              user.role === 'Manager' ? 'bg-emerald-100 text-emerald-700' :
                              user.role === 'Staff' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 
                              'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              {user.role}
                            </span>
                          )}
                        </td>
                        <td className="p-6">
                          <div className="flex gap-1.5 flex-wrap max-w-[200px]">
                            {allDepts.map(dept => {
                              const hasAccess = user.departments.includes(dept);
                              return (
                                <button 
                                  key={dept} 
                                  onClick={() => toggleGroup(user.id, dept)}
                                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all border ${
                                    hasAccess ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'
                                  }`}
                                >
                                  {dept}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex justify-end gap-2">
                            {editingUserId === user.id ? (
                              <>
                                <button onClick={() => saveEdit(user.id)} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-md"><Save size={14}/></button>
                                <button onClick={cancelEditing} className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-all"><X size={14}/></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEditing(user)} className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-900 rounded-lg transition-all" title="Edit Profile"><Edit3 size={14}/></button>
                                <button onClick={() => deleteUser(user.id)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all" title="Wipe Identity"><Trash2 size={14}/></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default IdentityManager;
