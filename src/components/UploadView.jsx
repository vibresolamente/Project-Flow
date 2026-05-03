import React from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle2 } from 'lucide-react';
import UploadForm from './UploadForm';

const UploadView = ({ onUpload }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-xl mx-auto py-12"
    >
      <div className="card p-10 space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Upload size={80} />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Secure Upload Center</h2>
          <p className="text-muted-foreground">Regional SharePoint ingest point for ProjectFlow KE.</p>
        </div>

        <UploadForm onUpload={onUpload} />
      </div>

      <div className="mt-8 flex items-center justify-center gap-6 grayscale opacity-40">
        <CheckCircle2 size={24} />
        <span className="text-[10px] uppercase font-bold tracking-widest">Compliance Verified</span>
        <span className="h-4 w-px bg-border"></span>
        <span className="text-[10px] uppercase font-bold tracking-widest">AES-256 Active</span>
      </div>
    </motion.div>
  );
};

export default UploadView;
