import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Search, Plus, X, 
  Sparkles, Play, ClipboardList, Target, BookOpen
} from 'lucide-react';
import axios from 'axios';

const CustomBuilder = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [testName, setTestName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim()) {
        searchTopics();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const searchTopics = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`http://localhost:3000/api/custom/topics?q=${query}`);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addTopic = (topic) => {
    if (!selected.some(s => s.id === topic.id)) {
      setSelected([...selected, topic]);
    }
    setQuery('');
    setResults([]);
  };

  const removeTopic = (id) => {
    setSelected(selected.filter(s => s.id !== id));
  };

  const launchTest = async () => {
    if (selected.length === 0) return;
    try {
      const { data } = await axios.post('http://localhost:3000/api/custom/create', {
        name: testName || `Custom Drill (${selected.length} Topics)`,
        topicIds: selected.map(s => s.id)
      });
      navigate(`/custom-session/${data.testId}`);
    } catch (err) {
      console.error("Failed to create custom test", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors">
            <ChevronLeft size={20} /> Back to Dashboard
          </button>
          <h2 className="text-4xl font-extrabold premium-gradient-text tracking-tight">Custom Test Architect</h2>
          <p className="text-slate-400 mt-2 font-medium">Curate your own elite study session across all SY0-701 objectives.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Search & Select Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-8">
            <div className="mb-8">
              <label className="block text-xs font-black uppercase text-slate-500 tracking-[0.2em] mb-3">Manual Search</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.target.value HSM, Cloud, Firewall, or 1.1..." 
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all text-slate-100 placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Results */}
            <div className="space-y-2 min-h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-sky-500"></div>
                </div>
              ) : results.length > 0 ? (
                results.map(topic => (
                  <div 
                    key={topic.id}
                    onClick={() => addTopic(topic)}
                    className="p-4 rounded-xl border border-slate-800 hover:border-sky-500 hover:bg-sky-500/5 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-[10px] font-black text-slate-500 group-hover:text-sky-400">{topic.subsection_code}</span>
                      <h4 className="font-bold text-slate-200">{topic.name}</h4>
                    </div>
                    <Plus size={20} className="text-slate-700 group-hover:text-sky-500" />
                  </div>
                ))
              ) : query.trim() ? (
                <div className="text-center py-20 text-slate-600">
                  <p>No matching topics found for "{query}"</p>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-700 select-none">
                  <Sparkles size={40} className="mx-auto mb-4 opacity-10" />
                  <p className="font-medium italic">Type keywords to find specific SY0-701 details.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Your Bucket Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-8 bg-slate-900/50 border-sky-500/10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Target size={20} className="text-rose-500" /> Your Selection
              </h3>
              <span className="bg-sky-500/10 text-sky-400 px-3 py-1 rounded-full text-xs font-black">
                {selected.length} Topics
              </span>
            </div>

            <div className="mb-8">
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2">Drill Name</label>
              <input 
                type="text" 
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="e.g. My Weakest Points" 
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:border-sky-500 transition-all font-medium"
              />
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-slate-800">
              {selected.length > 0 ? (
                selected.map(s => (
                  <div key={s.id} className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center justify-between group animate-scale-in">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-sky-500 uppercase">{s.subsection_code}</p>
                      <p className="text-sm font-bold text-slate-300 truncate">{s.name}</p>
                    </div>
                    <button onClick={() => removeTopic(s.id)} className="p-1 hover:bg-rose-500/20 hover:text-rose-400 text-slate-600 rounded transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-700 italic border border-dashed border-slate-800 rounded-2xl">
                  <p className="text-xs">Your bucket is empty.</p>
                </div>
              )}
            </div>

            <button 
              onClick={launchTest}
              disabled={selected.length === 0}
              className="w-full btn-primary mt-10 py-5 text-lg flex items-center justify-center gap-3 active:scale-95 shadow-2xl shadow-sky-500/20"
            >
              <Play size={20} fill="currentColor" /> Launch Custom Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomBuilder;
