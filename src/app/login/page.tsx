'use client';

import React, { useState, FormEvent } from 'react';
import { useAuth } from '@/lib/firebase/authContext';
import { useRouter } from 'next/navigation';
import { CreditCard, LogIn, Loader2, ShieldAlert, KeyRound } from 'lucide-react';
import { seedInitialAdminIfEmpty } from '@/lib/firebase/adminService';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('ইউজারনেম ও পাসওয়ার্ড দিন');
      return;
    }
    setError('');
    setIsBlocked(false);
    setLoading(true);

    try {
      await login(username, password);
      router.push('/scanner');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      if (msg === 'BLOCKED') {
        setIsBlocked(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSeedAdmin = async () => {
    try {
      setSeeding(true);
      const created = await seedInitialAdminIfEmpty();
      if (created) {
        toast.success('ডিফল্ট অ্যাডমিন তৈরি হয়েছে! (Username: admin, Password: adminpassword123)');
        setUsername('admin');
        setPassword('adminpassword123');
      } else {
        toast.info('ডাটাবেজে ইতিমধ্যে ইউজার আছে। অনুগ্রহ করে আপনার ইউজারনেম ও পাসওয়ার্ড দিয়ে লগইন করুন।');
      }
    } catch {
      toast.error('অ্যাডমিন সেটআপ ব্যর্থ হয়েছে');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 mx-auto mb-4">
            <CreditCard className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Smart NID Scan</h1>
          <p className="text-slate-400 text-sm mt-1">লগইন করুন</p>
        </div>

        {/* Blocked Message */}
        {isBlocked && (
          <div className="mb-6 p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-center space-y-2">
            <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
            <h2 className="text-red-300 font-bold text-lg">অ্যাকাউন্ট লক / ব্লক করা হয়েছে</h2>
            <p className="text-red-400/90 text-sm leading-relaxed">
              আপনার অ্যাকাউন্টটি অ্যাডমিন কর্তৃক ব্লক/লক করা হয়েছে।<br />
              অনুগ্রহ করে সাপোর্টে যোগাযোগ করুন।
            </p>
            <p className="text-red-500/70 text-xs">Your account has been locked. Please contact our support team.</p>
            <button
              onClick={() => setIsBlocked(false)}
              className="mt-3 text-xs text-slate-400 hover:text-white underline"
            >
              অন্য অ্যাকাউন্ট দিয়ে চেষ্টা করুন
            </button>
          </div>
        )}

        {/* Login Form */}
        {!isBlocked && (
          <form onSubmit={handleSubmit} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">ইউজারনেম / Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                autoComplete="username"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">পাসওয়ার্ড / Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-600 text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>{loading ? 'লগইন হচ্ছে...' : 'লগইন'}</span>
            </button>

            {/* Initial Admin Setup Helper */}
            <div className="pt-2 border-t border-slate-700/60 text-center">
              <button
                type="button"
                onClick={handleSeedAdmin}
                disabled={seeding}
                className="text-[11px] text-slate-400 hover:text-blue-400 inline-flex items-center gap-1 transition-colors"
              >
                <KeyRound className="w-3 h-3" />
                <span>{seeding ? 'চেক করা হচ্ছে...' : 'প্রথমবার ব্যবহার করছেন? ডিফল্ট অ্যাডমিন চালু করুন'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
