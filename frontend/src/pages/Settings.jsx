import React, { useState, useEffect } from 'react';
import { Save, ShieldCheck, Zap, AlertCircle, CheckCircle2, Key, Cpu, Users, UserPlus, Trash2, KeyRound } from 'lucide-react';
import axios from 'axios';

const MODEL_PRESETS = {
  google: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommended)' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Deep Reasoning)' },
    { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro (Legacy)' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o (Omni)' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Efficient)' },
    { id: 'o1-preview', name: 'o1 Reasoning Preview' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
  ]
};

// ─────────────────────────────────────────────
// User Management panel (admin only)
// ─────────────────────────────────────────────
const UserManagement = ({ currentUsername }) => {
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const { data } = await axios.get('/api/auth/users');
      setUsers(data);
    } catch { /* not admin or error — component won't render anyway */ }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg(null);
    try {
      await axios.post('/api/auth/users', { username: newUsername.trim(), password: newPassword });
      setCreateMsg({ type: 'success', text: `User "${newUsername.trim()}" created.` });
      setNewUsername('');
      setNewPassword('');
      loadUsers();
    } catch (err) {
      setCreateMsg({ type: 'error', text: err.response?.data?.error || 'Failed to create user.' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/auth/users/${username}`);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/auth/users/${resetTarget}/password`, { password: resetPassword });
      setResetTarget(null);
      setResetPassword('');
      alert(`Password updated for "${resetTarget}".`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update password.');
    }
  };

  return (
    <div className="glass-card p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
          <Users size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold">User Management</h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Admin Only</p>
        </div>
      </div>

      {/* User list */}
      <div className="space-y-3 mb-8">
        {users.map(u => (
          <div key={u.username} className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <span className="font-bold text-slate-200">{u.username}</span>
              {u.is_admin === 1 && (
                <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full">Admin</span>
              )}
              <p className="text-xs text-slate-600 mt-0.5">
                Created {new Date(u.created_at).toLocaleDateString()}
              </p>
            </div>
            {u.username !== currentUsername && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setResetTarget(u.username); setResetPassword(''); }}
                  className="p-2 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                  title="Reset password"
                >
                  <KeyRound size={16} />
                </button>
                <button
                  onClick={() => handleDelete(u.username)}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Delete user"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reset password form */}
      {resetTarget && (
        <form onSubmit={handleResetPassword} className="mb-8 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
          <p className="text-sm font-bold text-amber-400">Reset password for <span className="text-white">{resetTarget}</span></p>
          <input
            type="password"
            value={resetPassword}
            onChange={e => setResetPassword(e.target.value)}
            placeholder="New password (min 6 chars)"
            minLength={6}
            required
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-amber-500/50 text-sm"
          />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary py-2 px-4 text-sm">Save</button>
            <button type="button" onClick={() => setResetTarget(null)} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Create user form */}
      <div className="pt-6 border-t border-slate-800">
        <h4 className="font-bold text-slate-300 mb-4 flex items-center gap-2">
          <UserPlus size={18} className="text-emerald-400" /> Add New User
        </h4>
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            type="text"
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
            placeholder="Username"
            required
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500/50 text-sm"
          />
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Password (min 6 characters)"
            required
            minLength={6}
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500/50 text-sm"
          />
          {createMsg && (
            <p className={`text-sm font-medium ${createMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {createMsg.text}
            </p>
          )}
          <button type="submit" disabled={creating} className="btn-primary py-2.5 px-5 text-sm flex items-center gap-2">
            <UserPlus size={16} />
            {creating ? 'Creating...' : 'Create User'}
          </button>
        </form>
        <p className="text-xs text-slate-600 mt-3">
          The new user's syllabus is seeded automatically — they can start studying immediately after logging in.
        </p>
      </div>
    </div>
  );
};

const Settings = ({ user }) => {
  const [settings, setSettings] = useState({
    provider: 'google',
    model: 'gemini-2.5-flash',
    apiKey: ''
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [isCustomModel, setIsCustomModel] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get('/api/settings');
      if (data.provider) {
        setSettings(prev => ({ ...prev, ...data }));
        
        // Check if the current model is in our presets
        const presets = MODEL_PRESETS[data.provider] || [];
        const isPreset = presets.some(p => p.id === data.model);
        setIsCustomModel(!isPreset);
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  const handleProviderChange = (newProvider) => {
    const defaultModel = MODEL_PRESETS[newProvider][0].id;
    setSettings({ ...settings, provider: newProvider, model: defaultModel });
    setIsCustomModel(false);
  };


  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data } = await axios.post('/api/settings/test', settings);
      setTestResult(data.success ? 'success' : 'error');
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setTestResult({ status: 'error', message: msg });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      await axios.post('/api/settings', settings);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-20">
      <header className="mb-10">
        <h2 className="text-4xl font-extrabold premium-gradient-text tracking-tight mb-2">System Configuration</h2>
        <p className="text-slate-400">Configure your AI engine and secure your API credentials.</p>
      </header>

      <div className="space-y-8">
        <div className="glass-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
              <Cpu size={24} />
            </div>
            <h3 className="text-xl font-bold">AI Provider</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'google', name: 'Google Gemini', desc: 'Fast & High Context' },
              { id: 'openai', name: 'OpenAI GPT', desc: 'Industry Standard' },
              { id: 'anthropic', name: 'Anthropic Claude', desc: 'Superior Reasoning' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleProviderChange(p.id)}
                className={`p-5 rounded-2xl border text-left transition-all duration-200 ${
                  settings.provider === p.id 
                    ? 'bg-sky-500/10 border-sky-500 ring-1 ring-sky-500/20' 
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`w-3 h-3 rounded-full mb-3 ${settings.provider === p.id ? 'bg-sky-500' : 'bg-slate-700'}`}></div>
                <h4 className="font-bold text-slate-100">{p.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Key size={24} />
            </div>
            <h3 className="text-xl font-bold">Credentials</h3>
          </div>

          <div className="space-y-6">
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Target Model Name</label>
              <input 
                type="text" 
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                placeholder={settings.provider === 'google' ? 'e.g. gemini-2.0-flash-exp' : settings.provider === 'openai' ? 'e.g. gpt-4o' : 'e.g. claude-3-5-sonnet-latest'}
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500/50 transition-all font-mono text-sm"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {MODEL_PRESETS[settings.provider].map(m => (
                  <button 
                    key={m.id} 
                    onClick={() => setSettings({ ...settings, model: m.id })}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors border border-slate-700 hover:border-sky-500/30"
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">API Key</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={settings.apiKey}
                  onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                  placeholder="Paste your API key here..."
                  className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500/50 transition-all font-mono text-sm pr-12"
                />
                <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleTest}
                disabled={testing || !settings.apiKey}
                className="btn-secondary flex items-center gap-2 group"
              >
                {testing ? <Zap size={18} className="animate-pulse" /> : <Zap size={18} className="group-hover:text-amber-400" />}
                Test Connectivity
              </button>
              
              {testResult === 'success' && (
                <div className="text-emerald-400 flex items-center gap-2 text-sm font-bold animate-fade-in">
                  <CheckCircle2 size={18} /> CONNECTION REIFIED
                </div>
              )}
              {testResult?.status === 'error' && (
                <div className="text-rose-400 flex flex-col gap-1 text-sm font-bold animate-fade-in max-w-md">
                   <div className="flex items-center gap-2">
                    <AlertCircle size={18} /> AUTHENTICATION FAILED
                   </div>
                   <p className="text-xs font-normal text-rose-500/80 pl-6">{testResult.message}</p>
                </div>
              )}
              {testResult === 'error' && (
                 <div className="text-rose-400 flex items-center gap-2 text-sm font-bold animate-fade-in">
                  <AlertCircle size={18} /> AUTHENTICATION FAILED
                </div>
              )}
            </div>

            <button 
              onClick={handleSave}
              disabled={saving}
              className="btn-primary w-full md:w-auto flex items-center justify-center gap-2"
            >
              <Save size={18} /> {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
          
          {saveStatus === 'success' && (
            <p className="mt-4 text-center text-xs font-bold text-emerald-500 animate-fade-in uppercase tracking-widest">Settings updated successfully</p>
          )}
        </div>

        {/* Security Warning */}
        <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
          <AlertCircle className="text-amber-500 shrink-0 mt-1" size={24} />
          <div className="text-sm leading-relaxed text-amber-200/60">
            <p className="font-bold text-amber-500 mb-1">Local Identity Security</p>
            Your API keys are stored in your local SQLite database. While this file is private to your machine, it is unencrypted. Ensure your local device has appropriate disk encryption and access controls.
          </div>
        </div>

        {/* User Management — admin only */}
        {user?.isAdmin && <UserManagement currentUsername={user.username} />}

        {/* Danger Zone */}
        <div className="glass-card !border-rose-500/20 !bg-rose-500/5 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-rose-400">Danger Zone</h3>
              <p className="text-xs text-rose-500/60 font-bold uppercase tracking-widest">Permanent Actions</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <h4 className="font-bold text-slate-100">Re-initialize Project</h4>
              <p className="text-sm text-slate-500 mt-1">This will wipe all subsections, topics, and study progress. You will be taken back to the setup screen to re-parse the exam objectives PDF.</p>
            </div>
            <button 
              onClick={async () => {
                if (window.confirm("ARE YOU ABSOLUTELY SURE? This will permanently delete ALL study progress, analytics, and extracted topics. This cannot be undone.")) {
                  try {
                    await axios.post('/api/setup/reset');
                    window.location.href = '/setup';
                  } catch (err) {
                    alert("Failed to reset: " + err.message);
                  }
                }
              }}
              className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white font-bold rounded-xl transition-all border border-rose-500/20"
            >
              Wipe & Re-setup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
