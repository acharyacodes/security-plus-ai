import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Settings, Play, BookOpen, CheckCircle, ChevronRight, LayoutGrid, List, Sparkles } from 'lucide-react';
import axios from 'axios';
import ProgressBar from '../components/ProgressBar';

const Dashboard = () => {
  const navigate = useNavigate();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [expandedDomains, setExpandedDomains] = useState({ '1.0': true });

  const toggleDomain = (code) => {
    setExpandedDomains(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await axios.get('http://localhost:3000/api/study/dashboard');
      if (Array.isArray(data)) {
        setDomains(data);
      } else {
        setDomains(data.domains || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-fade-in">
      {/* Hero Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-5xl font-extrabold premium-gradient-text tracking-tighter">Study Command Center</h2>
          <p className="text-slate-400 mt-2 text-lg font-medium">SY0-701 Exam Objectives • Mastered with AI Precision</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <List size={20} />
            </button>
          </div>
          <button onClick={() => navigate('/settings')} className="btn-secondary flex items-center gap-2">
            <Settings size={18} /> Settings
          </button>
        </div>
      </header>

      {/* Main Roadmap */}
      <div className="space-y-12">
        {domains.map((domain) => (
          <section key={domain.code} className="space-y-6">
            <div 
              className="flex items-center justify-between border-b border-slate-800 pb-4 cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-xl transition-all"
              onClick={() => toggleDomain(domain.code)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
                  <h3 className="text-xl font-black">{domain?.code?.split('.')[0]}</h3>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-100">Domain {domain?.code?.split('.')[0]}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Overall Progress</span>
                    <span className="text-xs font-black text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded italic">
                      {Math.round(((domain?.mastered_topics || 0) / (domain?.total_topics || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className={`text-slate-500 transition-transform duration-300 ${expandedDomains[domain.code] ? 'rotate-90' : ''}`}>
                <ChevronRight size={24} />
              </div>
            </div>

            {expandedDomains[domain.code] && (
              <div className="animate-fade-in-down">
              {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(domain?.subsections || []).map((sub) => (
                  <div 
                    key={sub.id} 
                    className="glass-card p-8 group relative overflow-hidden transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                    onClick={() => navigate(`/study/${sub.id}`)}
                  >
                    <div className="mb-6 flex items-start justify-between">
                      <span className="text-xs font-black text-sky-500 uppercase tracking-[0.3em]">{sub.code}</span>
                      {sub.is_complete ? (
                        <div className="text-emerald-400"><CheckCircle size={24} /></div>
                      ) : (
                        <div className="text-slate-800 group-hover:text-sky-500/50 transition-colors"><Sparkles size={24} /></div>
                      )}
                    </div>
                    
                    <h4 className="text-xl font-bold mb-6 text-slate-200 leading-tight group-hover:text-white transition-colors">{sub.title}</h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                        <span>Mastery</span>
                        <span className="text-sky-400 italic">{Math.round(((sub?.mastered_topics || 0) / (sub?.total_topics || 1)) * 100)}%</span>
                      </div>
                      <ProgressBar current={sub?.mastered_topics || 0} total={sub?.total_topics || 1} color={sub?.is_complete ? "emerald" : "sky"} />
                    </div>

                    <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-800 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{sub?.total_topics || 0} Key Details</span>
                      <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                        Start Studio <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(domain?.subsections || []).map((sub) => (
                  <div 
                    key={sub.id}
                    onClick={() => navigate(`/study/${sub.id}`)}
                    className={`glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-800/30 cursor-pointer transition-all border-l-4 ${sub.is_complete ? 'border-l-emerald-500' : 'border-l-transparent'}`}
                  >
                    <div className="flex items-center gap-6 min-w-0">
                      <span className="text-xs font-black text-slate-500 uppercase min-w-[30px]">{sub.code}</span>
                      <h4 className="font-bold text-slate-200 truncate">{sub.title}</h4>
                    </div>
                    <div className="flex items-center gap-8 shrink-0">
                      <div className="w-48 hidden lg:block">
                        <ProgressBar current={sub?.mastered_topics || 0} total={sub?.total_topics || 1} color={sub.is_complete ? "emerald" : "sky"} />
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 group-hover:text-white transition-colors">
                        <Play size={16} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
