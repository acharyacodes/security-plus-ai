import React from 'react';
import { PenLine, Sparkles } from 'lucide-react';

const ReasonInput = ({ value, onChange, disabled }) => {
  return (
    <div className="space-y-4 animate-fade-in my-10 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
      <div className="flex items-center gap-2 text-sky-400 mb-2">
        <PenLine size={18} />
        <h4 className="font-bold text-sm uppercase tracking-widest">Your Thinking</h4>
        <Sparkles size={14} className="ml-auto opacity-50" />
      </div>
      
      <p className="text-sm text-slate-400 mb-4">
        Why did you choose this answer? What was your reasoning? (Brief notes feed the AI Diagnostic Engine).
      </p>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="e.g., 'I recognized the AAA pattern but wasn't sure if accounting included non-repudiation...'"
        className="w-full h-32 p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 transition-all resize-none font-medium"
      ></textarea>

      <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-slate-600">
        <span>Thinking Note for AI Engine</span>
        <span>{value.length} characters</span>
      </div>
    </div>
  );
};

export default ReasonInput;
