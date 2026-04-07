import React from 'react';
import { RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

const RatingButtons = ({ onRate, disabled }) => {
  const ratings = [
    { 
      id: 'again', 
      label: 'Again', 
      desc: 'Still confused', 
      icon: <RotateCcw size={18} />, 
      color: 'bg-rose-500 hover:bg-rose-400', 
      ring: 'hover:ring-rose-500/20 shadow-rose-500/10' 
    },
    { 
      id: 'hard', 
      label: 'Hard', 
      desc: 'Got it, but unsure', 
      icon: <AlertTriangle size={18} />, 
      color: 'bg-amber-500 hover:bg-amber-400', 
      ring: 'hover:ring-amber-500/20 shadow-amber-500/10' 
    },
    { 
      id: 'easy', 
      label: 'Easy', 
      desc: 'I fully understand', 
      icon: <CheckCircle2 size={18} />, 
      color: 'bg-emerald-500 hover:bg-emerald-400', 
      ring: 'hover:ring-emerald-500/20 shadow-emerald-500/10' 
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in mt-10">
      {ratings.map((rating) => (
        <button
          key={rating.id}
          onClick={() => onRate(rating.id)}
          disabled={disabled}
          className={`group relative p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 transform active:scale-95 shadow-xl ${rating.color} ${rating.ring} text-white`}
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-1">
            {rating.icon}
          </div>
          <div className="text-center">
            <h4 className="font-bold text-lg leading-tight">{rating.label}</h4>
            <p className="text-xs text-white/70 font-medium">{rating.desc}</p>
          </div>
          
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="px-2 py-1 bg-white/20 rounded-md text-[10px] font-bold uppercase tracking-widest">
              Level {rating.id === 'again' ? 1 : rating.id === 'hard' ? 2 : 3}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default RatingButtons;
