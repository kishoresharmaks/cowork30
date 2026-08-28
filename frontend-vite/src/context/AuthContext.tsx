import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'member' | 'guest';
  phone?: string;
  companyName?: string;
  gstin?: string;
  walletBalance?: number;
  deskCreditsBalance?: number;
  meetingCreditsBalance?: number;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  loading: true,
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const savedToken = localStorage.getItem('access_token');
    if (!savedToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/auth/me');
      const userData = res.data?.data || res.data;
      setUser(userData);
      setToken(savedToken);
    } catch (err) {
      console.error('Failed to authenticate session:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (authToken: string, authUser: User) => {
    localStorage.setItem('access_token', authToken);
    setToken(authToken);
    setUser(authUser);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
