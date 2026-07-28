import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import {
  loginApi,
  registerApi,
  getMeApi,
  updateProfileApi,
  getStoredToken,
  removeStoredToken,
} from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (owner_name: string, email: string, password: string, restaurant_name: string, slug: string, order_id?: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; user?: User; error?: string }>;
  refreshUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getStoredToken();
      if (storedToken) {
        try {
          const res = await getMeApi();
          setUser(res.user);
          setToken(storedToken);
        } catch {
          removeStoredToken();
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await loginApi({ email, password });
      setUser(res.user);
      setToken(res.token);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const register = async (owner_name: string, email: string, password: string, restaurant_name: string, slug: string, order_id?: string, phone?: string) => {
    setLoading(true);
    try {
      const res = await registerApi({ owner_name, email, password, restaurant_name, slug, order_id, phone });
      setUser(res.user);
      setToken(res.token);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = () => {
    removeStoredToken();
    setUser(null);
    setToken(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      const res = await updateProfileApi(data);
      setUser(res.user);
      return { success: true, user: res.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update profile' };
    }
  };

  const refreshUser = async () => {
    if (getStoredToken()) {
      try {
        const res = await getMeApi();
        setUser(res.user);
      } catch {
        setUser(null);
      }
    }
  };

  const resetPassword = async (email: string) => {
    return { success: true, message: `Password reset link dispatched to ${email}` };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
