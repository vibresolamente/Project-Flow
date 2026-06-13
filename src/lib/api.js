/**
 * ProjectFlow KE — Database API Layer
 * All reads/writes go through this file.
 * Falls back silently when Supabase is not configured.
 */
import { supabase, isDbConfigured } from './supabase';

// ── Guard: no-op when DB is not configured ──────────────────────
const guard = () => !isDbConfigured || !supabase;

// ── Field Mappers ────────────────────────────────────────────────
const toDoc = (r) => ({
  id: r.id, name: r.name, dept: r.dept, status: r.status,
  access: r.access, date: r.date, owner: r.owner,
  sensitivity: r.sensitivity, version: r.version, content: r.content,
  hasLock: r.has_lock, vaultLocked: r.vault_locked,
  vaultPassword: r.vault_password, signature: r.signature,
  certifiedBy: r.certified_by, certifiedAt: r.certified_at,
  deletedAt: r.deleted_at,
});

const fromDoc = (d) => ({
  id: d.id, name: d.name, dept: d.dept, status: d.status,
  access: d.access, date: d.date, owner: d.owner,
  sensitivity: d.sensitivity, version: d.version, content: d.content,
  has_lock: d.hasLock || false, vault_locked: d.vaultLocked || false,
  vault_password: d.vaultPassword || null, signature: d.signature || null,
  certified_by: d.certifiedBy || null, certified_at: d.certifiedAt || null,
  deleted_at: d.deletedAt || null,
});

const toApproval = (r) => ({
  id: r.id, docId: r.doc_id, docName: r.doc_name,
  submittedBy: r.submitted_by, dept: r.dept, time: r.time,
  status: r.status, resolvedAt: r.resolved_at, reason: r.reason,
});

const fromApproval = (a) => ({
  id: a.id, doc_id: a.docId, doc_name: a.docName,
  submitted_by: a.submittedBy, dept: a.dept, time: a.time,
  status: a.status, resolved_at: a.resolvedAt || null, reason: a.reason || null,
});

const toRequest = (r) => ({
  id: r.id, resource: r.resource, justification: r.justification,
  status: r.status, requestedBy: r.requested_by, time: r.time,
  resolvedAt: r.resolved_at, reason: r.reason,
});

const fromRequest = (r) => ({
  id: String(r.id), resource: r.resource, justification: r.justification,
  status: r.status, requested_by: r.requestedBy, time: r.time,
  resolved_at: r.resolvedAt || null, reason: r.reason || null,
});

const toLog = (r) => ({
  id: r.id, user: r.user_name, action: r.action, target: r.target,
  time: r.time, hash: r.hash, integrity: r.integrity,
});

const fromLog = (l) => ({
  id: String(l.id), user_name: l.user, action: l.action,
  target: l.target, time: l.time, hash: l.hash || null,
  integrity: l.integrity || 'Verified',
});

// ── Documents ────────────────────────────────────────────────────
export const documentsAPI = {
  async getAll() {
    if (guard()) return null;
    const { data, error } = await supabase
      .from('pf_documents')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.warn('[DB] getAll documents:', error.message); return null; }
    return data.map(toDoc);
  },

  async upsert(doc) {
    if (guard()) return;
    const { error } = await supabase
      .from('pf_documents')
      .upsert(fromDoc(doc), { onConflict: 'id' });
    if (error) console.warn('[DB] upsert document:', error.message);
  },

  async update(id, updates) {
    if (guard()) return;
    // Map camelCase keys to snake_case for partial updates
    const mapped = {};
    if (updates.status       !== undefined) mapped.status        = updates.status;
    if (updates.version      !== undefined) mapped.version       = updates.version;
    if (updates.content      !== undefined) mapped.content       = updates.content;
    if (updates.owner        !== undefined) mapped.owner         = updates.owner;
    if (updates.hasLock      !== undefined) mapped.has_lock      = updates.hasLock;
    if (updates.vaultLocked  !== undefined) mapped.vault_locked  = updates.vaultLocked;
    if (updates.vaultPassword!== undefined) mapped.vault_password= updates.vaultPassword;
    if (updates.signature    !== undefined) mapped.signature     = updates.signature;
    if (updates.certifiedBy  !== undefined) mapped.certified_by  = updates.certifiedBy;
    if (updates.certifiedAt  !== undefined) mapped.certified_at  = updates.certifiedAt;
    if (updates.deletedAt    !== undefined) mapped.deleted_at    = updates.deletedAt;
    const { error } = await supabase
      .from('pf_documents')
      .update(mapped)
      .eq('id', id);
    if (error) console.warn('[DB] update document:', error.message);
  },

  async delete(id) {
    if (guard()) return;
    const { error } = await supabase
      .from('pf_documents')
      .delete()
      .eq('id', id);
    if (error) console.warn('[DB] delete document:', error.message);
  },
};

// ── Users ─────────────────────────────────────────────────────────
export const usersAPI = {
  async getAll() {
    if (guard()) return null;
    const { data, error } = await supabase
      .from('pf_users')
      .select('*');
    if (error) { console.warn('[DB] getAll users:', error.message); return null; }
    return data.map(r => ({
      id: r.id, name: r.name, role: r.role,
      departments: r.departments || [], pin: r.pin,
    }));
  },

  async upsert(user) {
    if (guard()) return;
    const { error } = await supabase
      .from('pf_users')
      .upsert({ id: user.id, name: user.name, role: user.role, departments: user.departments || [], pin: user.pin }, { onConflict: 'id' });
    if (error) console.warn('[DB] upsert user:', error.message);
  },

  async update(id, updates) {
    if (guard()) return;
    const mapped = {};
    if (updates.name        !== undefined) mapped.name        = updates.name;
    if (updates.role        !== undefined) mapped.role        = updates.role;
    if (updates.departments !== undefined) mapped.departments = updates.departments;
    if (updates.pin         !== undefined) mapped.pin         = updates.pin;
    const { error } = await supabase
      .from('pf_users')
      .update(mapped)
      .eq('id', id);
    if (error) console.warn('[DB] update user:', error.message);
  },

  async delete(id) {
    if (guard()) return;
    const { error } = await supabase
      .from('pf_users')
      .delete()
      .eq('id', id);
    if (error) console.warn('[DB] delete user:', error.message);
  },
};

// ── Departments ───────────────────────────────────────────────────
export const departmentsAPI = {
  async getAll() {
    if (guard()) return null;
    const { data, error } = await supabase
      .from('pf_departments')
      .select('name')
      .order('name');
    if (error) { console.warn('[DB] getAll departments:', error.message); return null; }
    return data.map(r => r.name);
  },

  async create(name) {
    if (guard()) return;
    const { error } = await supabase
      .from('pf_departments')
      .insert({ name });
    if (error) console.warn('[DB] create department:', error.message);
  },

  async rename(oldName, newName) {
    if (guard()) return;
    const { error } = await supabase
      .from('pf_departments')
      .update({ name: newName })
      .eq('name', oldName);
    if (error) console.warn('[DB] rename department:', error.message);
  },

  async delete(name) {
    if (guard()) return;
    const { error } = await supabase
      .from('pf_departments')
      .delete()
      .eq('name', name);
    if (error) console.warn('[DB] delete department:', error.message);
  },
};

// ── Approvals ─────────────────────────────────────────────────────
export const approvalsAPI = {
  async getAll() {
    if (guard()) return null;
    const { data, error } = await supabase
      .from('pf_pending_approvals')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.warn('[DB] getAll approvals:', error.message); return null; }
    return data.map(toApproval);
  },

  async create(approval) {
    if (guard()) return;
    const { error } = await supabase
      .from('pf_pending_approvals')
      .insert(fromApproval(approval));
    if (error) console.warn('[DB] create approval:', error.message);
  },

  async update(id, updates) {
    if (guard()) return;
    const mapped = {};
    if (updates.status     !== undefined) mapped.status      = updates.status;
    if (updates.resolvedAt !== undefined) mapped.resolved_at = updates.resolvedAt;
    if (updates.reason     !== undefined) mapped.reason      = updates.reason;
    const { error } = await supabase
      .from('pf_pending_approvals')
      .update(mapped)
      .eq('id', id);
    if (error) console.warn('[DB] update approval:', error.message);
  },
};

// ── Access Requests ───────────────────────────────────────────────
export const requestsAPI = {
  async getAll() {
    if (guard()) return null;
    const { data, error } = await supabase
      .from('pf_pending_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.warn('[DB] getAll requests:', error.message); return null; }
    return data.map(toRequest);
  },

  async create(req) {
    if (guard()) return;
    const { error } = await supabase
      .from('pf_pending_requests')
      .insert(fromRequest(req));
    if (error) console.warn('[DB] create request:', error.message);
  },

  async update(id, updates) {
    if (guard()) return;
    const mapped = {};
    if (updates.status     !== undefined) mapped.status      = updates.status;
    if (updates.resolvedAt !== undefined) mapped.resolved_at = updates.resolvedAt;
    if (updates.reason     !== undefined) mapped.reason      = updates.reason;
    const { error } = await supabase
      .from('pf_pending_requests')
      .update(mapped)
      .eq('id', String(id));
    if (error) console.warn('[DB] update request:', error.message);
  },
};

// ── Notifications ─────────────────────────────────────────────────
export const notificationsAPI = {
  async getAll() {
    if (guard()) return null;
    const { data, error } = await supabase
      .from('pf_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) { console.warn('[DB] getAll notifications:', error.message); return null; }
    return data.map(r => ({
      id: r.id, type: r.type, message: r.message,
      time: r.time, read: r.read, docId: r.doc_id,
    }));
  },

  async create(n) {
    if (guard()) return;
    const { error } = await supabase
      .from('pf_notifications')
      .insert({ id: n.id, type: n.type, message: n.message, time: n.time, read: n.read, doc_id: n.docId || null });
    if (error) console.warn('[DB] create notification:', error.message);
  },

  async markAllRead() {
    if (guard()) return;
    const { error } = await supabase
      .from('pf_notifications')
      .update({ read: true })
      .eq('read', false);
    if (error) console.warn('[DB] markAllRead:', error.message);
  },
};

// ── Audit Logs ─────────────────────────────────────────────────────
export const auditAPI = {
  async getAll() {
    if (guard()) return null;
    const { data, error } = await supabase
      .from('pf_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) { console.warn('[DB] getAll audit:', error.message); return null; }
    return data.map(toLog);
  },

  async create(log) {
    if (guard()) return;
    const { error } = await supabase
      .from('pf_audit_logs')
      .insert(fromLog(log));
    if (error) console.warn('[DB] create audit log:', error.message);
  },
};

// ── Threat Alerts ─────────────────────────────────────────────────
export const threatsAPI = {
  async getAll() {
    if (guard()) return null;
    const { data, error } = await supabase
      .from('pf_threat_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) { console.warn('[DB] getAll threats:', error.message); return null; }
    return data.map(r => ({ id: r.id, type: r.type, message: r.message, time: r.time }));
  },

  async create(alert) {
    if (guard()) return;
    const { error } = await supabase
      .from('pf_threat_alerts')
      .insert({ id: String(alert.id), type: alert.type, message: alert.message, time: alert.time });
    if (error) console.warn('[DB] create threat:', error.message);
  },
};

// ── Config ────────────────────────────────────────────────────────
export const configAPI = {
  async get(key) {
    if (guard()) return null;
    const { data, error } = await supabase
      .from('pf_config')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (error) { console.warn('[DB] config get:', error.message); return null; }
    return data?.value ?? null;
  },

  async set(key, value) {
    if (guard()) return;
    const { error } = await supabase
      .from('pf_config')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) console.warn('[DB] config set:', error.message);
  },
};

// ── Groups ────────────────────────────────────────────────────────
export const groupsAPI = {
  async getAll() {
    if (guard()) return null;
    const { data, error } = await supabase
      .from('pf_groups')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.warn('[DB] getAll groups:', error.message); return null; }
    return data;
  },

  async upsert(group) {
    if (guard()) return;
    const { error } = await supabase
      .from('pf_groups')
      .upsert({ 
        id: group.id, 
        name: group.name, 
        description: group.description, 
        privacy: group.privacy, 
        members: group.members, 
        admin_id: group.adminId,
        created_at: group.createdAt 
      }, { onConflict: 'id' });
    if (error) console.warn('[DB] upsert group:', error.message);
  },

  async delete(id) {
    if (guard()) return;
    const { error } = await supabase
      .from('pf_groups')
      .delete()
      .eq('id', id);
    if (error) console.warn('[DB] delete group:', error.message);
  },
};
// ── Bootstrap: load all data from Supabase ────────────────────────
export async function loadAllFromDB() {
  if (guard()) return null;

  // Safe execution wrapper for each API call
  const safeCall = async (apiPromise) => {
    try {
      return await apiPromise;
    } catch (err) {
      console.warn('[DB] Load query failed:', err);
      return null;
    }
  };

  const isOffline = () => localStorage.getItem('pf_supabase_offline') === 'true';

  // Run queries sequentially with a tiny spacing (10ms) to prevent slamming HTTP/2 stream bounds.
  // Check the offline status between queries to immediately abort if a connection error marks us offline.
  const docs = await safeCall(documentsAPI.getAll());
  if (isOffline()) return null;
  await new Promise(r => setTimeout(r, 10));

  const users = await safeCall(usersAPI.getAll());
  if (isOffline()) return null;
  await new Promise(r => setTimeout(r, 10));

  const logs = await safeCall(auditAPI.getAll());
  if (isOffline()) return null;
  await new Promise(r => setTimeout(r, 10));

  const notifications = await safeCall(notificationsAPI.getAll());
  if (isOffline()) return null;
  await new Promise(r => setTimeout(r, 10));

  const departments = await safeCall(departmentsAPI.getAll());
  if (isOffline()) return null;
  await new Promise(r => setTimeout(r, 10));

  const approvals = await safeCall(approvalsAPI.getAll());
  if (isOffline()) return null;
  await new Promise(r => setTimeout(r, 10));

  const requests = await safeCall(requestsAPI.getAll());
  if (isOffline()) return null;
  await new Promise(r => setTimeout(r, 10));

  const threats = await safeCall(threatsAPI.getAll());
  if (isOffline()) return null;
  await new Promise(r => setTimeout(r, 10));

  const groups = await safeCall(groupsAPI.getAll());

  return { docs, users, logs, notifications, departments, approvals, requests, threats, groups };
}
