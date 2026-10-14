'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/authContext';
import {
  getAllUsers,
  createDbUser,
  toggleUserLock,
  deleteDbUser,
  getSystemSettings,
  updateSystemSettings,
  DbUser,
  SystemSettings,
} from '@/lib/firebase/adminService';
import {
  Shield,
  Users,
  UserPlus,
  Lock,
  Unlock,
  Trash2,
  Power,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<DbUser[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    scanningEnabled: true,
    noticeMessage: '',
  });

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);

  // Password visibility map
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [userList, sysSettings] = await Promise.all([
        getAllUsers(),
        getSystemSettings(),
      ]);
      setUsers(userList);
      setSettings(sysSettings);
    } catch {
      toast.error('তথ্য লোড করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && !user.isAdmin) {
      router.replace('/scanner');
      return;
    }
    loadData();
  }, [user, router, loadData]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      toast.error('ইউজারনেম ও পাসওয়ার্ড দিন');
      return;
    }

    try {
      setCreatingUser(true);
      await createDbUser(newUsername, newPassword, newIsAdmin);
      toast.success(`ইউজার '${newUsername}' সফলভাবে তৈরি হয়েছে`);
      setNewUsername('');
      setNewPassword('');
      setNewIsAdmin(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ব্যবহারকারী তৈরি ব্যর্থ হয়েছে';
      toast.error(msg);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleToggleLock = async (targetUser: DbUser) => {
    if (targetUser.id === user?.id) {
      toast.error('আপনি নিজের অ্যাকাউন্ট লক করতে পারবেন না');
      return;
    }

    try {
      await toggleUserLock(targetUser.id, targetUser.isLocked);
      toast.success(
        targetUser.isLocked
          ? `ইউজার '${targetUser.username}' আনলক করা হয়েছে`
          : `ইউজার '${targetUser.username}' লক/ব্লক করা হয়েছে`
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, isLocked: !targetUser.isLocked } : u
        )
      );
    } catch {
      toast.error('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে');
    }
  };

  const handleDeleteUser = async (targetUser: DbUser) => {
    if (targetUser.id === user?.id) {
      toast.error('আপনি নিজের অ্যাকাউন্ট মুছতে পারবেন না');
      return;
    }

    if (!confirm(`আপনি কি নিশ্চিত যে '${targetUser.username}' ইউজারটি ডিলিট করতে চান?`)) {
      return;
    }

    try {
      await deleteDbUser(targetUser.id);
      toast.success(`ইউজার '${targetUser.username}' মুছে ফেলা হয়েছে`);
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
    } catch {
      toast.error('ইউজার মুছতে সমস্যা হয়েছে');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await updateSystemSettings(settings);
      toast.success('সিস্টেম সেটিংস সফলভাবে আপডেট করা হয়েছে');
    } catch {
      toast.error('সেটিংস আপডেট ব্যর্থ হয়েছে');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 font-medium">অ্যাডমিন প্যানেল লোড হচ্ছে...</p>
      </div>
    );
  }

  const activeCount = users.filter((u) => !u.isLocked).length;
  const lockedCount = users.filter((u) => u.isLocked).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            অ্যাডমিন প্যানেল (Admin Panel)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            সিস্টেমের ইউজার ও স্ক্যানিং ফিচার নিয়ন্ত্রণ করুন
          </p>
        </div>
        <button
          onClick={loadData}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">মোট ইউজার</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{users.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs text-emerald-600 font-medium">সক্রিয় ইউজার</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs text-red-600 font-medium">লকড / ব্লকড</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{lockedCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs text-blue-600 font-medium">স্ক্যানিং স্ট্যাটাস</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                settings.scanningEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-sm font-bold text-slate-900">
              {settings.scanningEnabled ? 'চালু (ON)' : 'বন্ধ (OFF)'}
            </span>
          </div>
        </div>
      </div>

      {/* System Settings Control */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Power className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-base text-slate-900">
            সিস্টেম কন্ট্রোল (System Maintenance)
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900">
                স্ক্যানিং ফিচার চালু / বন্ধ (Scanner Feature)
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  settings.scanningEnabled
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}
              >
                {settings.scanningEnabled ? 'চালু আছে' : 'বন্ধ আছে'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {settings.scanningEnabled
                ? 'ইউজাররা বর্তমানে NID ও জন্ম নিবন্ধন স্ক্যান করতে পারছেন।'
                : 'স্ক্যানিং ফিচার বন্ধ রাখা হয়েছে। ইউজাররা সাময়িক নোটিশ দেখতে পাবেন।'}
            </p>
          </div>

          <button
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                scanningEnabled: !prev.scanningEnabled,
              }))
            }
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
              settings.scanningEnabled
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>
              {settings.scanningEnabled ? 'ফিচারটি বন্ধ করুন' : 'ফিচারটি চালু করুন'}
            </span>
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            নোটিশ বা রক্ষণাবেক্ষণ বার্তা (Maintenance notice - Optional)
          </label>
          <input
            type="text"
            value={settings.noticeMessage || ''}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, noticeMessage: e.target.value }))
            }
            placeholder="উদাহরণ: সিস্টেম আপডেটের কারণে স্ক্যানিং সাময়িক বন্ধ আছে..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm disabled:opacity-50 transition-all active:scale-95"
          >
            {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            <span>সেটিংস সেভ করুন</span>
          </button>
        </div>
      </div>

      {/* Create New User */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <UserPlus className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-base text-slate-900">
            নতুন ইউজার যোগ করুন (Create User)
          </h2>
        </div>

        <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">ইউজারনেম (Username)</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g. user1"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">পাসওয়ার্ড (Password)</label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="e.g. pass123"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={newIsAdmin}
                onChange={(e) => setNewIsAdmin(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>অ্যাডমিন অনুমতি দিন (Is Admin)</span>
            </label>

            <button
              type="submit"
              disabled={creatingUser}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-all active:scale-95"
            >
              {creatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              <span>ইউজার তৈরি করুন</span>
            </button>
          </div>
        </form>
      </div>

      {/* Users List */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700" />
            <h2 className="font-bold text-base text-slate-900">ইউজার তালিকা (User List)</h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">{users.length} জন ইউজার</span>
        </div>

        {users.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            কোন ইউজার পাওয়া যায়নি। উপরের ফর্ম থেকে নতুন ইউজার যোগ করুন।
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">ইউজারনেম</th>
                  <th className="py-2.5 px-3">পাসওয়ার্ড</th>
                  <th className="py-2.5 px-3">ভূমিকা (Role)</th>
                  <th className="py-2.5 px-3">অবস্থা (Status)</th>
                  <th className="py-2.5 px-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isVisible = visiblePasswords[u.id];
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {u.username}
                        {u.id === user?.id && (
                          <span className="ml-1.5 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-semibold">
                            আপনি
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span>{isVisible ? u.password : '••••••••'}</span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(u.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                            title={isVisible ? 'Hide' : 'Show'}
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {u.isAdmin ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-bold text-[10px]">
                            ADMIN
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[10px]">
                            USER
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {u.isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-bold text-[10px]">
                            <Lock className="w-2.5 h-2.5" />
                            লকড / ব্লকড
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                            <CheckCircle className="w-2.5 h-2.5" />
                            সক্রিয়
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleLock(u)}
                            disabled={u.id === user?.id}
                            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-30 ${
                              u.isLocked
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                            }`}
                            title={u.isLocked ? 'আনলক করুন' : 'লক/ব্লক করুন'}
                          >
                            {u.isLocked ? (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">আনলক</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">লক</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={u.id === user?.id}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-30"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
