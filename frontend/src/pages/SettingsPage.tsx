import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  Moon,
  Sun,
  CheckCircle2,
  Lock,
  Phone,
  Mail,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess(null);
    try {
      await api.updateProfile({
        full_name: fullName,
        phone: phone || undefined,
        password: password.trim() ? password : undefined,
      });
      await refreshUser();
      setSaveSuccess('Profile updated successfully!');
      setPassword('');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-electric-500" />
          System Settings & Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your account profile credentials, visual theme preferences, and review system configuration.
        </p>
      </div>

      {/* Theme Preference Box */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-navy-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-electric-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Interface Appearance</h3>
            <p className="text-xs text-slate-400">Current visual theme is set to {theme.toUpperCase()} mode.</p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
        >
          Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
        </button>
      </div>

      {/* Account Profile Form */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-electric-500" />
          Personal Profile Details
        </h3>

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-slate-500 cursor-not-allowed font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                New Password (leave blank to keep current)
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-electric-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saveLoading}
              className="px-6 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-glow-blue transition-all disabled:opacity-50"
            >
              {saveLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* System Technical Architecture */}
      <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-500" />
          Technical Stack & Platform Specifications
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Frontend</span>
            <span className="font-bold text-slate-900 dark:text-white">React 18 + Vite TS</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Backend</span>
            <span className="font-bold text-slate-900 dark:text-white">Python 3.12 + FastAPI</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Architecture</span>
            <span className="font-bold text-slate-900 dark:text-white">Map-Free Slot Grid</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Currency</span>
            <span className="font-bold text-slate-900 dark:text-white">INR (₹) Default</span>
          </div>
        </div>
      </div>
    </div>
  );
};
