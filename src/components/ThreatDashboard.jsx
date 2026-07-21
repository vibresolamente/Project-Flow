import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Activity, Globe, Lock, AlertTriangle, CheckCircle2, Terminal, ShieldCheck,
  ChevronRight, Compass, Server, Cpu, Database, Network
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const ThreatDashboard = () => {
  const { threatAlerts, auditLogs, userRole, lastHash, currentUser, logAction } = useApp();

  const [activeTab, setActiveTab] = useState('threats'); // threats | chain | radar
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [cyberRadarPulse, setCyberRadarPulse] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setCyberRadarPulse(p => (p + 1) % 360), 60);
    return () => clearInterval(iv);
  }, []);

  if (userRole !== 'Admin') {
    return (
      <div className="max-w-2xl mx-auto text-center p-12 bg-red-50/50 rounded-3xl border border-red-150">
        <ShieldAlert size={48} className="mx-auto text-red-600 mb-4" />
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Security Clearance Required</h3>
        <p className="text-sm text-slate-600 mt-2">
          The threat dashboard accesses low-level system logs and ledger validation services. Administrative authority required.
        </p>
      </div>
    );
  }

  // Blockchain Ledger Structure mock-up based on audit logs
  const blockchainLedger = useMemo(() => {
    return auditLogs.map((log, idx) => {
      const prevHash = idx === auditLogs.length - 1 ? '00000000000000000000000000000000' : auditLogs[idx + 1].hash;
      return {
        blockNumber: auditLogs.length - idx,
        prevHash: prevHash.substring(0, 16) + '...',
        currentHash: log.hash.substring(0, 16) + '...',
        fullCurrentHash: log.hash,
        fullPrevHash: prevHash,
        timestamp: log.time,
        action: log.action,
        user: log.user,
        target: log.target
      };
    });
  }, [auditLogs]);

  // Security score calculation
  const securityScore = 96;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12">
      
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <ShieldAlert size={32} className="text-red-600" />
            Security Intelligence War Room
          </h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mt-1">
            Realtime attack mitigation system & blockchain-anchored transaction ledger
          </p>
        </div>
        <div className="flex gap-2">
          {/* Header indicator */}
          <div className="bg-slate-900 text-white px-4.5 py-2.5 rounded-2xl border border-slate-800 flex items-center gap-3 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-[10px] font-mono">
              <p className="text-slate-500 uppercase tracking-widest text-[8px] font-black">Ledger State</p>
              <p className="font-bold text-emerald-400">0x{lastHash?.substring(0, 12)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECURITY SCORE & RADAR ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Security score ring (Circular metric) */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm flex flex-col items-center justify-center text-center col-span-1">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Security Posture Index</h4>
          
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* SVG circle meter */}
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="#F1F5F9" strokeWidth="12" fill="transparent" />
              <motion.circle cx="80" cy="80" r="70" stroke="#10B981" strokeWidth="12" fill="transparent"
                strokeDasharray="440" initial={{ strokeDashoffset: 440 }} animate={{ strokeDashoffset: 440 - (440 * securityScore) / 100 }} transition={{ duration: 1.5, ease: 'easeOut' }} />
            </svg>
            <div className="text-center">
              <span className="text-4xl font-black text-slate-900">{securityScore}%</span>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Excellent</p>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 font-bold mt-6 uppercase">0 Critical breaches detected</p>
        </div>

        {/* Global animated SVG Ingress map */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm col-span-1 lg:col-span-2 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Ingress Vector Radar</h4>
            <span className="text-[9px] bg-red-50 border border-red-100 text-red-600 font-black px-2 py-0.5 rounded-full uppercase tracking-wide">Threat Scanners Live</span>
          </div>

          {/* SVG Map mockup with lines */}
          <div className="h-44 bg-slate-950 rounded-3xl relative overflow-hidden flex items-center justify-center border border-slate-800">
            {/* Radar sweep lines */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.3),transparent_70%)]" />
            <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(${cyberRadarPulse}deg, rgba(16,185,129,0.05) 0%, transparent 50%)` }} />
            
            <svg className="absolute inset-0 w-full h-full">
              {/* Central base node */}
              <circle cx="50%" cy="50%" r="5" fill="#10B981" className="animate-pulse" />
              <circle cx="50%" cy="50%" r="15" fill="none" stroke="#10B981" strokeWidth="1" strokeDasharray="3 3" className="animate-ping" style={{ animationDuration: '3s' }} />
              
              {/* Origin nodes and path draws */}
              {[{x: 40, y: 50, color: '#EF4444', label: 'E-Ingress'}, {x: 280, y: 30, color: '#10B981', label: 'Node-Ke'}, {x: 120, y: 150, color: '#EF4444', label: 'Scanner'}].map((node, i) => (
                <g key={i}>
                  <circle cx={node.x} cy={node.y} r="3" fill={node.color} />
                  <path d={`M ${node.x} ${node.y} L 160 88`} fill="none" stroke={node.color} strokeWidth="1" strokeDasharray="4 2" className="animate-pulse" />
                </g>
              ))}
            </svg>
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-[0.3em] relative z-10">Cyber Threat Map Monitoring</span>
          </div>

          <div className="flex justify-between items-center text-[9px] font-black text-slate-400 mt-4 uppercase">
            <span>Ingress Scans: 1,489 / sec</span>
            <span>Integrity: 100% SECURE</span>
          </div>
        </div>

        {/* Crypto parameters cards */}
        <div className="bg-slate-900 text-white rounded-[2.5rem] p-6 shadow-2xl border border-slate-800 flex flex-col justify-between col-span-1">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Enclave Cryptography</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Standard Strength</span>
                <span className="text-base font-black text-emerald-400">AES-256</span>
              </div>
              <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Digital Hash Ledger</span>
                <span className="text-base font-black text-blue-400">SHA-256</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase mt-6">
            All system audit nodes are chained together. Alteration of any block immediately breaks validation chain.
          </p>
        </div>
      </div>

      {/* ── TAB MENU FOR ALERTS vs BLOCKCHAIN EXPLORER ── */}
      <div className="flex border-b border-slate-100 bg-white p-2 rounded-2xl shadow-sm gap-1">
        <button onClick={() => { setActiveTab('threats'); setSelectedBlock(null); }} className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'threats' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}>
          Live Threat Feed
        </button>
        <button onClick={() => { setActiveTab('chain'); setSelectedBlock(null); }} className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'chain' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}>
          Blockchain Ledger Explorer
        </button>
      </div>

      {/* ── LIVE THREAT ALERTS STREAM ── */}
      {activeTab === 'threats' && (
        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
          <div className="bg-red-600 px-6 py-4 flex justify-between items-center text-white">
            <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Activity size={15} /> Realtime Mitigation Feed
            </h4>
            <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded font-black tracking-widest">LIVE TRACKING</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {threatAlerts.map(alert => {
              const isDanger = alert.type === 'danger';
              return (
                <div key={alert.id} className="p-4.5 flex gap-4 items-start hover:bg-slate-50/50 transition-colors">
                  <div className={`mt-0.5 p-1.5 rounded-xl shrink-0 ${isDanger ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-500 border border-slate-150'}`}>
                    <AlertTriangle size={15} />
                  </div>
                  <div>
                    <h5 className={`font-black text-xs ${isDanger ? 'text-red-950' : 'text-slate-800'}`}>{alert.message}</h5>
                    <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase">{new Date(alert.time).toLocaleTimeString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BLOCKCHAIN LEDGER EXPLORER ── */}
      {activeTab === 'chain' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scrollable blockchain timeline */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Immutable Block Registry</h4>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {blockchainLedger.map((block) => (
                <div key={block.blockNumber} onClick={() => setSelectedBlock(block)}
                  className={`bg-slate-50/50 border hover:bg-slate-50 rounded-3xl p-5 flex items-center justify-between gap-4 cursor-pointer transition-all ${selectedBlock?.blockNumber === block.blockNumber ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-150'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white font-mono text-xs font-black flex items-center justify-center shrink-0">
                      #{block.blockNumber}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 uppercase">{block.action}</h4>
                      <p className="text-[9px] text-slate-400 mt-1 font-bold">BY: {block.user} · FOR: {block.target}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest inline-flex items-center gap-1">
                      <CheckCircle2 size={9} /> Sealed
                    </span>
                    <p className="text-[9px] text-slate-400 mt-1 font-mono">{block.currentHash}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Block details view */}
          <div className="lg:col-span-1 bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Cryptographic Details</h4>
            
            {selectedBlock ? (
              <div className="space-y-5 font-mono text-[10px] text-slate-600">
                <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl space-y-2">
                  <p className="font-black text-xs text-white">Block #{selectedBlock.blockNumber}</p>
                  <p className="text-[9px] text-slate-400">Timestamp: {selectedBlock.timestamp}</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider block font-bold text-[8px]">Previous Hash (Parent)</span>
                    <p className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 break-all mt-1">{selectedBlock.fullPrevHash}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider block font-bold text-[8px]">Current Hash</span>
                    <p className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 break-all mt-1">{selectedBlock.fullCurrentHash}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider block font-bold text-[8px]">Sealing User</span>
                    <p className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 mt-1 font-bold font-sans text-xs text-slate-800">{selectedBlock.user}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic">Select any block from registry to extract full parent/current hash keys.</p>
            )}
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default ThreatDashboard;
