import React, { useState } from 'react';
import { ShieldCheck, LogIn, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const Login = ({ onLogin, needsBootstrap }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    setError(null);

    try {
      const endpoint = needsBootstrap ? '/api/auth/bootstrap' : '/api/auth/login';
      const { data } = await axios.post(endpoint, { username: username.trim(), password });
      onLogin({ username: data.username, isAdmin: data.isAdmin });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-sky-500 flex items-center justify-center shadow-2xl shadow-sky-500/30 mx-auto mb-4">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Security+ <span className="text-sky-400">AI</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2">SY0-701 Adaptive Study Platform</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {needsBootstrap && (
            <div className="mb-6 p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-sm leading-relaxed">
              <p className="font-bold text-sky-400 mb-1">First-Time Setup</p>
              Create your admin account. This is the owner account — use it to create accounts for friends later in Settings.
            </div>
          )}

          <h2 className="text-xl font-bold mb-6">
            {needsBootstrap ? 'Create Admin Account' : 'Sign In'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your username"
                autoComplete="username"
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500/50 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={needsBootstrap ? 'new-password' : 'current-password'}
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500/50 transition-all"
                required
                minLength={6}
              />
              {needsBootstrap && (
                <p className="text-xs text-slate-600 mt-2">Minimum 6 characters.</p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm animate-fade-in">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-base flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <LogIn size={20} />
              )}
              {loading
                ? needsBootstrap ? 'Creating account...' : 'Signing in...'
                : needsBootstrap ? 'Create Account & Continue' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-700 mt-6">
          Access is by invitation only. Contact the admin to get an account.
        </p>
      </div>
    </div>
  );
};

export default Login;
