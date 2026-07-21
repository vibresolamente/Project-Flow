import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sidebar, Save, Lock, Unlock, UserPlus, Plus, Search, Star,
  Hash, Users, FileText, ChevronRight, Mic, MicOff, Video, VideoOff,
  Send, CheckSquare, Layers, Sparkles, ShieldCheck, Download, Eye,
  FileUp, MessageCircle, ExternalLink, Trash2, History, Settings,
  MoreHorizontal, Info, Activity, Database, Share2, Printer, Copy,
  Palette, ShieldAlert, Grid3x3, Monitor, MonitorOff, Phone, PhoneOff,
  Bold as BoldIcon, Italic as ItalicIcon, Underline as UnderlineIcon,
  List as ListIcon, Heading1, Heading2, Quote, Code, Highlighter,
  ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Table as TableIcon, Image as ImageIcon, Link as LinkIcon, Type, ChevronDown,
  Volume2, VolumeX, Maximize2, Minimize2, Hand, Smile, Radio,
  PlusSquare, Minus, RefreshCw, BarChart2, Globe, PenTool, FileSpreadsheet,
  StopCircle, CircleDot, Columns, Rows, SplitSquareHorizontal, MessageSquare,
  MessageSquareQuote, Zap, Check
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import ImageExt from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import CodeBlock from '@tiptap/extension-code-block';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as awarenessProtocol from 'y-protocols/awareness';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

// ─────────────────────────────────────────
// AI Worker singleton
// ─────────────────────────────────────────
let aiWorker = null;
if (typeof window !== 'undefined') {
  try {
    aiWorker = new Worker(new URL('../workers/aiWorker.js', import.meta.url), { type: 'module' });
  } catch (e) { /* Worker not available */ }
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
const toB64 = (arr) => {
  try { return btoa(Array.from(arr).map(b => String.fromCharCode(b)).join('')); }
  catch (e) { return ''; }
};
const fromB64 = (b64) => {
  try {
    if (!b64 || typeof b64 !== 'string') return new Uint8Array();
    return new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)));
  } catch (e) { return new Uint8Array(); }
};

const USER_COLORS = ['#10B981','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6'];
const getUserColor = (name) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return USER_COLORS[Math.abs(h) % USER_COLORS.length];
};

const FONTS = ['Inter','Georgia','Courier New','Arial','Times New Roman','Trebuchet MS'];
const FONT_SIZES = ['10','11','12','14','16','18','20','24','28','32','36','48','72'];
const REACTIONS = ['👍','❤️','😂','😮','🎉','🙌','🔥','💡'];

// ─────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────
const Toast = ({ message, type = 'info', onRemove }) => (
  <motion.div
    initial={{ opacity: 0, y: 24, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-2xl border text-sm font-bold backdrop-blur-xl
      ${type === 'error' ? 'bg-red-950/90 border-red-700/40 text-red-200' :
        type === 'success' ? 'bg-emerald-950/90 border-emerald-700/40 text-emerald-200' :
        'bg-slate-950/90 border-white/10 text-white'}`}
  >
    <div className={`w-2 h-2 rounded-full ${type === 'error' ? 'bg-red-400' : type === 'success' ? 'bg-emerald-400' : 'bg-blue-400'} animate-pulse`} />
    {message}
    <button onClick={onRemove} className="ml-2 opacity-50 hover:opacity-100"><X size={14} /></button>
  </motion.div>
);

// ─────────────────────────────────────────
// SPREADSHEET ENGINE
// ─────────────────────────────────────────
const COLS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const DEFAULT_ROWS = 30;
const DEFAULT_COLS = 10;

const evalFormula = (formula, cells) => {
  try {
    const f = formula.replace(/^=/, '').toUpperCase();
    // SUM(A1:B3)
    const sumMatch = f.match(/^SUM\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
    if (sumMatch) {
      const [, start, end] = sumMatch;
      const vals = getRangeValues(start, end, cells);
      return vals.reduce((a, v) => a + (parseFloat(v) || 0), 0);
    }
    // AVERAGE
    const avgMatch = f.match(/^AVERAGE\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
    if (avgMatch) {
      const [, start, end] = avgMatch;
      const vals = getRangeValues(start, end, cells).filter(v => !isNaN(parseFloat(v)));
      return vals.length ? vals.reduce((a, v) => a + parseFloat(v), 0) / vals.length : 0;
    }
    // COUNT
    const countMatch = f.match(/^COUNT\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
    if (countMatch) {
      const [, start, end] = countMatch;
      return getRangeValues(start, end, cells).filter(v => !isNaN(parseFloat(v))).length;
    }
    // MAX
    const maxMatch = f.match(/^MAX\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
    if (maxMatch) {
      const vals = getRangeValues(maxMatch[1], maxMatch[2], cells).map(Number).filter(v => !isNaN(v));
      return vals.length ? Math.max(...vals) : 0;
    }
    // MIN
    const minMatch = f.match(/^MIN\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
    if (minMatch) {
      const vals = getRangeValues(minMatch[1], minMatch[2], cells).map(Number).filter(v => !isNaN(v));
      return vals.length ? Math.min(...vals) : 0;
    }
    // Cell reference A1
    const cellRef = f.match(/^([A-Z]+)(\d+)$/);
    if (cellRef) {
      const key = `${cellRef[1]}${cellRef[2]}`;
      return cells[key]?.value || '';
    }
    // Arithmetic: replace cell refs
    const resolved = f.replace(/([A-Z]+\d+)/g, (ref) => {
      const v = cells[ref]?.value;
      return !isNaN(parseFloat(v)) ? parseFloat(v) : 0;
    });
    // eslint-disable-next-line no-new-func
    return new Function(`return ${resolved}`)();
  } catch { return '#ERR'; }
};

const getRangeValues = (start, end, cells) => {
  const startCol = start.match(/[A-Z]+/)[0];
  const startRow = parseInt(start.match(/\d+/)[0]);
  const endCol = end.match(/[A-Z]+/)[0];
  const endRow = parseInt(end.match(/\d+/)[0]);
  const sc = COLS.indexOf(startCol), ec = COLS.indexOf(endCol);
  const vals = [];
  for (let r = startRow; r <= endRow; r++) {
    for (let c = sc; c <= ec; c++) {
      vals.push(cells[`${COLS[c]}${r}`]?.value || '');
    }
  }
  return vals;
};

const Spreadsheet = ({ docId }) => {
  const [cells, setCells] = useState({});
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [sheets, setSheets] = useState(['Sheet1','Sheet2','Sheet3']);
  const [activeSheet, setActiveSheet] = useState('Sheet1');
  const [colWidths, setColWidths] = useState({});
  const inputRef = useRef(null);

  const getCellKey = (col, row) => `${col}${row}`;

  const getCellDisplay = (key) => {
    const cell = cells[key];
    if (!cell?.value) return '';
    if (typeof cell.value === 'string' && cell.value.startsWith('=')) {
      return evalFormula(cell.value, cells);
    }
    return cell.value;
  };

  const commitEdit = () => {
    if (!editing) return;
    setCells(prev => ({ ...prev, [editing]: { ...(prev[editing] || {}), value: editValue } }));
    setEditing(null);
  };

  const startEdit = (key, current) => {
    setEditing(key);
    setEditValue(current?.value || '');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e, col, row) => {
    if (e.key === 'Enter') { commitEdit(); setSelected(`${col}${row + 1}`); }
    if (e.key === 'Tab') { e.preventDefault(); commitEdit(); const ni = COLS.indexOf(col) + 1; if (ni < DEFAULT_COLS) setSelected(`${COLS[ni]}${row}`); }
    if (e.key === 'Escape') { setEditing(null); }
  };

  const formatCell = (type) => {
    if (!selected) return;
    setCells(prev => {
      const cell = prev[selected] || {};
      const fmt = cell.fmt || {};
      return { ...prev, [selected]: { ...cell, fmt: { ...fmt, [type]: !fmt[type] } } };
    });
  };

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n');
      const newCells = {};
      lines.forEach((line, ri) => {
        line.split(',').forEach((val, ci) => {
          if (ci < COLS.length) newCells[`${COLS[ci]}${ri + 1}`] = { value: val.trim() };
        });
      });
      setCells(newCells);
    };
    reader.readAsText(file);
  };

  const exportCSV = () => {
    let csv = '';
    for (let r = 1; r <= DEFAULT_ROWS; r++) {
      const row = COLS.slice(0, DEFAULT_COLS).map(c => getCellDisplay(`${c}${r}`) || '');
      if (row.some(v => v !== '')) csv += row.join(',') + '\n';
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `spreadsheet_${activeSheet}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-slate-200 bg-slate-50 shrink-0 flex-wrap">
        <button onClick={() => formatCell('bold')} className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${selected && cells[selected]?.fmt?.bold ? 'bg-slate-200' : ''}`}><BoldIcon size={14} /></button>
        <button onClick={() => formatCell('italic')} className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${selected && cells[selected]?.fmt?.italic ? 'bg-slate-200' : ''}`}><ItalicIcon size={14} /></button>
        <button onClick={() => formatCell('underline')} className="p-1.5 rounded hover:bg-slate-200 transition-colors"><UnderlineIcon size={14} /></button>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <select className="text-[11px] border border-slate-200 rounded px-1 py-0.5 bg-white" onChange={e => selected && setCells(p => ({...p, [selected]: {...(p[selected]||{}), fmt:{...(p[selected]?.fmt||{}), bg: e.target.value}}}))} defaultValue="">
          <option value="">Fill Color</option>
          {['#FEF3C7','#DCFCE7','#DBEAFE','#FCE7F3','#F3E8FF','#FEE2E2'].map(c => <option key={c} value={c} style={{background:c}}>{c}</option>)}
        </select>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded px-2 py-0.5 cursor-pointer hover:bg-slate-50">
          <FileUp size={12} /> Import CSV
          <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
        </label>
        <button onClick={exportCSV} className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded px-2 py-0.5 hover:bg-slate-50">
          <Download size={12} /> Export CSV
        </button>
      </div>

      {/* Formula Bar */}
      <div className="flex items-center gap-2 px-3 py-1 border-b border-slate-200 bg-white shrink-0">
        <span className="text-[11px] font-bold text-slate-500 w-12 text-center bg-slate-100 rounded px-1 py-0.5">{selected || '—'}</span>
        <div className="w-px h-4 bg-slate-300" />
        <input
          className="flex-1 text-[12px] font-mono text-slate-800 outline-none bg-transparent"
          value={editing ? editValue : (selected ? (cells[selected]?.value || '') : '')}
          onChange={e => editing ? setEditValue(e.target.value) : null}
          onFocus={() => selected && startEdit(selected, cells[selected])}
          placeholder="Enter value or formula (e.g. =SUM(A1:A10))"
          ref={inputRef}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); }}
        />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto relative">
        <table className="border-collapse text-[12px] min-w-full">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="w-10 min-w-[40px] bg-slate-100 border border-slate-200 text-slate-500 font-bold text-[10px]" />
              {COLS.slice(0, DEFAULT_COLS).map(col => (
                <th key={col} className="bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[11px] px-2 py-1 text-center min-w-[80px]" style={{width: colWidths[col] || 80}}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: DEFAULT_ROWS }, (_, ri) => ri + 1).map(row => (
              <tr key={row} className="hover:bg-slate-50/50">
                <td className="bg-slate-100 border border-slate-200 text-slate-500 font-bold text-[10px] text-center px-1 sticky left-0 z-10">{row}</td>
                {COLS.slice(0, DEFAULT_COLS).map(col => {
                  const key = getCellKey(col, row);
                  const cell = cells[key] || {};
                  const display = getCellDisplay(key);
                  const isSelected = selected === key;
                  const isEditing = editing === key;
                  return (
                    <td
                      key={key}
                      className={`border border-slate-200 relative cursor-cell ${isSelected ? 'outline outline-2 outline-blue-500 outline-offset-[-1px] z-20' : ''}`}
                      style={{ background: cell.fmt?.bg || 'white', fontWeight: cell.fmt?.bold ? 700 : 400, fontStyle: cell.fmt?.italic ? 'italic' : 'normal', textDecoration: cell.fmt?.underline ? 'underline' : 'none', minWidth: colWidths[col] || 80 }}
                      onClick={() => { setSelected(key); if (editing && editing !== key) commitEdit(); }}
                      onDoubleClick={() => startEdit(key, cell)}
                    >
                      {isEditing ? (
                        <input
                          ref={inputRef}
                          className="w-full h-full px-1 py-0.5 outline-none bg-white absolute inset-0 z-30 text-[12px]"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={e => handleKeyDown(e, col, row)}
                          autoFocus
                        />
                      ) : (
                        <span className="block px-1 py-0.5 truncate">{display}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sheet Tabs */}
      <div className="flex items-center gap-1 px-3 py-1 border-t border-slate-200 bg-slate-50 shrink-0">
        {sheets.map(s => (
          <button key={s} onClick={() => setActiveSheet(s)} className={`text-[11px] font-bold px-3 py-1 rounded transition-all ${activeSheet === s ? 'bg-white border border-slate-200 text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-white'}`}>
            {s}
          </button>
        ))}
        <button onClick={() => { const n = `Sheet${sheets.length + 1}`; setSheets(p => [...p, n]); setActiveSheet(n); }} className="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-800 transition-colors">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────
// VIDEO MEET (WebRTC via Supabase Signaling)
// ─────────────────────────────────────────
const VideoMeet = ({ roomId, userName, userColor, addToast }) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [reactionBubbles, setReactionBubbles] = useState([]);
  const [raisedHand, setRaisedHand] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const localVideoRef = useRef(null);
  const recordingRef = useRef(null);
  const channelRef = useRef(null);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      if (supabase) {
        const channel = supabase.channel(`meet-${roomId}`, { config: { broadcast: { self: false } } });
        channelRef.current = channel;
        channel.on('broadcast', { event: 'meet-chat' }, ({ payload }) => {
          setChatMessages(p => [...p, payload]);
        });
        channel.on('broadcast', { event: 'meet-reaction' }, ({ payload }) => {
          triggerReaction(payload.emoji, payload.user);
        });
        channel.on('broadcast', { event: 'meet-join' }, ({ payload }) => {
          setParticipants(p => [...p.filter(u => u.id !== payload.id), payload]);
          addToast(`${payload.name} joined the call`);
        });
        channel.on('broadcast', { event: 'meet-leave' }, ({ payload }) => {
          setParticipants(p => p.filter(u => u.id !== payload.id));
          addToast(`${payload.name} left the call`);
        });
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            channel.send({ type: 'broadcast', event: 'meet-join', payload: { id: `user-${Date.now()}`, name: userName, color: userColor } });
          }
        });
      }
      setIsInCall(true);
      addToast('You joined the meeting');
    } catch (err) {
      addToast('Camera/Mic access denied. Please allow permissions.');
    }
  };

  const endCall = () => {
    localStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    channelRef.current?.send({ type: 'broadcast', event: 'meet-leave', payload: { id: 'local', name: userName } });
    channelRef.current?.unsubscribe();
    setIsInCall(false);
    setParticipants([]);
    addToast('Call ended');
  };

  const toggleScreen = async () => {
    try {
      if (!isScreenSharing) {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) localVideoRef.current.srcObject = screen;
        screen.getVideoTracks()[0].onended = () => { setIsScreenSharing(false); if (localVideoRef.current) localVideoRef.current.srcObject = localStream; };
        setIsScreenSharing(true);
        addToast('Screen sharing started');
      } else {
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
        setIsScreenSharing(false);
        addToast('Screen sharing stopped');
      }
    } catch { addToast('Screen sharing was cancelled.'); }
  };

  const toggleMic = () => {
    localStream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMicOn(p => !p);
    addToast(isMicOn ? 'Microphone muted' : 'Microphone unmuted');
  };

  const toggleCam = () => {
    localStream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCamOn(p => !p);
    addToast(isCamOn ? 'Camera off' : 'Camera on');
  };

  const startRecording = () => {
    if (!localStream) return;
    const chunks = [];
    const rec = new MediaRecorder(localStream);
    rec.ondataavailable = e => chunks.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `meeting-${Date.now()}.webm`; a.click();
      addToast('Recording saved!');
    };
    rec.start();
    recordingRef.current = rec;
    setIsRecording(true);
    addToast('Recording started');
  };

  const stopRecording = () => {
    recordingRef.current?.stop();
    setIsRecording(false);
  };

  const triggerReaction = (emoji, user) => {
    const id = Date.now();
    setReactionBubbles(p => [...p, { id, emoji, user }]);
    setTimeout(() => setReactionBubbles(p => p.filter(r => r.id !== id)), 3000);
  };

  const sendReaction = (emoji) => {
    triggerReaction(emoji, userName);
    channelRef.current?.send({ type: 'broadcast', event: 'meet-reaction', payload: { emoji, user: userName } });
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = { user: userName, text: chatInput, time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), color: userColor };
    setChatMessages(p => [...p, msg]);
    channelRef.current?.send({ type: 'broadcast', event: 'meet-chat', payload: msg });
    setChatInput('');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}?meet=${roomId}`);
    addToast('Meeting link copied!');
  };

  if (!isInCall) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-12">
        <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30 mb-8">
          <Video size={52} />
        </div>
        <h2 className="text-4xl font-black tracking-tight mb-3">Team Video Meet</h2>
        <p className="text-slate-400 mb-2 text-sm font-medium">Room: <span className="text-emerald-400 font-bold font-mono">{roomId}</span></p>
        <p className="text-slate-500 text-xs mb-10">Real WebRTC video via your browser camera. No plugins needed.</p>
        <div className="flex gap-4">
          <button onClick={startCall} className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-black text-sm hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-1 transition-all flex items-center gap-3 shadow-xl">
            <Video size={20} /> Join Now
          </button>
          <button onClick={copyLink} className="px-6 py-4 border border-white/20 text-white rounded-2xl font-bold text-sm hover:bg-white/10 transition-all flex items-center gap-2">
            <Copy size={16} /> Copy Link
          </button>
        </div>
      </div>
    );
  }

  const allParticipants = [{ id: 'local', name: userName, color: userColor, isLocal: true }, ...participants];

  return (
    <div className="flex-1 flex flex-col bg-slate-900 relative overflow-hidden">
      {/* Reaction Bubbles */}
      <AnimatePresence>
        {reactionBubbles.map(r => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 0, scale: 0.5 }} animate={{ opacity: 1, y: -120, scale: 1.2 }} exit={{ opacity: 0 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 text-4xl pointer-events-none">
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Video Grid */}
      <div className={`flex-1 p-4 grid gap-3 ${allParticipants.length === 1 ? 'grid-cols-1' : allParticipants.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {allParticipants.map((p) => (
          <div key={p.id} className="relative rounded-2xl overflow-hidden bg-slate-800 border border-white/5 shadow-xl group">
            {p.isLocal ? (
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{minHeight: '180px'}} />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{minHeight: '180px', background: `${p.color}20`}}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-2xl" style={{background: p.color}}>
                  {p.name[0]}
                </div>
              </div>
            )}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg">{p.name}{p.isLocal ? ' (You)' : ''}</span>
              {raisedHand && p.isLocal && <span className="text-lg">✋</span>}
            </div>
            {!isCamOn && p.isLocal && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white" style={{background: userColor}}>{userName[0]}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Controls Bar */}
      <div className="h-20 bg-slate-800/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-center gap-3 px-6 shrink-0">
        <button onClick={toggleMic} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMicOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
          {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button onClick={toggleCam} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCamOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
          {isCamOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button onClick={toggleScreen} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isScreenSharing ? 'bg-amber-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>
          {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
        </button>
        <div className="w-px h-8 bg-white/10 mx-1" />
        {REACTIONS.slice(0, 4).map(r => (
          <button key={r} onClick={() => sendReaction(r)} className="text-xl hover:scale-125 transition-transform">{r}</button>
        ))}
        <div className="w-px h-8 bg-white/10 mx-1" />
        <button onClick={() => setRaisedHand(p => !p)} className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${raisedHand ? 'bg-amber-500' : 'bg-slate-700 hover:bg-slate-600'}`}>✋</button>
        <button onClick={() => setShowChat(p => !p)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${showChat ? 'bg-blue-500' : 'bg-slate-700 hover:bg-slate-600'}`}>
          <MessageSquare size={18} className="text-white" />
        </button>
        {isRecording
          ? <button onClick={stopRecording} className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all"><StopCircle size={18} className="text-white" /></button>
          : <button onClick={startRecording} className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-all"><CircleDot size={18} className="text-red-400" /></button>
        }
        <div className="w-px h-8 bg-white/10 mx-1" />
        <button onClick={endCall} className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all shadow-lg shadow-red-600/30">
          <PhoneOff size={20} className="text-white" />
        </button>
      </div>

      {/* Chat Sidebar */}
      <AnimatePresence>
        {showChat && (
          <motion.div initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }} className="absolute top-0 right-0 bottom-20 w-80 bg-slate-800/95 backdrop-blur-xl border-l border-white/10 flex flex-col z-40">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <span className="text-white font-bold text-sm">In-call Chat</span>
              <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((m, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold" style={{color: m.color}}>{m.user}</span>
                    <span className="text-[10px] text-slate-500">{m.time}</span>
                  </div>
                  <p className="text-white text-xs bg-white/5 rounded-xl px-3 py-2">{m.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={sendChat} className="p-4 border-t border-white/10 flex gap-2">
              <input className="flex-1 bg-white/10 text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-slate-500 focus:bg-white/15 transition-colors" placeholder="Message..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
              <button type="submit" className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-500 transition-colors"><Send size={14} className="text-white" /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────
// REALTIME TRANSCRIPTION ENGINE
// ─────────────────────────────────────────
const TranscriptionPanel = ({ onInsertText, addToast }) => {
  const [isLiveTranscribing, setIsLiveTranscribing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  const [fileProgress, setFileProgress] = useState(0);
  const [fileStatus, setFileStatus] = useState('');
  const [fullTranscript, setFullTranscript] = useState('');
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  const startLiveTranscription = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { addToast('Live transcription requires Chrome/Edge browser.', 'error'); return; }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (event) => {
      let interim = '', final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      if (final) setLiveTranscript(p => p + final + ' ');
      setInterimText(interim);
    };
    rec.onerror = (e) => { addToast(`Mic error: ${e.error}`, 'error'); setIsLiveTranscribing(false); };
    rec.onend = () => { if (isLiveTranscribing) rec.start(); };
    rec.start();
    recognitionRef.current = rec;
    setIsLiveTranscribing(true);
    addToast('Live transcription started — speak now!', 'success');
  };

  const stopLiveTranscription = () => {
    recognitionRef.current?.stop();
    setIsLiveTranscribing(false);
    setInterimText('');
    addToast('Transcription stopped');
  };

  const insertTranscript = () => {
    const text = liveTranscript || fullTranscript;
    if (!text.trim()) { addToast('No transcript to insert'); return; }
    onInsertText(`<blockquote><strong>🎙️ Transcription:</strong><br/>${text.trim()}</blockquote><p></p>`);
    addToast('Transcript inserted into document!', 'success');
    setLiveTranscript('');
    setFullTranscript('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      addToast('Only audio/video files supported', 'error'); return;
    }

    if (aiWorker) {
      // Use existing Whisper worker for file transcription
      setIsFileProcessing(true);
      setFileProgress(5);
      setFileStatus(`Loading ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)...`);
      addToast('AI transcription started — processing audio...', 'success');

      const listener = (e) => {
        const { status, message, result, error } = e.data;
        if (status === 'progress') { setFileProgress(p => Math.min(p + 8, 90)); setFileStatus(message || 'Transcribing...'); }
        else if (status === 'success') {
          setFileProgress(100);
          setFileStatus('Done!');
          setFullTranscript(result.text || '');
          setIsFileProcessing(false);
          addToast('File transcription complete!', 'success');
          aiWorker.removeEventListener('message', listener);
        } else if (status === 'error') {
          setIsFileProcessing(false);
          setFileProgress(0);
          setFileStatus('Failed');
          addToast(`Transcription error: ${error}`, 'error');
          aiWorker.removeEventListener('message', listener);
        }
      };
      aiWorker.addEventListener('message', listener);

      const reader = new FileReader();
      reader.onload = (ev) => {
        aiWorker.postMessage({ id: 'transcribe-audio', action: 'transcribe', payload: { audio: ev.target.result, mimeType: file.type } });
        setFileProgress(20);
        setFileStatus('Decoding audio...');
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Fallback: Web Speech API on audio element (works for many formats)
      addToast('AI worker not available — trying browser fallback...', 'info');
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div>
        <h3 className="text-sm font-black text-slate-800 mb-1 flex items-center gap-2"><Mic size={14} className="text-emerald-600" /> Real-Time Transcription</h3>
        <p className="text-[10px] text-slate-500">Live mic → text, or upload up to 5-min audio/video files</p>
      </div>

      {/* Live Transcription */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">🔴 Live Mic Transcription</span>
          {isLiveTranscribing && <span className="text-[9px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}
        </div>
        <button
          onClick={isLiveTranscribing ? stopLiveTranscription : startLiveTranscription}
          className={`w-full py-3 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${isLiveTranscribing ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'}`}
        >
          {isLiveTranscribing ? <><StopCircle size={14} /> Stop Transcription</> : <><Mic size={14} /> Start Live Transcription</>}
        </button>
        {(liveTranscript || interimText) && (
          <div className="bg-white rounded-xl p-3 border border-slate-200 max-h-32 overflow-y-auto text-[11px] text-slate-800 leading-relaxed">
            <span>{liveTranscript}</span>
            <span className="text-slate-400 italic">{interimText}</span>
          </div>
        )}
      </div>

      {/* File Transcription */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">📁 File Transcription (≤5 min)</span>
        <label className="w-full py-3 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-lg shadow-blue-600/20">
          <FileUp size={14} /> Upload Audio / Video
          <input ref={fileInputRef} type="file" accept="audio/*,video/*" className="hidden" onChange={handleFileUpload} />
        </label>
        {isFileProcessing && (
          <div className="space-y-1.5">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div className="h-full bg-blue-500 rounded-full" animate={{ width: `${fileProgress}%` }} transition={{ duration: 0.4 }} />
            </div>
            <p className="text-[10px] text-slate-500 font-bold">{fileStatus}</p>
          </div>
        )}
        {fullTranscript && (
          <div className="bg-white rounded-xl p-3 border border-slate-200 max-h-32 overflow-y-auto text-[11px] text-slate-800 leading-relaxed">
            {fullTranscript}
          </div>
        )}
      </div>

      {(liveTranscript || fullTranscript) && (
        <button onClick={insertTranscript} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-wider hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-xl">
          <Check size={14} /> Insert into Document
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────
// RICH DOCUMENT TOOLBAR (Word-like Ribbon)
// ─────────────────────────────────────────
const DocumentToolbar = ({ editor, onExport }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  if (!editor) return null;

  const TEXT_COLORS = ['#000000','#DC2626','#2563EB','#16A34A','#D97706','#9333EA','#0891B2','#DB2777'];

  const insertTable = () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  const insertImage = () => {
    const url = prompt('Image URL:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };
  const setLink = () => {
    if (linkUrl) editor.chain().focus().setLink({ href: linkUrl }).run();
    setShowLinkModal(false);
    setLinkUrl('');
  };

  const TB = ({ title, active, onClick, children }) => (
    <button title={title} onClick={onClick} className={`p-1.5 rounded-lg transition-all text-slate-700 ${active ? 'bg-slate-900 text-white shadow-inner' : 'hover:bg-slate-100'}`}>{children}</button>
  );

  return (
    <div className="bg-white border-b border-slate-200 px-3 py-1.5 flex flex-wrap items-center gap-0.5 shrink-0">
      {/* Font Family */}
      <select className="text-[11px] border border-slate-200 rounded px-1.5 py-1 mr-1 max-w-[100px] font-medium" onChange={e => editor.chain().focus().setFontFamily(e.target.value).run()} defaultValue="">
        <option value="">Font</option>
        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
      </select>
      {/* Font Size */}
      <select className="text-[11px] border border-slate-200 rounded px-1 py-1 mr-1 w-14" onChange={e => editor.chain().focus().setMark('textStyle', { fontSize: e.target.value + 'px' }).run()} defaultValue="">
        <option value="">Size</option>
        {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <div className="w-px h-5 bg-slate-200 mx-1" />

      {/* Format */}
      <TB title="Bold (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><BoldIcon size={14} /></TB>
      <TB title="Italic (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><ItalicIcon size={14} /></TB>
      <TB title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={14} /></TB>
      <TB title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><span className="line-through font-bold text-xs">S</span></TB>
      <div className="w-px h-5 bg-slate-200 mx-1" />

      {/* Colors */}
      <div className="relative">
        <button onClick={() => setShowColorPicker(p => !p)} className="p-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-0.5" title="Text Color">
          <span className="font-black text-sm" style={{color: editor.getAttributes('textStyle').color || '#000'}}>A</span>
          <ChevronDown size={10} />
        </button>
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 grid grid-cols-4 gap-1">
            {TEXT_COLORS.map(c => <button key={c} onClick={() => { editor.chain().focus().setColor(c).run(); setShowColorPicker(false); }} className="w-6 h-6 rounded-full border-2 border-white shadow hover:scale-110 transition-transform" style={{background: c}} />)}
          </div>
        )}
      </div>
      <TB title="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter size={14} /></TB>
      <div className="w-px h-5 bg-slate-200 mx-1" />

      {/* Headings */}
      <TB title="Heading 1" active={editor.isActive('heading', {level:1})} onClick={() => editor.chain().focus().toggleHeading({level:1}).run()}><Heading1 size={14} /></TB>
      <TB title="Heading 2" active={editor.isActive('heading', {level:2})} onClick={() => editor.chain().focus().toggleHeading({level:2}).run()}><Heading2 size={14} /></TB>
      <div className="w-px h-5 bg-slate-200 mx-1" />

      {/* Lists */}
      <TB title="Bullet List" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><ListIcon size={14} /></TB>
      <TB title="Ordered List" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={14} /></TB>
      <TB title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={14} /></TB>
      <TB title="Code Block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code size={14} /></TB>
      <div className="w-px h-5 bg-slate-200 mx-1" />

      {/* Alignment */}
      <TB title="Align Left" active={editor.isActive({textAlign:'left'})} onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft size={14} /></TB>
      <TB title="Align Center" active={editor.isActive({textAlign:'center'})} onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter size={14} /></TB>
      <TB title="Align Right" active={editor.isActive({textAlign:'right'})} onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight size={14} /></TB>
      <TB title="Justify" active={editor.isActive({textAlign:'justify'})} onClick={() => editor.chain().focus().setTextAlign('justify').run()}><AlignJustify size={14} /></TB>
      <div className="w-px h-5 bg-slate-200 mx-1" />

      {/* Insert */}
      <TB title="Insert Table" onClick={insertTable}><TableIcon size={14} /></TB>
      <TB title="Insert Image" onClick={insertImage}><ImageIcon size={14} /></TB>
      <div className="relative">
        <TB title="Insert Link" onClick={() => setShowLinkModal(p => !p)}><LinkIcon size={14} /></TB>
        {showLinkModal && (
          <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 z-50 flex gap-2 min-w-[260px]">
            <input className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none" placeholder="https://..." value={linkUrl} onChange={e => setLinkUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && setLink()} autoFocus />
            <button onClick={setLink} className="bg-slate-900 text-white text-xs px-3 rounded-lg font-bold hover:bg-slate-700">Add</button>
          </div>
        )}
      </div>
      <div className="w-px h-5 bg-slate-200 mx-1" />

      {/* Export */}
      <button onClick={onExport} title="Export as HTML" className="flex items-center gap-1 text-[10px] font-black text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-all uppercase tracking-wider">
        <Download size={12} /> Export
      </button>
    </div>
  );
};

// ─────────────────────────────────────────
// COLLABORATIVE DOCUMENT EDITOR
// ─────────────────────────────────────────
const CollaborativeDoc = ({ ydoc, awareness, isLocked, onStatsUpdate, userName, userColor, currentDoc, addToast, onInsertTranscript }) => {
  const editorRef = useRef(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const EXTENSIONS = useMemo(() => [
    StarterKit.configure({ history: false }),
    Collaboration.configure({ document: ydoc }),
    CollaborationCursor.configure({ provider: { awareness }, user: { name: userName, color: userColor } }),
    Underline,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle,
    Color,
    FontFamily,
    Highlight.configure({ multicolor: true }),
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    ImageExt.configure({ allowBase64: true }),
    Link.configure({ openOnClick: false }),
    CodeBlock,
  ], [ydoc, awareness, userName, userColor]);

  const editor = useEditor({
    extensions: EXTENSIONS,
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[calc(100vh-240px)] px-16 py-12 text-slate-900 font-sans',
        style: 'font-size: 14px; line-height: 1.8;'
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const words = text.split(/\s+/).filter(Boolean).length;
      setWordCount(words);
      setCharCount(text.length);
      onStatsUpdate?.({ words, readTime: Math.max(1, Math.round(words / 200)) });
    },
    editable: !isLocked,
  }, [EXTENSIONS, isLocked]);

  useEffect(() => { editorRef.current = editor; }, [editor]);

  // Allow parent to insert transcript
  useEffect(() => {
    if (onInsertTranscript && editor) {
      onInsertTranscript.current = (html) => {
        editor.chain().focus().insertContent(html).run();
      };
    }
  }, [editor, onInsertTranscript]);

  const handleExport = () => {
    if (!editor) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${currentDoc?.name || 'Document'}</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.8;color:#1a202c;}</style></head><body>${editor.getHTML()}</body></html>`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    a.download = `${currentDoc?.name || 'document'}.html`;
    a.click();
    addToast('Document exported!', 'success');
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <DocumentToolbar editor={editor} onExport={handleExport} />
      <div className="flex-1 overflow-y-auto bg-slate-200/50 scrollbar-hide">
        {/* A4 Page */}
        <div className="max-w-[816px] mx-auto my-8 bg-white shadow-2xl shadow-slate-400/30 rounded-sm ring-1 ring-slate-300/50 min-h-[1056px]">
          <EditorContent editor={editor} className="min-h-[1056px]" />
        </div>
      </div>
      {/* Status Bar */}
      <div className="h-7 bg-slate-800 border-t border-slate-700 flex items-center px-4 gap-6 shrink-0">
        <span className="text-[10px] text-slate-400 font-mono">{wordCount} words</span>
        <span className="text-[10px] text-slate-400 font-mono">{charCount} chars</span>
        <span className="text-[10px] text-slate-400 font-mono">~{Math.max(1, Math.round(wordCount / 200))} min read</span>
        {isLocked && <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1"><Lock size={10} /> READ ONLY</span>}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────
// CREATE DOC MODAL
// ─────────────────────────────────────────
const CreateDocModal = ({ onClose, onCreate, departments }) => {
  const [name, setName] = useState('');
  const [dept, setDept] = useState(departments[0] || 'Operations');
  const [type, setType] = useState('doc');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const ext = type === 'sheet' ? '.xlsx' : '.docx';
    onCreate({ name: name.trim().includes('.') ? name.trim() : `${name.trim()}${ext}`, dept, type });
    onClose();
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-900">New Canvas</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[{v:'doc',label:'Document',icon:'📄'},{v:'sheet',label:'Spreadsheet',icon:'📊'}].map(t => (
              <button key={t.v} type="button" onClick={() => setType(t.v)} className={`p-4 rounded-2xl border-2 font-bold text-sm flex flex-col items-center gap-2 transition-all ${type === t.v ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                <span className="text-2xl">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="File name..." className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm font-bold focus:ring-4 ring-emerald-500/10 outline-none transition-all" required autoFocus />
          <select value={dept} onChange={e => setDept(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-sm font-bold outline-none cursor-pointer">
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>
          <button type="submit" disabled={!name.trim()} className="w-full py-4 rounded-2xl font-black text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-all shadow-xl shadow-emerald-500/20">
            Create & Open
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ─────────────────────────────────────────
// MAIN WORKSPACE
// ─────────────────────────────────────────
const CollaborationWorkspace = () => {
  const {
    documents, groups, systemUsers, activeDocId, setActiveDocId,
    addDocument, updateDocumentContent, createGroup, updateGroupMembers,
    currentUser, departments, recordDocRead
  } = useApp();

  const userName = currentUser?.name || 'Enterprise User';
  const userColor = useMemo(() => getUserColor(userName), [userName]);

  // Mode: 'doc' | 'sheet' | 'meet'
  const [mode, setMode] = useState('doc');
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [rightTab, setRightTab] = useState('chat'); // chat | comments | transcribe | ai
  const [isLocked, setIsLocked] = useState(false);
  const [isViewingOriginal, setIsViewingOriginal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [connStatus, setConnStatus] = useState('connecting');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [commentMessages, setCommentMessages] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [stats, setStats] = useState({ words: 0, readTime: 0 });
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [showCreateDocModal, setShowCreateDocModal] = useState(false);
  const [ydoc, setYdoc] = useState(null);
  const [awareness, setAwareness] = useState(null);
  const [syncedDocId, setSyncedDocId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const insertTranscriptRef = useRef(null);
  const channelRef = useRef(null);

  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(curr => curr.filter(t => t.id !== id)), 4000);
  }, []);

  const currentDoc = useMemo(() => {
    if (activeDocId === 'scratch-global') return { id: 'scratch-global', name: 'Global Scratchpad', content: '<p>Welcome to the global team scratchpad.</p>' };
    return documents.find(d => d.id?.toString() === activeDocId?.toString());
  }, [documents, activeDocId]);

  const filteredDocs = useMemo(() => {
    const base = activeGroupId ? documents.filter(d => d.groupId === activeGroupId) : documents;
    if (!searchQuery) return base;
    return base.filter(d => d.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [documents, activeGroupId, searchQuery]);

  const roomId = currentDoc?.id ? `pf-room-${currentDoc.id}` : 'pf-room-global';

  // SYNC ENGINE
  useEffect(() => {
    let doc, persistence, awr, channel;
    const init = async () => {
      try {
        setConnStatus('connecting');
        if (currentDoc?.id) recordDocRead?.(currentDoc.id, currentDoc.name);
        if (!supabase) { setConnStatus('offline'); addToast('Real-time sync unavailable (no database)', 'error'); return; }

        doc = new Y.Doc();
        persistence = new IndexeddbPersistence(roomId, doc);
        awr = new awarenessProtocol.Awareness(doc);
        awr.setLocalStateField('user', { name: userName, color: userColor });

        channel = supabase.channel(roomId, { config: { broadcast: { self: false, ack: true } } });
        channelRef.current = channel;

        channel.on('broadcast', { event: 'y-update' }, ({ payload }) => payload.update && Y.applyUpdate(doc, fromB64(payload.update), 'remote'));
        channel.on('broadcast', { event: 'y-awareness' }, ({ payload }) => payload.update && awarenessProtocol.applyAwarenessUpdate(awr, fromB64(payload.update), 'remote'));
        channel.on('broadcast', { event: 'y-sync-step-1' }, ({ payload }) => {
          if (payload.stateVector) {
            const update = Y.encodeStateAsUpdate(doc, fromB64(payload.stateVector));
            const b64 = toB64(update);
            if (b64.length < 24000) channel.send({ type: 'broadcast', event: 'y-sync-step-2', payload: { update: b64 } });
          }
        });
        channel.on('broadcast', { event: 'y-sync-step-2' }, ({ payload }) => payload.update && Y.applyUpdate(doc, fromB64(payload.update), 'remote'));

        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnStatus('connected');
            channel.send({ type: 'broadcast', event: 'y-sync-step-1', payload: { stateVector: toB64(Y.encodeStateVector(doc)) } });
            const awrUpdate = awarenessProtocol.encodeAwarenessUpdate(awr, [awr.clientID]);
            channel.send({ type: 'broadcast', event: 'y-awareness', payload: { update: toB64(awrUpdate) } });
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setConnStatus('error');
          }
        });

        const yChat = doc.getArray('chat');
        const yComments = doc.getArray('comments');
        setChatMessages([...yChat.toArray()]);
        setCommentMessages([...yComments.toArray()]);
        yChat.observe(() => setChatMessages([...yChat.toArray()]));
        yComments.observe(() => setCommentMessages([...yComments.toArray()]));

        doc.on('update', (update, origin) => {
          if (origin !== 'remote' && origin !== 'indexeddb') {
            const b64 = toB64(update);
            if (b64.length < 24000) channel.send({ type: 'broadcast', event: 'y-update', payload: { update: b64 } });
          }
        });
        awr.on('update', () => {
          const update = awarenessProtocol.encodeAwarenessUpdate(awr, [awr.clientID]);
          channelRef.current?.send({ type: 'broadcast', event: 'y-awareness', payload: { update: toB64(update) } });
          const states = Array.from(awr.getStates().entries());
          setOnlineUsers(states.filter(([, s]) => s.user).map(([id, s]) => ({ ...s.user, id })));
        });

        setYdoc(doc);
        setAwareness(awr);
        setSyncedDocId(currentDoc?.id || 'global');
      } catch (err) {
        console.error('[Sync] Init failed:', err);
        setConnStatus('error');
      }
    };
    init();
    return () => {
      channel?.unsubscribe();
      persistence?.destroy();
      awr?.destroy();
      doc?.destroy();
      setYdoc(null);
      setAwareness(null);
      setSyncedDocId(null);
    };
  }, [currentDoc?.id, userName, userColor]);

  // AUTO-SAVE
  useEffect(() => {
    if (!ydoc || !currentDoc?.id || currentDoc.id === 'scratch-global') return;
    const iv = setInterval(async () => {
      const state = Y.encodeStateAsUpdate(ydoc);
      await updateDocumentContent?.(currentDoc.id, toB64(state));
    }, 60000);
    return () => clearInterval(iv);
  }, [ydoc, currentDoc?.id]);

  const handleSave = async () => {
    if (!ydoc || !currentDoc?.id) return;
    await updateDocumentContent?.(currentDoc.id, toB64(Y.encodeStateAsUpdate(ydoc)));
    addToast('Document saved to cloud vault', 'success');
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = { user: userName, message: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), color: userColor, id: Date.now() };
    if (ydoc) { ydoc.getArray('chat').push([msg]); }
    else setChatMessages(p => [...p, msg]);
    setChatInput('');
  };

  const handleSendComment = (e) => {
    e?.preventDefault();
    if (!commentInput.trim()) return;
    const msg = { user: userName, message: commentInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), color: userColor, id: Date.now() };
    if (ydoc) ydoc.getArray('comments').push([msg]);
    setCommentInput('');
    addToast('Comment added');
  };

  const handleCreateCanvas = (details) => {
    const id = Date.now().toString();
    addDocument({ id, name: details.name, dept: details.dept, content: `<h1>${details.name.replace(/\.[^/.]+$/, '')}</h1><p>Start typing here...</p>`, groupId: activeGroupId });
    setActiveDocId(id);
    setMode(details.type === 'sheet' ? 'sheet' : 'doc');
    addToast(`Created: ${details.name}`, 'success');
  };

  const connColor = { connected: '#10B981', error: '#EF4444', offline: '#F59E0B', connecting: '#F59E0B' };

  return (
    <div className="collab-workspace-container h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
      {/* TOASTS */}
      <AnimatePresence>
        {toasts.map(t => <Toast key={t.id} message={t.msg} type={t.type} onRemove={() => setToasts(curr => curr.filter(x => x.id !== t.id))} />)}
      </AnimatePresence>

      {/* MODALS */}
      <AnimatePresence>
        {showCreateDocModal && <CreateDocModal onClose={() => setShowCreateDocModal(false)} onCreate={handleCreateCanvas} departments={departments?.map(d => d.name || d) || ['General']} />}
      </AnimatePresence>

      {/* ── TOP HEADER ── */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40 shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowLeftPanel(p => !p)} className={`p-1.5 rounded-lg transition-all ${showLeftPanel ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}><Sidebar size={18} /></button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{currentDoc ? currentDoc.name : 'Collaboration Hub'}</span>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: connColor[connStatus] || '#F59E0B' }} title={`Sync: ${connStatus}`} />
            </div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{connStatus === 'connected' ? 'Synced' : connStatus === 'error' ? 'Sync Error' : 'Connecting...'}</span>
          </div>
        </div>

        {/* MODE TABS */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[{v:'doc',label:'Document',icon:<FileText size={14}/>},{v:'sheet',label:'Spreadsheet',icon:<FileSpreadsheet size={14}/>},{v:'meet',label:'Video Meet',icon:<Video size={14}/>}].map(tab => (
            <button key={tab.v} onClick={() => setMode(tab.v)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${mode === tab.v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab.icon} <span className="hidden sm:block">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Online avatars */}
          <div className="flex -space-x-1.5">
            {[{name: userName, color: userColor}, ...onlineUsers.filter(u => u.name !== userName)].slice(0,5).map((u, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black text-white shadow-sm" style={{ background: u.color }} title={u.name}>{u.name[0]}</div>
            ))}
            <button onClick={() => setShowCreateDocModal(true)} className="w-7 h-7 rounded-full border-2 border-dashed border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:border-emerald-500 hover:text-emerald-500 transition-all" title="New Canvas"><Plus size={12} /></button>
          </div>

          {mode === 'doc' && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setIsLocked(p => !p)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${isLocked ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-white'}`}>
                {isLocked ? <Lock size={12} /> : <Unlock size={12} />} {isLocked ? 'Locked' : 'Unlocked'}
              </button>
              <button onClick={handleSave} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/20">
                <Save size={12} /> Save
              </button>
            </div>
          )}

          <button onClick={() => setShowRightPanel(p => !p)} className={`p-1.5 rounded-lg transition-all ${showRightPanel ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}><MessageCircle size={18} /></button>
          <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-[10px] font-black shadow-sm" style={{background: userColor}}>{userName[0]}</div>
        </div>
      </header>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT PANEL — File Explorer */}
        <AnimatePresence initial={false}>
          {showLeftPanel && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 260, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="bg-white border-r border-slate-200 flex flex-col overflow-hidden shrink-0">
              <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-hide">
                {/* Search */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="w-full pl-8 pr-3 py-2 text-[11px] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-300 transition-colors" placeholder="Search files..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>

                {/* Workspaces */}
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Workspaces</p>
                  <div className="space-y-0.5">
                    <button onClick={() => setActiveGroupId(null)} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[11px] font-bold transition-all ${!activeGroupId ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                      <Hash size={14} /> Global Mesh
                    </button>
                    {(groups || []).map(g => (
                      <button key={g.id} onClick={() => setActiveGroupId(g.id)} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[11px] font-bold transition-all ${activeGroupId === g.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <Users size={14} /> <span className="truncate">{g.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Files */}
                <div>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Files</p>
                    <button onClick={() => setShowCreateDocModal(true)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors"><Plus size={12} /></button>
                  </div>
                  <div className="space-y-0.5">
                    <button onClick={() => { setActiveDocId('scratch-global'); setMode('doc'); }} className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-[11px] font-bold transition-all ${activeDocId === 'scratch-global' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                      <Sparkles size={14} className={activeDocId === 'scratch-global' ? 'text-emerald-400' : 'text-slate-400'} />
                      <span className="truncate">Global Scratchpad</span>
                    </button>
                    {filteredDocs.map(doc => (
                      <button key={doc.id} onClick={() => { setActiveDocId(doc.id); setMode('doc'); setIsViewingOriginal(false); }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-[11px] font-bold transition-all group ${activeDocId?.toString() === doc.id?.toString() ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                        {doc.name?.match(/\.(xlsx?|csv)$/i) ? <FileSpreadsheet size={14} className={activeDocId?.toString() === doc.id?.toString() ? 'text-emerald-400' : 'text-slate-400'} /> : <FileText size={14} className={activeDocId?.toString() === doc.id?.toString() ? 'text-emerald-400' : 'text-slate-400'} />}
                        <span className="truncate flex-1 text-left">{doc.name}</span>
                        {activeDocId?.toString() === doc.id?.toString() && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />}
                      </button>
                    ))}
                    {filteredDocs.length === 0 && (
                      <div className="text-center py-6 text-slate-400">
                        <Layers size={24} className="mx-auto mb-2 opacity-30" />
                        <p className="text-[10px] font-bold">No files yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Left panel footer */}
              <div className="p-3 border-t border-slate-100">
                <button onClick={() => setShowCreateDocModal(true)} className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                  <Plus size={13} /> New Canvas
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* CENTER — Active Mode */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {mode === 'doc' && (
            currentDoc ? (
              (ydoc && awareness && syncedDocId === (currentDoc?.id || 'global')) ? (
                <CollaborativeDoc
                  ydoc={ydoc}
                  awareness={awareness}
                  isLocked={isLocked}
                  onStatsUpdate={setStats}
                  userName={userName}
                  userColor={userColor}
                  currentDoc={currentDoc}
                  addToast={addToast}
                  onInsertTranscript={insertTranscriptRef}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 gap-4">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-slate-300 animate-pulse"><Database size={32} /></div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Establishing sync node...</p>
                </div>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-100">
                <div className="w-32 h-32 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center text-slate-200 mb-10"><Layers size={64} /></div>
                <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Enterprise Collaboration Hub</h2>
                <p className="text-slate-500 max-w-sm mb-10 text-sm leading-relaxed">Select a document, open a spreadsheet, or start a video meeting with your team.</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button onClick={() => { setActiveDocId('scratch-global'); setMode('doc'); }} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-xl shadow-emerald-600/20 hover:-translate-y-1 transition-all flex items-center gap-2"><Sparkles size={16}/> Global Scratchpad</button>
                  <button onClick={() => setShowCreateDocModal(true)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2"><Plus size={16}/> New Canvas</button>
                  <button onClick={() => setMode('meet')} className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-xl shadow-blue-600/20 hover:-translate-y-1 transition-all flex items-center gap-2"><Video size={16}/> Start Meeting</button>
                </div>
              </div>
            )
          )}

          {mode === 'sheet' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="h-10 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0">
                <FileSpreadsheet size={16} className="text-emerald-600" />
                <span className="text-sm font-bold text-slate-800">{currentDoc?.name || 'Untitled Spreadsheet'}</span>
                <span className="text-[10px] text-slate-400 font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Live Sync</span>
              </div>
              <Spreadsheet docId={currentDoc?.id || 'global'} />
            </div>
          )}

          {mode === 'meet' && (
            <VideoMeet roomId={roomId} userName={userName} userColor={userColor} addToast={addToast} />
          )}
        </main>

        {/* RIGHT PANEL — Chat / Comments / Transcribe / AI */}
        <AnimatePresence initial={false}>
          {showRightPanel && mode !== 'meet' && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="bg-white border-l border-slate-200 flex flex-col overflow-hidden shrink-0">

              {/* Right Panel Tabs */}
              <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
                {[{v:'chat',label:'Chat',icon:<MessageCircle size={12}/>},{v:'comments',label:'Notes',icon:<MessageSquareQuote size={12}/>},{v:'transcribe',label:'Transcribe',icon:<Mic size={12}/>}].map(tab => (
                  <button key={tab.v} onClick={() => setRightTab(tab.v)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 ${rightTab === tab.v ? 'border-emerald-500 text-emerald-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Chat */}
              {rightTab === 'chat' && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                    {chatMessages.length === 0 && (
                      <div className="text-center py-10 opacity-30">
                        <MessageCircle size={32} className="mx-auto mb-2" />
                        <p className="text-[10px] font-bold uppercase">No messages yet</p>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={msg.id || i} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full text-white text-[8px] font-black flex items-center justify-center shrink-0" style={{background: msg.color}}>{msg.user[0]}</div>
                          <span className="text-[10px] font-bold" style={{color: msg.color}}>{msg.user}</span>
                          <span className="text-[9px] text-slate-400">{msg.time}</span>
                        </div>
                        <div className="ml-7 bg-slate-50 rounded-2xl rounded-tl-sm px-3 py-2">
                          <p className="text-[12px] text-slate-800 leading-relaxed">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendChat} className="p-3 border-t border-slate-100 flex gap-2">
                    <input className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-slate-300 transition-colors" placeholder="Message team..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                    <button type="submit" className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center hover:bg-slate-700 transition-colors"><Send size={13} className="text-white" /></button>
                  </form>
                </div>
              )}

              {/* Comments */}
              {rightTab === 'comments' && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                    {commentMessages.length === 0 && (
                      <div className="text-center py-10 opacity-30">
                        <MessageSquareQuote size={32} className="mx-auto mb-2" />
                        <p className="text-[10px] font-bold uppercase">No annotations yet</p>
                      </div>
                    )}
                    {commentMessages.map((c, i) => (
                      <div key={c.id || i} className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold" style={{color: c.color || '#D97706'}}>{c.user}</span>
                          <span className="text-[9px] text-slate-400">{c.time}</span>
                        </div>
                        <p className="text-[12px] text-slate-800 leading-relaxed">{c.message}</p>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendComment} className="p-3 border-t border-slate-100 flex gap-2">
                    <input className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[12px] outline-none focus:border-slate-300 transition-colors" placeholder="Add annotation..." value={commentInput} onChange={e => setCommentInput(e.target.value)} />
                    <button type="submit" className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center hover:bg-amber-600 transition-colors"><Send size={13} className="text-white" /></button>
                  </form>
                </div>
              )}

              {/* Transcription */}
              {rightTab === 'transcribe' && (
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  <TranscriptionPanel
                    onInsertText={(html) => insertTranscriptRef.current?.(html)}
                    addToast={addToast}
                  />
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CollaborationWorkspace;
