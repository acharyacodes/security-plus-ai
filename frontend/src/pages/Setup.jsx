import React, { useState, useEffect } from 'react';
import { Upload, FileCheck, Loader2, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const Setup = ({ onSetupComplete }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [fileFound, setFileFound] = useState(false);

  useEffect(() => {
    checkInitialFile();
  }, []);

  const checkInitialFile = async () => {
    try {
      const { data } = await axios.get('/api/setup/status');
      if (data.isSetup) {
        onSetupComplete();
      }
      setFileFound(true); // Assuming the user placed the PDF as instructed
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoSetup = async () => {
    setLoading(true);
    setStatus('processing');
    setError(null);
    try {
      const { data } = await axios.post('/api/setup/auto');
      setStatus('complete');
      setTimeout(() => onSetupComplete(), 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setStatus('processing');
    setError(null);
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      await axios.post('/api/setup/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus('complete');
      setTimeout(() => onSetupComplete(), 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-20 p-8 glass-card animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-3 premium-gradient-text">Initialize SY0-701</h1>
        <p className="text-slate-400">Upload the CompTIA Security+ Exam Objectives PDF to build your personalized study path.</p>
      </div>

      <div className="space-y-6">
        {/* Auto-Setup Card */}
        <div className={`p-6 rounded-2xl border ${status === 'processing' ? 'border-sky-500/50 bg-sky-500/5' : 'border-slate-800 bg-slate-900/50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-sky-400">
                <FileCheck size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Quick Start (Recommended)</h3>
                <p className="text-sm text-slate-500">Initialize instantly using the verified SY0-701 syllabus.</p>
              </div>
            </div>
            <button 
              onClick={handleAutoSetup}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
              Process Now
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 my-8">
          <div className="h-px bg-slate-800 flex-1"></div>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">or upload manually</span>
          <div className="h-px bg-slate-800 flex-1"></div>
        </div>

        {/* Manual Upload */}
        <label className="block p-10 rounded-2xl border-2 border-dashed border-slate-800 hover:border-sky-500/50 hover:bg-sky-500/5 transition-all text-center cursor-pointer">
          <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf" />
          <Upload className="mx-auto mb-4 text-slate-500" size={32} />
          <p className="text-slate-300 font-medium">Click to select PDF or drag and drop</p>
          <p className="text-xs text-slate-500 mt-2">Maximum file size: 50MB</p>
        </label>

        {status === 'complete' && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3">
            <CheckCircle2 size={20} />
            <span className="font-medium">Parsing and Seeding Successful! Redirecting...</span>
          </div>
        )}

        {status === 'error' && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3">
            <AlertCircle size={20} />
            <span className="font-medium">Setup Error: {error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Setup;
