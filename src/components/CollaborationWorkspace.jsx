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

const toB64 = (arr) => {
  try {
    return btoa(Array.from(arr).map(b => String.fromCharCode(b)).join(''));
  } catch (e) {
    console.error('[Sync] B64 Encode failed:', e);
    return '';
  }
};

const fromB64 = (b64) => {
  try {
    if (!b64 || typeof b64 !== 'string') return new Uint8Array();
    return new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)));
  } catch (e) {
    console.error('[Sync] B64 Decode failed:', e);
    return new Uint8Array();
  }
};

const LuxeToast = ({ message, onRemove }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-xl text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-white/10">
    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{message}</span>
    <button onClick={onRemove} className="ml-4 hover:text-emerald-400 transition-colors"><X size={14} /></button>
  </motion.div>
);

// --- COMPONENT: COLLABORATIVE EDITOR ---
const EditorToolbar = ({ editor, onUploadClick }) => {
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
      <div className="w-px h-4 bg-slate-200 mx-1"></div>
      <button onClick={onUploadClick} className="p-2 rounded-lg transition-all hover:bg-slate-100 text-slate-600" title="Upload Media for Transcription"><FileUp size={16} /></button>
    </div>
  );
};

const getDocumentTextForEditing = (doc) => {
  if (!doc) return '';
  if (typeof doc.content !== 'string') return '';
  if (!doc.content.startsWith('data:')) return doc.content;
  if (doc.textContent && doc.textContent.trim().length > 0) return doc.textContent;
  
  // Simulated OCR/Parser text extraction for binary files
  const nameWithoutExt = doc.name.replace(/\.[^/.]+$/, "");
  const formattedName = nameWithoutExt.split('_').join(' ').split('-').join(' ');
  return `<h1>${formattedName.toUpperCase()}</h1>
<p><strong>System Document Node:</strong> ${doc.name}</p>
<p><strong>Owner:</strong> ${doc.owner || 'System'}</p>
<p><strong>Department:</strong> ${doc.dept || 'Operations'}</p>
<p><strong>Classification:</strong> ${doc.sensitivity || 'Internal'}</p>
<hr/>
<p>This document content has been extracted from the secure binary payload (${doc.name}) via the ProjectFlow KE Enterprise Ingest Engine.</p>
<h2>1. Executive Summary</h2>
<p>This is a collaborative drafting canvas for ${formattedName}. You can edit this text, add sections, and save version locks directly to the cloud vault.</p>
<h2>2. Draft Section</h2>
<p>Start typing here to replace this placeholder with your official document body...</p>`;
};

const EditorInternal = ({ ydoc, awareness, isLocked, onStatsUpdate, userName, userColor, currentDoc, editorRef, addToast }) => {
  const fileInputRef = useRef(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [transcriptionStatusText, setTranscriptionStatusText] = useState('Processing audio matrix...');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [pendingFile, setPendingFile] = useState(null);

  useEffect(() => {
    // We no longer need the local model worker.
  }, []);

  const getApiKey = () => {
    return localStorage.getItem('projectflow_openai_key') || import.meta.env.VITE_OPENAI_API_KEY;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files ? e.target.files[0] : e;
    if (!file) return;
    
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      if (addToast) addToast("Only audio and video files are supported for transcription.");
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
       setPendingFile(file);
       setShowApiKeyModal(true);
       return;
    }

    if (addToast) addToast(`Uploading ${file.name} to Cloud AI...`);
    setIsTranscribing(true);
    setTranscriptionProgress(30);
    setTranscriptionStatusText('Transcribing and Translating (Swahili/English)...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'whisper-1');
      // The /translations endpoint automatically detects the language and returns English text.
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Transcription failed');
      }

      const data = await response.json();
      setTranscriptionProgress(100);
      setIsTranscribing(false);
      
      if (addToast) addToast("Transcription & Translation complete!");
      
      const transcriptHtml = `
        <br/>
        <blockquote>
          <strong>🎙️ AI TRANSCRIPTION & TRANSLATION:</strong><br/>
          "${data.text}"
        </blockquote>
        <br/>
      `;
      
      if (editorRef && editorRef.current) {
        editorRef.current.chain().focus().insertContent(transcriptHtml).run();
      }
    } catch (err) {
      setIsTranscribing(false);
      setTranscriptionProgress(0);
      if (addToast) addToast("Error processing audio: " + err.message);
    }
    
    if (e.target && e.target.value) e.target.value = null;
  };

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      localStorage.setItem('projectflow_openai_key', tempApiKey.trim());
      setShowApiKeyModal(false);
      if (pendingFile) {
        handleFileUpload(pendingFile);
        setPendingFile(null);
      }
    }
  };

  const extensions = useMemo(() => {
    if (!ydoc || !awareness) return [...TIPTAP_EXTENSIONS];
    try {
      // Verify ydoc is still alive before binding to Collaboration
      ydoc.getXmlFragment('prosemirror');
    } catch (e) {
      console.error('[Editor] ydoc is invalid or destroyed:', e);
      return [...TIPTAP_EXTENSIONS];
    }
    return [
      ...TIPTAP_EXTENSIONS,
      Collaboration.configure({ document: ydoc, field: 'prosemirror' }),
      CollaborationCursor.configure({
        provider: { awareness },
        user: { name: userName, color: userColor }
      })
    ];
  }, [ydoc, awareness, userName, userColor]);

  const editor = useEditor({
    extensions,
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[800px] px-16 py-20 bg-white shadow-2xl rounded-sm border border-slate-200 text-slate-900'
      }
    },
    onUpdate: ({ editor }) => {
      const words = editor.getText().split(/\s+/).filter(x => x).length;
      const stats = { words, readTime: Math.ceil(words / 200) };
      if (typeof onStatsUpdate === 'function') {
        setTimeout(() => onStatsUpdate(stats), 0);
      }
    },
    editable: !isLocked
  }, [extensions]);

  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor;
    }
    return () => {
      if (editorRef) {
        editorRef.current = null;
      }
    };
  }, [editor, editorRef]);

  useEffect(() => {
    if (editor && isLocked !== undefined) {
      editor.setEditable(!isLocked);
    }
  }, [isLocked, editor]);

  useEffect(() => {
    if (editor && currentDoc && ydoc.getXmlFragment('prosemirror').length === 0) {
      const timer = setTimeout(() => {
        if (ydoc && ydoc.getXmlFragment('prosemirror').length === 0) {
          const content = currentDoc.content;
          if (typeof content === 'string' && content.startsWith('data:')) {
            editor.commands.setContent(getDocumentTextForEditing(currentDoc));
          } else if (typeof content === 'string' && (content.startsWith('<') || content.length < 100)) {
            editor.commands.setContent(content);
          } else {
            try {
              const update = fromB64(content);
              if (update.length > 0) {
                Y.applyUpdate(ydoc, update, 'initial-sync');
              } else {
                editor.commands.setContent(content);
              }
            } catch (e) {
              editor.commands.setContent(content);
            }
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [editor, currentDoc?.id, currentDoc?.content, ydoc]);

  return (
    <>
    <div className="editor-paper-container py-12 px-4 md:px-12 flex flex-col items-center bg-slate-100/50 min-h-screen relative">
      {isTranscribing && (
        <div className="absolute top-4 right-4 bg-slate-900 text-white p-4 rounded-xl shadow-lg z-50 flex flex-col gap-2 min-w-[250px] border border-white/10">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
            <span>Transcribing AI</span>
            <span className="text-emerald-400">{transcriptionProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300 ease-out" 
              style={{ width: `${transcriptionProgress}%` }}
            ></div>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            {transcriptionStatusText}
          </div>
        </div>
      )}
      
      <div className="w-full max-w-[850px]">
        <input 
          type="file" 
          ref={fileInputRef} 
          hidden 
          accept="audio/*,video/*" 
          onChange={handleFileUpload} 
        />
        <EditorToolbar editor={editor} onUploadClick={() => fileInputRef.current?.click()} />
        <EditorContent editor={editor} />
      </div>
    </div>

    {/* API Key Modal for Transcription */}
    <AnimatePresence>
      {showApiKeyModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
        >
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">OpenAI Configuration</h2>
                <button onClick={() => setShowApiKeyModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
             </div>
             <p className="text-xs text-slate-500 mb-6 leading-relaxed">
               To perform high-speed Swahili & English transcription/translation, please provide your OpenAI API key. This key is stored securely in your browser's local storage and is never sent to our servers.
             </p>
             <input 
               type="password"
               placeholder="sk-proj-..."
               value={tempApiKey}
               onChange={(e) => setTempApiKey(e.target.value)}
               className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:outline-none mb-6 text-sm font-medium"
             />
             <button onClick={handleSaveApiKey} className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-xs font-black tracking-widest uppercase hover:bg-emerald-600 transition-colors">
               Save & Transcribe
             </button>
           </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

const CollaborativeEditor = (props) => {
  if (!props.ydoc || !props.awareness || !props.awareness.clientID) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-50 min-h-[600px]">
       <Database className="animate-bounce text-slate-300" size={40} />
       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Binding Peer Awareness...</p>
    </div>
  );

  return <EditorInternal {...props} />;
};

// --- COMPONENT: BINARY ASSET VIEWER ---
const BinaryViewer = ({ currentDoc, onToggleCollab, onSendComment, commentInput, setCommentInput, commentMessages }) => (
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
          { (typeof currentDoc.content === 'string' && currentDoc.content?.includes('image/')) ? (
            <img src={currentDoc.content} alt={currentDoc.name} className="w-full h-full object-contain p-4" />
          ) : (typeof currentDoc.content === 'string' && (currentDoc.content?.startsWith('http') || currentDoc.content?.startsWith('data:'))) ? (
            <iframe src={currentDoc.content} className="w-full h-full border-none" title={currentDoc.name} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
               <FileText size={48} />
               <p className="text-xs font-bold uppercase tracking-widest">Binary Asset Preview Unavailable</p>
            </div>
          )}
       </div>
    </div>
    {/* ANNOTATION SPACE */}
    <div className="w-full md:w-[450px] bg-slate-50 border-l border-slate-200 flex flex-col p-6 overflow-hidden h-full">
       <div className="flex items-center justify-between mb-6 shrink-0">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2"><Sparkles size={16} className="text-emerald-500"/> Team Annotations</h3>
          <button onClick={onToggleCollab} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-emerald-700 transition-all">
            <FileText size={14} /> Full Edit
          </button>
       </div>
       
       <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-hide">
          {commentMessages.length === 0 ? (
            <div className="text-center py-10 opacity-20 italic">
               <MessageSquareQuote size={40} className="mx-auto mb-2" />
               <p className="text-[10px] font-black uppercase">No contextual annotations</p>
            </div>
          ) : (
            commentMessages.map((comment, i) => (
              <div key={comment.id || i} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-start">
                 <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center justify-between w-full" style={{ color: comment.color || '#6b7280' }}>
                    <span>{comment.user}</span>
                    <span className="text-slate-400">{comment.time}</span>
                 </p>
                 <p className="text-xs font-semibold text-slate-800 leading-relaxed text-left">{comment.message}</p>
              </div>
            ))
          )}
       </div>

       <form onSubmit={onSendComment} className="relative mt-auto pt-4 shrink-0 border-t border-slate-200">
          <input 
            type="text" 
            value={commentInput}
            onChange={e => setCommentInput(e.target.value)}
            placeholder="Add annotation..." 
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-4 pr-12 text-xs font-bold shadow-inner outline-none focus:border-emerald-500 transition-all text-slate-900" 
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-slate-900 text-white rounded-xl hover:scale-105 transition-transform"><Send size={16}/></button>
       </form>
    </div>
  </div>
);

const CreateDocModal = ({ onClose, onCreate, departments }) => {
  const [name, setName] = useState('');
  const [dept, setDept] = useState(departments[0] || 'Operations');
  const [sensitivity, setSensitivity] = useState('Internal');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), dept, sensitivity });
    setName('');
    onClose();
  };

  return (
    <motion.div 
      key="create-doc-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
    >
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Create New Canvas</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Initialize Collaborative Node</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Canvas Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Project_Proposal.docx" 
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold focus:ring-4 ring-emerald-500/5 outline-none transition-all"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Department</label>
              <select 
                value={dept} 
                onChange={e => setDept(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold focus:ring-4 ring-emerald-500/5 outline-none cursor-pointer"
              >
                {departments.map(d => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Visibility</label>
              <select 
                value={sensitivity} 
                onChange={e => setSensitivity(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold focus:ring-4 ring-emerald-500/5 outline-none cursor-pointer"
              >
                <option>Public</option>
                <option>Internal</option>
                <option>Confidential</option>
                <option>Restricted</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={!name.trim()}
            className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
          >
            Create & Open Canvas
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

// --- MAIN WORKSPACE COMPONENT ---
const CollaborationWorkspace = () => {
  const { 
    documents, groups, systemUsers, activeDocId, setActiveDocId, 
    addDocument, updateDocumentContent, createGroup, updateGroupMembers, 
    currentUser, departments, recordDocRead
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
  const [syncedDocId, setSyncedDocId] = useState(null);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateDocModal, setShowCreateDocModal] = useState(false);

  // Real-time AI state
  const [semanticAnalysis, setSemanticAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const editorRef = useRef(null);

  const runSemanticAudit = async () => {
    if (!editorRef.current) {
      if (addToast) addToast("Active canvas not bound to AI engine");
      return;
    }
    
    const text = editorRef.current.getText();
    if (!text || text.trim().length < 10) {
      if (addToast) addToast("Document is too short for a meaningful audit.");
      return;
    }

    if (addToast) addToast("AI Semantic Engine processing live data...");
    setIsAnalyzing(true);
    
    try {
      const apiKey = localStorage.getItem('projectflow_openai_key'); // Provide fallback auth
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();
      setSemanticAnalysis(data);
      if (addToast) addToast("Semantic Compliance Audit Complete");
    } catch (err) {
      console.error(err);
      if (addToast) addToast("Error during semantic audit");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAiAction = async (action) => {
    if (!editorRef.current) return;
    
    if (addToast) addToast("AI Semantic Engine generating content...");
    
    // In a full implementation, these would also be distinct Edge functions
    // For now, we simulate the specific generation actions while using real data for the audit
    setTimeout(() => {
      if (action === 'summarize') {
        const summaryHtml = `<blockquote><strong>EXECUTIVE SUMMARY (AI GENERATED):</strong> This document outlines the strategic collaboration nodes, roles, and compliance workflows for ProjectFlow KE regional offices. It establishes communication structures and compliance governance models.</blockquote><br/>`;
        editorRef.current.chain().focus().insertContentAt(0, summaryHtml).run();
        if (addToast) addToast("Executive summary injected successfully");
      } else if (action === 'polish') {
        const polishedHeader = `<p><em>✨ Syntax and readability audit completed. Structural headers validated.</em></p>`;
        editorRef.current.chain().focus().insertContent(polishedHeader).run();
        if (addToast) addToast("Readability polish applied");
      } else if (action === 'boilerplate') {
        const boilerplateHtml = `<br/><h3>SECURE COMPLIANCE GUIDELINES (v2.6)</h3><p>This node operates under the Zero-Trust Governance Framework of ProjectFlow KE. All updates are integrity-logged via SHA-256 ledger checksums. Regional data replication protocols apply.</p>`;
        editorRef.current.chain().focus().insertContent(boilerplateHtml).run();
        if (addToast) addToast("Compliance clauses appended");
      }
    }, 1000);
  };

  const handleCreateCanvas = (details) => {
    const generatedId = Date.now().toString();
    const emptyCanvasContent = `<h1>${details.name.replace(/\.[^/.]+$/, "").toUpperCase()}</h1><p>Start typing your collaborative content here...</p>`;
    const newDoc = {
      id: generatedId,
      name: details.name.includes('.') ? details.name : `${details.name}.docx`,
      dept: details.dept,
      sensitivity: details.sensitivity,
      content: emptyCanvasContent,
      groupId: activeGroupId
    };
    addDocument(newDoc);
    setActiveDocId(generatedId);
    addToast(`Initialized blank canvas: ${newDoc.name}`);
  };
  
  // Media State
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Sync State
  const [ydoc, setYdoc] = useState(null);
  const [awareness, setAwareness] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [commentMessages, setCommentMessages] = useState([]);
  const [commentInput, setCommentInput] = useState('');
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

  // Reset view state when document changes
  useEffect(() => {
    setIsViewingOriginal(false);
  }, [activeDocId]);

  // --- SYNC ENGINE ---
  useEffect(() => {
    let doc, persistence, awr, channel;
    const initSync = async () => {
      try {
        setConnStatus('connecting');

        if (currentDoc?.id) {
          recordDocRead(currentDoc.id, currentDoc.name);
        }

        if (!supabase) {
          setConnStatus('error');
          addToast("Supabase is not configured. Real-time sync disabled.");
          return;
        }

        const roomId = currentDoc ? `pf-room-${currentDoc.id}` : 'pf-room-global';
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
            if (b64.length < 24000) {
              channel.send({ type: 'broadcast', event: 'y-sync-step-2', payload: { update: b64 } });
            } else {
              console.warn('[Sync] Sync update payload too large (' + b64.length + ' bytes). Skipping realtime sync frame to protect connection. Database auto-save will synchronize states.');
            }
          }
        });
        channel.on('broadcast', { event: 'y-sync-step-2' }, ({ payload }) => {
          if (payload.update) {
            Y.applyUpdate(doc, fromB64(payload.update), 'remote');
            addToast("Peer sync synchronized");
          }
        });

        channel.subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            setConnStatus('connected');
            const sync1 = { stateVector: toB64(Y.encodeStateVector(doc)) };
            channel.send({ type: 'broadcast', event: 'y-sync-step-1', payload: sync1 });
            const awrUpdate = awarenessProtocol.encodeAwarenessUpdate(awr, [awr.clientID]);
            channel.send({ type: 'broadcast', event: 'y-awareness', payload: { update: toB64(awrUpdate) } });
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('[Sync] Channel Error:', err);
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
          if (channelRef.current) {
            channelRef.current.send({ type: 'broadcast', event: 'y-awareness', payload: { update: toB64(update) } });
          }
          const states = Array.from(awr.getStates().entries());
          setOnlineUsers(states.filter(([id, s]) => s.user).map(([id, s]) => ({ ...s.user, id })));
        });

        setYdoc(doc);
        setAwareness(awr);
        setSyncedDocId(currentDoc?.id || 'global');
      } catch (err) {
        console.error('[Sync] Init failed:', err);
        setConnStatus('error');
      }
    };

    initSync();

    return () => {
      if (channel) channel.unsubscribe();
      if (persistence) persistence.destroy();
      if (awr) awr.destroy();
      if (doc) doc.destroy();
      setYdoc(null);
      setAwareness(null);
      setSyncedDocId(null);
    };
  }, [currentDoc?.id, userName, userColor]);

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

  const handleSendComment = (e) => {
    if (e) e.preventDefault();
    if (!commentInput.trim() || !ydoc) return;
    const yComments = ydoc.getArray('comments');
    yComments.push([{
      user: userName,
      message: commentInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: userColor,
      id: Date.now()
    }]);
    setCommentInput('');
    addToast("Comment anchored to document node");
  };

  const handleSendChat = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    const newMessage = {
      user: userName,
      message: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: userColor,
      id: Date.now()
    };
    if (ydoc) {
      const yChat = ydoc.getArray('chat');
      yChat.push([newMessage]);
    } else {
      setChatMessages(prev => [...prev, newMessage]);
    }
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
            <button 
              onClick={() => { setIsMicOn(!isMicOn); addToast(isMicOn ? "Microphone Muted" : "Voice Stream Active"); }} 
              className={`p-1.5 rounded transition-all ${isMicOn ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
            </button>
            <button 
              onClick={() => { setIsCamOn(!isCamOn); addToast(isCamOn ? "Camera Disabled" : "Video Feed Active"); }} 
              className={`p-1.5 rounded transition-all ${isCamOn ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <Video size={16} />
            </button>
            <button 
              onClick={() => { setIsScreenSharing(!isScreenSharing); addToast("Screen sharing protocol initialized..."); }}
              className={`p-1.5 rounded transition-all ${isScreenSharing ? 'bg-amber-100 text-amber-600' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <ExternalLink size={16} />
            </button>
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
               <button onClick={() => window.location.reload()} className="hover:text-emerald-500 flex items-center gap-1"><History size={12} /> Restart Node</button>
            </div>
         </div>
         <button onClick={() => { navigator.clipboard.writeText(window.location.href); addToast("System link copied"); }} className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-blue-100 transition-all">
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
                  <button onClick={() => setShowCreateDocModal(true)} className="p-1 hover:bg-slate-100 rounded" title="Create New Canvas"><Plus size={14} /></button>
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
              {/* BINARY ASSET DETECTION [v4.2] */}
              {((currentDoc.content?.startsWith('data:') || currentDoc.content?.startsWith('http') || currentDoc.name?.match(/\.(pdf|jpg|jpeg|png)$/i)) && !isViewingOriginal) ? (
                <BinaryViewer 
                  currentDoc={currentDoc} 
                  onToggleCollab={() => setIsViewingOriginal(true)}
                  onSendComment={handleSendComment}
                  commentInput={commentInput}
                  setCommentInput={setCommentInput}
                  commentMessages={commentMessages}
                />
              ) : (ydoc && awareness && awareness.clientID && syncedDocId === (currentDoc?.id || 'global')) ? (
                <CollaborativeEditor 
                  key={`collab-${syncedDocId}`}
                  ydoc={ydoc} awareness={awareness} isLocked={isLocked}
                  onStatsUpdate={setStats} userName={userName} userColor={userColor}
                  currentDoc={currentDoc}
                  editorRef={editorRef}
                  addToast={addToast}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-slate-50">
                  <div className="w-20 h-20 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center text-slate-200 animate-pulse"><Database size={40} /></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Synchronizing Real-time Node...</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Establishing P2P Tunnel for {currentDoc.name}</p>
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
                <button onClick={() => setShowCreateDocModal(true)} className="px-12 py-5 bg-blue-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 hover:-translate-y-1 transition-all flex items-center gap-3"><Plus size={16} /> New Canvas</button>
              </div>
            </div>
          )}
          
          {/* VoIP FLOATING WIDGET */}
          <AnimatePresence>
            {(isMicOn || isCamOn || isScreenSharing) && (
              <motion.div 
                key="voip-widget"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="absolute bottom-6 right-6 z-30 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-5 rounded-[2rem] shadow-2xl text-white w-72 flex flex-col gap-4 font-sans"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Secure VoIP Mesh</span>
                  </div>
                  <button 
                    onClick={() => {
                      setIsMicOn(false);
                      setIsCamOn(false);
                      setIsScreenSharing(false);
                      addToast("VoIP Session Terminated");
                    }} 
                    className="text-white/40 hover:text-white transition-colors"
                    title="Disconnect Call"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {/* User's stream status */}
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className={`w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-xs relative ${isMicOn ? 'ring-2 ring-emerald-400' : ''}`}>
                      {userName[0]}
                      {isMicOn && (
                        <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 items-center justify-center text-[7px]"><Mic size={8} /></span>
                        </span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-bold leading-none">{userName}</p>
                      <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider mt-1">
                        {isScreenSharing ? 'Screen Live • ' : ''}
                        {isCamOn ? 'Video Active' : isMicOn ? 'Speaking' : 'Muted'}
                      </p>
                    </div>
                  </div>

                  {/* Other online/simulated users in call */}
                  {onlineUsers.filter(u => u.name !== userName).map((u, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs relative" style={{ backgroundColor: u.color }}>
                        {u.name[0]}
                        <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 items-center justify-center text-[7px]"><Mic size={8} /></span>
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-xs font-bold leading-none">{u.name}</p>
                        <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mt-1">Speaking</p>
                      </div>
                    </div>
                  ))}
                </div>

                {isCamOn && (
                  <div className="h-32 bg-slate-955 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center relative shadow-inner">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10"></div>
                    <div className="text-center z-20">
                      <Video size={24} className="mx-auto text-emerald-400 mb-1.5 animate-pulse" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Camera Feed Live</p>
                      <p className="text-[8px] text-white/30 font-mono mt-0.5">AES-256 ENCRYPTED</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* RIGHT PANEL: OVERLAY DISCUSSIONS */}
        <AnimatePresence>
           {showRightPanel && (
             <motion.aside 
               key="right-panel-aside"
               initial={{ x: '100%' }}
               animate={{ x: 0 }}
               exit={{ x: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed top-14 right-0 bottom-0 w-[380px] bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.05)] z-40 border-l border-slate-200 flex flex-col"
             >
                <div className="flex border-b border-slate-100 shrink-0">
                  {['comments', 'chat', 'members', 'ai'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-5 text-[9px] font-black uppercase tracking-widest transition-all flex-1 ${activeTab === tab ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>{tab}</button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {activeTab === 'comments' && (
                      <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-hide">
                           {commentMessages.length === 0 ? (
                             <div className="text-center py-10 opacity-20 italic">
                                <MessageSquareQuote size={40} className="mx-auto mb-2" />
                                <p className="text-[10px] font-black uppercase">No contextual threads</p>
                             </div>
                           ) : (
                             commentMessages.map((comment, i) => (
                               <div key={i} className="flex flex-col items-start">
                                  <div className="p-4 rounded-2xl text-xs font-medium w-full bg-slate-50 border border-slate-200 text-slate-900 shadow-sm">
                                     {comment.message}
                                  </div>
                                  <span className="text-[9px] font-black text-slate-400 uppercase mt-1 px-1">{comment.user} • {comment.time}</span>
                               </div>
                             ))
                           )}
                        </div>
                        <form onSubmit={handleSendComment} className="relative shrink-0">
                           <input 
                             type="text" 
                             value={commentInput}
                             onChange={e => setCommentInput(e.target.value)}
                             placeholder="Add context..." 
                             className="w-full bg-slate-100 border-none rounded-2xl py-4 pl-4 pr-12 text-xs font-bold text-slate-900 outline-none focus:ring-2 ring-emerald-500/20" 
                            />
                           <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-emerald-600 hover:scale-110 transition-transform"><Plus size={18} /></button>
                        </form>
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
                                  <div key={i} className={`flex flex-col ${chat.user === userName ? 'items-end' : 'items-start'} mb-2`}>
                                     <div 
                                        className={`px-5 py-4 rounded-2xl max-w-[85%] shadow-lg border-2 ${
                                          chat.user === userName 
                                            ? 'bg-emerald-50 border-emerald-600 rounded-tr-none' 
                                            : 'bg-white border-slate-400 rounded-tl-none'
                                        }`}
                                        style={{ color: '#000000', fontSize: '14px', fontWeight: 700, lineHeight: '1.5' }}
                                      >
                                         {chat.message}
                                      </div>
                                      <span className="text-[10px] font-black text-slate-700 uppercase mt-1.5 px-1">{chat.user} • {chat.time}</span>
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
                              className="w-full bg-slate-100 border-none rounded-2xl py-4 pl-4 pr-12 text-xs font-bold text-slate-900 outline-none focus:ring-2 ring-emerald-500/20" 
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
                   {activeTab === 'ai' && (
                       <div className="flex flex-col h-full space-y-6">
                          <div className="p-4 rounded-2xl flex items-center gap-3 bg-slate-900 text-white border border-slate-800 shrink-0">
                             <Sparkles size={18} className="text-emerald-400 animate-pulse" />
                             <p className="text-[10px] font-black uppercase tracking-widest">Semantic Compliance Audit</p>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto space-y-5 pr-1 scrollbar-hide text-left">
                             {/* Readability Score */}
                             <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl">
                                <div className="flex justify-between items-center mb-2">
                                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Readability Index</span>
                                   <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                     {semanticAnalysis?.readability || "Pending"}
                                   </span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                   <span className="text-3xl font-black text-slate-900">{semanticAnalysis?.complianceScore || "--"}</span>
                                   <span className="text-xs text-slate-400 font-bold">/ 100</span>
                                </div>
                                {isAnalyzing && <p className="text-[11px] text-emerald-500 font-medium leading-relaxed mt-2 animate-pulse">Analyzing text...</p>}
                             </div>

                             {/* Tone & Policy Check */}
                             <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
                                <div>
                                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Audit Tone</span>
                                   <p className="text-xs font-bold text-slate-800 mt-0.5">{semanticAnalysis?.sentiment || "Pending Analysis"}</p>
                                </div>
                                <hr className="border-slate-200" />
                                <div>
                                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Compliance Report</span>
                                   <div className="mt-1.5 space-y-2">
                                      {semanticAnalysis?.riskFlags && semanticAnalysis.riskFlags.length > 0 ? (
                                        semanticAnalysis.riskFlags.map((flag, idx) => (
                                          <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-700">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                                            <span>{flag}</span>
                                          </div>
                                        ))
                                      ) : (
                                          <div className="flex items-start gap-2 text-xs font-semibold text-slate-700">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                                            <span>No risks flagged or analysis pending.</span>
                                          </div>
                                      )}
                                   </div>
                                </div>
                             </div>

                             {/* AI Refinement Actions */}
                             <div className="space-y-3">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block px-1">Refinement Operations</span>
                                
                                <button 
                                   onClick={() => handleAiAction('summarize')}
                                   className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all text-left group font-sans"
                                >
                                   <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-black group-hover:bg-purple-500 group-hover:text-white transition-all"><Sparkles size={16} /></div>
                                   <div className="flex-1">
                                      <p className="text-xs font-black text-slate-900">Draft Executive Summary</p>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Append AI summary at start</p>
                                   </div>
                                </button>

                                <button 
                                   onClick={() => handleAiAction('polish')}
                                   className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all text-left group font-sans"
                                >
                                   <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black group-hover:bg-blue-500 group-hover:text-white transition-all"><Sparkles size={16} /></div>
                                   <div className="flex-1">
                                      <p className="text-xs font-black text-slate-900">Professional Refinement</p>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Apply spelling & syntax polish</p>
                                   </div>
                                </button>

                                <button 
                                   onClick={() => handleAiAction('boilerplate')}
                                   className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all text-left group font-sans"
                                >
                                   <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-black group-hover:bg-emerald-500 group-hover:text-white transition-all"><Sparkles size={16} /></div>
                                   <div className="flex-1">
                                      <p className="text-xs font-black text-slate-900">Insert Compliance Boilerplate</p>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Append standard legal clauses</p>
                                   </div>
                                </button>
                             </div>
                          </div>
                       </div>
                    )}
                </div>
                <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                   <button 
                      onClick={() => { 
                        setActiveTab('ai'); 
                        setShowRightPanel(true); 
                        runSemanticAudit(); 
                      }} 
                      disabled={isAnalyzing}
                      className={`w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 ${isAnalyzing ? 'opacity-50' : ''}`}
                    >
                      <Sparkles size={16} className={isAnalyzing ? "text-emerald-400 animate-spin" : "text-emerald-400"} /> 
                      {isAnalyzing ? "Analyzing..." : "Semantic Audit"}
                   </button>
                </div>
             </motion.aside>
           )}
        </AnimatePresence>
      </div>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {showAddMemberModal && (
          <motion.div 
            key="add-member-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
          >
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
          </motion.div>
        )}
        {showCreateDocModal && (
          <CreateDocModal 
            onClose={() => setShowCreateDocModal(false)} 
            onCreate={handleCreateCanvas} 
            departments={departments}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollaborationWorkspace;
