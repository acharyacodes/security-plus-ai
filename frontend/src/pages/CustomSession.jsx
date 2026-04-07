import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, CheckCircle, XCircle, Sparkles, LayoutDashboard, ArrowRight, Target } from 'lucide-react';
import axios from 'axios';
import QuestionCard from '../components/QuestionCard';
import ReasonInput from '../components/ReasonInput';
import RatingButtons from '../components/RatingButtons';
import ProgressBar from '../components/ProgressBar';

const CustomSession = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const [reason, setReason] = useState('');
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(null);

  useEffect(() => {
    fetchSession();
  }, [testId]);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`http://localhost:3000/api/custom/session/${testId}?t=${Date.now()}`);
      if (data.finished) {
        setFinished(true);
      } else {
        setSessionData(data);
        if (data.isRevealed) {
          setRevealed(true);
          setSelectedAnswers(data.selectedAnswers || []);
        } else {
          setSelectedAnswers([]);
          setRevealed(false);
        }
        setReason('');
        setRating(null);
      }
    } catch (err) {
      console.error("Failed to fetch custom session", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = () => {
    if (selectedAnswers.length === 0) return;
    setRevealed(true);
  };

  const handleRate = async (newRating) => {
    setRating(newRating);
    setSubmitting(true);
    try {
      await axios.post(`http://localhost:3000/api/custom/submit?t=${Date.now()}`, {
        testId,
        questionId: sessionData.question.id,
        rating: newRating,
        selectedAnswers
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      const { data } = await axios.post(`http://localhost:3000/api/custom/advance?t=${Date.now()}`, {
        testId,
        rating
      });

      if (data.finished) {
        setFinished(true);
      } else {
        fetchSession(); // Reload next question
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <Loader2 size={40} className="animate-spin text-sky-500" />
      <p className="text-slate-400 font-medium italic">Architecting your mixed-topic drill...</p>
    </div>
  );

  if (finished) return (
    <div className="max-w-xl mx-auto mt-20 text-center glass-card p-12">
      <div className="w-20 h-20 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 mx-auto mb-6">
        <Target size={40} />
      </div>
      <h2 className="text-3xl font-bold mb-4 premium-gradient-text">Custom Drill Complete!</h2>
      <p className="text-slate-400 mb-8 leading-relaxed">You have finished your personalized study session. These results have been integrated into your overall logic profile.</p>
      <button onClick={() => navigate('/')} className="btn-primary w-full flex items-center justify-center gap-2">
        <LayoutDashboard size={18} /> Back to Dashboard
      </button>
    </div>
  );

  const { question, testName, progress } = sessionData;
  const isCorrect = question.options
    .filter(opt => opt.is_correct)
    .every(opt => selectedAnswers.includes(opt.id)) &&
    selectedAnswers.length === question.options.filter(opt => opt.is_correct).length;

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-fade-in">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={20} /> <span className="font-semibold">Exit Custom Test</span>
        </button>
        <div className="text-right">
          <span className="text-xs font-black text-rose-500 uppercase tracking-widest flex items-center gap-2 justify-end">
            <Target size={12} /> Custom Session
          </span>
          <p className="text-lg font-extrabold text-slate-200">{testName}</p>
        </div>
      </header>

      {/* Question Area */}
      <div className="glass-card p-10 min-h-[400px] relative overflow-hidden border-t-4 border-t-rose-500/50">
        <QuestionCard 
          question={question} 
          selectedAnswers={selectedAnswers} 
          onSelect={setSelectedAnswers} 
          revealed={revealed} 
        />

        {!revealed ? (
          <div className="mt-10 flex justify-end">
            <button
              onClick={handleReveal}
              disabled={selectedAnswers.length === 0}
              className="btn-primary px-10 py-4 text-lg shadow-2l"
            >
              Check Answer
            </button>
          </div>
        ) : (
          <div className="mt-10 pt-10 border-t border-slate-800 animate-fade-in">
             <div className={`p-6 rounded-2xl mb-10 flex items-center gap-6 ${isCorrect ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${isCorrect ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'}`}>
                  {isCorrect ? <CheckCircle size={32} /> : <XCircle size={32} />}
                </div>
                <div>
                  <h4 className={`text-xl font-black ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isCorrect ? 'ELITE ACCURACY' : 'CRITICAL GAP'}
                  </h4>
                  <p className="text-slate-400 font-medium italic">Analyze the "Why Not" logic below carefully.</p>
                </div>
              </div>

              <ReasonInput value={reason} onChange={setReason} disabled={submitting || !!rating} />

              <div className="mt-12 text-center relative">
                <RatingButtons onRate={handleRate} disabled={submitting || !!rating} />
                {rating && (
                  <div className="mt-10 animate-slide-up bg-sky-500/5 p-6 rounded-2xl border border-sky-500/10 flex flex-col items-center gap-4">
                    <p className="text-sm text-slate-400 font-medium italic">Custom spot saved. Ready for the next mixed-topic detail?</p>
                    <button 
                      onClick={handleNext}
                      disabled={submitting}
                      className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 group"
                    >
                      Next Topic <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                )}
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomSession;
