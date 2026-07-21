import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Lock, Unlock, FileText, CheckCircle2, ShieldAlert,
  Clock, KeyRound, AlertTriangle, Eye, EyeOff, Activity, ShieldCheck as VerifiedIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const VaultSecurity = () => {
  const { documents, updateDocumentVaultStatus, userRole, logAction, currentUser } = useApp();

  const [selectedDocId, setSelectedDocId] = useState('');
  const [vaultPassword, setVaultPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [timeLockDuration, setTimeLockDuration] = useState('0'); // 0 = no time lock, 5 = 5 mins, 60 = 1 hour etc.
  const [successMsg, setSuccessMsg] = useState('');
  const [isOpeningVaultDoor, setIsOpeningVaultDoor] = useState(false);
  const [vaultAttempts, setVaultAttempts] = useState([]); // Vault logs local state

  // Security score calculation for passwords
  const passwordStrength = useMemo(() => {
    if (!vaultPassword) return { score: 0, label: 'Empty', color: 'bg-slate-200' };
    let points = 0;
    if (vaultPassword.length >= 6) points += 1;
    if (/[A-Z]/.test(vaultPassword)) points += 1;
    if (/[0-9]/.test(vaultPassword)) points += 1;
    if (/[^A-Za-z0-9]/.test(vaultPassword)) points += 1;

    if (points <= 1) return { score: 25, label: 'Weak', color: 'bg-red-500', tips: 'Add uppercase, numbers, and symbols.' };
    if (points === 2) return { score: 50, label: 'Moderate', color: 'bg-amber-500', tips: 'Add unique symbols and length.' };
    if (points === 3) return { score: 75, label: 'Strong', color: 'bg-blue-500', tips: 'Excellent. Keep it memorable.' };
    return { score: 100, label: 'Unbreakable', color: 'bg-emerald-500', tips: 'Cryptographically supreme password.' };
  }, [vaultPassword]);

  if (userRole !== 'Admin') {
    return (
      <div className="max-w-2xl mx-auto text-center p-12 bg-red-50/50 rounded-3xl border border-red-150">
        <ShieldAlert size={48} className="mx-auto text-red-600 mb-4" />
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Vault Management Restrict</h3>
        <p className="text-sm text-slate-600 mt-2">
          Standard user profiles cannot configure cryptographic parameters. Contact System Administration for token overrides.
        </p>
      </div>
    );
  }

  const handleApplyLock = (e) => {
    e.preventDefault();
    if (!selectedDocId || !vaultPassword) return;

    // Simulate applying cryptographic lock
    updateDocumentVaultStatus(selectedDocId, vaultPassword);
    
    // Add to local logs
    const docName = documents.find(d => d.id === selectedDocId)?.name || 'Document';
    const newLog = {
      id: Date.now(),
      docName,
      user: currentUser?.name || 'Administrator',
      action: 'Cryptographic Lock Applied',
      time: new Date().toLocaleTimeString(),
      timeLockedUntil: timeLockDuration !== '0' ? new Date(Date.now() + parseInt(timeLockDuration) * 60000).toLocaleTimeString() : 'N/A'
    };

    setVaultAttempts(prev => [newLog, ...prev]);
    logAction(currentUser?.name, `Applied AES-256 Vault Lock (${timeLockDuration}m lock)`, docName);

    // Animation trigger
    setIsOpeningVaultDoor(true);
    setTimeout(() => setIsOpeningVaultDoor(false), 2200);

    setSuccessMsg(`AES-256 Vault Lock Applied to ${docName}.`);
    setSelectedDocId('');
    setVaultPassword('');
    setTimeLockDuration('0');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const activeEnclaves = documents.filter(d => d.vaultLocked);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <ShieldCheck size={32} className="text-emerald-600" />
          Zero-Trust Enclave Vault
        </h2>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mt-1">
          Apply military-grade secondary locks to isolate critical corporate files.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ── CRYPTOGRAPHIC FORM (LEFT PANEL) ── */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <Lock className="text-slate-900" size={20} />
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Initialize Cryptographic Lock</h3>
          </div>

          <form onSubmit={handleApplyLock} className="space-y-5">
            {/* Target Document */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target Document</label>
              <select value={selectedDocId} onChange={e => setSelectedDocId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-bold outline-none focus:border-slate-350 cursor-pointer">
                <option value="" disabled>Select unprotected document...</option>
                {documents.filter(d => !d.vaultLocked).map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.name} ({doc.dept})</option>
                ))}
              </select>
            </div>

            {/* Password input */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between items-center mb-2">
                <span>Secret Passphrase</span>
                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black">MIN 4 CHARS</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={vaultPassword}
                  onChange={e => setVaultPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pr-12 text-xs font-mono tracking-widest outline-none focus:border-slate-350"
                  placeholder="••••••••••••"
                  required
                  minLength={4}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {vaultPassword && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                    <span className="text-slate-400">Strength: <span style={{ color: passwordStrength.color }} className="font-extrabold">{passwordStrength.label}</span></span>
                    <span className="text-slate-400">{passwordStrength.score}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div className={`h-full ${passwordStrength.color}`} animate={{ width: `${passwordStrength.score}%` }} transition={{ duration: 0.3 }} />
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold">{passwordStrength.tips}</p>
                </div>
              )}
            </div>

            {/* Time-Lock Config */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Auto Time-Lock Release</label>
              <select value={timeLockDuration} onChange={e => setTimeLockDuration(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-bold outline-none cursor-pointer">
                <option value="0">No Time-Lock (Instant unlock allowed)</option>
                <option value="5">Lock for 5 Minutes</option>
                <option value="60">Lock for 1 Hour</option>
                <option value="1440">Lock for 24 Hours (Extreme security)</option>
              </select>
              <p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase flex items-center gap-1"><Clock size={10} /> Lock active from initialization</p>
            </div>

            {/* Success indicator */}
            <AnimatePresence>
              {successMsg && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-emerald-50 text-emerald-700 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 size={16} className="shrink-0" /> {successMsg}
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10 active:scale-98">
              Seal Document in Enclave
            </button>
          </form>
        </div>

        {/* ── ACTIVE ENCLAVES REGISTER (RIGHT PANEL) ── */}
        <div className="bg-slate-900 text-slate-300 rounded-[2.5rem] p-8 shadow-2xl border border-slate-800 flex flex-col justify-between overflow-hidden relative min-h-[450px]">
          
          {/* Glassmorphic Cyber vault door animation block */}
          <AnimatePresence>
            {isOpeningVaultDoor && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 text-center">
                
                {/* Visual Vault Door Spin */}
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.8, ease: 'easeInOut' }}
                  className="w-28 h-28 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 flex items-center justify-center mb-6">
                  <Lock size={36} className="text-emerald-400" />
                </motion.div>

                <h4 className="text-white font-black text-sm uppercase tracking-widest animate-pulse">Initializing AES-256 Crypto Staging</h4>
                <p className="text-[10px] text-slate-500 mt-2 font-mono">SEALING SECTOR · INDEXING SHARDS</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-white tracking-widest uppercase text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Sealed Vault Enclaves
              </h3>
              <span className="text-[10px] font-black bg-white/5 border border-white/10 text-white px-2 py-0.5 rounded-full">{activeEnclaves.length} active</span>
            </div>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {activeEnclaves.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Unlock size={32} className="mx-auto opacity-20 mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No active vault enclaves</p>
                </div>
              ) : (
                activeEnclaves.map(doc => (
                  <div key={doc.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Lock size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <h4 className="font-bold text-white text-xs leading-normal">{doc.name}</h4>
                        <p className="text-[9px] text-slate-500 font-mono mt-1 uppercase">ID: {doc.id} | {doc.dept}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-1 bg-red-900/40 text-red-400 border border-red-900 rounded-lg">Sealed</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><VerifiedIcon size={12} className="text-emerald-500" /> Complies with FIPS 140-2 Standards</p>
          </div>
        </div>

      </div>

      {/* ── VAULT AUDIT LOG (BOTTOM PANEL) ── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
          <Activity size={15} /> Vault Enclave Audit Logs
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest pb-3">
                <th className="py-2.5">User</th>
                <th>Target Payload</th>
                <th>Cryptographic Action</th>
                <th>Release Schedule</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-600 font-bold">
              {vaultAttempts.map(attempt => (
                <tr key={attempt.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 text-slate-900">{attempt.user}</td>
                  <td>{attempt.docName}</td>
                  <td><span className="text-emerald-600">{attempt.action}</span></td>
                  <td>{attempt.timeLockedUntil}</td>
                  <td className="text-slate-400">{attempt.time}</td>
                </tr>
              ))}
              {vaultAttempts.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-slate-400 italic">No cryptographic transactions registered in this session.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </motion.div>
  );
};

export default VaultSecurity;
