-- ================================================================
-- ProjectFlow KE — Supabase Database Schema
-- Paste and run this entire file in the Supabase SQL Editor
-- ================================================================

-- System Users
CREATE TABLE IF NOT EXISTS pf_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Staff',
  departments JSONB DEFAULT '[]'::jsonb,
  pin TEXT NOT NULL DEFAULT '0000',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents (active + recycle bin via deleted_at)
CREATE TABLE IF NOT EXISTS pf_documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dept TEXT,
  status TEXT DEFAULT 'draft',
  access TEXT DEFAULT 'Internal Only',
  date TEXT,
  owner TEXT,
  sensitivity TEXT DEFAULT 'Internal',
  version INTEGER DEFAULT 1,
  content TEXT,
  has_lock BOOLEAN DEFAULT FALSE,
  vault_locked BOOLEAN DEFAULT FALSE,
  vault_password TEXT,
  signature TEXT,
  certified_by TEXT,
  certified_at TEXT,
  deleted_at TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments
CREATE TABLE IF NOT EXISTS pf_departments (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval Workflows
CREATE TABLE IF NOT EXISTS pf_pending_approvals (
  id TEXT PRIMARY KEY,
  doc_id TEXT,
  doc_name TEXT,
  submitted_by TEXT,
  dept TEXT,
  time TEXT,
  status TEXT DEFAULT 'Pending',
  resolved_at TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Access Requests
CREATE TABLE IF NOT EXISTS pf_pending_requests (
  id TEXT PRIMARY KEY,
  resource TEXT,
  justification TEXT,
  status TEXT DEFAULT 'Pending',
  requested_by TEXT,
  time TEXT,
  resolved_at TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS pf_notifications (
  id TEXT PRIMARY KEY,
  type TEXT,
  message TEXT,
  time TEXT,
  read BOOLEAN DEFAULT FALSE,
  doc_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs (Immutable Ledger)
CREATE TABLE IF NOT EXISTS pf_audit_logs (
  id TEXT PRIMARY KEY,
  user_name TEXT,
  action TEXT,
  target TEXT,
  time TEXT,
  hash TEXT,
  integrity TEXT DEFAULT 'Verified',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Threat Alerts
CREATE TABLE IF NOT EXISTS pf_threat_alerts (
  id TEXT PRIMARY KEY,
  type TEXT,
  message TEXT,
  time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Config (key-value)
CREATE TABLE IF NOT EXISTS pf_config (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ROW LEVEL SECURITY — Open anon access (upgrade in production)
-- ================================================================
ALTER TABLE pf_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_pending_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_pending_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_threat_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_users"         ON pf_users             FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_documents"     ON pf_documents         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_departments"   ON pf_departments       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_approvals"     ON pf_pending_approvals FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_requests"      ON pf_pending_requests  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_notifications" ON pf_notifications     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_audit"         ON pf_audit_logs        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_threats"       ON pf_threat_alerts     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_config"        ON pf_config            FOR ALL TO anon USING (true) WITH CHECK (true);

-- ================================================================
-- SEED DATA
-- ================================================================
INSERT INTO pf_users (id, name, role, departments, pin) VALUES
  ('u1', 'System Admin',     'Admin',      '["Finance","Legal","HR","Ops","IT"]', '0000'),
  ('u2', 'Sarah Manager',    'Manager',    '["Finance","HR"]',                    '1234'),
  ('u3', 'Kevin Staff',      'Staff',      '["Ops"]',                             '4321'),
  ('u4', 'Guest Contractor', 'Restricted', '[]',                                  '9999')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pf_departments (name) VALUES
  ('Finance'), ('Legal'), ('HR'), ('Ops'), ('IT')
ON CONFLICT (name) DO NOTHING;

INSERT INTO pf_documents (id, name, dept, status, access, date, owner, sensitivity, version, content) VALUES
  ('1', 'Finance_Report_Q1_2026.pdf',   'Finance', 'approved',    'Finance Only',  '2026-04-20', 'System Admin',  'Confidential', 3, 'REGIONAL FINANCE SUMMARY - Q1 2026\nRevenue: KES 4.2B\nGrowth: +12% YoY\nStatus: Verified by Central Audit.'),
  ('2', 'Confidential_M&A_Log.xlsx',    'Legal',   'confidential','Restricted',    '2026-04-18', 'David Ochieng', 'Restricted',   1, 'M&A TRANSACTION LOG [ENCRYPTED]\nTarget: Coastal Logistics Ltd\nStatus: Due Diligence Phase\nRisk: High'),
  ('3', 'HR_Policy_Handbook_2026.docx', 'HR',      'review',      'Internal Only', '2026-04-19', 'Sarah Manager', 'Internal',     2, 'STANDARD OPERATING PROCEDURES 2026\n1. Leave Policy\n2. Health Insurance\n3. Disciplinary Framework'),
  ('4', 'Ops_Manual_Nairobi_v4.pdf',    'Ops',     'draft',       'Internal Only', '2026-04-21', 'Kevin Otieno',  'Internal',     1, 'NAIROBI BRANCH OPERATIONS GUIDE\nGrid maintenance schedule... (STAGING)'),
  ('5', 'Legal_NDA_Mombasa_Branch.pdf', 'Legal',   'approved',    'Legal Only',    '2026-04-17', 'Sarah Kamau',   'Confidential', 4, 'NON-DISCLOSURE AGREEMENT\nParties: ProjectFlow KE & Mombasa Port Auth\nTerms: 5 Years Confidentiality')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pf_config (key, value) VALUES
  ('watermark', '{"enabled":true,"text":"PROJECTFLOW KE - CONFIDENTIAL","opacity":0.1}'),
  ('last_hash', '"0000000000000000"')
ON CONFLICT (key) DO NOTHING;
