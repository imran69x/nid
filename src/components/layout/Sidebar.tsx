'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Scan,
  Shield,
  LogOut,
  Menu,
  X,
  CreditCard,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/lib/firebase/authContext';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/login') {
        router.replace('/login');
      } else if (user && pathname === '/admin' && !user.isAdmin) {
        router.replace('/scanner');
      }
    }
  }, [user, loading, pathname, router]);

  // Don't wrap login page with AppShell chrome
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Show loading indicator while verifying session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // If unauthenticated, render nothing while redirecting to /login
  if (!user) {
    return null;
  }

  const navItems: NavItem[] = [
    { name: 'স্ক্যানার (Scanner)', href: '/scanner', icon: Scan },
    ...(user.isAdmin
      ? [{ name: 'অ্যাডমিন প্যানেল (Admin Panel)', href: '/admin', icon: Shield, adminOnly: true }]
      : []),
  ];

  return (
    <>
      {/* Top Navbar with hamburger (Sidebar hidden by default on all screens) */}
      <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">Smart NID Scan</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            <span className="font-semibold text-slate-800">{user.username}</span>
            {user.isAdmin && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white font-extrabold text-[10px]">
                ADMIN
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar Drawer Modal (overlay) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 animate-fadeIn">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 text-slate-100 flex flex-col z-50 shadow-2xl border-r border-slate-800">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-white leading-tight">Smart NID Scan</h2>
                  <p className="text-[11px] text-slate-400">বাংলাদেশ NID স্ক্যানার</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-slate-400')} />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-blue-200" />}
                  </Link>
                );
              })}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
              <div className="text-xs">
                <p className="text-white font-semibold">{user.username}</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {user.isAdmin ? 'অ্যাডমিনিস্ট্রেটর' : 'সাধারণ ইউজার'}
                </p>
              </div>
              <button
                onClick={() => {
                  logout();
                  setSidebarOpen(false);
                  router.push('/login');
                }}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                title="লগআউট"
              >
                <LogOut className="w-4 h-4" />
                <span>লগআউট</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-3 sm:p-5 md:p-6 max-w-5xl w-full mx-auto">
        {children}
      </main>
    </>
  );
}
