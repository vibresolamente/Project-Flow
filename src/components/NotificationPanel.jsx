import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle2, ShieldAlert, Zap, Info, AtSign, RefreshCcw, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

const iconFor = (type) => {
  if (type === 'approval') return <UserCheck size={14} className="text-amber-600" />;
  if (type === 'access')   return <ShieldAlert size={14} className="text-blue-600" />;
  if (type === 'mention')  return <AtSign size={14} className="text-emerald-600" />;
  if (type === 'update')   return <RefreshCcw size={14} className="text-slate-600" />;
  return <Info size={14} className="text-emerald-600" />;
};

const bgFor = (type) => {
  if (type === 'approval') return '#FFF7ED';
  if (type === 'access')   return '#EFF6FF';
  if (type === 'mention')  return '#ECFDF5';
  if (type === 'update')   return '#F8FAF9';
  return '#F0FDF4';
};

const NotificationPanel = ({ isOpen, onClose }) => {
  const { notifications, markAllRead, unreadCount } = useApp();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <div onClick={onClose} className="fixed inset-0 z-[199] bg-black/10 backdrop-blur-[2px]" />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.97, x: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="notification-panel fixed top-16 right-4 w-[400px] bg-white border border-slate-200 rounded-3xl shadow-2xl z-[200] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell size={18} className="text-emerald-600" />
                  {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Smart Notifications</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{unreadCount} UNREAD ALERTS</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline transition-all">Clear All</button>
                )}
                <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full transition-all text-slate-400"><X size={18} /></button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[500px] overflow-y-auto scrollbar-hide">
              {notifications.length === 0 ? (
                <div className="py-20 text-center px-10">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200"><Bell size={32} /></div>
                  <h4 className="text-sm font-black text-slate-900 mb-1">Silence is Golden</h4>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Your workspace is perfectly optimized. No pending alerts detected.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.map(n => (
                    <motion.div
                      layout
                      key={n.id}
                      className={`flex gap-4 p-5 transition-all relative ${n.read ? 'opacity-60' : 'bg-emerald-50/20'}`}
                    >
                      <div style={{ backgroundColor: bgFor(n.type) }} className="w-10 h-10 min-w-[40px] rounded-xl flex items-center justify-center shadow-sm">
                        {iconFor(n.type)}
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs leading-relaxed ${n.read ? 'text-slate-600' : 'text-slate-900 font-black'}`}>{n.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{n.type}</span>
                        </div>
                      </div>
                      {!n.read && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
              <button className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-emerald-600 transition-all flex items-center justify-center gap-2 mx-auto">
                <RefreshCcw size={12} /> Sync with Power Automate
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;
