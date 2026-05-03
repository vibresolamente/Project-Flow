import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, User, AlertTriangle, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AuthGate = ({ children }) => {
  const { currentUser, setCurrentUser, systemUsers, mfaVerified, setMfaVerified, pushThreatAlert } = useApp();

  const [pin, setPin] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [step, setStep] = useState(1); // 1: Identity/PIN, 2: MFA
  const [error, setError] = useState('');

  // If user is already authenticated AND MFA is verified, return children
  if (currentUser && mfaVerified) {
    return <>{children}</>;
  }

  const handleInitialLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedUserId || !pin) {
      setError('Please select an ID and enter the PIN.');
      return;
    }

    const user = systemUsers.find(u => u.id === selectedUserId);
    if (user && user.pin === pin) {
      setCurrentUser(user);
      setStep(2); // Move to MFA step
    } else {
      const failedUser = systemUsers.find(u => u.id === selectedUserId)?.name || 'Unknown';
      pushThreatAlert('danger', `FAILED_AUTH: Unauthorized PIN attempt for ${failedUser}.`);
      setError('AUTH_SEC_FAIL: Cryptographic PIN rejected by authority.');
    }
  };

  const handleMFAVerify = (e) => {
    e.preventDefault();
    setError('');

    // Simulate MFA verification (accept any 6-digit code)
    if (mfaCode.length === 6) {
      setMfaVerified(true);
    } else {
      setError('MFA_INVALID: Security code must be 6 digits.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Enterprise Background */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-emerald-500 blur-[120px]"></div>
        <div className="absolute top-[40%] right-[10%] w-[400px] h-[400px] rounded-full bg-blue-500 blur-[150px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl relative z-10 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-8 text-center relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400"></div>
          <ShieldCheck className="mx-auto text-emerald-400 h-16 w-16 mb-4 drop-shadow-lg" />
          <h1 className="text-2xl font-extrabold text-white tracking-tight">ProjectFlow OS</h1>
          <p className="text-emerald-200/80 text-xs mt-2 uppercase tracking-widest font-bold">Encrypted Enterprise Gateway</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="step1"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              onSubmit={handleInitialLogin}
              className="p-8 space-y-6 bg-slate-50"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <User size={14} /> Simulated Identity
                </label>
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-3 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="" disabled>Select User Identity...</option>
                  {systemUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Lock size={14} /> Authentication PIN
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="e.g. 0000 or 1234"
                  className="w-full bg-white border border-slate-300 rounded p-3 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono tracking-widest"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded p-3 flex gap-2 items-start">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Next Step <ArrowRight size={16} />
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="step2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              onSubmit={handleMFAVerify}
              className="p-8 space-y-6 bg-slate-50"
            >
              <div className="text-center space-y-2 mb-4">
                <div className="h-12 w-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="font-bold text-slate-800">MFA Verification</h3>
                <p className="text-xs text-slate-500">Enter the 6-digit code from your authenticator app for <strong>{currentUser?.name}</strong></p>
              </div>

              <div className="space-y-1">
                <input
                  autoFocus
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full bg-white border border-slate-300 rounded p-4 text-center text-2xl font-mono tracking-[0.5em] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded p-3 flex gap-2 items-start">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Verify & Enter Platform <Lock size={16} />
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setPin(''); setCurrentUser(null); }}
                className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest mt-4"
              >
                Back to Identity Selection
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="text-center p-4 bg-slate-100 text-[10px] text-slate-400 font-bold tracking-widest uppercase border-t border-slate-200">
          Zero-Trust Architecture Active
        </div>
      </motion.div>
    </div>
  );
};

export default AuthGate; 