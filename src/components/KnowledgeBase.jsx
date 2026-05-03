import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  HelpCircle,
  FileText,
  Video,
  Search,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Globe,
  Zap,
  ShieldCheck
} from 'lucide-react';

const KnowledgeBase = () => {
  const [activeCat, setActiveCat] = useState('Guide');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold tracking-tight">Knowledge Hub</h2>
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest border border-emerald-200">v2.0 Governance Active</span>
        </div>
        <p className="text-muted-foreground font-medium">Standard Operating Procedures, policies, and training resources centrally governed on SharePoint.</p>
      </div>

      {/* SEARCH HUB */}
      <div className="card bg-primary p-10 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <h3 className="text-xl font-bold mb-4">How can we help you today?</h3>
          <div className="search-bar bg-white/10 border-white/20 h-14 px-6 focus-within:bg-white focus-within:text-foreground group transition-all">
            <Search className="text-white group-focus-within:text-primary" size={20} />
            <input
              type="text"
              placeholder="Search policies, SOPs, training materials..."
              className="text-white placeholder:text-white/50 group-focus-within:text-foreground group-focus-within:placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex gap-4 mt-6 text-xs font-bold text-emerald-100">
            <span>Popular:</span>
            <button className="underline hover:text-white">Remote Work Policy</button>
            <button className="underline hover:text-white">Tax Compliance SOP</button>
            <button className="underline hover:text-white">Teams Training</button>
          </div>
        </div>
        <BookOpen className="absolute -right-10 -bottom-10 h-64 w-64 text-white/5 rotate-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* SIDEBAR CATEGORIES */}
        <div className="space-y-2">
          <KBCatItem label="System Guide" icon={<Globe size={18} />} active={activeCat === 'Guide'} onClick={() => setActiveCat('Guide')} />
          <KBCatItem label="Governance Policies" icon={<ShieldCheck size={18} />} active={activeCat === 'Policies'} onClick={() => setActiveCat('Policies')} />
          <KBCatItem label="SOPs (Procedures)" icon={<FileText size={18} />} active={activeCat === 'SOPs'} onClick={() => setActiveCat('SOPs')} />
          <KBCatItem label="Training Center" icon={<Video size={18} />} active={activeCat === 'Training'} onClick={() => setActiveCat('Training')} />

          <div className="mt-10 p-6 bg-slate-900 rounded-xl border border-slate-700 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <MessageSquare size={60} />
            </div>
            <h4 className="text-sm font-bold mb-1 text-white">Security Hotlink</h4>
            <p className="text-[10px] text-slate-400 mb-4 font-medium">Immediate escalation for data breach or vault failures.</p>
            <button className="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded text-[10px] font-black uppercase tracking-widest shadow-lg">Secure Comms</button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="lg:col-span-3 space-y-8">
          {activeCat === 'Guide' ? (
            <div className="space-y-8">
              <div className="card p-8 bg-emerald-50/50 border-emerald-100 border-2">
                <h3 className="text-2xl font-black text-emerald-900 mb-4 flex items-center gap-3"><Zap className="text-primary" /> ProjectFlow v2.0 Core Operations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="text-sm font-black uppercase tracking-widest text-emerald-800">1. Cryptographic Ingest</h4>
                    <p className="text-xs text-emerald-700 leading-relaxed">Drag files directly into the portal. The system uses <strong>Smart-Tagging AI v2</strong> to analyze content payloads and automatically route files to their designated Department Hubs based on sensitivity.</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-black uppercase tracking-widest text-emerald-800">2. Immutable Ledger</h4>
                    <p className="text-xs text-emerald-700 leading-relaxed">Every action (Upload, View, Sign) is recorded in a <strong>Blockchain-linked ledger</strong>. You can verify the mathematical integrity of any document in the Threat Intelligence Dashboard.</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-black uppercase tracking-widest text-emerald-800">3. Digital Certification</h4>
                    <p className="text-xs text-emerald-700 leading-relaxed">Managers can apply <strong>PF-SIG Cryptographic Signatures</strong> to approved files. A Certified document generates a unique tamper-proof certificate embedded in the metadata.</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-black uppercase tracking-widest text-emerald-800">4. Secure Multi-Format Export</h4>
                    <p className="text-xs text-emerald-700 leading-relaxed">Export documents as <strong>PDF Envelopes, Word Nodes, or Excel Datasets</strong>. All exports include a Governance Wrapper ensuring content visibility on any device.</p>
                  </div>
                </div>
              </div>

              {/* V2.5 REAL-TIME OPERATIONS MONITORING */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="card bg-slate-900 text-white p-4">
                  <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1">Global Vault Sync</p>
                  <p className="text-2xl font-bold">99.98%</p>
                  <div className="h-1 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[99.98%]"></div>
                  </div>
                </div>
                <div className="card bg-slate-900 text-white p-4">
                  <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Active AI Scans</p>
                  <p className="text-2xl font-bold">1,248</p>
                  <div className="h-1 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-blue-500 w-[85%]"></div>
                  </div>
                </div>
                <div className="card bg-slate-900 text-white p-4">
                  <p className="text-[10px] font-black uppercase text-amber-400 tracking-widest mb-1">Audit Ledger Head</p>
                  <p className="text-xs font-mono truncate mt-1">0x7F2A...9E4C</p>
                  <p className="text-[9px] text-slate-400 mt-2 font-bold animate-pulse">● Live Synchronization Active</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold">Governance & Security Manuals</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ResourceCard title="Secure Envelope (HTML) User Guide" type="Vault" updated="Just Now" urgent />
                  <ResourceCard title="How to Decrypt Vaulted Files" type="Guide" updated="Today" />
                  <ResourceCard title="Managing Departmental AD Groups" type="Policy" updated="1 day ago" />
                  <ResourceCard title="Reading the Threat Intel Heatmap" type="Guide" updated="Newly Added" />
                </div>
              </div>

              <div className="card p-6 bg-emerald-50 border-emerald-100 mt-6">
                <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2 mb-2">
                  <ShieldCheck size={18} />
                  New Feature: Standalone Secure Envelopes
                </h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  ProjectFlow v2.5 introduces <strong>Secure Envelopes</strong>. Documents with vault protection are now exported as self-decrypting HTML files.
                  These files can be sent outside the platform but <strong>still require the original document password</strong> to be viewed.
                  This ensures that sensitive Kakamega High School data remains protected even on local hard drives or email attachments.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {activeCat} Library
                <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground ml-2">8 Items</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResourceCard title="IT Remote Access Policy" type="Policy" updated="4 days ago" />
                <ResourceCard title="Quarterly Tax Filing SOP" type="Procedure" updated="1 week ago" />
                <ResourceCard title="Crisis Management Framework" type="Policy" updated="Newly Added" urgent />
                <ResourceCard title="Regional SharePoint Governance" type="Policy" updated="1 month ago" />
              </div>
            </div>
          )}

          <div className="pt-8 border-t border-border">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><HelpCircle className="text-primary" /> Frequently Asked Questions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FAQItem q="Why can't I see the Finance Hub?" a="Access is controlled via AD Group membership. If you aren't assigned to the Finance group, the hub remains invisible for zero-trust security." />
              <FAQItem q="How do I verify a document hash?" a="Click the 'Threat Intelligence' icon in the top nav and check the Immutable Ledger. Compare the hash on your download with the ledger head." />
              <FAQItem q="What is a 'Certified' status?" a="It means the document has been digitally signed by an authorized manager and its integrity is guaranteed by the ProjectFlow kernel." />
              <FAQItem q="How do I request a Vault override?" a="Vault overrides are strictly prohibited. You must obtain the secondary cryptographic PIN from the document owner or a Global Admin." />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const KBCatItem = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active ? 'bg-primary text-white shadow-lg' : 'text-foreground hover:bg-muted'
      }`}
  >
    {icon}
    <span className="font-bold text-sm tracking-tight">{label}</span>
    {active && <ChevronRight size={16} className="ml-auto" />}
  </button>
);

const ResourceCard = ({ title, type, updated, urgent }) => (
  <div className={`card p-5 group hover:border-primary transition-all cursor-pointer relative ${urgent ? 'border-primary/40 bg-emerald-50/10' : ''}`}>
    {urgent && <div className="absolute top-0 right-0 h-2 w-2 bg-primary rounded-bl-lg"></div>}
    <div className="flex justify-between items-start mb-3">
      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
        <FileText size={20} />
      </div>
      <ExternalLink size={16} className="text-muted-foreground group-hover:text-primary" />
    </div>
    <h4 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">{title}</h4>
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-primary uppercase">{type}</span>
      <span className="text-[10px] text-muted-foreground">• Updated {updated}</span>
    </div>
  </div>
);

const FAQItem = ({ q, a }) => (
  <div className="card p-4 hover:shadow-md transition-shadow cursor-pointer">
    <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
      <HelpCircle size={16} className="text-primary" />
      {q}
    </h4>
    <p className="text-xs text-muted-foreground pl-6 border-l-2 border-primary/20 ml-2">{a}</p>
  </div>
);

export default KnowledgeBase;