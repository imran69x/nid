'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

export interface AppUser {
  id: string;
  uid: string;
  username: string;
  isAdmin: boolean;
  isLocked: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') { setLoading(false); return; }
    try {
      const stored = localStorage.getItem('app_user_session');
      if (stored) {
        const parsed: AppUser = JSON.parse(stored);
        setUser(parsed);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'লগইন ব্যর্থ হয়েছে');
    }

    const appUser: AppUser = data.user;
    setUser(appUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_user_session', JSON.stringify(appUser));
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('app_user_session');
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
