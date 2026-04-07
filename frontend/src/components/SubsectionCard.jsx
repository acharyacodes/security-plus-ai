import React from 'react';
import { Play, RotateCcw, BarChart3, CheckCircle2, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from './ProgressBar';

const SubsectionCard = ({ subsection }) => {
  const navigate = useNavigate();
  const { id, code, title, total_topics, mastered_topics, is_complete } = subsection;
  
  const isMastered = mastered_topics === total_topics && total_topics > 0;
  const isStarted = mastered_topics > 0;

  return (
    <div className={`glass-card p-5 group flex flex-col h-full border ${isMastered ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">{code}</span>
          <h4 className="text-sm font-semibold text-slate-100 mt-1 line-clamp-2 leading-relaxed group-hover:text-sky-300 transition-colors">{title}</h4>
        </div>
        {isMastered ? (
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 size={18} />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
            <Circle size={18} />
          </div>
        )}
      </div>

      <div className="mt-auto">
        <ProgressBar current={mastered_topics} total={total_topics} size="sm" color={isMastered ? 'emerald' : 'sky'} />
        
        <div className="flex gap-2 mt-5">
          {isMastered ? (
            <>
              <button 
                onClick={() => navigate(`/analytics/${id}`)}
                className="flex-1 py-1.5 px-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all hover:text-white"
              >
                <BarChart3 size={14} /> Analytics
              </button>
              <button 
                onClick={() => navigate(`/study/${id}`)}
                className="py-1.5 px-3 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center transition-colors"
                title="Redo Subsection"
              >
                <RotateCcw size={14} />
              </button>
            </>
          ) : (
            <button 
              onClick={() => navigate(`/study/${id}`)}
              className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20"
            >
              <Play size={14} fill="currentColor" /> {isStarted ? 'Resume' : 'Start Study'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubsectionCard;
