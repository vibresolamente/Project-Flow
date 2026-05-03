import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  ShieldAlert,
  ShieldCheck,
  Bell, 
  Search, 
  Settings, 
  ChevronRight,
  FolderLock,
  History,
  CheckCircle2,
  Lock,
  Plus,
  Rocket,
  Upload,
  FileBadge,
  Activity,
  Globe,
  Database,
  Terminal,
  X,
  Zap,
  Menu,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CollaborationWorkspace from './components/CollaborationWorkspace';
import UserDashboard from './components/UserDashboard';
import DataTransferHub from './components/DataTransferHub';
import AccessRequestSystem from './components/AccessRequestSystem';
import GlobalSearch from './components/GlobalSearch';
import UserAnalytics from './components/UserAnalytics';
import KnowledgeBase from './components/KnowledgeBase';
import DepartmentView from './components/DepartmentView';
import SystemTesting from './components/SystemTesting';
import GovernanceCenter from './components/GovernanceCenter';
import UploadView from './components/UploadView';
import WorkflowManager from './components/WorkflowManager';
import NotificationPanel from './components/NotificationPanel';
import AuthGate from './components/AuthGate';
import IdentityManager from './components/IdentityManager';
import VaultSecurity from './components/VaultSecurity';
import ThreatDashboard from './components/ThreatDashboard';
import UploadForm from './components/UploadForm';
import ViewManager from './components/ViewManager';

import { useApp } from './context/AppContext';

const ApplicationLayout = () => {
  const { activeTab, setActiveTab, userRole, setUserRole, pendingRequests, addDocument, unreadCount, pendingApprovalCount, theme, toggleTheme } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewManager, setShowViewManager] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // THEME MANAGEMENT
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // SESSION TIMEOUT (5 MINS)
  useEffect(() => {
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (localStorage.getItem('pf_current_user')) {
           localStorage.removeItem('pf_current_user');
           window.location.reload();
        }
      }, 300000); // 5 minutes
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      clearTimeout(timeout);
    };
  }, []);

  // FUNCTIONAL EXPANSION: Unified Navigation Handler
  const navigateTo = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* PROFESSIONAL TOP NAVIGATION */}
      <header className="top-nav justify-between gap-4 lg:gap-8 px-4 md:px-8">
        <div className="flex items-center gap-3 md:gap-4 min-w-fit">
          <button 
            className="lg:hidden p-2 -ml-2 text-muted-foreground hover:bg-muted rounded-md"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('portal')}>
            <div className="h-8 w-8 md:h-9 md:w-9 rounded bg-primary flex items-center justify-center text-white shrink-0">
              <Lock size={18} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base md:text-lg font-bold leading-none text-primary">ProjectFlow KE</h1>
              <p className="tagline">Secure Collaboration</p>
            </div>
          </div>
        </div>

        {/* TOP SEARCH (HIDDEN ON MOBILE) */}
        <div className="flex-1 hidden md:flex justify-center max-w-xl mx-4">
          <div className="search-bar cursor-pointer" onClick={() => navigateTo('search')}>
            <Search size={16} className="text-muted-foreground" />
            <input type="text" placeholder="Advanced Search..." readOnly />
            <div className="text-[10px] bg-muted px-2 py-1 rounded text-muted-foreground font-bold uppercase hidden lg:block">CMD+K</div>
          </div>
        </div>

        <nav className="flex items-center gap-1 md:gap-2">
          <div className="hidden lg:flex items-center gap-1">
            <TopNavLink label="Home" active={activeTab === 'portal'} onClick={() => navigateTo('portal')} />
            <TopNavLink label="Documents" active={activeTab === 'docs'} onClick={() => navigateTo('docs')} />
            <TopNavLink label="Departments" active={activeTab === 'depts'} onClick={() => navigateTo('depts')} />
            <TopNavLink label="Analytics" active={activeTab === 'analytics'} onClick={() => navigateTo('analytics')} />
          </div>
          
          {userRole === 'Admin' && (
            <div className="hidden lg:flex items-center">
              <div className="h-6 w-px bg-border mx-1"></div>
              <button onClick={() => navigateTo('identity')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 mx-1 ${activeTab === 'identity' ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}><Users size={14}/> identities</button>
              <button onClick={() => navigateTo('vault')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 mx-1 ${activeTab === 'vault' ? 'bg-red-600 text-white shadow-md' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}><Lock size={14}/> Secure Vault</button>
            </div>
          )}

          <div className="h-6 w-px bg-border mx-2"></div>
          
          <button className="p-2 text-muted-foreground hover:text-primary transition-colors" onClick={() => navigateTo('threats')}>
            <ShieldAlert size={20} className={activeTab === 'threats' ? 'text-red-600' : ''} />
          </button>
          
          <button 
            className="p-2 text-muted-foreground hover:text-primary transition-colors" 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Lock size={20} /> : <Zap size={20} className="text-amber-400" />}
          </button>

          <div className="relative">
            <button className="p-2 text-muted-foreground hover:text-primary transition-colors relative" onClick={() => setNotifOpen(o => !o)}>
              <Bell size={20} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '6px', right: '6px', background: '#DC2626', width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #fff' }}></span>
              )}
            </button>
            <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
          </div>
          <div 
            className="h-8 w-8 rounded bg-primary text-white flex items-center justify-center font-bold text-xs ml-2 cursor-pointer hover:ring-2 ring-emerald-200 transition-all active:scale-95 shadow-lg"
            onClick={() => {
              if (window.confirm("Terminate strict simulated session and return to AuthGate?")) {
                  localStorage.removeItem('pf_current_user');
                  window.location.reload();
              }
            }}
            title={`Terminate Session (Current Identity: ${userRole})`}
          >
            {userRole[0] + (userRole[1] || '')}
          </div>
        </nav>
      </header>

      <div className="flex flex-1">
        {/* SIDE NAVIGATION (DESKTOP) */}
        <aside className="side-nav hidden lg:flex flex-col gap-6">
          <SidebarContent 
            activeTab={activeTab} 
            navigateTo={navigateTo} 
            userRole={userRole} 
            pendingApprovalCount={pendingApprovalCount} 
          />
        </aside>

        {/* MOBILE SIDEBAR DRAWER */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm lg:hidden"
              />
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[160] shadow-2xl flex flex-col lg:hidden"
              >
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-white">
                      <Lock size={18} />
                    </div>
                    <span className="font-bold text-primary">Navigation</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 pb-24 flex flex-col gap-6">
                  <SidebarContent 
                    activeTab={activeTab} 
                    navigateTo={navigateTo} 
                    userRole={userRole} 
                    pendingApprovalCount={pendingApprovalCount} 
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* MAIN CONTENT AREA */}
        <main className={`flex-1 bg-subtle overflow-y-auto ${activeTab === 'collab' ? 'p-0' : 'p-4 md:p-8'}`}>
          <div className={activeTab === 'collab' ? 'h-full w-full' : 'max-w-7xl mx-auto'}>
            {/* MOBILE SEARCH BAR */}
            <div className="md:hidden mb-4">
              <div
                className="search-bar cursor-pointer"
                onClick={() => navigateTo('search')}
                style={{ maxWidth: '100%' }}
              >
                <Search size={16} className="text-muted-foreground" />
                <input type="text" placeholder="Search documents, users..." readOnly />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'portal' && <PortalView key="portal" navigate={navigateTo} onUploadClick={() => setShowUploadModal(true)} />}
              {activeTab === 'docs' && <DocumentCenterView key="docs" navigate={navigateTo} onUploadClick={() => setShowUploadModal(true)} setShowViewManager={setShowViewManager} showViewManager={showViewManager} />}
              {activeTab === 'collab' && <CollaborationWorkspace key="collab" />}
              {activeTab === 'dashboard' && <UserDashboard key="dashboard" />}
              {activeTab === 'search' && <GlobalSearch key="search" />}
              {activeTab === 'requests' && <AccessRequestSystem key="requests" />}
              {activeTab === 'analytics' && <UserAnalytics key="analytics" />}
              {activeTab === 'kb' && <KnowledgeBase key="kb" />}
              {activeTab === 'depts' && <DepartmentView key="depts" navigate={navigateTo} onUploadClick={() => setShowUploadModal(true)} />}
              {activeTab === 'audit' && <GovernanceCenter key="audit" />}
              {activeTab === 'testing' && <SystemTesting key="testing" />}
              {activeTab === 'workflow' && <WorkflowManager key="workflow" />}
              {activeTab === 'identity' && <IdentityManager key="identity" />}
              {activeTab === 'vault' && <VaultSecurity key="vault" />}
              {activeTab === 'threats' && <ThreatDashboard key="threats" />}
              {activeTab === 'transfer' && <DataTransferHub key="transfer" />}

              
              {activeTab === 'upload' && (
                <UploadView key="upload" onUpload={(docDetails) => {
                  addDocument(docDetails);
                  navigateTo('docs');
                }} />
              )}
            </AnimatePresence>

            {/* GLOBAL MODALS [v2.1] */}
            <AnimatePresence>
              {showViewManager && <ViewManager key="view-manager" onClose={() => setShowViewManager(false)} />}
              {showUploadModal && (
                <div key="upload-modal" className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="card w-full max-w-lg shadow-2xl p-0 overflow-hidden font-sans">
                    <div className="bg-primary p-6 text-center text-white border-b border-emerald-800 relative">
                      <button onClick={() => setShowUploadModal(false)} className="absolute py-2 px-3 right-0 top-0 text-white/50 hover:bg-white/10 transition-colors"><X size={16} /></button>
                      <Upload className="mx-auto text-white h-10 w-10 mb-3" />
                      <h3 className="font-bold tracking-widest uppercase text-sm">Secure Ingest Portal</h3>
                      <p className="text-xs text-emerald-100 mt-1">Direct upload to SharePoint library</p>
                    </div>
                    <div className="p-8 bg-white">
                      <UploadForm 
                        onUpload={(doc) => {
                          addDocument(doc);
                          setShowUploadModal(false);
                          if (activeTab !== 'docs' && activeTab !== 'depts') navigateTo('docs');
                        }} 
                        onCancel={() => setShowUploadModal(false)}
                      />
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-bottom-nav-item ${activeTab === 'portal' ? 'active' : ''}`}
          onClick={() => navigateTo('portal')}
        >
          <LayoutDashboard size={22} />
          Home
        </button>
        <button
          className={`mobile-bottom-nav-item ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => navigateTo('docs')}
        >
          <FileText size={22} />
          Docs
        </button>
        <button
          className={`mobile-bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => navigateTo('dashboard')}
        >
          <FileBadge size={22} />
          My Files
        </button>
        {['Admin', 'Manager'].includes(userRole) && (
          <button
            className={`mobile-bottom-nav-item ${activeTab === 'workflow' ? 'active' : ''}`}
            onClick={() => navigateTo('workflow')}
          >
            <Zap size={22} />
            Workflow
          </button>
        )}
        <button
          className={`mobile-bottom-nav-item ${activeTab === 'collab' ? 'active' : ''}`}
          onClick={() => navigateTo('collab')}
        >
          <Rocket size={22} />
          Collab
        </button>
        <button
          className={`mobile-bottom-nav-item ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => navigateTo('upload')}
        >
          <Upload size={22} />
          Upload
        </button>
      </nav>
    </div>
  );
};

const SidebarContent = ({ activeTab, navigateTo, userRole, pendingApprovalCount }) => (
  <>
    <div>
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Core Modules</h3>
      <div className="space-y-1">
        <SideNavLink icon={<LayoutDashboard size={18} />} label="Home Portal" active={activeTab === 'portal'} onClick={() => navigateTo('portal')} />
        <SideNavLink icon={<FolderLock size={18} />} label="Document Center" active={activeTab === 'docs'} onClick={() => navigateTo('docs')} />
        <SideNavLink icon={<Users size={18} />} label="Departments" active={activeTab === 'depts'} onClick={() => navigateTo('depts')} />
        <SideNavLink icon={<Activity size={18} />} label="Analytics" active={activeTab === 'analytics'} onClick={() => navigateTo('analytics')} />
        <SideNavLink icon={<FileBadge size={18} />} label="My Dashboard" active={activeTab === 'dashboard'} onClick={() => navigateTo('dashboard')} />
        <SideNavLink icon={<Upload size={18} />} label="Upload Center" active={activeTab === 'upload'} onClick={() => navigateTo('upload')} />
        <SideNavLink icon={<ShieldCheck size={18} />} label="Governance Hub" active={activeTab === 'audit'} onClick={() => navigateTo('audit')} />
        <SideNavLink icon={<ArrowRightLeft size={18} />} label="Data Transfer" active={activeTab === 'transfer'} onClick={() => navigateTo('transfer')} />
        <SideNavLink icon={<Rocket size={18} />} label="Collaborate" active={activeTab === 'collab'} onClick={() => navigateTo('collab')} />
      </div>
    </div>
    
    {['Admin', 'Manager'].includes(userRole) && (
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#6b7280' }}>Management</h3>
        <div className="space-y-1">
          <SideNavLink icon={<Zap size={18} />} label={`Workflow Engine ${pendingApprovalCount > 0 ? `(${pendingApprovalCount})` : ''}`} active={activeTab === 'workflow'} onClick={() => navigateTo('workflow')} highlight={pendingApprovalCount > 0} />
          <SideNavLink icon={<ShieldAlert size={18} />} label="Access Requests" active={activeTab === 'requests'} onClick={() => navigateTo('requests')} />
          <SideNavLink icon={<Globe size={18} />} label="Knowledge Base" active={activeTab === 'kb'} onClick={() => navigateTo('kb')} />
          <SideNavLink icon={<Terminal size={18} />} label="System Testing" active={activeTab === 'testing'} onClick={() => navigateTo('testing')} />
        </div>
      </div>
    )}

    {['Admin'].includes(userRole) && (
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 mt-6" style={{ color: '#6b7280' }}>Zero-Trust Admin</h3>
        <div className="space-y-1">
          <SideNavLink icon={<Lock size={18} className="text-red-600" />} label="Vault Security" active={activeTab === 'vault'} onClick={() => navigateTo('vault')} />
          <SideNavLink icon={<Users size={18} />} label="Identity Manager" active={activeTab === 'identity'} onClick={() => navigateTo('identity')} />
        </div>
      </div>
    )}

    <div className="mt-auto">
      <div className="p-4 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center gap-2 text-emerald-700 font-bold text-[11px] mb-1">
          <ShieldCheck size={14} />
          Identity: {userRole}
        </div>
        <p className="text-[10px] text-muted-foreground font-semibold">Active Directory Synced</p>
      </div>
    </div>
  </>
);

const TopNavLink = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold transition-all border-b-2 ${
      active 
        ? 'border-primary text-primary' 
        : 'border-transparent hover:border-primary/30 hover:bg-muted/50'
    }`}
    style={{ color: active ? 'var(--primary)' : '#1f2937' }}
  >
    {label}
  </button>
);

const SideNavLink = ({ icon, label, active, onClick, highlight }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors text-sm font-semibold ${
      active ? 'bg-primary text-white' : 'hover:bg-muted'
    }`}
    style={{ color: active ? '#ffffff' : '#1f2937' }}
  >
    {icon}
    <span className="flex-1 text-left">{label}</span>
    {highlight && !active && (
      <span style={{ background: '#DC2626', width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite', flexShrink: 0 }}></span>
    )}
  </button>
);

const PlaceholderView = ({ title }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="flex flex-col items-center justify-center p-20 text-center"
  >
    <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center text-primary mb-6">
      <Database size={40} />
    </div>
    <h2 className="text-4xl font-bold mb-4">{title} Module</h2>
    <p className="text-muted-foreground max-w-md">
      This module is being initialized with your regional SharePoint database. 
      Access, permissions, and Power Automate flows are active.
    </p>
    <button className="btn btn-primary mt-8 px-10">Initialize Workspace</button>
  </motion.div>
);

const PortalView = ({ navigate, onUploadClick }) => {
  const { documents, pendingApprovals, auditLogs, unreadCount } = useApp();
  
  // Dynamic Calculations (Simulated SharePoint aggregations)
  const totalDocs = documents.length;
  const pendingCount = pendingApprovals.filter(a => a.status === 'Pending').length;
  
  // Top items for feeds
  const recentDocs = documents.slice(0, 3);
  const recentLogs = auditLogs.slice(0, 3);

  // Helper for relative time (mock calculation for UI)
  const timeAgo = (dateStr) => {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 60000); // mins
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
    return `${Math.floor(diff/1440)}d ago`;
  };

  const getExtension = (name) => {
    const parts = name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {/* HERO — Full brand gradient with real visual identity */}
    <div style={{ background: 'linear-gradient(135deg, #1F7A6B 0%, #165a4f 100%)' }} className="rounded-xl p-6 md:p-10 text-white relative overflow-hidden shadow-xl">
      <div className="relative z-10 max-w-2xl">
        <div style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold mb-4 md:mb-6 uppercase tracking-wider">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
          Secure Enterprise Platform — Active
        </div>
        <h2 className="text-2xl md:text-4xl font-extrabold mb-2 md:mb-3 tracking-tight">ProjectFlow KE</h2>
        <p className="text-emerald-100 text-sm md:text-lg font-medium mb-6 md:mb-8" style={{ maxWidth: '480px' }}>
          Centralized document governance for Kenyan enterprises. Powered by SharePoint, secured by role-based access control.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button 
            style={{ background: '#fff', color: '#1F7A6B' }}
            className="px-6 py-2.5 rounded font-bold transition-all hover:shadow-lg text-sm"
            onClick={() => navigate('docs')}
          >
            📂 Access Documents
          </button>
          <button 
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}
            className="px-6 py-2.5 rounded font-bold text-sm"
            onClick={onUploadClick}
          >
            ⬆ Upload Files
          </button>
          <button 
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#D1FAE5' }}
            className="px-6 py-2.5 rounded font-bold text-sm"
            onClick={() => navigate('kb')}
          >
            📖 System Guide
          </button>
        </div>
      </div>
      {/* Decorative elements */}
      <ShieldCheck className="absolute -right-10 -bottom-10 h-64 w-64 rotate-12" style={{ color: 'rgba(255,255,255,0.04)' }} />
      <div style={{ background: 'rgba(167,215,197,0.1)', width: '200px', height: '200px', borderRadius: '50%', position: 'absolute', top: '-60px', right: '200px' }}></div>
    </div>

    {/* LIVE SYSTEM STATS STRIP */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatStrip label="Total Documents" value={totalDocs.toString()} note="System-wide" color="#1F7A6B" />
      <StatStrip label="Active Users" value="84" note="Online now" color="#059669" />
      <StatStrip label="Pending Approvals" value={pendingCount.toString()} note="Needs action" color="#D97706" />
      <StatStrip label="Storage Used" value="1.4 TB" note="of 5 TB" color="#2563EB" />
    </div>

    {/* CORE MODULE CARDS */}
    <div>
      <h3 className="text-lg font-bold mb-4" style={{ color: '#2E2E2E' }}>Core Modules</h3>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        <ModuleCard icon={<FolderLock />} title="Document Center" desc="Encrypted file management" badge="Live" onClick={() => navigate('docs')} />
        <ModuleCard icon={<Rocket />} title="Collaborate" desc="Real-time multi-user editing workspace" onClick={() => navigate('collab')} />
        <ModuleCard icon={<ArrowRightLeft />} title="Data Transfer" desc="Secure large file sharing" onClick={() => navigate('transfer')} />
        <ModuleCard icon={<Users />} title="Departments" desc="Team-specific workspaces" onClick={() => navigate('depts')} />
      </div>
    </div>

    {/* PUBLIC DOCUMENTS SECTION */}
    <div className="space-y-4">
      <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#2E2E2E' }}>
        <Globe size={18} className="text-emerald-600" />
        Organization-Wide Public Library
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.filter(d => d.sensitivity === 'Public').length === 0 ? (
          <div className="col-span-full card p-8 text-center text-muted-foreground text-sm border-dashed">
            No public documents have been shared yet.
          </div>
        ) : (
          documents.filter(d => d.sensitivity === 'Public').slice(0, 3).map(doc => (
            <div key={doc.id} className="card hover:border-emerald-500 transition-all cursor-pointer group" onClick={() => navigate('docs')}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold truncate max-w-[150px]">{doc.name}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">{doc.dept}</p>
                </div>
              </div>
              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                <span>{doc.date}</span>
                <span className="text-emerald-600">Public Access</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>

    {/* BOTTOM SECTION: FEEDS */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-base font-bold flex items-center gap-2" style={{ color: '#2E2E2E' }}>
          <History size={18} className="text-primary" />
          Recent Documents
        </h3>
        <div className="card p-0 overflow-hidden">
          {recentDocs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No documents found.</div>
          ) : (
            recentDocs.map(doc => (
              <RecentDocItem key={doc.id} name={doc.name} time={doc.date} type={getExtension(doc.name)} dept={doc.dept} />
            ))
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-base font-bold flex items-center gap-2" style={{ color: '#2E2E2E' }}>
          <Activity size={18} className="text-primary" />
          Live Activity Feed
        </h3>
        <div className="card p-0 overflow-hidden">
          {recentLogs.length === 0 ? (
             <div className="p-8 text-center text-muted-foreground text-sm">No recent activity.</div>
          ) : (
            recentLogs.map(log => (
              <ActivityItem key={log.id} user={log.user} action={log.action} target={log.target} time={timeAgo(log.time)} />
            ))
          )}
        </div>
      </div>
    </div>
  </motion.div>
  );
};

const StatStrip = ({ label, value, note, color }) => (
  <div className="card flex items-center gap-4" style={{ borderLeft: `3px solid ${color}` }}>
    <div>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{note}</p>
    </div>
  </div>
);

const ModuleCard = ({ icon, title, desc, count, badge, onClick }) => (
  <div 
    className="card cursor-pointer group animate-slide-up"
    style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
    onClick={onClick}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#1F7A6B'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(31,122,107,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
  >
    <div className="flex justify-between items-start mb-4">
      <div style={{ background: 'rgba(31,122,107,0.08)', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1F7A6B', transition: 'all 0.2s' }}>
        {React.cloneElement(icon, { size: 22 })}
      </div>
      <div className="flex gap-2 items-center">
        {badge && <span style={{ background: '#F0FDF4', color: '#16A34A', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', border: '1px solid #BBF7D0' }}>{badge}</span>}
        {count && <span style={{ background: '#DC2626', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>{count}</span>}
      </div>
    </div>
    <h4 className="font-bold text-base mb-1">{title}</h4>
    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
  </div>
);

const DocumentCenterView = ({ navigate, onUploadClick, setShowViewManager, showViewManager }) => {
  const { documents, deleteDocument, userRole, submitForApproval, logAction, currentUser, signDocument, addDocument, columnVisibility, setActiveDocId } = useApp();
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [decryptionTarget, setDecryptionTarget] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [decryptionError, setDecryptionError] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'mine'
  const [previewDoc, setPreviewDoc] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState('PDF');

  // ABAC: Users can only see documents in their department (if they have restricted visibility implicitly via AD groups)
  const accessibleGroups = currentUser?.departments || [];
  
  // Enterprise RBAC + ABAC Filter: 
  // Admin & Manager see all (simulated global view).
  // Others see documents in their department OR documents explicitly marked as 'Public'.
  // Additionally, if a document has specific 'authorizedRoles', it must match the current user's role.
  let filteredDocs = (userRole === 'Admin' || userRole === 'Manager') 
    ? documents 
    : documents.filter(d => {
        const isOwner = d.owner === currentUser?.name;
        const isPublic = d.sensitivity === 'Public';
        const inDept = accessibleGroups.includes(d.dept);
        const isAuthorizedRole = d.authorizedRoles ? d.authorizedRoles.includes(userRole) : true;
        // Public documents are accessible to everyone regardless of department and role
        return isOwner || isPublic || (inDept && isAuthorizedRole);
      });

  // Apply "My Documents" filter
  if (viewMode === 'mine') {
    filteredDocs = filteredDocs.filter(d => d.owner === currentUser?.name);
  }

  const isRestricted = (doc) => !accessibleGroups.includes(doc.dept) && userRole !== 'Admin' && userRole !== 'Manager';

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  const attemptDecryption = (e) => {
    e.preventDefault();
    if (passwordInput === decryptionTarget.vaultPassword) {
      logAction(currentUser?.name, 'Successfully Authorized Vault', decryptionTarget.name);
      setDecryptionTarget(null);
      setPasswordInput('');
      navigate('collab');
    } else {
      setDecryptionError(true);
      setTimeout(() => setDecryptionError(false), 2000);
      logAction(currentUser?.name, 'FAILED VAULT DECRAMP ATTEMPT', decryptionTarget.name);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Document Center</h2>
          <p className="text-muted-foreground font-medium text-sm">Organization-wide file governance | Showing {filteredDocs.length} files</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            className="flex-1 md:flex-none btn border border-border bg-white hover:bg-muted"
            onClick={() => setShowViewManager(true)}
          >
            Manage Views
          </button>
          <button 
            className="flex-1 md:flex-none btn btn-primary"
            onClick={onUploadClick}
          >
            <Plus size={18} />
            New Document
          </button>
        </div>
      </div>

      {/* PROFESSIONALLY FILTERED VIEWS */}
      <div className="flex gap-4 md:gap-6 border-b border-border text-sm font-bold overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button 
          className={`pb-3 border-b-2 transition-all ${viewMode === 'all' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setViewMode('all')}
        >
          All Documents
        </button>
        <button 
          className={`pb-3 border-b-2 transition-all ${viewMode === 'mine' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setViewMode('mine')}
        >
          My Documents
        </button>
        <button className="pb-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground">Recently Edited</button>
        <button 
          className="pb-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground"
          onClick={() => navigate('depts')}
        >
          By Department
        </button>
      </div>

      {/* METADATA TABLE WITH COLORED LABELS */}
      <div className="card p-0 overflow-x-auto border-none md:border md:rounded-lg">
        <table className="w-full text-left min-w-[800px] md:min-w-0">
          <thead>
            <tr className="bg-muted/50 text-[10px] font-bold uppercase text-muted-foreground tracking-widest border-b border-border">
              <th className="px-6 py-4">Document Name</th>
              {columnVisibility.dept && <th className="px-6 py-4">Dept</th>}
              {columnVisibility.status && <th className="px-6 py-4">Status</th>}
              {columnVisibility.access && <th className="px-6 py-4">Access Level</th>}
              {columnVisibility.owner && <th className="px-6 py-4">Owner</th>}
              {columnVisibility.date && <th className="px-6 py-4">Modified Date</th>}
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredDocs.map(doc => {
              const restricted = isRestricted(doc);
              return (
                <DocRow 
                  key={doc.id} 
                  {...doc} 
                  onDelete={() => deleteDocument(doc.id)}
                  isRestricted={restricted}
                  submitForApproval={() => submitForApproval(doc.id)}
                  onSign={() => signDocument(doc.id)}
                  onSelect={() => {
                    if (restricted) {
                      navigate('access');
                    } else {
                      setSelectedDocId(doc.id);
                    }
                  }}
                  onLiveEdit={(docDetails) => {
                    if (docDetails.vaultLocked) {
                      setDecryptionTarget(docDetails);
                    } else {
                      logAction(currentUser?.name, 'Opened in Word Online', docDetails.name);
                      setActiveDocId(docDetails.id);
                      navigate('collab');
                    }
                  }}
                  logAction={logAction}
                  userRole={userRole}
                  columnVisibility={columnVisibility}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {decryptionTarget && (
          <div key="decryption-portal" className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="card w-full max-w-sm shadow-2xl p-0 overflow-hidden font-sans border-slate-700">
               <div className="bg-slate-900 p-6 text-center text-white border-b border-slate-800 relative">
                 <button onClick={() => { setDecryptionTarget(null); setPasswordInput(''); }} className="absolute py-2 px-3 right-0 top-0 text-slate-500 hover:bg-slate-800 transition-colors"><X size={16} /></button>
                 <Lock className="mx-auto text-red-500 h-10 w-10 mb-3 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                 <h3 className="font-bold tracking-widest uppercase text-sm">Encrypted Payload</h3>
                 <p className="text-xs text-slate-400 mt-1">{decryptionTarget.name}</p>
               </div>
               <form onSubmit={attemptDecryption} className="p-6 space-y-4 bg-slate-50">
                 <p className="text-xs text-slate-500 text-center font-bold tracking-wide uppercase px-4">Provide secondary cryptographic PIN to access document.</p>
                 <input autoFocus type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className={`w-full bg-white border ${decryptionError ? 'border-red-500 animate-[shake_0.2s_ease-in-out]' : 'border-slate-300'} rounded p-3 text-center text-lg font-mono tracking-[0.5em] outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 shadow-inner`} placeholder="****" />
                 <button type="submit" className="w-full btn bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-widest uppercase text-sm py-3">DECRYPT</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDoc && (
          <React.Fragment key="side-panel">
             <div onClick={() => setSelectedDocId(null)} className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm" />
             <motion.div 
               initial={{ x: '100%', opacity: 0.5 }}
               animate={{ x: 0, opacity: 1 }}
               exit={{ x: '100%', opacity: 0.5 }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed top-0 right-0 w-full md:w-[400px] h-full bg-white shadow-2xl z-50 border-l border-border flex flex-col"
             >
               <div className="p-6 border-b border-border flex justify-between items-center bg-slate-50">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-emerald-100 text-emerald-700 rounded"><FileText size={20} /></div>
                   <h3 className="font-extrabold text-lg text-slate-800 line-clamp-1" title={selectedDoc.name}>{selectedDoc.name}</h3>
                 </div>
                 <button onClick={() => setSelectedDocId(null)} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-600 transition-colors">
                   <X size={16} />
                 </button>
               </div>
               
               <div className="p-6 flex-1 overflow-y-auto space-y-8">
                 <div>
                   <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Metadata Info</h4>
                   <div className="space-y-3 text-sm">
                     <div className="flex justify-between border-b border-border pb-2"><span className="text-slate-500 font-medium">Department</span><span className="font-bold">{selectedDoc.dept}</span></div>
                     <div className="flex justify-between border-b border-border pb-2"><span className="text-slate-500 font-medium">Sensitivity</span><span className="font-bold flex gap-1 items-center">{selectedDoc.sensitivity === 'Confidential' || selectedDoc.sensitivity === 'Restricted' ? <Lock size={12} className="text-red-500"/> : null}{selectedDoc.sensitivity || 'Internal'}</span></div>
                     <div className="flex justify-between border-b border-border pb-2"><span className="text-slate-500 font-medium">Owner</span><span className="font-bold">{selectedDoc.owner || 'System'}</span></div>
                     <div className="flex justify-between border-b border-border pb-2"><span className="text-slate-500 font-medium">Upload Date</span><span className="font-bold">{selectedDoc.date}</span></div>
                     <div className="flex justify-between border-b border-border pb-2"><span className="text-slate-500 font-medium">System Status</span><span className={`px-2 rounded text-xs font-bold capitalize ${selectedDoc.status === 'certified' ? 'bg-primary text-white' : selectedDoc.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{selectedDoc.status}</span></div>
                     {selectedDoc.signature && (
                       <div className="bg-slate-900 text-white p-3 rounded mt-4 border border-slate-700">
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1"><ShieldCheck size={12}/> Digital Certificate</p>
                          <p className="text-xs font-mono break-all">{selectedDoc.signature}</p>
                          <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold">Signed by {selectedDoc.certifiedBy} on {new Date(selectedDoc.certifiedAt).toLocaleDateString()}</p>
                       </div>
                     )}
                   </div>
                 </div>

                 <div>
                   <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><History size={14}/> Version Lineage</h4>
                   <div className="border-l-2 border-border ml-2 pl-4 relative space-y-6">
                     {selectedDoc.version >= 2 && (
                       <div className="relative">
                         <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-4 ring-emerald-50"></div>
                         <p className="font-bold text-sm text-slate-800">Version 2.0 <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] ml-2">Current</span></p>
                         <p className="text-xs text-muted-foreground mt-0.5">Approved by workflow engine</p>
                       </div>
                     )}
                     <div className="relative opacity-60">
                       <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-slate-400 rounded-full ring-4 ring-slate-100"></div>
                       <p className="font-bold text-sm text-slate-800">Version 1.0</p>
                       <p className="text-xs text-muted-foreground mt-0.5">Initial draft upload by {selectedDoc.owner || 'System'}</p>
                     </div>
                   </div>
                 </div>
               </div>
               
               {/* EXPORT OPTIONS [v2.2] */}
               <div className="bg-slate-50 p-6 space-y-4 border-t border-border">
                   <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Select Export Format</label>
                   <div className="grid grid-cols-3 gap-2">
                      {['PDF', 'DOCX', 'XLSX'].map(fmt => (
                        <button 
                          key={fmt} 
                          onClick={() => setDownloadFormat(fmt)}
                          className={`py-2 text-[10px] font-black rounded border transition-all ${downloadFormat === fmt ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
                        >
                          {fmt}
                        </button>
                      ))}
                   </div>
                   
                   <div className="flex gap-2">
                       <button 
                         className="flex-1 btn bg-emerald-600 hover:bg-emerald-700 text-white flex justify-center items-center gap-2 py-3.5 font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
                         onClick={() => {
                           setPreviewDoc(selectedDoc);
                         }}
                       >
                         <FileText size={16}/> View Full Original
                       </button>
                       <button 
                         className="flex-1 btn btn-primary flex justify-center items-center gap-2 py-3.5 shadow-lg font-black text-xs uppercase tracking-widest"
                         onClick={() => {
                        const baseName = selectedDoc.name.split('.')[0];
                        const isWrappedBinary = selectedDoc.content?.includes('[BINARY ASSET DETECTED]');
                        const isOriginalBinary = selectedDoc.content?.startsWith('data:') || isWrappedBinary;
                        const isVaultProtected = selectedDoc.hasLock && selectedDoc.vaultPassword;
                        
                        let downloadUrl = selectedDoc.content;
                        if (isWrappedBinary) {
                           const match = downloadUrl.match(/src="(data:[^"]+)"/);
                           if (match) downloadUrl = match[1];
                        }
                        
                        // [v2.3] SECURE ENVELOPE GENERATION
                        if (isVaultProtected) {
                          const envelopeHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>ProjectFlow Secure Envelope - ${selectedDoc.name}</title>
    <style>
        body { font-family: 'Inter', sans-serif; background: #0F172A; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #1E293B; padding: 2.5rem; border-radius: 16px; border: 1px solid #334155; text-align: center; width: 400px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .icon { background: #1F7A6B; width: 64px; height: 64px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
        h1 { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.5rem; }
        p { color: #94A3B8; font-size: 0.875rem; margin-bottom: 2rem; }
        input { width: 100%; background: #0F172A; border: 1px solid #334155; padding: 0.75rem; border-radius: 8px; color: white; margin-bottom: 1rem; outline: none; box-sizing: border-box; }
        button { width: 100%; background: #1F7A6B; color: white; border: none; padding: 0.75rem; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        button:hover { background: #2a9d8a; }
        .error { color: #EF4444; font-size: 12px; margin-top: 1rem; display: none; }
        #content { display: none; }
    </style>
</head>
<body>
    <div class="card" id="login">
        <div class="icon">🔒</div>
        <h1>ProjectFlow Secure Node</h1>
        <p>This document is encrypted. Enter the security password to decrypt and view the contents.</p>
        <input type="password" id="pass" placeholder="Enter Password">
        <button onclick="decrypt()">Access Document</button>
        <div id="error" class="error">Invalid decryption key. Access denied.</div>
    </div>
    <div id="content">${downloadUrl}</div>

    <script>
        function decrypt() {
            const pass = document.getElementById('pass').value;
            if (pass === "${selectedDoc.vaultPassword}") {
                const content = document.getElementById('content').innerHTML;
                if (content.startsWith('data:')) {
                    const link = document.createElement('a');
                    link.href = content;
                    link.download = "${selectedDoc.name}";
                    link.click();
                } else {
                    document.body.innerHTML = '<div style="padding: 40px; font-family: monospace; white-space: pre-wrap; background: white; color: black; min-height: 100vh;">' + content + '</div>';
                }
            } else {
                document.getElementById('error').style.display = 'block';
            }
        }
    </script>
</body>
</html>`;
                          const blob = new Blob([envelopeHtml], { type: 'text/html' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `[SECURE_ENVELOPE]_${selectedDoc.name}.html`;
                          a.click();
                          logAction(currentUser?.name || userRole, `Exported Secure Envelope`, selectedDoc.name);
                          return;
                        }

                        if (isOriginalBinary) {
                          const a = document.createElement('a');
                          a.href = downloadUrl;
                          a.download = selectedDoc.name;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          logAction(currentUser?.name || userRole, `Exported Original Binary`, selectedDoc.name);
                          return;
                        }

                        // Otherwise, proceed with the simulated Secure Export (PDF, DOCX, XLSX)
                        const displayContent = selectedDoc.content || `Simulated content for ${selectedDoc.name}`;

                        let fileName = `[${downloadFormat}_SECURE]_${baseName}`;
                        let blob;

                        if (downloadFormat === 'PDF') {
                          // PDF Simulation via HTML (printable)
                          const pdfContent = `
                            <html>
                            <head>
                              <style>
                                body { font-family: serif; padding: 50px; line-height: 1.6; }
                                .header { border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; }
                                .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); opacity: 0.1; font-size: 80px; z-index: -1; }
                                .footer { margin-top: 50px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 10px; }
                              </style>
                            </head>
                            <body>
                              <div class="watermark">PROJECTFLOW KE</div>
                              <div class="header">
                                <h1>PROJECTFLOW KE - SECURE PDF</h1>
                                <p>Document: ${selectedDoc.name} | Owner: ${selectedDoc.owner} | Date: ${selectedDoc.date}</p>
                              </div>
                              <div class="content" style="white-space: pre-wrap; margin-top: 20px; font-size: 14px; color: #111;">
                                ${isOriginalBinary ? `<div style="padding: 20px; border: 1px dashed #000; text-align: center; background: #f9f9f9;"><strong>[EMBEDDED ATTACHMENT NODE]</strong><br/><br/><img src="${selectedDoc.content}" style="max-width: 100%; border: 2px solid #000;"/></div>` : selectedDoc.content}
                              </div>
                              <div class="footer">Digitally Certified: ${selectedDoc.signature || 'N/A'}</div>
                            </body>
                            </html>
                          `;
                          blob = new Blob([pdfContent], { type: 'text/html' }); // Browsers can "Save as PDF" from HTML
                          fileName += '.html';
                        } else if (downloadFormat === 'DOCX') {
                          // Word Simulation via structured HTML (Word can open this)
                          const docContent = `
                            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                            <head><meta charset='utf-8'><title>${selectedDoc.name}</title></head>
                            <body>
                              <h1 style="color: #1F7A6B;">${selectedDoc.name}</h1>
                              <p><b>Department:</b> ${selectedDoc.dept}</p>
                              <p><b>Owner:</b> ${selectedDoc.owner}</p>
                              <hr>
                              <div style="white-space: pre-wrap;">${displayContent}</div>
                            </body>
                            </html>
                          `;
                          blob = new Blob([docContent], { type: 'application/msword' });
                          fileName += '.doc';
                        } else {
                          // Excel Simulation via CSV
                          let csvContent = `ID,METADATA_FIELD,VALUE\n`;
                          csvContent += `1,DOCUMENT_NAME,"${selectedDoc.name}"\n`;
                          csvContent += `2,DEPARTMENT,"${selectedDoc.dept}"\n`;
                          csvContent += `3,OWNER,"${selectedDoc.owner}"\n`;
                          csvContent += `4,DATE,"${selectedDoc.date}"\n`;
                          csvContent += `5,CONTENT,"${displayContent.replace(/"/g, '""')}"\n`;
                          blob = new Blob([csvContent], { type: 'text/csv' });
                          fileName += '.csv';
                        }

                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        logAction(currentUser?.name || userRole, `Exported as ${downloadFormat}`, selectedDoc.name); 
                      }}
                   >
                     <Database size={16}/> Secure Export (${downloadFormat})
                   </button>
                  </div>
               </div>
             </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewDoc && (
          <div key="doc-viewer-modal" className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 lg:p-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-600 rounded"><FileText size={20} /></div>
                  <div>
                    <h3 className="font-bold text-sm leading-none">{previewDoc.name}</h3>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Simulated {downloadFormat} View</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-xs font-bold transition-all" onClick={() => window.print()}>Print / Export</button>
                   <button className="p-2 hover:bg-white/10 rounded-full transition-all" onClick={() => setPreviewDoc(null)}><X size={20} /></button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-slate-200 p-8 flex justify-center">
                {/* SIMULATED PAGE */}
                <div className="bg-white w-full max-w-[800px] min-h-[1000px] shadow-lg p-16 font-serif relative">
                  {/* WATERMARK */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-35deg] text-6xl font-black text-slate-900 uppercase">
                    PROJECTFLOW KE - CONFIDENTIAL
                  </div>

                  <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                      <div className="space-y-1">
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">PROJECTFLOW KE</h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Enterprise Document Governance</p>
                      </div>
                      <div className="text-right text-[10px] font-bold text-slate-400 space-y-0.5">
                        <p>REF: DOC-{previewDoc.id}</p>
                        <p>DATE: {previewDoc.date}</p>
                        <p>DEPT: {previewDoc.dept}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-xl font-black text-slate-900 border-b-2 border-slate-900 pb-4 uppercase tracking-tight">{previewDoc.name.replace(/\.[^/.]+$/, "")}</h2>
                      <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-inner text-slate-800 leading-relaxed whitespace-pre-wrap font-mono text-[11px] min-h-[400px] max-h-[600px] overflow-y-auto scrollbar-hide">
                        {previewDoc.content || "NO PAYLOAD DETECTED"}
                      </div>
                    </div>

                    <div className="pt-20 border-t border-slate-200">
                      <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Owner Signature</p>
                          <div className="h-12 border-b border-slate-300 font-script text-2xl text-slate-400 pt-2 px-2">
                             {previewDoc.owner}
                          </div>
                          <p className="text-[9px] text-slate-500 italic">Digitally Signed via SharePoint Identity</p>
                        </div>
                        {previewDoc.signature && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">System Certification</p>
                            <div className="bg-slate-50 border border-slate-200 p-2 rounded">
                               <p className="text-[9px] font-mono break-all text-slate-500">{previewDoc.signature}</p>
                            </div>
                            <p className="text-[9px] text-emerald-600 font-bold uppercase">Integrity Verified</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 border-t border-slate-200 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Confidential Document | ProjectFlow KE Zero-Trust Protocol
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const DocRow = ({ id, name, dept, status, access, sensitivity, owner, version, date, hasLock, vaultLocked, vaultPassword, onDelete, isRestricted, submitForApproval, onSelect, onLiveEdit, logAction, userRole, onSign, columnVisibility }) => (
  <tr onClick={() => { if(!isRestricted && onSelect) onSelect(); }} className={`hover:bg-muted/30 transition-colors group cursor-pointer text-sm ${isRestricted ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <FileText size={18} className="text-muted-foreground shrink-0" />
          {vaultLocked && <Lock size={12} className="text-red-500 absolute -bottom-1 -right-1 bg-red-50 rounded-full" />}
        </div>
        <div>
          <span className="font-bold text-foreground block">{name}</span>
          <div className="flex gap-2 items-center mt-1">
            {!columnVisibility.owner && owner && <span className="text-[10px] text-muted-foreground font-semibold">Owner: {owner}</span>}
            {version && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold">v{version}</span>}
          </div>
        </div>
      </div>
    </td>
    {columnVisibility.dept && <td className="px-6 py-4 text-muted-foreground font-semibold text-xs">{dept}</td>}
    {columnVisibility.status && (
      <td className="px-6 py-4">
        <span className={`status-badge status-${status}`}>{status}</span>
      </td>
    )}
    {columnVisibility.access && (
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground uppercase tracking-wider">
            {(hasLock || isRestricted) && <Lock size={12} className="text-destructive shrink-0" />}
            {isRestricted ? 'LOCKED (Restricted Role)' : (sensitivity || access)}
          </div>
        </div>
      </td>
    )}
    {columnVisibility.owner && (
      <td className="px-6 py-4 text-muted-foreground font-semibold text-xs">
        {owner || 'System'}
      </td>
    )}
    {columnVisibility.date && (
      <td className="px-6 py-4 text-muted-foreground font-semibold text-xs">
        {date}
      </td>
    )}
    <td className="px-6 py-4 text-right">
      <div className="flex items-center justify-end gap-3">
        {status === 'draft' && !isRestricted && (
          <button 
            onClick={(e) => { e.stopPropagation(); submitForApproval(); }}
            className="hidden group-hover:flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded transition-colors"
          >
            <Zap size={14} /> Submit
          </button>
        )}
        
        {status === 'approved' && !isRestricted && (
          <div className="flex gap-2">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                onLiveEdit({ id, name, vaultLocked, vaultPassword });
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#185ABD] hover:bg-[#103F85] px-3 py-1.5 rounded transition-colors shadow-sm"
            >
              <span className="font-serif italic font-medium">W</span> Live Edit
            </button>
            {userRole === 'Manager' || userRole === 'Admin' ? (
               <button 
                onClick={(e) => { e.stopPropagation(); onSign(); }}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded transition-colors shadow-sm border border-slate-700"
                title="Apply Digital Signature"
              >
                <ShieldCheck size={14} className="text-emerald-400" /> Sign
              </button>
            ) : null}
          </div>
        )}

        {status === 'certified' && !isRestricted && (
           <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 uppercase tracking-tighter">
             <ShieldCheck size={12}/> Certified
           </div>
        )}

        {!isRestricted && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 hover:bg-red-50 text-muted-foreground hover:text-red-600 rounded transition-colors opacity-0 group-hover:opacity-100"
            title="Delete (Move to Recycle Bin)"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </td>
  </tr>
);

const RecentDocItem = ({ name, time, type, dept }) => {
  const typeColors = { XLS: '#16A34A', PDF: '#DC2626', DOC: '#2563EB', ZIP: '#6B7280' };
  const color = typeColors[type] || '#1F7A6B';
  return (
    <div style={{ transition: 'background 0.15s' }} className="px-6 py-4 flex justify-between items-center cursor-pointer" onMouseEnter={e => e.currentTarget.style.background='rgba(243,244,246,0.7)'} onMouseLeave={e => e.currentTarget.style.background=''}>
      <div className="flex items-center gap-3">
        <div style={{ background: `${color}15`, color, width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>
          {type}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#2E2E2E' }}>{name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {dept && <span style={{ background: 'rgba(31,122,107,0.08)', color: '#1F7A6B', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }}>{dept}</span>}
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>
        </div>
      </div>
      <ChevronRight size={14} className="text-muted-foreground" />
    </div>
  );
};

const ActivityItem = ({ user, action, target, time }) => {
  const actionColors = { Approved: '#16A34A', Uploaded: '#2563EB', 'Auto-archived': '#6B7280', Deleted: '#DC2626', Requested: '#D97706' };
  const color = actionColors[action] || '#1F7A6B';
  return (
    <div className="px-6 py-4 flex gap-3 items-start" style={{ borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(243,244,246,0.7)'} onMouseLeave={e => e.currentTarget.style.background=''}>
      <div style={{ background: 'rgba(31,122,107,0.1)', color: '#1F7A6B', width: '32px', height: '32px', minWidth: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
        {user[0]}
      </div>
      <div className="flex-1">
        <p className="text-xs" style={{ color: '#2E2E2E' }}>
          <span className="font-bold">{user}</span>
          <span style={{ color, fontWeight: 700, margin: '0 4px' }}>{action}</span>
          <span className="font-semibold">{target}</span>
        </p>
        {time && <p className="text-xs text-muted-foreground mt-0.5">{time}</p>}
      </div>
    </div>
  );
};

const MoreVertical = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
  </svg>
);

const App = () => (
  <AuthGate>
    <ApplicationLayout />
  </AuthGate>
);

export default App;
