import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, BarChart3, Settings, ShieldCheck, ChevronRight, Menu, X, Sparkles } from 'lucide-react';
import axios from 'axios';

// Pages (to be implemented next)
import ErrorPage from './pages/ErrorPage';

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

const Sidebar = () => {
  const location = useLocation();
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Analytics', path: '/analytics', icon: <BarChart3 size={20} /> },
    { name: 'Custom Test', path: '/custom-builder', icon: <Sparkles size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4 fixed left-0 top-0 z-50">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <ShieldCheck className="text-white" size={24} />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Security+ <span className="text-sky-400">AI</span></h1>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
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

      <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-800">
        <p className="text-xs text-slate-500 mb-1 text-center font-bold tracking-widest uppercase">SY0-701 Progress</p>
        <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2">
          <div className="bg-sky-500 h-full rounded-full w-0 transition-all duration-1000" id="global-progress"></div>
        </div>
      </div>
    </aside>
  );
};

const AppContent = () => {
  const [isSetup, setIsSetup] = useState(null);
  const [apiError, setApiError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // ── Global API Interceptor ──
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (!error.response) {
          setApiError('The Security+ AI Backend is unreachable. Check your connection or Pi status.');
        }
        return Promise.reject(error);
      }
    );

    checkSetupStatus();
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const checkSetupStatus = async () => {
    try {
      const { data } = await axios.get('/api/setup/status');
      setIsSetup(data.isSetup);
      if (!data.isSetup && location.pathname !== '/setup') {
        navigate('/setup');
      }
    } catch (err) {
      console.error("Failed to check setup status", err);
      setIsSetup(false);
    }
  };

  if (isSetup === null) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
    </div>
  );

  const showSidebar = location.pathname !== '/setup' && isSetup;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 relative">
      {apiError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] bg-rose-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-slide-down border border-rose-400">
          <ShieldCheck size={20} />
          <span className="font-bold text-sm tracking-tight">{apiError}</span>
          <button onClick={() => setApiError(null)} className="ml-4 hover:text-rose-200 transition-colors"><X size={16} /></button>
        </div>
      )}

      {showSidebar && <Sidebar />}
      <main className={`flex-1 transition-all duration-300 ${showSidebar ? 'pl-64' : ''}`}>
        <div className="max-w-7xl mx-auto p-6 md:p-10">
          <Routes>
            <Route path="/setup" element={<Setup onSetupComplete={() => { setIsSetup(true); navigate('/'); }} />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/study/:subsectionId" element={<StudySession />} />
            <Route path="/analytics/:subsectionId" element={<Analytics />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/custom-builder" element={<CustomBuilder />} />
            <Route path="/custom-session/:testId" element={<CustomSession />} />
            {/* Catch-all 404 component */}
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
