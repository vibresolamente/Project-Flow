import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Sidebar, MessageSquareQuote, Save, Lock, Unlock, UserPlus, 
  Plus, Search, Clock3, Star, Folder, Hash, Users, FileText, 
  ChevronRight, Mic, MicOff, Video, Send, CheckSquare, Layers, 
  Sparkles, ShieldCheck, Download, Eye, FileUp, MessageCircle, 
  ExternalLink, Trash2, History, Settings, MoreHorizontal,
  Info, Activity, Database, Share2, Printer, Copy, Palette,
  ShieldAlert
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as awarenessProtocol from 'y-protocols/awareness';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import '../index.css';

// --- CONSTANTS & HELPERS ---
import { 
  Bold as BoldIcon, Italic as ItalicIcon, List as ListIcon, 
  Heading1, Heading2, Quote, Code, Highlighter, ListOrdered
} from 'lucide-react';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Blockquote from '@tiptap/extension-blockquote';
import Highlight from '@tiptap/extension-highlight';
import CodeBlock from '@tiptap/extension-code-block';

const TIPTAP_EXTENSIONS = [
  StarterKit.configure({ history: false }),
  Bold, Italic, Heading.configure({ levels: [1, 2] }),
  BulletList, OrderedList, ListItem, Blockquote, Highlight, CodeBlock
];

const toB64 = (arr) => btoa(Array.from(arr).map(b => String.fromCharCode(b)).join(''));
const fromB64 = (b64) => new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)));

const LuxeToast = ({ message, onRemove }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-xl text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-white/10">
    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{message}</span>
    <button onClick={onRemove} className="ml-4 hover:text-emerald-400 transition-colors"><X size={14} /></button>
  </motion.div>
);

// --- COMPONENT: COLLABORATIVE EDITOR ---
const EditorToolbar = ({ editor }) => {
  if (!editor) return null;
  return (
    <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-sm mb-4">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded-lg transition-all ${editor.isActive('bold') ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}><BoldIcon size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded-lg transition-all ${editor.isActive('italic') ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}><ItalicIcon size={16} /></button>
      <div className="w-px h-4 bg-slate-200 mx-1"></div>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-2 rounded-lg transition-all ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}><Heading1 size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-2 rounded-lg transition-all ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}><Heading2 size={16} /></button>
      <div className="w-px h-4 bg-slate-200 mx-1"></div>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded-lg transition-all ${editor.isActive('bulletList') ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}><ListIcon size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded-lg transition-all ${editor.isActive('orderedList') ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}><ListOrdered size={16} /></button>
      <div className="w-px h-4 bg-slate-200 mx-1"></div>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-2 rounded-lg transition-all ${editor.isActive('blockquote') ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}><Quote size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={`p-2 rounded-lg transition-all ${editor.isActive('highlight') ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}><Highlighter size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`p-2 rounded-lg transition-all ${editor.isActive('codeBlock') ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}><Code size={16} /></button>
    </div>
  );
};

const CollaborativeEditor = ({ ydoc, awareness, isLocked, onStatsUpdate, userName, userColor, currentDoc }) => {
  const extensions = useMemo(() => [
    ...TIPTAP_EXTENSIONS,
    Collaboration.configure({ document: ydoc, field: 'prosemirror' }),
    CollaborationCursor.configure({
      awareness,
      user: { name: userName, color: userColor }
    })
  ], [ydoc, awareness, userName, userColor]);

  const editor = useEditor({
    extensions,
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[800px] px-16 py-20 bg-white shadow-2xl rounded-sm border border-slate-200'
      }
    },
    onUpdate: ({ editor }) => {
      const words = editor.getText().split(/\s+/).filter(x => x).length;
      onStatsUpdate({ words, readTime: Math.ceil(words / 200) });
    },
    editable: !isLocked
  }, [extensions]);

  useEffect(() => {
    if (editor && isLocked !== undefined) {
      editor.setEditable(!isLocked);
    }
  }, [isLocked, editor]);

  useEffect(() => {
    if (editor && currentDoc?.content && ydoc.getXmlFragment('prosemirror').length === 0) {
      const timer = setTimeout(() => {
        if (ydoc.getXmlFragment('prosemirror').length === 0) {
          editor.commands.setContent(currentDoc.content);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [editor, currentDoc?.id]);

  return (
    <div className="editor-paper-container py-12 px-4 md:px-12 flex flex-col items-center bg-slate-100/50 min-h-screen">
      <div className="w-full max-w-[850px]">
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

// --- COMPONENT: BINARY ASSET VIEWER ---
const BinaryViewer = ({ currentDoc, onToggleCollab }) => (
  <div className="flex-1 flex flex-col md:flex-row bg-slate-100 h-full overflow-hidden">
    {/* ASSET PREVIEW */}
    <div className="flex-1 p-6 flex flex-col">
       <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Eye size={12} /> Visual Reference</p>
          <div className="bg-slate-900 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
             <Download size={12} /> {currentDoc.name}
          </div>
       </div>
       <div className="flex-1 bg-white shadow-2xl rounded-[2rem] overflow-hidden border border-slate-200 relative group">
          {currentDoc.content?.includes('image/') ? (
            <img src={currentDoc.content} alt={currentDoc.name} className="w-full h-full object-contain p-4" />
          ) : (
            <iframe src={currentDoc.content} className="w-full h-full border-none" title={currentDoc.name} />
          )}
       </div>
    </div>
    {/* ANNOTATION SPACE */}
    <div className="w-full md:w-[450px] bg-slate-50 border-l border-slate-200 flex flex-col p-6 overflow-y-auto">
       <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2"><Sparkles size={16} className="text-emerald-500"/> Team Annotations</h3>
          <button onClick={onToggleCollab} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-emerald-700 transition-all">
            <FileText size={14} /> Full Edit
          </button>
       </div>
       <div className="space-y-4">
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                <span>Sarah Manager</span>
                <span>12:44 PM</span>
             </p>
             <p className="text-sm font-medium text-slate-800 leading-relaxed">Please ensure the regional boundaries are updated to reflect the new Nairobi branch coordinates.</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
             <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Collaborative Note Active</p>
          </div>
       </div>
       <div className="mt-auto pt-6">
          <div className="relative">
             <input type="text" placeholder="Add annotation..." className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-4 pr-12 text-sm font-bold shadow-inner outline-none focus:border-emerald-500 transition-all" />
             <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-slate-900 text-white rounded-xl"><Send size={16}/></button>
          </div>
       </div>
    </div>
  </div>
);

// --- MAIN WORKSPACE COMPONENT ---
const CollaborationWorkspace = () => {
  const { 
    documents, groups, systemUsers, activeDocId, setActiveDocId, 
    addDocument, updateDocumentContent, createGroup, updateGroupMembers, 
    currentUser 
  } = useApp();

  const userName = currentUser?.name || 'Enterprise User';

  // UI State
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [isLocked, setIsLocked] = useState(false);
  const [isViewingOriginal, setIsViewingOriginal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [connStatus, setConnStatus] = useState('connecting');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [stats, setStats] = useState({ words: 0, readTime: 0 });
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // Sync State
  const [ydoc, setYdoc] = useState(null);
  const [awareness, setAwareness] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const channelRef = useRef(null);

  const addToast = (msg) => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg }]);
    setTimeout(() => setToasts(curr => curr.filter(t => t.id !== id)), 3000);
  };

  const userColor = useMemo(() => {
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];
    let hash = 0; for (let i = 0; i < userName.length; i++) hash = userName.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }, [userName]);

  const currentDoc = useMemo(() => {
    if (activeDocId === 'scratch-global') return { id: 'scratch-global', name: 'Global Scratchpad', content: '<p>Welcome to the global team node.</p>' };
    return documents.find(d => d.id.toString() === activeDocId?.toString());
  }, [documents, activeDocId]);

  const filteredDocs = useMemo(() => {
    if (!activeGroupId) return documents;
    return documents.filter(d => d.groupId === activeGroupId);
  }, [documents, activeGroupId]);

  // --- SYNC ENGINE ---
  useEffect(() => {
    const roomId = currentDoc ? `pf-room-${currentDoc.id}` : 'pf-room-global';
    const doc = new Y.Doc();
    const persistence = new IndexeddbPersistence(roomId, doc);
    const awr = new awarenessProtocol.Awareness(doc);

    awr.setLocalStateField('user', { name: userName, color: userColor });
    setYdoc(doc);
    setAwareness(awr);

    const channel = supabase.channel(roomId, { config: { broadcast: { self: false, ack: true } } });
    channelRef.current = channel;

    channel.on('broadcast', { event: 'y-update' }, ({ payload }) => payload.update && Y.applyUpdate(doc, fromB64(payload.update), 'remote'));
    channel.on('broadcast', { event: 'y-awareness' }, ({ payload }) => payload.update && awarenessProtocol.applyAwarenessUpdate(awr, fromB64(payload.update), 'remote'));
    
    channel.on('broadcast', { event: 'y-sync-step-1' }, ({ payload }) => {
      if (payload.stateVector) {
        const update = Y.encodeStateAsUpdate(doc, fromB64(payload.stateVector));
        channel.send({ type: 'broadcast', event: 'y-sync-step-2', payload: { update: toB64(update) } });
      }
    });
    channel.on('broadcast', { event: 'y-sync-step-2' }, ({ payload }) => payload.update && Y.applyUpdate(doc, fromB64(payload.update), 'remote'));

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setConnStatus('connected');
        const sync1 = { stateVector: toB64(Y.encodeStateVector(doc)) };
        channel.send({ type: 'broadcast', event: 'y-sync-step-1', payload: sync1 });
        const awrUpdate = awarenessProtocol.encodeAwarenessUpdate(awr, [awr.clientID]);
        channel.send({ type: 'broadcast', event: 'y-awareness', payload: { update: toB64(awrUpdate) } });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setConnStatus('error');
      }
    });

    // Chat Sync via Yjs
    const yChat = doc.getArray('chat');
    yChat.observe(() => {
      setChatMessages(yChat.toArray());
    });

    doc.on('update', (update, origin) => {
      if (origin !== 'remote' && origin !== 'indexeddb') {
        const b64 = toB64(update);
        if (b64.length < 24000) channel.send({ type: 'broadcast', event: 'y-update', payload: { update: b64 } });
      }
    });

    awr.on('update', () => {
      const update = awarenessProtocol.encodeAwarenessUpdate(awr, [awr.clientID]);
      channel.send({ type: 'broadcast', event: 'y-awareness', payload: { update: toB64(update) } });
      const states = Array.from(awr.getStates().values());
      setOnlineUsers(states.filter(s => s.user).map((s, i) => ({ ...s.user, id: i })));
    });

    return () => {
      channel.unsubscribe();
      persistence.destroy();
      awr.destroy();
      doc.destroy();
      setYdoc(null);
      setAwareness(null);
    };
  }, [currentDoc?.id]);

  // AUTO-SAVE LOOP
  useEffect(() => {
    if (!ydoc || !currentDoc?.id || currentDoc.id === 'scratch-global') return;
    const interval = setInterval(async () => {
      const state = Y.encodeStateAsUpdate(ydoc);
      await updateDocumentContent(currentDoc.id, toB64(state));
    }, 60000);
    return () => clearInterval(interval);
  }, [ydoc, currentDoc?.id]);

  const handleSave = async () => {
    if (!ydoc || !currentDoc?.id) return;
    const state = Y.encodeStateAsUpdate(ydoc);
    await updateDocumentContent(currentDoc.id, toB64(state));
    addToast("Document version locked in cloud vault");
  };

  const handleSendChat = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !ydoc) return;
    const yChat = ydoc.getArray('chat');
    yChat.push([{
      user: userName,
      message: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: userColor
    }]);
    setChatInput('');
  };

  const handleAddMember = (userId) => {
    const user = systemUsers.find(u => u.id === userId);
    if (!user) return;
    if (activeGroupId) {
      const group = groups.find(g => g.id === activeGroupId);
      if (group) {
        updateGroupMembers(activeGroupId, [...new Set([...group.members, userId])]);
        addToast(`${user.name} added to workspace`);
      }
    } else {
      addToast(`Shared node access with ${user.name}`);
    }
    setShowAddMemberModal(false);
  };

  return (
    <div className="collab-workspace-container h-screen flex flex-col bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <AnimatePresence>
        {toasts.map(t => <LuxeToast key={t.id} message={t.msg} onRemove={() => setToasts(curr => curr.filter(x => x.id !== t.id))} />)}
      </AnimatePresence>

      {/* --- PREMIUM TOP BAR --- */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-50 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black"><FileText size={18} /></div>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <button onClick={() => setShowLeftPanel(!showLeftPanel)} className={`p-1.5 rounded-md transition-all ${showLeftPanel ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}><Sidebar size={18} /></button>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-slate-900">{currentDoc ? currentDoc.name : 'Collaboration Workspace'}</h1>
              <div className={`w-2 h-2 rounded-full ${connStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : connStatus === 'error' ? 'bg-red-500' : 'bg-amber-500'}`} title={`Signaling Status: ${connStatus}`}></div>
            </div>
            <p className="text-[10px] font-medium text-slate-400">
               {connStatus === 'connected' ? 'Sync Active' : connStatus === 'error' ? 'Sync Failure' : 'Initializing Signal...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex -space-x-1.5 mr-4">
            {onlineUsers.map((u, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black text-white shadow-sm" style={{ backgroundColor: u.color }} title={u.name}>{u.name[0]}</div>
            ))}
            <button onClick={() => setShowAddMemberModal(true)} className="w-7 h-7 rounded-full border-2 border-dashed border-slate-200 bg-white text-slate-400 flex items-center justify-center hover:border-emerald-500 hover:text-emerald-500 transition-all"><UserPlus size={12} /></button>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
             <button onClick={() => setShowRightPanel(!showRightPanel)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${showRightPanel ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
                <MessageCircle size={14} /> Discussions
             </button>
             <button onClick={handleSave} className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm shadow-emerald-600/20">
                <Save size={14} /> Save
             </button>
          </div>
          
          <button className="p-2 text-slate-400 hover:text-slate-900 transition-all"><MoreHorizontal size={20} /></button>
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 border border-slate-300 ml-2">{userName[0]}</div>
        </div>
      </header>

      {/* --- TOOLS STRIP --- */}
      <div className="h-10 bg-white border-b border-slate-200 px-6 flex items-center gap-4 shrink-0">
         <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Printer size={16} /></button>
            <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Copy size={16} /></button>
            <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Palette size={16} /></button>
         </div>
         <div className="h-4 w-px bg-slate-200 mx-2"></div>
         <div className="flex items-center gap-1">
            <button onClick={() => setIsLocked(!isLocked)} className={`flex items-center gap-2 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${isLocked ? 'bg-amber-100 text-amber-700' : 'hover:bg-slate-100 text-slate-600'}`}>
               {isLocked ? <Lock size={14} /> : <Unlock size={14} />} {isLocked ? 'Locked' : 'Unlocked'}
            </button>
         </div>
         <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-6 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
               <span className="flex items-center gap-1.5 text-emerald-500"><ShieldCheck size={12} /> Compliance: Verified</span>
               <span className="flex items-center gap-1.5"><Database size={12} /> Sync: Online</span>
            </div>
         </div>
         <button onClick={() => addToast("Link copied to clipboard")} className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-blue-100 transition-all">
            <Share2 size={14} /> Share Link
         </button>
      </div>

      {/* --- MAIN LAYOUT --- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT NAV: THE EXPLORER */}
        <motion.aside initial={false} animate={{ width: showLeftPanel ? 280 : 0 }} className="bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
            <div className="nav-group">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Workspaces</p>
               <div className="space-y-1">
                  <button onClick={() => setActiveGroupId(null)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${!activeGroupId ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}>
                    <Hash size={18} /> <span className="text-xs">Global Mesh</span>
                  </button>
                  {groups.map(g => (
                    <button key={g.id} onClick={() => setActiveGroupId(g.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${activeGroupId === g.id ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}>
                      <Users size={18} /> <span className="text-xs truncate">{g.name}</span>
                    </button>
                  ))}
               </div>
            </div>

            <div className="nav-group pt-4 border-t border-slate-50">
               <div className="flex items-center justify-between mb-4 px-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Assets</p>
                  <button onClick={() => addToast("Starting AI ingestion...")} className="p-1 hover:bg-slate-100 rounded"><Plus size={14} /></button>
               </div>
               <div className="space-y-1">
                  {filteredDocs.map(doc => (
                    <button key={doc.id} onClick={() => { setActiveDocId(doc.id); setIsViewingOriginal(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all group ${activeDocId === doc.id ? 'bg-slate-900 text-white shadow-xl' : 'hover:bg-slate-100 text-slate-600'}`}>
                      <FileText size={18} className={activeDocId === doc.id ? 'text-emerald-400' : 'text-slate-300'} />
                      <span className="text-xs font-black truncate flex-1 text-left">{doc.name}</span>
                      {activeDocId === doc.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>}
                    </button>
                  ))}
                  {filteredDocs.length === 0 && <p className="text-[10px] text-slate-400 p-4 text-center italic">No documents in this workspace.</p>}
               </div>
            </div>
          </div>
        </motion.aside>

        {/* CENTER: THE PAPER EDITOR */}
        <main className="flex-1 flex flex-col bg-slate-100 overflow-hidden relative">
          {currentDoc ? (
            <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide">
              {currentDoc.content?.startsWith('data:') && !isViewingOriginal ? (
                <BinaryViewer currentDoc={currentDoc} onToggleCollab={() => setIsViewingOriginal(true)} />
              ) : (ydoc && awareness) ? (
                <CollaborativeEditor 
                  key={`${currentDoc.id}-${ydoc.guid}`}
                  ydoc={ydoc} awareness={awareness} isLocked={isLocked}
                  onStatsUpdate={setStats} userName={userName} userColor={userColor}
                  currentDoc={currentDoc}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-slate-50">
                  <div className="w-20 h-20 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center text-slate-200 animate-pulse"><Database size={40} /></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Synchronizing Real-time Node...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50">
              <div className="w-40 h-40 bg-white rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] flex items-center justify-center text-slate-100 mb-12"><Layers size={80} /></div>
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Enterprise Collaboration</h2>
              <p className="text-slate-500 max-w-sm mb-12 font-medium leading-relaxed">Select a document from the vault or initialize a team-wide scratchpad to begin secure, real-time operations.</p>
              <div className="flex gap-4">
                <button onClick={() => setShowLeftPanel(true)} className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/30 hover:-translate-y-1 transition-all">Launch Explorer</button>
                <button onClick={() => setActiveDocId('scratch-global')} className="px-12 py-5 bg-emerald-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-600/20 hover:-translate-y-1 transition-all flex items-center gap-3"><Sparkles size={16} /> Global Scratchpad</button>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT PANEL: OVERLAY DISCUSSIONS */}
        <AnimatePresence>
           {showRightPanel && (
             <motion.aside 
               initial={{ x: '100%' }}
               animate={{ x: 0 }}
               exit={{ x: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed top-14 right-0 bottom-0 w-[380px] bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.05)] z-40 border-l border-slate-200 flex flex-col"
             >
                <div className="flex border-b border-slate-100 shrink-0">
                  {['comments', 'chat', 'members'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-5 text-[9px] font-black uppercase tracking-widest transition-all flex-1 ${activeTab === tab ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>{tab}</button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                   {activeTab === 'comments' && (
                     <div className="space-y-6">
                       <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Context Threads</h3>
                       <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center">
                          <MessageSquareQuote size={32} className="text-slate-200 mx-auto mb-4" />
                          <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">No discussions active. Highlight any document segment to start a thread.</p>
                       </div>
                     </div>
                   )}
                   {activeTab === 'chat' && (
                      <div className="flex flex-col h-full">
                         <div className={`p-4 rounded-2xl flex items-center gap-3 border mb-6 shrink-0 ${connStatus === 'connected' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                            {connStatus === 'connected' ? <MessageCircle size={18} /> : <ShieldAlert size={18} />}
                            <p className="text-[10px] font-black uppercase tracking-widest">{connStatus === 'connected' ? 'Real-time P2P Signal' : 'Signaling Failure'}</p>
                         </div>
                         <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-hide">
                            {chatMessages.length === 0 ? (
                               <div className="text-center py-10 opacity-20 italic">
                                  <Send size={40} className="mx-auto mb-2" />
                                  <p className="text-[10px] font-black uppercase">No encrypted messages</p>
                               </div>
                             ) : (
                               chatMessages.map((chat, i) => (
                                 <div key={i} className={`flex flex-col ${chat.user === userName ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-4 rounded-2xl text-xs font-medium max-w-[85%] shadow-sm ${chat.user === userName ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                                       {chat.message}
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase mt-1 px-1">{chat.user} • {chat.time}</span>
                                 </div>
                               ))
                             )}
                         </div>
                         <form onSubmit={handleSendChat} className="relative shrink-0">
                            <input 
                              type="text" 
                              value={chatInput}
                              onChange={e => setChatInput(e.target.value)}
                              placeholder="Secure message..." 
                              className="w-full bg-slate-100 border-none rounded-2xl py-4 pl-4 pr-12 text-xs font-bold outline-none focus:ring-2 ring-emerald-500/20" 
                             />
                            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-emerald-600 hover:scale-110 transition-transform"><Send size={18} /></button>
                         </form>
                      </div>
                   )}
                   {activeTab === 'members' && (
                      <div className="space-y-8">
                         <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Live Collaborators</p>
                           <div className="space-y-3">
                              {onlineUsers.map((u, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-slate-100">
                                   <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black" style={{ backgroundColor: u.color }}>{u.name[0]}</div>
                                   <div className="flex-1 text-left">
                                      <p className="text-xs font-black text-slate-900">{u.name}</p>
                                      <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1"><Activity size={10} /> Active Pulse</p>
                                   </div>
                                </div>
                              ))}
                           </div>
                         </div>
                      </div>
                   )}
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                   <button onClick={() => addToast("AI Engine analyzing semantic markers...")} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">
                      <Sparkles size={16} className="text-emerald-400" /> Semantic Audit
                   </button>
                </div>
             </motion.aside>
           )}
        </AnimatePresence>
      </div>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {showAddMemberModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8">
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Add Collaborator</h2>
                  <button onClick={() => setShowAddMemberModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
               </div>
               <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
                  {systemUsers.map(u => (
                    <button key={u.id} onClick={() => handleAddMember(u.id)} className="w-full flex items-center gap-4 p-3 hover:bg-emerald-50 rounded-2xl transition-all group text-left">
                       <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">{u.name[0]}</div>
                       <div className="flex-1">
                          <p className="text-xs font-black text-slate-900">{u.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{u.role}</p>
                       </div>
                       <Plus size={16} className="text-slate-300 group-hover:text-emerald-500" />
                    </button>
                  ))}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollaborationWorkspace;
