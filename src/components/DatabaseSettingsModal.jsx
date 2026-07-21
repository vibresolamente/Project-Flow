import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Zap, 
  Terminal, 
  X, 
  Server, 
  Key, 
  Globe, 
  Download,
  AlertTriangle
} from 'lucide-react';
import { 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  clearSupabaseCredentials, 
  checkSupabaseHealth 
} from '../lib/supabase';
import { getTableStats } from '../lib/api';

const SQL_SCHEMA_SNIPPET = `-- ProjectFlow KE — Production Supabase Schema
-- Run in Supabase Dashboard -> SQL Editor

CREATE TABLE IF NOT EXISTS pf_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  role TEXT DEFAULT 'Viewer',
  departments JSONB DEFAULT '[]'::JSONB,
  pin TEXT DEFAULT '1234',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pf_documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  dept TEXT DEFAULT '',
  status TEXT DEFAULT 'Draft',
  access TEXT DEFAULT 'Private',
  date TEXT DEFAULT '',
  owner TEXT DEFAULT '',
  sensitivity TEXT DEFAULT 'Internal',
  version TEXT DEFAULT '1.0',
  content TEXT DEFAULT '',
  has_lock BOOLEAN DEFAULT FALSE,
  vault_locked BOOLEAN DEFAULT FALSE,
  vault_password TEXT,
  signature TEXT,
  certified_by TEXT,
  certified_at TEXT,
  deleted_at TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pf_departments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pf_pending_approvals (
  id TEXT PRIMARY KEY,
  doc_id TEXT,
  doc_name TEXT DEFAULT '',
  submitted_by TEXT DEFAULT '',
  dept TEXT DEFAULT '',
  time TEXT DEFAULT '',
  status TEXT DEFAULT 'Pending',
  resolved_at TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pf_pending_requests (
  id TEXT PRIMARY KEY,
  resource TEXT DEFAULT '',
  justification TEXT DEFAULT '',
  status TEXT DEFAULT 'Pending',
  requested_by TEXT DEFAULT '',
  time TEXT DEFAULT '',
  resolved_at TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pf_notifications (
  id TEXT PRIMARY KEY,
  type TEXT DEFAULT 'info',
  message TEXT DEFAULT '',
  time TEXT DEFAULT '',
  read BOOLEAN DEFAULT FALSE,
  doc_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pf_audit_logs (
  id TEXT PRIMARY KEY,
  user_name TEXT DEFAULT '',
  action TEXT DEFAULT '',
  target TEXT DEFAULT '',
  time TEXT DEFAULT '',
  hash TEXT,
  integrity TEXT DEFAULT 'Verified',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pf_threat_alerts (
  id TEXT PRIMARY KEY,
  type TEXT DEFAULT '',
  message TEXT DEFAULT '',
  time TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pf_config (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pf_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  privacy TEXT DEFAULT 'private',
  members JSONB DEFAULT '[]'::JSONB,
  admin_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & Policies
ALTER TABLE pf_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_pending_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_pending_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_threat_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_groups ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['pf_documents','pf_users','pf_departments','pf_pending_approvals','pf_pending_requests','pf_notifications','pf_audit_logs','pf_threat_alerts','pf_config','pf_groups'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow anon select on %1$s" ON %1$s;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow anon insert on %1$s" ON %1$s;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow anon update on %1$s" ON %1$s;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow anon delete on %1$s" ON %1$s;', tbl);
    EXECUTE format('CREATE POLICY "Allow anon select on %1$s" ON %1$s FOR SELECT TO anon USING (true);', tbl);
    EXECUTE format('CREATE POLICY "Allow anon insert on %1$s" ON %1$s FOR INSERT TO anon WITH CHECK (true);', tbl);
    EXECUTE format('CREATE POLICY "Allow anon update on %1$s" ON %1$s FOR UPDATE TO anon USING (true) WITH CHECK (true);', tbl);
    EXECUTE format('CREATE POLICY "Allow anon delete on %1$s" ON %1$s FOR DELETE TO anon USING (true);', tbl);
  END LOOP;
END $$;

-- Default Seed
INSERT INTO pf_departments (name) VALUES ('Finance'),('Legal'),('Human Resources'),('IT'),('Operations') ON CONFLICT (name) DO NOTHING;
INSERT INTO pf_users (id, name, role, departments, pin) VALUES ('admin-001', 'System Admin', 'Admin', '["IT","Finance","Legal"]'::JSONB, '1234') ON CONFLICT (id) DO NOTHING;
`;

export default function DatabaseSettingsModal({ isOpen, onClose, onRefreshData }) {
  const [activeTab, setActiveTab] = useState('credentials'); // credentials | health | sql
  const [urlInput, setUrlInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [healthState, setHealthState] = useState({ connected: false, latencyMs: 0, statusText: 'Checking...' });
  const [testing, setTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [tableStats, setTableStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrlInput(creds.url);
      setKeyInput(creds.key);
      runHealthCheck(creds.url, creds.key);
    }
  }, [isOpen]);

  const runHealthCheck = async (urlToTest, keyToTest) => {
    setTesting(true);
    const res = await checkSupabaseHealth(urlToTest, keyToTest);
    setHealthState(res);
    setTesting(false);

    if (res.connected) {
      fetchStats();
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    const stats = await getTableStats();
    setTableStats(stats);
    setLoadingStats(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveSuccessMsg('');
    saveSupabaseCredentials(urlInput, keyInput);
    setSaveSuccessMsg('Credentials saved! Testing database connectivity...');
    
    await runHealthCheck(urlInput, keyInput);
    if (onRefreshData) {
      await onRefreshData();
    }
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleClear = async () => {
    clearSupabaseCredentials();
    setUrlInput('');
    setKeyInput('');
    setSaveSuccessMsg('Cleared database credentials. Switched to Local Security Sandbox Mode.');
    setHealthState({ connected: false, latencyMs: 0, statusText: 'Local Sandbox Mode Active' });
    setTableStats(null);
    if (onRefreshData) {
      await onRefreshData();
    }
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SNIPPET);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/90 p-6 shadow-2xl text-slate-100 dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-blue-500/20">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Supabase Cloud Manager
                  {healthState.connected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online ({healthState.latencyMs}ms)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
                      ⚡ Local Sandbox
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400">Configure database credentials, check table health, and manage SQL migrations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 border-b border-slate-800 mb-6 pb-2">
            <button
              onClick={() => setActiveTab('credentials')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'credentials'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Key className="h-4 w-4" />
              Credentials & Connection
            </button>

            <button
              onClick={() => {
                setActiveTab('health');
                fetchStats();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'health'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Server className="h-4 w-4" />
              Table Health & Stats
            </button>

            <button
              onClick={() => setActiveTab('sql')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'sql'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Terminal className="h-4 w-4" />
              SQL Setup Script
            </button>
          </div>

          {/* Alert Messages */}
          {saveSuccessMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs font-medium text-emerald-300 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              {saveSuccessMsg}
            </div>
          )}

          {/* Tab 1: Credentials Form */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Supabase Project URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://your-project-id.supabase.co"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Supabase Anon (Public) Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 pl-10 pr-4 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-950/40 border border-slate-800 p-3 text-xs">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span className="text-slate-300">Status:</span>
                  <span className="font-semibold text-white">{healthState.statusText}</span>
                </div>

                <button
                  type="button"
                  onClick={() => runHealthCheck(urlInput, keyInput)}
                  disabled={testing}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
                  Test Latency
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
                >
                  Clear & Use Local Sandbox
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Save & Connect Database
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Table Health & Inspector */}
          {activeTab === 'health' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Database Connection Target</h4>
                  <p className="text-xs font-mono text-slate-400">{urlInput || 'No Cloud Database Connected (Running Local Sandbox)'}</p>
                </div>
                <button
                  onClick={fetchStats}
                  className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {tableStats ? (
                <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                  {Object.entries(tableStats).map(([tbl, status]) => (
                    <div key={tbl} className="flex items-center justify-between rounded-xl bg-slate-950/40 p-3 border border-slate-800/80">
                      <span className="text-xs font-mono text-cyan-300 font-semibold">{tbl}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-md font-mono ${
                        status.includes('Error') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-300'
                      }`}>
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                  {healthState.connected ? 'Click Refresh to inspect table rows' : 'Connect your Supabase database to inspect table health metrics'}
                </div>
              )}

              {healthState.connected && (
                <div className="pt-2">
                  <button
                    onClick={async () => {
                      if (onRefreshData) {
                        await onRefreshData();
                        fetchStats();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Sync & Reload Cloud Data
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: SQL Script */}
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Run this SQL script in your Supabase project's <strong className="text-white">SQL Editor</strong> to create all required tables & RLS policies.
                </p>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-500 transition-colors"
                >
                  {copiedSql ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedSql ? 'Copied!' : 'Copy SQL'}
                </button>
              </div>

              <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-slate-300 max-h-60 overflow-y-auto leading-relaxed">
                <pre>{SQL_SCHEMA_SNIPPET}</pre>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <ExternalLink className="h-4 w-4 text-blue-400 shrink-0" />
                <span>Need a new database? Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Supabase Dashboard</a>, create a free project, paste the SQL above into the SQL Editor, then paste your API credentials in the Credentials tab!</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
