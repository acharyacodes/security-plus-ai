import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Settings, ShieldCheck, ChevronRight, Sparkles, LogOut, User, X, Menu } from 'lucide-react';
import axios from 'axios';

// Pages
import ErrorPage from './pages/ErrorPage';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import StudySession from './pages/StudySession';
import Analytics from './pages/Analytics';
import SettingsPage from './pages/Settings';
import CustomBuilder from './pages/CustomBuilder';
import CustomSession from './pages/CustomSession';
import Login from './pages/Login';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return <ErrorPage type="500" error={this.state.error} />;
    }
    return this.props.children;
  }
}

const Sidebar = ({ user, onLogout, open, onClose }) => {
  const location = useLocation();
  const menuItems = [
    { name: 'Dashboard',    path: '/',               icon: <LayoutDashboard size={20} /> },
    { name: 'Analytics',    path: '/analytics',      icon: <BarChart3 size={20} /> },
    { name: 'Custom Test',  path: '/custom-builder', icon: <Sparkles size={20} /> },
    { name: 'Settings',     path: '/settings',       icon: <Settings size={20} /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden mobile-overlay"
          onClick={onClose}
        />
      )}

      <aside className={`h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4 fixed left-0 top-0 z-[60] transition-transform duration-300 ease-in-out md:translate-x-0 ${open ? 'translate-x-0 shadow-2xl shadow-sky-500/10' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <ShieldCheck className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Security+ <span className="text-sky-400">AI</span></h1>
          </div>
          <button onClick={onClose} className="md:hidden p-2 text-slate-500 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-slate-800">
            <X size={24} />
          </button>
        </div>

      <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            onClick={onClose}

            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              location.pathname === item.path
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.name}</span>
            {location.pathname === item.path && <ChevronRight size={16} className="ml-auto" />}
          </Link>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-800">
          <div className="w-7 h-7 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <User size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-200 truncate">{user?.username}</p>
            {user?.isAdmin && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-sky-500">Admin</p>
            )}
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-200"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  );
};

const AppContent = () => {
  const [user, setUser] = useState(undefined); // undefined = loading, null = not logged in
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [isSetup, setIsSetup] = useState(null);
  const [apiError, setApiError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close sidebar on navigation to a new route (mobile improvement)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    // Intercept 401 responses from any API call (session expired mid-use)
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && !error.config.url.includes('/api/auth/')) {
          setUser(null);
        }
        if (!error.response) {
          setApiError('The Security+ AI Backend is unreachable. Check your connection or Pi status.');
        }
        return Promise.reject(error);
      }
    );
    checkAuthStatus();
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data } = await axios.get('/api/auth/status');
      if (data.needsBootstrap) {
        setNeedsBootstrap(true);
        setUser(null);
      } else if (data.loggedIn) {
        setUser(data.user);
        checkSetupStatus();
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const checkSetupStatus = async () => {
    try {
      const { data } = await axios.get('/api/setup/status');
      setIsSetup(data.isSetup);
      if (!data.isSetup && location.pathname !== '/setup') {
        navigate('/setup');
      }
    } catch {
      setIsSetup(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setNeedsBootstrap(false);
    checkSetupStatus();
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch { /* ignore */ }
    setUser(null);
    setIsSetup(null);
    navigate('/');
  };

  // ── Loading state ────────────────────────────────────────────
  if (user === undefined) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
    </div>
  );

  // ── Not logged in ────────────────────────────────────────────
  if (!user) return <Login onLogin={handleLogin} needsBootstrap={needsBootstrap} />;

  // ── Logged in but setup status unknown ───────────────────────
  if (isSetup === null) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
    </div>
  );

  const showSidebar = location.pathname !== '/setup' && isSetup;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden">
      {apiError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] bg-rose-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-slide-down border border-rose-400">
          <ShieldCheck size={20} />
          <span className="font-bold text-sm tracking-tight">{apiError}</span>
          <button onClick={() => setApiError(null)} className="ml-4 hover:text-rose-200 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {showSidebar && (
        <Sidebar user={user} onLogout={handleLogout} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      <main className={`flex-1 transition-all duration-300 ${showSidebar ? 'md:pl-64' : ''}`}>
        {/* Mobile Navbar */}
        {showSidebar && (
          <div className="md:hidden sticky top-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 z-40">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-400 hover:text-white"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-sky-400" size={20} />
              <span className="font-bold text-sm">Security+ AI</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400">
              <User size={16} />
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-10">
          <Routes>
            <Route path="/setup" element={<Setup onSetupComplete={() => { setIsSetup(true); navigate('/'); }} />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/study/:subsectionId" element={<StudySession />} />
            <Route path="/analytics/:subsectionId" element={<Analytics />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<SettingsPage user={user} />} />
            <Route path="/custom-builder" element={<CustomBuilder />} />
            <Route path="/custom-session/:testId" element={<CustomSession />} />
            <Route path="*" element={<ErrorPage type="404" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </Router>
  );
}

export default App;
