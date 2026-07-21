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
import ErrorBoundary from './components/ErrorBoundary';
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
import CommandPalette from './components/CommandPalette';
import PortalView from './components/PortalView';
import DocumentCenterView from './components/DocumentCenterView';
import DatabaseSettingsModal from './components/DatabaseSettingsModal';

import { useApp } from './context/AppContext';

const ApplicationLayout = () => {
  const { activeTab, setActiveTab, userRole, setUserRole, pendingRequests, addDocument, unreadCount, pendingApprovalCount, theme, toggleTheme, isCloudOffline, dbStatus, refreshDatabaseData } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewManager, setShowViewManager] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);

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
              <h1 className="text-base md:text-lg font-bold leading-none text-primary flex items-center gap-2">
                ProjectFlow KE
              </h1>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDbModal(true);
                }}
                className="flex items-center gap-1.5 mt-1 hover:opacity-80 transition-opacity bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/60"
                title="Click to configure Supabase Database Connection & check table health"
              >
                 <div className={`w-1.5 h-1.5 rounded-full ${dbStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                 <p className="text-[9px] font-bold uppercase text-slate-600 dark:text-slate-300 tracking-wider flex items-center gap-1">
                   {dbStatus?.connected ? (
                     <>Database: Cloud Active ({dbStatus.latencyMs}ms)</>
                   ) : (
                     <>Database: Local Sandbox (Click to Connect)</>
                   )}
                 </p>
              </button>
            </div>
          </div>
        </div>

        {/* TOP SEARCH (HIDDEN ON MOBILE) */}
        <div className="flex-1 hidden md:flex justify-center max-w-xl mx-4">
          <div className="search-bar cursor-pointer" onClick={() => setIsCommandPaletteOpen(true)}>
            <Search size={16} className="text-muted-foreground" />
            <input type="text" placeholder="Global Command Palette..." readOnly />
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
              {activeTab === 'portal' && <ErrorBoundary key="portal"><PortalView navigate={navigateTo} onUploadClick={() => setShowUploadModal(true)} /></ErrorBoundary>}
              {activeTab === 'docs' && <ErrorBoundary key="docs"><DocumentCenterView navigate={navigateTo} onUploadClick={() => setShowUploadModal(true)} setShowViewManager={setShowViewManager} showViewManager={showViewManager} /></ErrorBoundary>}
              {activeTab === 'collab' && <ErrorBoundary key="collab"><CollaborationWorkspace /></ErrorBoundary>}
              {activeTab === 'dashboard' && <ErrorBoundary key="dashboard"><UserDashboard /></ErrorBoundary>}
              {activeTab === 'search' && <ErrorBoundary key="search"><GlobalSearch /></ErrorBoundary>}
              {activeTab === 'requests' && <ErrorBoundary key="requests"><AccessRequestSystem /></ErrorBoundary>}
              {activeTab === 'analytics' && <ErrorBoundary key="analytics"><UserAnalytics /></ErrorBoundary>}
              {activeTab === 'kb' && <ErrorBoundary key="kb"><KnowledgeBase /></ErrorBoundary>}
              {activeTab === 'depts' && <ErrorBoundary key="depts"><DepartmentView navigate={navigateTo} onUploadClick={() => setShowUploadModal(true)} /></ErrorBoundary>}
              {activeTab === 'audit' && <ErrorBoundary key="audit"><GovernanceCenter /></ErrorBoundary>}
              {activeTab === 'testing' && <ErrorBoundary key="testing"><SystemTesting /></ErrorBoundary>}
              {activeTab === 'workflow' && <ErrorBoundary key="workflow"><WorkflowManager /></ErrorBoundary>}
              {activeTab === 'identity' && <ErrorBoundary key="identity"><IdentityManager /></ErrorBoundary>}
              {activeTab === 'vault' && <ErrorBoundary key="vault"><VaultSecurity /></ErrorBoundary>}
              {activeTab === 'threats' && <ErrorBoundary key="threats"><ThreatDashboard /></ErrorBoundary>}
              {activeTab === 'transfer' && <ErrorBoundary key="transfer"><DataTransferHub /></ErrorBoundary>}
              
              {activeTab === 'upload' && (
                <ErrorBoundary key="upload">
                  <UploadView onUpload={(docDetails) => {
                    addDocument(docDetails);
                    navigateTo('docs');
                  }} />
                </ErrorBoundary>
              )}
            </AnimatePresence>

            {/* GLOBAL MODALS [v2.5] */}
            <AnimatePresence>
              <DatabaseSettingsModal isOpen={showDbModal} onClose={() => setShowDbModal(false)} onRefreshData={refreshDatabaseData} />
              {showViewManager && <ViewManager key="view-manager" onClose={() => setShowViewManager(false)} />}
              {isCommandPaletteOpen && <CommandPalette key="command-palette" isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />}
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
