'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  gstin?: string;
  role: string;
  avatarUrl?: string;
  bio?: string;
  walletBalance: number | string;
  deskCreditsBalance?: number | string;
  meetingCreditsBalance?: number | string;
  walletTransactions?: any[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  updateProfile: (data: any) => Promise<any>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete apiClient.defaults.headers.common['Authorization'];
  };

  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken) {
        // Check JWT Expiration
        const decoded = parseJwt(storedToken);
        if (decoded && decoded.exp && decoded.exp * 1000 < Date.now()) {
          console.warn('Stored JWT token has expired. Logging out.');
          logout();
          setIsLoading(false);
          return;
        }

        setToken(storedToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {}
        }
        fetchCurrentProfile(storedToken);
      } else {
        setIsLoading(false);
      }
    };

    initAuth();

    // Multi-Tab Logout & Session Sync Listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) {
        logout();
      } else if (e.key === 'token' && e.newValue) {
        initAuth();
      }
    };

    const handleFocus = () => {
      const t = localStorage.getItem('token');
      if (t) {
        const decoded = parseJwt(t);
        if (decoded && decoded.exp && decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          fetchCurrentProfile(t);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  async function fetchCurrentProfile(authToken?: string) {
    const t = authToken || token;
    if (!t) return;
    try {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${t}`;
      const res = await apiClient.get('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
      if ((err as any)?.response?.status === 401) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }

  const login = async (email: string, pass: string) => {
    // Purge old session before logging in
    logout();

    const res = await apiClient.post('/auth/login', { email, password: pass });
    if (res.data?.accessToken) {
      const accessToken = res.data.accessToken;
      const userData = res.data.user;

      setToken(accessToken);
      setUser(userData);

      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));

      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    }
    return res.data;
  };

  const register = async (data: any) => {
    // Purge old session before registering
    logout();

    const res = await apiClient.post('/auth/register', data);
    if (res.data?.accessToken) {
      const accessToken = res.data.accessToken;
      const userData = res.data.user;

      setToken(accessToken);
      setUser(userData);

      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));

      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    }
    return res.data;
  };

  const updateProfile = async (data: any) => {
    const res = await apiClient.put('/auth/profile', data);
    if (res.data?.user) {
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshProfile: () => fetchCurrentProfile(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
