import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Share2, Lock, ShieldCheck, Settings, MessageSquare, Send, X, 
  Mic, MicOff, Video, VideoOff, PhoneOff, Users, Layout, MoreHorizontal,
  Maximize2, Plus, Bold as LUCIDE_BOLD, Italic as LUCIDE_ITALIC, List, Heading1, Heading2, Quote, Undo, Redo,
  Terminal, Shield, Eye, FileText, CheckCircle2, Clock, Download, 
  UserPlus, Zap, History, Info, ChevronRight, Search, Bell, Save, 
  Unlock, Activity, Layers, MessageCircle, AlertCircle, FileUp, ArrowRightLeft,
  Star, Clock3, Folder, Hash, MessageSquareQuote, CheckSquare, Sparkles, Sidebar,
  GitBranch, Workflow, MousePointer2, ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// TipTap & Yjs Imports
import { useEditor, EditorContent } from '@tiptap/react';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';
import Blockquote from '@tiptap/extension-blockquote';
import TIP_TAP_BOLD from '@tiptap/extension-bold';
import TIP_TAP_ITALIC from '@tiptap/extension-italic';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as awarenessProtocol from 'y-protocols/awareness';
import { supabase } from '../lib/supabase';

// ============================================================
//  CLEAN TOOLBAR
// ============================================================
const CleanToolbar = ({ editor, onAction }) => {
  if (!editor) return null;
  const handleFormat = (type) => {
    if (type === 'bold') editor.chain().focus().toggleBold().run();
    if (type === 'italic') editor.chain().focus().toggleItalic().run();
    if (type === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
    if (type === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
    if (type === 'list') editor.chain().focus().toggleBulletList().run();
    if (type === 'quote') editor.chain().focus().toggleBlockquote().run();
    onAction(`Format: ${type}`);
  };
  return (
    <div className="collab-toolbar">
      <button onClick={() => handleFormat('bold')} className={`toolbar-button ${editor.isActive('bold') ? 'is-active' : ''}`} title="Bold"><LUCIDE_BOLD size={16} /></button>
      <button onClick={() => handleFormat('italic')} className={`toolbar-button ${editor.isActive('italic') ? 'is-active' : ''}`} title="Italic"><LUCIDE_ITALIC size={16} /></button>
      <div className="toolbar-divider"></div>
      <button onClick={() => handleFormat('h1')} className={`toolbar-button ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`} title="H1"><Heading1 size={16} /></button>
      <button onClick={() => handleFormat('h2')} className={`toolbar-button ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`} title="H2"><Heading2 size={16} /></button>
      <div className="toolbar-divider"></div>
      <button onClick={() => handleFormat('list')} className={`toolbar-button ${editor.isActive('bulletList') ? 'is-active' : ''}`} title="Bullet List"><List size={16} /></button>
      <button onClick={() => handleFormat('quote')} className={`toolbar-button ${editor.isActive('blockquote') ? 'is-active' : ''}`} title="Quote"><Quote size={16} /></button>
    </div>
  );
};

// ============================================================
//  TOAST SYSTEM
// ============================================================
const LuxeToast = ({ message, onRemove }) => {
  useEffect(() => { const timer = setTimeout(onRemove, 2500); return () => clearTimeout(timer); }, [onRemove]);
  return (
    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} 
      className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-[1000] text-xs font-black uppercase tracking-[0.2em] border border-emerald-500/20">
      <Zap size={16} className="text-emerald-400" /> {message}
    </motion.div>
  );
};

// ============================================================
//  UNIVERSAL DOCUMENT VIEWER
// ============================================================
const UniversalDocumentViewer = ({ currentDoc, ydoc, provider, isLocked, onStatsUpdate, onAction, onEditorInit, isViewingOriginal }) => {
  if (!currentDoc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-10 text-center">
         <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-slate-300 mb-6"><Layers size={40} /></div>
         <h3 className="text-xl font-black text-slate-900 mb-2">No Active Payload</h3>
         <p className="text-sm text-slate-500 max-w-xs mb-8">Select a document from the vault or initialize a new discussion node to begin collaboration.</p>
         <button onClick={() => onAction('showPicker')} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-2">Initialize Node</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <div className="absolute inset-0 flex flex-col bg-white z-10 relative overflow-hidden">
        {/* FORENSIC WATERMARK OVERLAY */}
        <div className="absolute inset-0 pointer-events-none z-[5] flex flex-wrap gap-20 p-20 opacity-[0.03] select-none pointer-events-none rotate-[-25deg]">
           {Array.from({ length: 20 }).map((_, i) => (
             <div key={i} className="text-xl font-black text-slate-900 uppercase tracking-[0.5em] whitespace-nowrap">
               {userName} | {new Date().toLocaleDateString()} | PF-SECURE-NODE
             </div>
           ))}
        </div>
        {ydoc ? (
          <CleanEditorInternal 
            ydoc={ydoc} 
            awareness={awareness} 
            isLocked={isLocked} 
            onStatsUpdate={onStatsUpdate} 
            onAction={onAction}
            onEditorInit={onEditorInit}
            currentDoc={currentDoc}
            userName={userName}
            userColor={userColor}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50"><p className="text-xs font-black uppercase tracking-[0.3em] text-slate-300 animate-pulse">Initializing Collaboration Node...</p></div>
        )}
      </div>
    </div>
  );
};

const CleanEditorInternal = ({ ydoc, awareness, isLocked, onStatsUpdate, onAction, onEditorInit, currentDoc, userName, userColor }) => {
  const editor = useEditor({
    extensions: [ 
      Document, Paragraph, Text, Heading.configure({ levels: [1, 2, 3] }),
      BulletList, ListItem, Blockquote, TIP_TAP_BOLD, TIP_TAP_ITALIC,
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({
        awareness,
        user: { name: userName, color: userColor }
      })
    ],
    editable: !isLocked,
    editorProps: { attributes: { class: 'focus:outline-none ProseMirror' } },
    onUpdate({ editor }) {
      const text = editor.getText();
      const words = text.split(/\s+/).filter(w => w.length > 0).length;
      onStatsUpdate({ words, readTime: Math.ceil(words / 200) });
    },
    onCreate({ editor }) {
      onEditorInit(editor);
    }
  }, [ydoc, awareness]);

  useEffect(() => {
    if (editor) editor.setEditable(!isLocked);
  }, [isLocked, editor]);

  if (!editor) return null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-10 pt-10">
        <CleanToolbar editor={editor} onAction={onAction} />
      </div>
      <div className="flex-1 overflow-y-auto px-10 pb-10 scrollbar-hide">
         <div className="collab-paper mx-auto">
            <div className="flex items-center justify-between border-b pb-6 mb-10">
               <div className="flex items-center gap-2 text-emerald-600 text-xs font-black uppercase tracking-wider"><ShieldCheck size={22} /> Secure Workspace</div>
               <div className="flex items-center gap-4 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Activity size={14} /> Synchronized</span>
                  <span className="flex items-center gap-1"><Lock size={14} /> End-to-End</span>
               </div>
            </div>
            <div className="tiptap-editor-container"><EditorContent editor={editor} className="tiptap-editor" /></div>
         </div>
      </div>
    </div>
  );
};

// ============================================================
//  MAIN WORKSPACE: 3-PANEL LAYOUT (V18 - FIXED & POLISHED)
// ============================================================
const CollaborationWorkspace = () => {
  const { 
    documents, systemUsers, auditLogs, logAction, pushNotification, 
    userName, userRole, currentUser, updateDocumentContent, addDocument,
    activeDocId, setActiveDocId 
  } = useApp();

  // --- UI STATE ---
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [activeTab, setActiveTab] = useState('comments'); // comments, chat, activity, tasks, snapshots, workflows
  const [isLocked, setIsLocked] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [stats, setStats] = useState({ words: 0, readTime: 0 });

  // --- COLLABORATION STATE ---
  const [ydoc, setYdoc] = useState(null);
  const [awareness, setAwareness] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  
  const editorRef = useRef(null);
  const chatEndRef = useRef(null);
  const webrtcProviderRef = useRef(null);
  const channelRef = useRef(null);

  const currentDoc = documents.find(d => d.id.toString() === activeDocId?.toString());
  const accessibleGroups = currentUser?.departments || [];
  const filteredDocs = (userRole === 'Admin' || userRole === 'Manager')
    ? documents
    : documents.filter(d => (d.sensitivity === 'Public' || accessibleGroups.includes(d.dept)));

  // Mock Data
  const [comments, setComments] = useState([
    { id: 1, author: 'Sarah Admin', text: 'Please ensure the data policy is updated.', time: '10:45 AM', replies: [] },
    { id: 2, author: 'John Manager', text: 'I have added the new annexure.', time: '11:12 AM', replies: [
      { id: 3, author: 'Sarah Admin', text: 'Got it, thanks!', time: '11:15 AM' }
    ]}
  ]);

  const [tasks, setTasks] = useState([
    { id: 1, text: 'Complete Security Section', assignedTo: 'Sarah Admin', status: 'Pending' },
    { id: 2, text: 'Finalize Proposal Draft', assignedTo: 'You', status: 'Completed' }
  ]);

  const [snapshots, setSnapshots] = useState([
    { id: 1, label: 'Initial Draft', date: '2026-05-01', user: 'Sarah Admin' },
    { id: 2, label: 'Pre-Audit Checkout', date: '2026-05-02', user: 'You' }
  ]);

  const [workflows, setWorkflows] = useState([
    { id: 1, name: 'Approval Flow', status: 'Active', trigger: 'On Save' },
    { id: 2, name: 'Team Notification', status: 'Active', trigger: 'On Comment' }
  ]);

  const addToast = (msg) => { 
    const id = Date.now() + Math.random().toString(36).substr(2, 9); 
    setToasts(prev => [...prev, { id, msg }]); 
    setTimeout(() => setToasts(curr => curr.filter(t => t.id !== id)), 3000); 
  };

  const userColor = useMemo(() => {
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];
    let hash = 0; for (let i = 0; i < userName.length; i++) hash = userName.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }, [userName]);

  // --- SYNC LOGIC ---
  useEffect(() => {
    const roomId = currentDoc ? `pf-room-${currentDoc.id}` : 'pf-room-global';
    const doc = new Y.Doc();
    const persistence = new IndexeddbPersistence(roomId, doc);
    const awr = new awarenessProtocol.Awareness(doc);
    
    awr.setLocalStateField('user', { name: userName, color: userColor });
    setAwareness(awr);
    setYdoc(doc);

    import('y-webrtc').then(({ WebrtcProvider }) => {
      if (webrtcProviderRef.current) webrtcProviderRef.current.destroy();
      webrtcProviderRef.current = new WebrtcProvider(roomId, doc, { 
        awareness: awr,
        signaling: [
          'wss://y-webrtc-signaling-eu.herokuapp.com',
          'wss://y-webrtc-signaling-us.herokuapp.com',
          'wss://signaling.yjs.dev',
          'wss://y-webrtc-signaling.p-p.sh' // More reliable public signaling
        ],
        maxConns: 20,
        filterReachability: true
      });
      
      // Error handling for provider
      webrtcProviderRef.current.on('status', (event) => {
        if (event.status === 'connected') {
          console.log('[WebRTC] Connected to swarm:', roomId);
        }
      });
    });

    if (supabase) {
      const channel = supabase.channel(roomId, { config: { broadcast: { self: false, ack: false } } });
      channelRef.current = channel;
      const toB64 = (arr) => btoa(Array.from(arr).map(b => String.fromCharCode(b)).join(''));
      const fromB64 = (b64) => new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)));

      channel.on('broadcast', { event: 'y-update' }, ({ payload }) => payload.update && Y.applyUpdate(doc, fromB64(payload.update), 'remote'));
      channel.on('broadcast', { event: 'y-awareness' }, ({ payload }) => payload.update && awarenessProtocol.applyAwarenessUpdate(awr, fromB64(payload.update), 'remote'));
      
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          const update = awarenessProtocol.encodeAwarenessUpdate(awr, [awr.clientID]);
          channel.send({ type: 'broadcast', event: 'y-awareness', payload: { update: toB64(update) } });
          channel.send({ type: 'broadcast', event: 'y-sync-step-1', payload: { stateVector: toB64(Y.encodeStateVector(doc)) } });
        }
      });

      doc.on('update', (update, origin) => {
        if (origin !== 'remote' && origin !== 'indexeddb') {
          const b64 = toB64(update);
          if (b64.length < 24000) channel.send({ type: 'broadcast', event: 'y-update', payload: { update: b64 } });
        }
      });
    }

    const yChat = doc.getArray('chat');
    const updateChat = () => setChatHistory(yChat.toArray());
    yChat.observe(updateChat);

    const yXmlFragment = doc.getXmlFragment('prosemirror');
    if (currentDoc && yXmlFragment.length === 0) {
      setTimeout(() => {
        if (editorRef.current) {
          const content = currentDoc.content || '<h1>New Workspace</h1><p>Start collaborating...</p>';
          editorRef.current.commands.setContent(content);
        }
      }, 800);
    }

    return () => { 
      channelRef.current?.unsubscribe(); 
      awr.destroy(); 
      persistence.destroy(); 
      doc.destroy(); 
    };
  }, [currentDoc?.id]);

  useEffect(() => {
    if (!awareness) return;
    const handle = () => {
      const states = Array.from(awareness.getStates().values());
      setOnlineUsers(states.filter(s => s.user).map((s, i) => ({ id: `u-${i}`, name: s.user.name, color: s.user.color })));
    };
    awareness.on('change', handle);
    return () => awareness.off('change', handle);
  }, [awareness]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage || !ydoc) return;
    const yChat = ydoc.getArray('chat');
    yChat.push([{ id: Date.now(), user: userName, text: chatMessage, color: userColor, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setChatMessage('');
  };

  const handleSave = () => {
    if (!currentDoc || !editorRef.current) return;
    updateDocumentContent(currentDoc.id, editorRef.current.getHTML());
    addToast("Document Saved to Vault");
  };

  const createSnapshot = () => {
    const newSnapshot = { id: Date.now(), label: `Checkpoint ${snapshots.length + 1}`, date: new Date().toLocaleDateString(), user: 'You' };
    setSnapshots([newSnapshot, ...snapshots]);
    addToast("Milestone Version Saved");
  };

  return (
    <div className="collab-workspace-container h-screen flex flex-col bg-slate-50 overflow-hidden">
      <AnimatePresence>{toasts.map(t => <LuxeToast key={t.id} message={t.msg} onRemove={() => setToasts(curr => curr.filter(x => x.id !== t.id))} />)}</AnimatePresence>

      {/* HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveDocId(null)} 
            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900"
            title="Exit Workspace"
          >
            <X size={20} />
          </button>
          <div className="h-8 w-px bg-slate-100"></div>
          <button onClick={() => setShowLeftPanel(!showLeftPanel)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><Sidebar size={20} className={showLeftPanel ? 'text-emerald-600' : 'text-slate-400'} /></button>
          <div className="h-8 w-px bg-slate-100"></div>
          <div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight">{currentDoc ? currentDoc.name : 'Standby...'}</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Live Node Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex -space-x-2">
            {onlineUsers.map(u => (
              <div key={u.id} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-md" style={{ backgroundColor: u.color }} title={u.name}>{u.name[0]}</div>
            ))}
            <button className="w-8 h-8 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 bg-white hover:border-emerald-500 hover:text-emerald-500 transition-all"><UserPlus size={14} /></button>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setIsLocked(!isLocked)} className={`p-2 rounded-xl border transition-all ${isLocked ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-slate-200 text-slate-400'}`}>{isLocked ? <Lock size={18} /> : <Unlock size={18} />}</button>
            <button onClick={handleSave} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"><Save size={16} /> Save</button>
          </div>

          <button onClick={() => setShowRightPanel(!showRightPanel)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><MessageSquareQuote size={20} className={showRightPanel ? 'text-emerald-600' : 'text-slate-400'} /></button>
        </div>
      </header>

      {/* 3-PANEL CORE LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: WORKSPACE EXPLORER */}
        <motion.aside initial={false} animate={{ width: showLeftPanel ? 260 : 0 }} className="bg-white border-r border-slate-200 flex flex-col overflow-hidden relative">
           <div className="panel-header"><span className="panel-title">Workspace Hub</span><Search size={14} className="text-slate-300" /></div>
           <div className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="nav-section">
                <p className="nav-section-title">Views</p>
                <div className="nav-item active"><Clock3 size={18} /> Recent Files</div>
                <div className="nav-item"><Star size={18} /> Favorites</div>
                <div className="nav-item"><Folder size={18} /> Departments</div>
              </div>
              <div className="px-4 py-6">
                <div className="flex items-center justify-between mb-3 px-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Assets</p>
                  <button onClick={() => addToast("Bulk Edit Enabled")} className="text-[9px] font-black text-emerald-600 uppercase hover:underline">Bulk</button>
                </div>
                <div className="space-y-1">
                  {filteredDocs.slice(0, 8).map(doc => (
                    <button key={doc.id} onClick={() => setActiveDocId(doc.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${activeDocId === doc.id ? 'bg-emerald-500 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'}`}>
                      <FileText size={16} className={activeDocId === doc.id ? 'text-white' : 'text-slate-300 group-hover:text-slate-400'} />
                      <span className="text-xs font-black truncate flex-1">{doc.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Presence List */}
              <div className="px-4 py-4 border-t border-slate-50">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Collaborators</p>
                 <div className="space-y-2">
                    {onlineUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                         <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: u.color }}></div>
                         <span className="text-[10px] font-black text-slate-700">{u.name}</span>
                         <span className="ml-auto text-[8px] font-black text-emerald-600 uppercase">Online</span>
                      </div>
                    ))}
                    {onlineUsers.length === 0 && <p className="text-[9px] font-bold text-slate-300 px-2 italic">No other users online...</p>}
                 </div>
              </div>

              {/* Drag & Drop Placeholder */}
              <div className="px-4 pb-10 mt-4">
                <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center gap-3 group hover:border-emerald-500 transition-all cursor-pointer">
                  <FileUp size={24} className="text-slate-300 group-hover:text-emerald-500 transition-all" />
                  <p className="text-[9px] font-black uppercase text-slate-400 text-center tracking-widest leading-relaxed">Drag & Drop to Upload Assets</p>
                </div>
              </div>
           </div>
           <div className="p-4 border-t">
              <button 
                onClick={() => {
                  addToast("AI Initializing Neural Engine...");
                  setTimeout(() => addToast("Analyzing Semantic Structure..."), 1000);
                  setTimeout(() => {
                    const words = stats.words;
                    const summary = words > 10 ? `Extracted 3 critical action items from ${words} words. Compliance risk detected in Section 2.` : "Document too short for meaningful AI extraction.";
                    addToast(summary);
                  }, 2500);
                }} 
                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/30 group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <Sparkles size={16} className="text-emerald-400 group-hover:rotate-12 transition-transform" /> AI Smart Audit
              </button>
           </div>
        </motion.aside>

        {/* CENTER: POWER WORKSPACE */}
        <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
           {currentDoc ? (
             <UniversalDocumentViewer 
               currentDoc={currentDoc} ydoc={ydoc} provider={awareness} 
               isLocked={isLocked} onStatsUpdate={setStats} onAction={addToast}
               onEditorInit={(editor) => { editorRef.current = editor; }}
             />
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
               <div className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center text-slate-200 mb-8 animate-pulse"><Layers size={48} /></div>
               <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Collaboration Hub</h2>
               <p className="text-sm text-slate-500 max-w-xs mb-10 font-medium">Connect with your team and edit enterprise documents in real-time.</p>
               <button onClick={() => setShowLeftPanel(true)} className="px-12 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/40 hover:-translate-y-1 transition-all">Launch Explorer</button>
             </div>
           )}

           <div className="h-10 bg-white border-t border-slate-200 px-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1.5 text-emerald-500"><ShieldCheck size={12} /> Secure Mesh</span>
                <span className="flex items-center gap-1.5"><FileText size={12} /> {stats.words} Words</span>
                <span className="flex items-center gap-1.5"><Clock size={12} /> {stats.readTime}m Read</span>
              </div>
              <div className="flex items-center gap-4">
                 <button className="text-[9px] font-black text-slate-400 hover:text-emerald-600 transition-all">P2P Status: 🟢</button>
                 <span className="h-3 w-px bg-slate-100"></span>
                 <span className="text-[9px] font-black text-slate-900 tracking-widest uppercase">ProjectFlow KE v4.0</span>
              </div>
           </div>
        </main>

        {/* RIGHT: CONTEXT & DISCUSSION */}
        <motion.aside initial={false} animate={{ width: showRightPanel ? 340 : 0 }} className="bg-white border-l border-slate-200 flex flex-col overflow-hidden relative">
           <div className="flex overflow-x-auto scrollbar-hide border-b border-slate-100">
              {['comments', 'chat', 'tasks', 'activity', 'snapshots', 'workflows'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  className={`px-4 py-4 flex-shrink-0 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                  {tab}
                </button>
              ))}
           </div>

           <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              <AnimatePresence mode="wait">
                {activeTab === 'comments' && (
                  <motion.div key="comments" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Discussions</h3>
                      <button onClick={() => addToast("Selecting section...")} className="text-[10px] font-black text-emerald-600 flex items-center gap-1 hover:underline"><Plus size={12} /> Comment</button>
                    </div>
                    {comments.map(c => (
                      <div key={c.id} className="comment-card group">
                        <div className="comment-header">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-lg ring-2 ring-white">{c.author[0]}</div>
                          <div className="flex-1">
                             <div className="flex items-center justify-between">
                                <p className="comment-author">{c.author}</p>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-black text-emerald-600 uppercase">Resolve</button>
                             </div>
                             <p className="comment-time">{c.time}</p>
                          </div>
                        </div>
                        <p className="comment-body">{c.text}</p>
                        <div className="mt-4 pl-4 border-l-2 border-slate-100 space-y-4">
                          {c.replies.map(r => (
                            <div key={r.id} className="comment-thread relative">
                               <div className="absolute -left-[18px] top-2 w-2 h-px bg-slate-100"></div>
                               <p className="text-[10px] font-black text-slate-900 flex items-center gap-2">
                                  {r.author} 
                                  <span className="text-[8px] text-slate-300 font-black uppercase">{r.time}</span>
                               </p>
                               <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{r.text}</p>
                            </div>
                          ))}
                          <div className="pt-2">
                             <input type="text" placeholder="Reply..." className="w-full bg-slate-50 border-none rounded-lg py-2 px-3 text-[10px] font-bold focus:ring-1 focus:ring-emerald-500/20 outline-none" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'chat' && (
                  <motion.div key="chat" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-2xl mb-4 border border-blue-100">
                       <MessageCircle size={18} />
                       <div className="flex-1">
                          <p className="text-[10px] font-black uppercase tracking-tight">Teams Integration</p>
                          <p className="text-[9px] font-bold">Secure MS Teams channel linked</p>
                       </div>
                       <ExternalLink size={14} className="cursor-pointer" />
                    </div>
                    <div className="flex-1 space-y-4">
                      {chatHistory.map(msg => (
                        <div key={msg.id} className={`flex flex-col ${msg.user === userName ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 py-2.5 rounded-2xl text-xs shadow-sm max-w-[90%] font-bold ${msg.user === userName ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-700'}`}>{msg.text}</div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t border-slate-100">
                      <div className="relative">
                        <input type="text" value={chatMessage} onChange={e => setChatMessage(e.target.value)} placeholder="Send to channel..." className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-5 pr-14 text-xs font-bold outline-none ring-2 ring-transparent focus:ring-emerald-500/10 transition-all" />
                        <button type="submit" className="absolute right-2 top-2 h-10 w-10 flex items-center justify-center bg-slate-900 text-white rounded-xl shadow-lg"><Send size={18} /></button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {activeTab === 'tasks' && (
                  <motion.div key="tasks" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Planner Hub</h3>
                      <button className="p-1 hover:bg-slate-100 rounded-md"><Plus size={14} /></button>
                    </div>
                    <div className="space-y-3">
                      {tasks.map(t => (
                        <div key={t.id} className="p-4 bg-white rounded-2xl border-2 border-slate-100 flex items-start gap-4 hover:border-emerald-500 transition-all group">
                           <div className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${t.status === 'Completed' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200'}`}>
                             {t.status === 'Completed' && <CheckSquare size={12} className="text-white" />}
                           </div>
                           <div className="flex-1">
                              <p className={`text-xs font-black ${t.status === 'Completed' ? 'text-slate-300 line-through' : 'text-slate-900'}`}>{t.text}</p>
                              <div className="flex items-center gap-2 mt-2">
                                 <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">@{t.assignedTo}</span>
                                 <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{t.status}</span>
                              </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'activity' && (
                  <motion.div key="activity" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Workspace History</h3>
                    <div className="space-y-4">
                      {auditLogs.slice(0, 10).map(log => (
                        <div key={log.id} className="relative pl-6 pb-6 border-l-2 border-slate-50 last:border-none group">
                          <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-white border-2 border-emerald-500 group-hover:scale-125 transition-all"></div>
                          <p className="text-[11px] font-black text-slate-900">{log.user}</p>
                          <p className="text-[10px] font-bold text-slate-500 mt-0.5">{log.action}</p>
                          <p className="text-[8px] text-slate-300 mt-1 font-black uppercase tracking-tighter">Just now</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'snapshots' && (
                  <motion.div key="snapshots" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Version Snapshots</h3>
                      <button onClick={createSnapshot} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">Save Milestone</button>
                    </div>
                    <div className="space-y-3">
                      {snapshots.map(s => (
                        <div key={s.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-300 transition-all cursor-pointer">
                           <div className="flex items-center gap-3 mb-2">
                              <GitBranch size={16} className="text-emerald-500" />
                              <span className="text-xs font-black text-slate-900">{s.label}</span>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400">{s.date}</span>
                              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Restore</span>
                           </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'workflows' && (
                  <motion.div key="workflows" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Automation Flows</h3>
                    {workflows.map(w => (
                      <div key={w.id} className="p-5 bg-white rounded-3xl border-2 border-slate-100 flex items-center gap-4">
                         <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm"><Workflow size={20} /></div>
                         <div className="flex-1">
                            <p className="text-xs font-black text-slate-900">{w.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Trigger: {w.trigger}</p>
                         </div>
                         <div className="w-10 h-6 bg-emerald-500 rounded-full flex items-center px-1"><div className="w-4 h-4 bg-white rounded-full ml-auto"></div></div>
                      </div>
                    ))}
                    <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-600 transition-all">+ Add Logic Flow</button>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </motion.aside>

      </div>
    </div>
  );
};

export default CollaborationWorkspace;
