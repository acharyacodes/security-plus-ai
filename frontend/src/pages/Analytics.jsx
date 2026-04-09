import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BarChart3, Brain, Award, AlertTriangle, 
  RotateCcw, RefreshCw, ChevronLeft, Target,
  CheckCircle, XCircle, TrendingUp, Download, FileText
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import axios from 'axios';

const Analytics = () => {
  const { subsectionId } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (subsectionId) {
      fetchAnalytics();
    }
  }, [subsectionId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/analytics/subsection/${subsectionId}`);
      setData(data);
      const historyRes = await axios.get(`/api/analytics/history/${subsectionId}`);
      setHistory(historyRes.data);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await axios.post(`/api/analytics/refresh/${subsectionId}`);
      await fetchAnalytics();
    } catch (err) {
      console.error("Failed to refresh analysis", err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRedo = async () => {
    if (!window.confirm("This will reset your mastery progress for this subsection. Your attempt history will be preserved for AI analysis. Continue?")) return;
    try {
      await axios.post(`/api/analytics/redo/${subsectionId}`);
      navigate(`/study/${subsectionId}`);
    } catch (err) {
      console.error("Failed to redo subsection", err);
    }
  };

  const downloadCSV = () => {
    if (history.length === 0) return;
    
    const headers = ["Subtopic", "Question", "Correct Answer", "Your Reason", "Date"];
    const rows = history.map(h => [
      `"${(h.subtopic || 'Unknown').replace(/"/g, '""')}"`,
      `"${(h.question || '').replace(/"/g, '""')}"`,
      `"${(h.correctAnswer || '').replace(/"/g, '""')}"`,
      `"${(h.reason || '').replace(/"/g, '""')}"`,
      h.date ? new Date(h.date).toLocaleDateString() : 'N/A'
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SecurityPlus_Review_${subsectionId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!subsectionId) return (
    <div className="text-center mt-20 glass-card p-12 max-w-xl mx-auto">
      <BarChart3 size={48} className="text-slate-500 mx-auto mb-6" />
      <h2 className="text-2xl font-bold mb-4">No Subsection Selected</h2>
      <p className="text-slate-400 mb-8">Go to the dashboard and complete a study session to see your diagnostic analysis here.</p>
      <button onClick={() => navigate('/')} className="btn-primary">Back to Dashboard</button>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
    </div>
  );

  if (!data || !data.stats) return (
    <div className="text-center mt-20 glass-card p-12 max-w-xl mx-auto">
      <AlertTriangle size={48} className="text-amber-500 mx-auto mb-6" />
      <h2 className="text-2xl font-bold mb-4">Insufficient Data</h2>
      <p className="text-slate-400 mb-8">No statistical data found for this subsection yet. Have you completed any study sessions?</p>
      <button onClick={() => navigate('/')} className="btn-primary">Back to Dashboard</button>
    </div>
  );

  const { analysis, stats, topics } = data;
  const ratingData = [
    { name: 'Again', value: stats.again_count || 0, color: '#ef4444' },
    { name: 'Hard', value: stats.hard_count || 0, color: '#f59e0b' },
    { name: 'Easy', value: stats.easy_count || 0, color: '#22c55e' },
  ];

  return (
    <div className="space-y-10 pb-20 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors">
            <ChevronLeft size={20} /> Back to Dashboard
          </button>
          <h2 className="text-4xl font-extrabold premium-gradient-text tracking-tight">Diagnostic Analysis</h2>
          <p className="text-slate-400 mt-2">Personalized insights into your reasoning and mastery patterns.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleRedo} className="btn-secondary flex items-center gap-2">
            <RotateCcw size={18} /> Redo Section
          </button>
          <button onClick={handleRefresh} disabled={refreshing} className="btn-primary flex items-center gap-2">
            {refreshing ? <RefreshCw size={18} className="animate-spin" /> : <Brain size={18} />}
            {analysis ? 'Refresh Analysis' : 'Generate Analysis'}
          </button>
        </div>
      </header>

      {/* Accuracy & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass-card flex flex-col items-center justify-center p-10 text-center">
          <div className="relative w-40 h-40 mb-6">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle className="text-slate-800 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
              <circle 
                className="text-sky-500 stroke-current transition-all duration-1000" 
                strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * (stats.correct_questions / (stats.total_questions || 1)))}
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black">{Math.round((stats.correct_questions / (stats.total_questions || 1)) * 100)}%</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Accuracy</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 w-full mt-4">
            <div>
              <p className="text-2xl font-black text-slate-100">{stats.total_questions}</p>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Attempts</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400">{stats.correct_questions}</p>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Correct</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 glass-card p-8">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Award size={20} className="text-amber-400" /> Rating Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {ratingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Reasoning Panel */}
      <div className="glass-card p-10 relative overflow-hidden group border-l-4 border-l-sky-500">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Brain size={120} />
        </div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
            <Brain size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold">AI Reasoning Insight</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Pattern Recognition Analysis</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          {analysis ? (
            <div className="text-slate-300 leading-relaxed space-y-4 whitespace-pre-wrap font-medium">
              {analysis.analysis_text}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-slate-500 italic">No analysis generated yet. Click "Generate Analysis" to identify your thinking patterns.</p>
            </div>
          )}
        </div>

        {analysis && analysis.has_new_attempts_since === 1 && (
          <div className="mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center gap-3">
            <AlertTriangle size={20} />
            <span className="text-sm font-semibold">You have completed new attempts since this analysis. Consider refreshing for updated insights.</span>
          </div>
        )}
      </div>

      {/* Topic Breakdown */}
      <div className="glass-card p-8">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
          <Target size={24} className="text-rose-500" /> Topic Breakdown
        </h3>
        <div className="space-y-4">
          {topics.map((topic, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${topic.mastery_status === 'mastered' ? 'bg-emerald-500' : topic.attempts_count > 0 ? 'bg-amber-500' : 'bg-slate-700'}`}></div>
                <div>
                  <h4 className="font-bold text-slate-100">{topic.name}</h4>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-black">{topic.mastery_status.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-10">
                <div className="text-center">
                  <p className="text-lg font-black text-slate-300">{topic.attempts_count}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">Attempts</p>
                </div>
                <div className="text-center">
                  <p className={`text-lg font-black ${topic.missed_count > 0 ? 'text-rose-400' : 'text-slate-500'}`}>{topic.missed_count}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">Missed</p>
                </div>
                <div className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${topic.mastery_status === 'mastered' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  {topic.mastery_status === 'mastered' ? 'Mastered' : 'In Progress'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Review History */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-sky-400">
            <FileText size={24} />
            <h3 className="text-xl font-bold">Deep Study & Vocabulary Gaps</h3>
          </div>
          {history.length > 0 && (
            <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-all text-sm font-bold">
              <Download size={18} /> Download Study List (CSV)
            </button>
          )}
        </div>
        
        {history.length > 0 ? (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="pb-4 px-4 text-xs font-black uppercase text-slate-500 tracking-widest">Subtopic</th>
                    <th className="pb-4 px-4 text-xs font-black uppercase text-slate-500 tracking-widest">Missed Detail</th>
                    <th className="pb-4 px-4 text-xs font-black uppercase text-slate-500 tracking-widest">Correct Logic</th>
                    <th className="pb-4 px-4 text-xs font-black uppercase text-slate-500 tracking-widest">Your Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {history.map((h, idx) => (
                    <tr key={idx} className="group hover:bg-slate-900/50 transition-colors">
                      <td className="py-5 px-4 text-sm font-bold text-sky-400 align-top whitespace-nowrap">{h.subtopic}</td>
                      <td className="py-5 px-4 text-sm text-slate-300 align-top min-w-[300px] leading-relaxed italic">"{h.question}"</td>
                      <td className="py-5 px-4 text-sm text-emerald-400 align-top font-medium">{h.correctAnswer}</td>
                      <td className="py-5 px-4 text-sm text-slate-500 align-top max-w-[200px] break-words">{h.reason || 'No reason provided.'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-600 italic">This list shows all incorrect attempts since your last Elite reset. Use the download button to audit these for "Vocabulary Gaps" manually.</p>
          </div>
        ) : (
          <div className="text-center py-10 rounded-2xl bg-slate-900/50 border border-dashed border-slate-800">
            <p className="text-slate-500">No failed attempts recorded for this subsection yet. Keep up the good work!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
