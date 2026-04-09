import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, CheckCircle, XCircle, Info, Sparkles, LayoutDashboard, ArrowRight } from 'lucide-react';
import axios from 'axios';
import QuestionCard from '../components/QuestionCard';
import ReasonInput from '../components/ReasonInput';
import RatingButtons from '../components/RatingButtons';
import ProgressBar from '../components/ProgressBar';

const StudySession = () => {
  const { subsectionId } = useParams();
  const navigate = useNavigate();
  
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuestion();
  }, [subsectionId]);

  const fetchQuestion = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`/api/study/session/${subsectionId}?t=${Date.now()}`);
      if (!data || data.length === 0) {
        setFinished(true);
      } else {
        setQuestionData(data);
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
      console.error("Failed to fetch study session", err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = async () => {
    if (selectedAnswers.length === 0) return;
    setRevealed(true);
  };

  const handleRate = async (newRating) => {
    setRating(newRating);
    setSubmitting(true);

    const isCorrect = questionData.question.options
      .filter(opt => opt.is_correct)
      .every(opt => selectedAnswers.includes(opt.id)) &&
      selectedAnswers.length === questionData.question.options.filter(opt => opt.is_correct).length;

    try {
      await axios.post(`/api/study/submit?t=${Date.now()}`, {
        subsectionId,
        questionId: questionData.question.id,
        topicId: questionData.question.topic_id,
        subtopicId: questionData.question.subtopic_id,
        selectedAnswers,
        isCorrect,
        rating: newRating,
        userReason: reason,
        userConfidence: newRating === 'easy' ? 'high' : newRating === 'hard' ? 'medium' : 'low'
      });
    } catch (err) {
      console.error("Failed to submit attempt", err);
      setError("Failed to save progress. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      const { data } = await axios.post(`/api/study/advance?t=${Date.now()}`, {
        subsectionId,
        questionId: questionData.question.id,
        rating
      });

      if (data.finished) {
        setFinished(true);
      } else {
        setQuestionData({
          question: data.nextQuestion,
          topicName: data.nextQuestion.topic_name || questionData.topicName,
          progress: data.progress
        });
        setSelectedAnswers([]);
        setRevealed(false);
        setReason('');
        setRating(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error("Failed to advance session", err);
      setError(err.response?.data?.error || "Failed to generate next question.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">
      <div className="relative">
        <Loader2 size={60} className="animate-spin text-sky-500/20" />
        <Loader2 size={60} className="animate-spin text-sky-500 absolute top-0 left-0 [animation-delay:-0.3s]" />
      </div>
      <div className="text-center">
        <p className="text-xl font-bold premium-gradient-text animate-pulse">Curating Your Path</p>
        <p className="text-slate-500 text-sm mt-1">Analyzing mastery gaps and generating objectives...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-xl mx-auto mt-20 text-center glass-card p-12 border-rose-500/20">
      <div className="w-20 h-20 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-6">
        <Info size={40} />
      </div>
      <h2 className="text-3xl font-bold mb-4 text-rose-100">Setup Required</h2>
      <p className="text-slate-400 mb-8 leading-relaxed">
        {error.includes('API key') 
          ? "We couldn't generate questions because your AI API Key is missing or invalid. Please configure it in your settings to proceed."
          : `Something went wrong: ${error}`}
      </p>
      <div className="flex gap-4">
        <button onClick={() => navigate('/')} className="flex-1 btn-secondary">
          Dashboard
        </button>
        <button onClick={() => navigate('/settings')} className="flex-1 btn-primary bg-rose-600 hover:bg-rose-500 border-rose-400/50">
          Open Settings
        </button>
      </div>
    </div>
  );

  if (finished) return (
    <div className="max-w-xl mx-auto mt-20 text-center glass-card p-12">
      <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-6">
        <CheckCircle size={40} />
      </div>
      <h2 className="text-3xl font-bold mb-4 premium-gradient-text">Subsection Complete!</h2>
      <p className="text-slate-400 mb-8 leading-relaxed">You have mastered all currently assigned topics in this section. Your diagnostic analysis is now ready.</p>
      <div className="flex gap-4">
        <button onClick={() => navigate('/')} className="flex-1 btn-secondary flex items-center justify-center gap-2">
          <LayoutDashboard size={18} /> Dashboard
        </button>
        <button onClick={() => navigate(`/analytics/${subsectionId}`)} className="flex-1 btn-primary">
          View Detailed Analytics
        </button>
      </div>
    </div>
  );

  const { question, topicName, progress } = questionData;
  const isCorrect = question.options
    .filter(opt => opt.is_correct)
    .every(opt => selectedAnswers.includes(opt.id)) &&
    selectedAnswers.length === question.options.filter(opt => opt.is_correct).length;

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      {/* Top Header */}
      <header className="flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={20} /> <span className="font-semibold px-2 py-1 rounded-md hover:bg-slate-900 transition-colors">Back to Dashboard</span>
        </button>
        <div className="text-right">
          <span className="text-xs font-bold text-sky-500 uppercase tracking-widest">{topicName}</span>
          <p className="text-sm text-slate-400 font-medium">{progress.mastered} of {progress.total} sub-objectives mastered</p>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="glass-card p-4 rounded-2xl flex items-center gap-6">
        <div className="flex-1">
          <ProgressBar current={progress.mastered} total={progress.total} color="emerald" />
        </div>
        <div className="w-px h-10 bg-slate-800"></div>
        <div className="px-4 text-center">
          <p className="text-xs font-black uppercase text-slate-600 tracking-tighter">Session Streak</p>
          <p className="text-lg font-black text-emerald-400">🔥 7</p>
        </div>
      </div>

      {/* Question Area */}
      <div className="glass-card p-10 min-h-[400px] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-sky-500/10 transition-colors"></div>
        
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
              className="btn-primary px-10 py-4 text-lg shadow-2xl flex items-center gap-3 active:scale-95 transition-all"
            >
              Check Answer <ChevronLeft size={20} className="rotate-180" />
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
                  {isCorrect ? 'EXCELLENT' : 'INCORRECT'}
                </h4>
                <p className="text-slate-400 font-medium italic">Master all 4 logic points below to clear this objective.</p>
              </div>
            </div>

            <ReasonInput value={reason} onChange={setReason} disabled={submitting || !!rating} />
            
            <div className="mt-12 text-center relative">
              {(submitting && !rating) && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3 rounded-2xl animate-fade-in">
                  <Loader2 className="animate-spin text-sky-500" size={24} />
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">AI is analyzing your reasons...</span>
                </div>
              )}
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center justify-center gap-3">
                <div className="h-px w-10 bg-slate-800"></div>
                How easy was this?
                <div className="h-px w-10 bg-slate-800"></div>
              </h3>
              <RatingButtons onRate={handleRate} disabled={submitting || !!rating} />
              
              {rating && (
                <div className="mt-10 animate-slide-up bg-sky-500/5 p-6 rounded-2xl border border-sky-500/10 flex flex-col items-center gap-4">
                  <p className="text-sm text-slate-400 font-medium">Session spot saved. Take your time with the review above.</p>
                  <button 
                    onClick={handleNext}
                    disabled={submitting}
                    className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 group"
                  >
                    Next Question <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
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

export default StudySession;
