import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  loadAllFromDB,
  documentsAPI, usersAPI, departmentsAPI,
  approvalsAPI, requestsAPI, notificationsAPI,
  auditAPI, threatsAPI, configAPI,
} from '../lib/api';
import { isDbConfigured } from '../lib/supabase';
import { storage } from '../lib/storage';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // ── Seed Data ────────────────────────────────────────────────
  const initialDocs = [
    { id: '1', name: 'Finance_Report_Q1_2026.pdf',   dept: 'Finance', status: 'approved',    access: 'Public',        date: '2026-04-20', owner: 'System Admin',   sensitivity: 'Public',       version: 3, content: 'REGIONAL FINANCE SUMMARY - Q1 2026\nRevenue: KES 4.2B\nGrowth: +12% YoY\nStatus: Verified by Central Audit.' },
    { id: '2', name: 'Confidential_M&A_Log.xlsx',    dept: 'Legal',   status: 'confidential', access: 'Restricted',    date: '2026-04-18', owner: 'David Ochieng',  sensitivity: 'Restricted',   version: 1, hasLock: true, content: 'M&A TRANSACTION LOG [ENCRYPTED]\nTarget: Coastal Logistics Ltd\nStatus: Due Diligence Phase\nRisk: High' },
    { id: '3', name: 'HR_Policy_Handbook_2026.docx', dept: 'HR',      status: 'review',       access: 'Internal Only', date: '2026-04-19', owner: 'Sarah Manager',  sensitivity: 'Internal',     version: 2, content: 'STANDARD OPERATING PROCEDURES 2026\n1. Leave Policy\n2. Health Insurance\n3. Disciplinary Framework' },
    { id: '4', name: 'Ops_Manual_Nairobi_v4.pdf',    dept: 'Ops',     status: 'draft',        access: 'Internal Only', date: '2026-04-21', owner: 'Kevin Otieno',   sensitivity: 'Internal',     version: 1, content: 'NAIROBI BRANCH OPERATIONS GUIDE\nGrid maintenance schedule... (STAGING)' },
    { id: '5', name: 'Legal_NDA_Mombasa_Branch.pdf', dept: 'Legal',   status: 'approved',     access: 'Legal Only',    date: '2026-04-17', owner: 'Sarah Kamau',    sensitivity: 'Confidential', version: 4, content: 'NON-DISCLOSURE AGREEMENT\nParties: ProjectFlow KE & Mombasa Port Auth\nTerms: 5 Years Confidentiality' },
  ];
  const initialNotifications = [
    { id: 'n1', type: 'approval', message: 'HR_Policy_Handbook_2026.docx is awaiting your approval.', time: new Date(Date.now() - 120000).toISOString(), read: false, docId: '3' },
    { id: 'n2', type: 'access',   message: 'Kevin Otieno requested access to Legal Contracts library.', time: new Date(Date.now() - 3600000).toISOString(), read: false },
    { id: 'n3', type: 'system',   message: 'Auto-archive scheduled for 12 documents expiring this month.', time: new Date(Date.now() - 7200000).toISOString(), read: true },
  ];

  // ── State ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('portal');
  const [dbReady,   setDbReady]   = useState(false);

  const [documents, setDocuments] = useState(initialDocs);
  const [recycleBin, setRecycleBin] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([
    { id: 'a1', docId: '3', docName: 'HR_Policy_Handbook_2026.docx', submittedBy: 'Grace Njeri', dept: 'HR', time: new Date(Date.now() - 120000).toISOString(), status: 'Pending' }
  ]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [systemUsers, setSystemUsers] = useState([
    { id: 'u1', name: 'System Admin',     role: 'Admin',      departments: ['Finance', 'Legal', 'HR', 'Ops', 'IT'], pin: '0000' },
    { id: 'u2', name: 'Sarah Manager',    role: 'Manager',    departments: ['Finance', 'HR'],                       pin: '1234' },
    { id: 'u3', name: 'Kevin Staff',      role: 'Staff',      departments: ['Ops'],                                 pin: '4321' },
    { id: 'u4', name: 'Guest Contractor', role: 'Restricted', departments: [],                                      pin: '9999' }
  ]);
  const [currentUser, setCurrentUser] = useState(null);
  const [auditLogs, setAuditLogs] = useState([
    { id: Date.now(), user: 'System', action: 'IAM Boot', target: 'Zero Trust Kernel', time: new Date().toISOString() },
  ]);
  const [sharedContent, setSharedContent] = useState('This document outlines the collaborative protocols for the ProjectFlow KE initiative...');
  const [departments, setDepartments] = useState(['Finance', 'Legal', 'HR', 'Ops', 'IT']);
  const [watermarkConfig, setWatermarkConfig] = useState({ enabled: true, text: 'PROJECTFLOW KE - CONFIDENTIAL', opacity: 0.1 });
  const [theme, setTheme] = useState('light');
  const [mfaVerified, setMfaVerified] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({ dept: true, status: true, access: true, owner: true, date: true });
  const [threatAlerts, setThreatAlerts] = useState([
    { id: 1, type: 'info', message: 'Zero-Trust Kernel initialized.', time: new Date().toISOString() }
  ]);
  const [lastHash, setLastHash] = useState('0000000000000000');
  const [activeDocId, setActiveDocId] = useState(null);

  // ── Load from Storage & Supabase on mount ──────────────────────
  useEffect(() => {
    const bootstrap = async () => {
      // 1. Load from Persistent Storage (IDB)
      const savedDocs = await storage.get('pf_docs');
      if (savedDocs) setDocuments(savedDocs);

      const savedRecycle = await storage.get('pf_recycle');
      if (savedRecycle) setRecycleBin(savedRecycle);

      const savedApprovals = await storage.get('pf_approvals');
      if (savedApprovals) setPendingApprovals(savedApprovals);

      const savedRequests = await storage.get('pf_requests');
      if (savedRequests) setPendingRequests(savedRequests);

      const savedNotifs = await storage.get('pf_notifications');
      if (savedNotifs) setNotifications(savedNotifs);

      const savedUsers = await storage.get('pf_users');
      if (savedUsers) setSystemUsers(savedUsers);

      const savedCurrentUser = await storage.get('pf_current_user');
      if (savedCurrentUser) setCurrentUser(savedCurrentUser);

      const savedLogs = await storage.get('pf_logs');
      if (savedLogs) setAuditLogs(savedLogs);

      const savedDepts = await storage.get('pf_depts');
      if (savedDepts) setDepartments(savedDepts);

      const savedWatermark = await storage.get('pf_watermark');
      if (savedWatermark) setWatermarkConfig(savedWatermark);

      const savedTheme = await storage.get('pf_theme');
      if (savedTheme) setTheme(savedTheme);

      const savedThreats = await storage.get('pf_threats');
      if (savedThreats) setThreatAlerts(savedThreats);

      const savedLastHash = await storage.get('pf_last_hash');
      if (savedLastHash) setLastHash(savedLastHash);

      const savedCols = await storage.get('pf_view_cols');
      if (savedCols) setColumnVisibility(savedCols);

      // 2. Sync from Supabase if configured
      if (isDbConfigured) {
        try {
          const data = await loadAllFromDB();
          if (data) {
            const { docs, users, logs, notifications: notifs, departments: depts, approvals, requests, threats } = data;
            if (docs?.length) {
              setDocuments(docs.filter(d => !d.deletedAt));
              const bin = docs.filter(d => d.deletedAt);
              if (bin.length) setRecycleBin(bin);
            }
            if (users?.length) setSystemUsers(users);
            if (logs?.length) setAuditLogs(logs);
            if (notifs?.length) setNotifications(notifs);
            if (depts?.length) setDepartments(depts);
            if (approvals?.length) setPendingApprovals(approvals);
            if (requests?.length) setPendingRequests(requests);
            if (threats?.length) setThreatAlerts(threats);
          }
        } catch (err) {
          console.warn('[DB] Supabase sync failed:', err);
        }
      }
      setDbReady(true);
    };

    bootstrap();
  }, []);

  // ── Persist to Storage ─────────────────────────────────────────
  useEffect(() => {
    if (!dbReady) return; // Wait until initial load is done
    
    storage.set('pf_docs', documents);
    storage.set('pf_recycle', recycleBin);
    storage.set('pf_logs', auditLogs);
    storage.set('pf_users', systemUsers);
    storage.set('pf_current_user', currentUser);
    storage.set('pf_requests', pendingRequests);
    storage.set('pf_approvals', pendingApprovals);
    storage.set('pf_notifications', notifications);
    storage.set('pf_shared_content', sharedContent);
    storage.set('pf_depts', departments);
    storage.set('pf_watermark', watermarkConfig);
    storage.set('pf_theme', theme);
    storage.set('pf_threats', threatAlerts);
    storage.set('pf_last_hash', lastHash);
    storage.set('pf_view_cols', columnVisibility);
  }, [documents, recycleBin, auditLogs, systemUsers, currentUser, pendingRequests, pendingApprovals, notifications, sharedContent, departments, watermarkConfig, theme, threatAlerts, lastHash, columnVisibility, dbReady]);


  // ── Helpers ───────────────────────────────────────────────────
  const userRole = currentUser?.role || 'Guest';
  const userName = currentUser?.name || 'System';

  const generateHash = (data) => {
    const str = JSON.stringify(data) + lastHash;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const hex = Math.abs(hash).toString(16).padStart(16, '0');
    setLastHash(hex);
    return hex;
  };

  const logAction = (user, action, target) => {
    const hash = generateHash({ user, action, target, time: new Date().toISOString() });
    const newLog = { id: Date.now() + Math.random(), user, action, target, time: new Date().toISOString(), hash, integrity: 'Verified' };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 100));
    auditAPI.create(newLog).catch(() => {});
  };

  const pushThreatAlert = (type, message) => {
    const alert = { id: Date.now(), type, message, time: new Date().toISOString() };
    setThreatAlerts(prev => [alert, ...prev].slice(0, 10));
    threatsAPI.create(alert).catch(() => {});
    pushNotification('system', `⚠️ SECURITY ALERT: ${message}`);
  };

  const pushNotification = (type, message, docId = null) => {
    const n = { id: `n${Date.now()}`, type, message, time: new Date().toISOString(), read: false, docId };
    setNotifications(prev => [n, ...prev].slice(0, 30));
    notificationsAPI.create(n).catch(() => {});
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    notificationsAPI.markAllRead().catch(() => {});
  };

  // ── Document Actions ──────────────────────────────────────────
  const addDocument = (doc) => {
    const newDoc = { ...doc, id: Date.now().toString(), status: 'approved', date: new Date().toISOString().split('T')[0], version: 1, owner: userName, sensitivity: doc.sensitivity || 'Internal' };
    setDocuments(prev => [newDoc, ...prev]);
    documentsAPI.upsert(newDoc).catch(() => {});
    logAction(userName, 'Uploaded', newDoc.name);
    pushNotification('system', `${newDoc.name} uploaded to ${newDoc.dept} library.`);
  };

  const transferDocument = (docId, newOwner) => {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, owner: newOwner } : d));
    documentsAPI.update(docId, { owner: newOwner }).catch(() => {});
  };

  const updateDocumentVaultStatus = (docId, vaultPassword) => {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, vaultLocked: true, vaultPassword, hasLock: true } : d));
    documentsAPI.update(docId, { vaultLocked: true, vaultPassword, hasLock: true }).catch(() => {});
    const targetDoc = documents.find(d => d.id === docId);
    logAction(userName, 'Vault Lock Applied', targetDoc?.name);
  };

  const updateDocumentContent = (docId, newContent) => {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, content: newContent, version: (d.version || 1) + 1 } : d));
    const targetDoc = documents.find(d => d.id === docId);
    documentsAPI.update(docId, { content: newContent, version: (targetDoc?.version || 1) + 1 }).catch(() => {});
    logAction(userName, 'Updated Content', targetDoc?.name);
  };

  const deleteDocument = (id) => {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      const deletedDoc = { ...doc, deletedAt: new Date().toISOString() };
      setDocuments(prev => prev.filter(d => d.id !== id));
      setRecycleBin(prev => [...prev, deletedDoc]);
      documentsAPI.update(id, { deletedAt: deletedDoc.deletedAt }).catch(() => {});
      logAction(userName, 'Deleted → Recycle Bin', doc.name);
    }
  };

  const restoreDocument = (id) => {
    const doc = recycleBin.find(d => d.id === id);
    if (doc) {
      setRecycleBin(prev => prev.filter(d => d.id !== id));
      setDocuments(prev => [{ ...doc, deletedAt: undefined }, ...prev]);
      documentsAPI.update(id, { deletedAt: null }).catch(() => {});
      logAction(userName, 'Restored from Recycle Bin', doc.name);
      pushNotification('system', `${doc.name} has been restored to the ${doc.dept} library.`);
    }
  };

  // ── User Actions ──────────────────────────────────────────────
  const registerNewUser = (userProfile) => {
    const newUser = { id: `u${Date.now()}`, ...userProfile };
    setSystemUsers(prev => [...prev, newUser]);
    usersAPI.upsert(newUser).catch(() => {});
    logAction(userName, 'Created New User Identity', newUser.name);
  };

  const updateUser = (userId, updates) => {
    setSystemUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    usersAPI.update(userId, updates).catch(() => {});
    logAction(userName, 'Updated User Identity', userId);
  };

  const deleteUser = (userId) => {
    setSystemUsers(prev => prev.filter(u => u.id !== userId));
    usersAPI.delete(userId).catch(() => {});
    logAction(userName, 'Deleted User Identity', userId);
  };

  const updateUserGroups = (userId, depts) => {
    setSystemUsers(prev => prev.map(u => u.id === userId ? { ...u, departments: depts } : u));
    usersAPI.update(userId, { departments: depts }).catch(() => {});
    logAction(userName, 'Modified Identity Groups', userId);
  };

  // ── Department Actions ────────────────────────────────────────
  const addDepartment = (name) => {
    if (departments.includes(name)) return;
    setDepartments(prev => [...prev, name]);
    departmentsAPI.create(name).catch(() => {});
    logAction(userName, 'Created Department', name);
  };

  const updateDepartment = (oldName, newName) => {
    setDepartments(prev => prev.map(d => d === oldName ? newName : d));
    setDocuments(prev => prev.map(doc => doc.dept === oldName ? { ...doc, dept: newName } : doc));
    departmentsAPI.rename(oldName, newName).catch(() => {});
    logAction(userName, 'Renamed Department', `${oldName} → ${newName}`);
  };

  const deleteDepartment = (name) => {
    setDepartments(prev => prev.filter(d => d !== name));
    departmentsAPI.delete(name).catch(() => {});
    logAction(userName, 'Deleted Department', name);
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // ── Workflow Engine ───────────────────────────────────────────
  const submitForApproval = (docId, optionalDoc = null) => {
    const doc = optionalDoc || documents.find(d => d.id === docId);
    if (!doc) return;
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'review' } : d));
    documentsAPI.update(docId, { status: 'review' }).catch(() => {});
    const approval = { id: `a${Date.now()}`, docId, docName: doc.name, submittedBy: userName, dept: doc.dept, time: new Date().toISOString(), status: 'Pending' };
    setPendingApprovals(prev => [approval, ...prev]);
    approvalsAPI.create(approval).catch(() => {});
    logAction(userName, 'Submitted for Approval', doc.name);
    pushNotification('approval', `${doc.name} submitted for Manager approval. Workflow triggered.`, docId);
  };

  const approveDocument = (approvalId) => {
    const approval = pendingApprovals.find(a => a.id === approvalId);
    if (!approval) return;
    const resolvedAt = new Date().toISOString();
    setPendingApprovals(prev => prev.map(a => a.id === approvalId ? { ...a, status: 'Approved', resolvedAt } : a));
    approvalsAPI.update(approvalId, { status: 'Approved', resolvedAt }).catch(() => {});
    setDocuments(prev => prev.map(d => d.id === approval.docId ? { ...d, status: 'approved', version: (d.version || 1) + 1 } : d));
    documentsAPI.update(approval.docId, { status: 'approved' }).catch(() => {});
    logAction(userName, 'Approved', approval.docName);
    pushNotification('approval', `✅ ${approval.docName} has been approved and is now live.`, approval.docId);
  };

  const rejectDocument = (approvalId, reason = 'Requires revision') => {
    const approval = pendingApprovals.find(a => a.id === approvalId);
    if (!approval) return;
    const resolvedAt = new Date().toISOString();
    setPendingApprovals(prev => prev.map(a => a.id === approvalId ? { ...a, status: 'Rejected', resolvedAt, reason } : a));
    approvalsAPI.update(approvalId, { status: 'Rejected', resolvedAt, reason }).catch(() => {});
    setDocuments(prev => prev.map(d => d.id === approval.docId ? { ...d, status: 'draft' } : d));
    documentsAPI.update(approval.docId, { status: 'draft' }).catch(() => {});
    logAction(userName, 'Rejected', approval.docName);
    pushNotification('approval', `❌ ${approval.docName} was rejected. Reason: ${reason}. Returned to Draft.`, approval.docId);
  };

  const signDocument = (docId) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || doc.status !== 'approved') return;
    const signature = `PF-SIG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const certifiedAt = new Date().toISOString();
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'certified', signature, certifiedBy: userName, certifiedAt } : d));
    documentsAPI.update(docId, { status: 'certified', signature, certifiedBy: userName, certifiedAt }).catch(() => {});
    logAction(userName, 'Applied Digital Signature', doc.name);
    pushNotification('system', `🔏 ${doc.name} has been Digitally Certified. Signature: ${signature}`);
  };

  const archiveDocument = (docId) => {
    const doc = documents.find(d => d.id === docId);
    if (doc) {
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'archived' } : d));
      documentsAPI.update(docId, { status: 'archived' }).catch(() => {});
      logAction(userName, 'Archived', doc.name);
      pushNotification('system', `${doc.name} has been archived. Access preserved for audit.`);
    }
  };

  // ── Access Requests ───────────────────────────────────────────
  const requestAccess = (resource, justification) => {
    const newRequest = { id: Date.now(), resource, justification, status: 'Pending', requestedBy: userName, time: new Date().toISOString() };
    setPendingRequests(prev => [newRequest, ...prev]);
    requestsAPI.create(newRequest).catch(() => {});
    logAction(userName, 'Requested Access', resource);
    pushNotification('access', `Access requested for ${resource}. Pending manager review.`);
  };

  const approveRequest = (requestId) => {
    const resolvedAt = new Date().toISOString();
    setPendingRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'Approved', resolvedAt } : r));
    requestsAPI.update(requestId, { status: 'Approved', resolvedAt }).catch(() => {});
    const req = pendingRequests.find(r => r.id === requestId);
    if (req) {
      const requestingUser = systemUsers.find(u => u.name === req.requestedBy);
      if (requestingUser) {
        const newDepts = [...new Set([...requestingUser.departments, req.resource])];
        updateUserGroups(requestingUser.id, newDepts);
      }
      logAction(userName, 'Approved Access Request', req.resource);
      pushNotification('access', `✅ Access to ${req.resource} has been granted to ${req.requestedBy}.`);
    }
  };

  const rejectAccessRequest = (requestId, reason = 'Insufficient justification') => {
    const resolvedAt = new Date().toISOString();
    setPendingRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'Rejected', resolvedAt, reason } : r));
    requestsAPI.update(requestId, { status: 'Rejected', resolvedAt, reason }).catch(() => {});
    const req = pendingRequests.find(r => r.id === requestId);
    if (req) {
      logAction(userName, 'Rejected Access Request', req.resource);
      pushNotification('access', `❌ Access to ${req.resource} was denied for ${req.requestedBy}. Reason: ${reason}`);
    }
  };

  // ── Watermark config sync ────────────────────────────────────
  const updateWatermarkConfig = (config) => {
    setWatermarkConfig(config);
    configAPI.set('watermark', config).catch(() => {});
  };

  // ── Computed ──────────────────────────────────────────────────
  const unreadCount          = notifications.filter(n => !n.read).length;
  const pendingApprovalCount = pendingApprovals.filter(a => a.status === 'Pending').length;

  // ── Context Value ─────────────────────────────────────────────
  return (
    <AppContext.Provider value={{
      activeTab, setActiveTab,
      dbReady, isDbConfigured,

      systemUsers, currentUser, setCurrentUser,
      setUserRole: (role) => setCurrentUser(prev => prev ? { ...prev, role } : null),
      userRole, userName,
      registerNewUser, updateUser, deleteUser, updateUserGroups,

      documents, recycleBin,
      pendingApprovals, pendingApprovalCount, pendingRequests,
      notifications, unreadCount, markAllRead,
      auditLogs,
      sharedContent, setSharedContent,

      addDocument, deleteDocument, restoreDocument,
      submitForApproval, approveDocument, rejectDocument,
      archiveDocument, requestAccess, approveRequest, rejectAccessRequest,
      logAction, pushNotification,
      updateDocumentContent, transferDocument, updateDocumentVaultStatus,

      departments, addDepartment, updateDepartment, deleteDepartment,
      watermarkConfig, setWatermarkConfig: updateWatermarkConfig,
      theme, toggleTheme,
      mfaVerified, setMfaVerified,
      threatAlerts, pushThreatAlert,
      lastHash, signDocument,
      columnVisibility, setColumnVisibility,
      activeDocId, setActiveDocId,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
