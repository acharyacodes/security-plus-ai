import React from 'react';

const ProgressBar = ({ current, total, size = 'md', color = 'sky' }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  
  const heightClass = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }[size];

  const colorClass = {
    sky: 'bg-sky-500',
    emerald: 'bg-emerald-500',
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500'
  }[color];

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-1.5">
        <span className="text-xs font-medium text-slate-400 capitalize">{percentage}% Complete</span>
        <span className="text-xs font-semibold text-slate-200">{current} / {total}</span>
      </div>
      <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${heightClass}`}>
        <div 
          className={`${colorClass} h-full rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
