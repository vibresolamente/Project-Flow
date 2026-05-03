import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ShieldCheck, Zap, Loader2, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';

const UploadForm = ({ onUpload, onCancel }) => {
  const { departments } = useApp();
  const [fileName, setFileName] = useState('');
  const [content, setContent] = useState('');
  const [binaryUrl, setBinaryUrl] = useState('');
  const [dept, setDept] = useState(departments[0] || 'Operations');
  const [sensitivity, setSensitivity] = useState('Internal');
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [toasts, setToasts] = useState([]);
  const addToast = (msg) => { const id = Date.now(); setToasts(prev => [...prev, { id, msg }]); setTimeout(() => setToasts(curr => curr.filter(t => t.id !== id)), 3000); };

  const fileInputRef = React.useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    
    const reader = new FileReader();
    
    // For text files, read as UTF-8 string to enable direct collaborative editing
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      reader.onload = (e) => setContent(e.target.result);
      reader.readAsText(file);
    } else {
      // For Word/PDF, read as DataURL to preserve binary structure (mocking system behavior)
      reader.onload = (e) => setBinaryUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleAIScan = () => {
    if (!fileName && !content) return;
    setIsScanning(true);
    setTimeout(() => {
      const lowerText = (fileName + ' ' + content).toLowerCase();
      
      // INTELLIGENT CLASSIFICATION: Suggest metadata without overwriting user content
      if (lowerText.includes('kakamega') || lowerText.includes('proposal')) {
        setDept('Legal');
        setSensitivity('Public');
        addToast("Classification: High-Priority School Proposal Detected");
      } else if (lowerText.includes('legal') || lowerText.includes('contract') || lowerText.includes('nda')) {
        setDept('Legal');
        setSensitivity('Confidential');
        addToast("Classification: Legal/Contractual Node Detected");
      } else if (lowerText.includes('finance') || lowerText.includes('budget') || lowerText.includes('revenue')) {
        setDept('Finance');
        setSensitivity('Restricted');
        addToast("Classification: Financial Record Detected");
      } else if (lowerText.includes('hr') || lowerText.includes('staff') || lowerText.includes('salary')) {
        setDept('HR');
        setSensitivity('Confidential');
        addToast("Classification: Personnel Record Detected");
      } else if (lowerText.includes('ops') || lowerText.includes('manual') || lowerText.includes('guide')) {
        setDept('Ops');
        setSensitivity('Internal');
        addToast("Classification: Operational Documentation Detected");
      }
      setIsScanning(false);
    }, 1200);
  };

  const handleUpload = () => {
    if (!fileName) return;
    setIsUploading(true);
    setTimeout(() => {
      onUpload({ 
        name: fileName, 
        dept, 
        sensitivity,
        vaultLocked: vaultPassword !== '',
        vaultPassword,
        authorizedRoles: selectedRoles,
        content: binaryUrl || content || `Simulated system data for ${fileName}. Generated at ${new Date().toLocaleString()}.`,
        textContent: content
      });
      setIsUploading(false);
      setFileName('');
      setContent('');
      setBinaryUrl('');
      if (onCancel) onCancel();
    }, 1500);
  };

  const [vaultPassword, setVaultPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState(['Admin', 'Manager', 'Staff']);

  return (
    <div className="space-y-6 relative">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-0 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase z-50 shadow-lg">
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={(e) => handleFile(e.target.files[0])}
      />
      
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer group ${isDragging ? 'border-primary bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'}`}
      >
        <Upload className={`mx-auto mb-4 transition-transform ${isDragging ? 'scale-125 text-primary' : 'text-slate-400 group-hover:scale-110'}`} size={48} />
        <p className="text-base font-black text-slate-900 mb-1">
          {fileName ? `Loaded: ${fileName}` : 'Select Document'}
        </p>
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">Enterprise-Grade Ingest Node Active</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Metadata Label</label>
                {(fileName || content) && (
                  <button 
                    onClick={handleAIScan}
                    disabled={isScanning}
                    className="text-[10px] font-black uppercase text-emerald-600 flex items-center gap-1.5 hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isScanning ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                    {isScanning ? 'AI Analyzing...' : 'Run Auto-Classifier'}
                  </button>
                )}
            </div>
          <input 
            type="text" 
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Payload name..."
            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold focus:ring-4 ring-emerald-500/5 outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Text Transcription (Editable)</label>
          <div className="relative group">
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste raw document content here to enable live collaborative editing..."
              rows={6}
              className="w-full bg-slate-900 border border-slate-800 p-6 rounded-2xl text-[11px] font-mono text-emerald-400 focus:ring-4 ring-emerald-500/5 outline-none resize-none scrollbar-hide shadow-inner leading-relaxed"
            />
            <div className="absolute top-4 right-4 text-emerald-900/40 pointer-events-none font-black text-[8px] uppercase tracking-widest">Live Editor Payload</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Department Hub</label>
            <select 
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold focus:ring-4 ring-emerald-500/5 outline-none appearance-none cursor-pointer"
            >
              {departments.map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Initial Visibility</label>
            <select 
              value={sensitivity}
              onChange={(e) => setSensitivity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm font-bold focus:ring-4 ring-emerald-500/5 outline-none appearance-none cursor-pointer"
            >
              <option>Public</option>
              <option>Internal</option>
              <option>Confidential</option>
              <option>Restricted</option>
            </select>
          </div>
        </div>

        {/* SECURITY & ACCESS CONTROL SECTION */}
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-5">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-900 shadow-sm"><ShieldCheck size={18} /></div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-tight text-slate-900">Security & Access Control</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hardened Protection Layer</p>
              </div>
           </div>

           <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Vault Protection (Leave blank for no lock)</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={vaultPassword} 
                    onChange={(e) => setVaultPassword(e.target.value)} 
                    placeholder="Enter secondary PIN..."
                    className="w-full bg-white border border-slate-200 p-3.5 rounded-xl text-sm font-mono tracking-[0.2em] focus:ring-4 ring-red-500/5 outline-none pl-11"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Authorized Roles</label>
                 <div className="flex flex-wrap gap-2 pt-1">
                    {['Admin', 'Manager', 'Staff', 'Restricted'].map(role => (
                      <button 
                        key={role}
                        onClick={() => setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${selectedRoles.includes(role) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                      >
                        {role}
                      </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        {onCancel && (
          <button 
            onClick={onCancel}
            className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
          >
            Abort
          </button>
        )}
        <button 
          onClick={handleUpload}
          disabled={!fileName || isUploading}
          className={`flex-[2] py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all active:scale-95 ${
            isUploading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {isUploading ? 'Syncing...' : 'Initialize Secure Upload'}
        </button>
      </div>
    </div>
  );
};

export default UploadForm;
