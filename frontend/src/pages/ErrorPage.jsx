import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, RotateCcw, ShieldAlert } from 'lucide-react';

const ErrorPage = ({ type = '404', error = null }) => {
  const navigate = useNavigate();

  const is404 = type === '404';

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6 animate-fade-in">
      <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-8 shadow-2xl ${is404 ? 'bg-sky-500/20 text-sky-400' : 'bg-rose-500/20 text-rose-400'}`}>
        {is404 ? <AlertTriangle size={48} /> : <ShieldAlert size={48} />}
      </div>

      <h1 className="text-4xl font-black mb-4 premium-gradient-text uppercase tracking-tighter">
        {is404 ? 'Objective Not Found' : 'System Disruption'}
      </h1>
      
      <p className="text-slate-400 text-lg max-w-md mb-10 leading-relaxed font-medium">
        {is404 
          ? "The section or resource you're looking for doesn't exist in the SY0-701 syllabus or has been moved." 
          : "An unexpected runtime error occurred within the application engine. Your study progress (SQLite) remains safe."}
      </p>

      {error && (
        <div className="w-full max-w-2xl bg-black/40 border border-slate-800 rounded-2xl p-4 mb-10 text-left overflow-auto max-h-40">
          <p className="text-rose-400 font-mono text-sm">{error.message || 'Unknown Error'}</p>
          {error.stack && <pre className="text-slate-600 font-mono text-xs mt-2">{error.stack}</pre>}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button 
          onClick={() => navigate('/')} 
          className="flex-1 btn-secondary flex items-center justify-center gap-2"
        >
          <Home size={18} /> Return Dashboard
        </button>
        <button 
          onClick={() => window.location.reload()} 
          className="flex-1 btn-primary flex items-center justify-center gap-2"
        >
          <RotateCcw size={18} /> Reload System
        </button>
      </div>
      
      <p className="mt-12 text-slate-600 text-xs font-bold uppercase tracking-widest bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
        Status Code: {is404 ? '404_NOT_FOUND' : '500_RUNTIME_FAULT'}
      </p>
    </div>
  );
};

export default ErrorPage;
