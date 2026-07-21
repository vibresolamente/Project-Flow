-- ================================================================
-- ProjectFlow KE — Production Supabase Database Schema
-- Paste and run this script in the Supabase SQL Editor (supabase.com)
-- ================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS pf_users (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL DEFAULT '',
  role         TEXT DEFAULT 'Viewer',
  departments  JSONB DEFAULT '[]'::JSONB,
  pin          TEXT DEFAULT '1234',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Documents Table
CREATE TABLE IF NOT EXISTS pf_documents (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL DEFAULT '',
  dept           TEXT DEFAULT '',
  status         TEXT DEFAULT 'Draft',
  access         TEXT DEFAULT 'Private',
  date           TEXT DEFAULT '',
  owner          TEXT DEFAULT '',
  sensitivity    TEXT DEFAULT 'Internal',
  version        TEXT DEFAULT '1.0',
  content        TEXT DEFAULT '',
  has_lock       BOOLEAN DEFAULT FALSE,
  vault_locked   BOOLEAN DEFAULT FALSE,
  vault_password TEXT,
  signature      TEXT,
  certified_by   TEXT,
  certified_at   TEXT,
  deleted_at     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Departments Table
CREATE TABLE IF NOT EXISTS pf_departments (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Pending Approvals Table
CREATE TABLE IF NOT EXISTS pf_pending_approvals (
  id           TEXT PRIMARY KEY,
  doc_id       TEXT,
  doc_name     TEXT DEFAULT '',
  submitted_by TEXT DEFAULT '',
  dept         TEXT DEFAULT '',
  time         TEXT DEFAULT '',
  status       TEXT DEFAULT 'Pending',
  resolved_at  TEXT,
  reason       TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Access Requests Table
CREATE TABLE IF NOT EXISTS pf_pending_requests (
  id            TEXT PRIMARY KEY,
  resource      TEXT DEFAULT '',
  justification TEXT DEFAULT '',
  status        TEXT DEFAULT 'Pending',
  requested_by  TEXT DEFAULT '',
  time          TEXT DEFAULT '',
  resolved_at   TEXT,
  reason        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS pf_notifications (
  id         TEXT PRIMARY KEY,
  type       TEXT DEFAULT 'info',
  message    TEXT DEFAULT '',
  time       TEXT DEFAULT '',
  read       BOOLEAN DEFAULT FALSE,
  doc_id     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Audit Logs Table
CREATE TABLE IF NOT EXISTS pf_audit_logs (
  id         TEXT PRIMARY KEY,
  user_name  TEXT DEFAULT '',
  action     TEXT DEFAULT '',
  target     TEXT DEFAULT '',
  time       TEXT DEFAULT '',
  hash       TEXT,
  integrity  TEXT DEFAULT 'Verified',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Threat Alerts Table
CREATE TABLE IF NOT EXISTS pf_threat_alerts (
  id         TEXT PRIMARY KEY,
  type       TEXT DEFAULT '',
  message    TEXT DEFAULT '',
  time       TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. System Config Table
CREATE TABLE IF NOT EXISTS pf_config (
  key        TEXT PRIMARY KEY,
  value      JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Collaboration Groups Table
CREATE TABLE IF NOT EXISTS pf_groups (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  privacy     TEXT DEFAULT 'private',
  members     JSONB DEFAULT '[]'::JSONB,
  admin_id    TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE pf_documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_departments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_pending_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_pending_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_audit_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_threat_alerts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_config            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pf_groups            ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'pf_documents','pf_users','pf_departments',
      'pf_pending_approvals','pf_pending_requests',
      'pf_notifications','pf_audit_logs','pf_threat_alerts',
      'pf_config','pf_groups'
    ])
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
END
$$;

-- INITIAL SEED DATA
INSERT INTO pf_departments (name) VALUES
  ('Finance'), ('Legal'), ('Human Resources'), ('IT'), ('Operations'), ('Marketing'), ('Compliance')
ON CONFLICT (name) DO NOTHING;

INSERT INTO pf_users (id, name, role, departments, pin) VALUES
  ('admin-001', 'System Admin', 'Admin', '["IT","Finance","Legal","Human Resources"]'::JSONB, '1234')
ON CONFLICT (id) DO NOTHING;
