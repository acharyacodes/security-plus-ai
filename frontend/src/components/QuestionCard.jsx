import React from 'react';
import { Check, X, Info, Target, HelpCircle } from 'lucide-react';

const QuestionCard = ({ question, selectedAnswers, onSelect, revealed }) => {
  const toggleOption = (optionId) => {
    if (revealed) return;
    if (question.multiple_correct) {
      onSelect(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId) 
          : [...prev, optionId]
      );
    } else {
      onSelect([optionId]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Question Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-black uppercase tracking-widest">
            {question.question_type}
          </span>
          {question.multiple_correct && (
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest flex items-center gap-1">
              <Target size={12} /> Multiple Selection
            </span>
          )}
        </div>
        <h3 className="text-2xl font-bold leading-relaxed text-slate-100 italic">
          "{question.question_text}"
        </h3>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-4">
        {question.options.map((option) => {
          const isSelected = selectedAnswers.includes(option.id);
          const isCorrect = option.is_correct;
          const showSuccess = revealed && isCorrect;
          const showError = revealed && isSelected && !isCorrect;

          let cardClass = "relative p-6 rounded-2xl border-2 transition-all cursor-pointer group ";
          if (revealed) {
            if (isCorrect) cardClass += "border-emerald-500 bg-emerald-500/5 cursor-default ";
            else if (isSelected) cardClass += "border-rose-500 bg-rose-500/5 cursor-default ";
            else cardClass += "border-slate-800 bg-slate-900/50 cursor-default ";
          } else {
            cardClass += isSelected 
              ? "border-sky-500 bg-sky-500/5 shadow-lg shadow-sky-500/10 " 
              : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/50 ";
          }

          return (
            <div key={option.id} className="space-y-2">
              <div
                onClick={() => toggleOption(option.id)}
                className={cardClass}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border-2 transition-colors ${
                    showSuccess ? 'bg-emerald-500 border-emerald-500 text-white' :
                    showError ? 'bg-rose-500 border-rose-500 text-white' :
                    isSelected ? 'bg-sky-500 border-sky-500 text-white' :
                    'border-slate-700 text-slate-500 group-hover:border-slate-500'
                  }`}>
                    {showSuccess ? <Check size={18} /> : 
                     showError ? <X size={18} /> : 
                     <span className="text-xs font-bold">{option.id}</span>}
                  </div>
                  <p className={`text-lg transition-colors ${isSelected || showSuccess ? 'text-white' : 'text-slate-400'}`}>
                    {option.text}
                  </p>
                </div>

                {/* Show Correct Answer Logic */}
                {revealed && isCorrect && (
                  <div className="mt-4 pt-4 border-t border-emerald-500/20 animate-fade-in">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0 text-emerald-400">
                        <Info size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-1">Correct Logic:</p>
                        <p className="text-sm text-emerald-400/80 leading-relaxed italic">
                          {option.explanation?.why_this_context || option.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Show ALL Distractor Logic on Reveal, even if not selected */}
              {revealed && !isCorrect && (
                <div className={`mx-4 p-5 rounded-b-2xl bg-slate-900 border-x-2 border-b-2 transition-colors animate-slide-down ${isSelected ? 'border-rose-500/50' : 'border-slate-800'}`}>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 flex-shrink-0 ${isSelected ? 'text-rose-400' : 'text-slate-500'}`}>
                        {isSelected ? <X size={16} /> : <HelpCircle size={16} />}
                      </div>
                      <div>
                        <p className={`text-xs font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-rose-500' : 'text-slate-600'}`}>
                          {isSelected ? "Wait, here's why not:" : "Why this was a distractor:"}
                        </p>
                        <p className={`text-sm leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {option.explanation?.why_this_context || option.explanation}
                        </p>
                      </div>
                    </div>
                    
                    {option.explanation?.when_would_be_correct && (
                      <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${isSelected ? 'bg-sky-500/5 border-sky-500/10' : 'bg-slate-800/10 border-slate-800/50'}`}>
                        <div className={`mt-1 flex-shrink-0 ${isSelected ? 'text-sky-400' : 'text-slate-600'}`}>
                          <Target size={16} />
                        </div>
                        <div>
                          <p className={`text-xs font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-sky-400' : 'text-slate-700'}`}>Contextual Insight:</p>
                          <p className={`text-sm ${isSelected ? 'text-slate-400' : 'text-slate-600'}`}>
                            This WOULD be the correct answer if: <span className={`italic ${isSelected ? 'text-sky-300/90' : 'text-slate-500/90'}`}>{option.explanation.when_would_be_correct}</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionCard;
