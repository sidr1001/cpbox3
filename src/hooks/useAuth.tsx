import { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any } | undefined>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any } | undefined>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore user from local storage if exists (minimal)
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await apiClient.login(email, password);
      setUser(res.user);
      try { localStorage.setItem('user', JSON.stringify(res.user)); } catch {}
      return { error: null };
    } catch (error) {
      return { error } as any;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      await apiClient.register(email, password, displayName);
      // авто-логин
      const res = await apiClient.login(email, password);
      setUser(res.user);
      try { localStorage.setItem('user', JSON.stringify(res.user)); } catch {}
      return { error: null };
    } catch (error) {
      return { error } as any;
    }
  };

  const signOut = async () => {
    apiClient.logout();
    setUser(null);
    try { localStorage.removeItem('user'); } catch {}
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}