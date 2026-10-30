import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; phone?: string }) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const DEFAULT_DEMO_USER: User = {
  id: 1,
  email: 'admin@smartparking.com',
  full_name: 'Smart Parking Admin',
  phone: '+91 98765 43210',
  role: 'admin',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(DEFAULT_DEMO_USER);
  const [token] = useState<string | null>('demo_mode_token');
  const [isLoading] = useState<boolean>(false);

  const refreshUser = async () => {
    try {
      const me = await api.getMe();
      if (me && me.id) {
        setUser(me);
      }
    } catch {
      // Retain active demonstration user
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async () => {
    // Direct college demonstration mode: credentials not required
  };

  const register = async () => {
    // Direct college demonstration mode: registration not required
  };

  const logout = () => {
    // Direct college demonstration mode: session remains active
  };

  const switchDemoRole = async (targetRole: UserRole) => {
    const rolesMap: Record<UserRole, { name: string; email: string }> = {
      admin: { name: 'Smart Parking Admin', email: 'admin@smartparking.com' },
      operator: { name: 'Gate Operator', email: 'operator@smartparking.com' },
      customer: { name: 'Vikram Verma (Customer)', email: 'customer@smartparking.com' },
    };
    const info = rolesMap[targetRole] || rolesMap.admin;
    setUser(prev => ({
      ...prev,
      full_name: info.name,
      email: info.email,
      role: targetRole,
    }));
  };

  const role: UserRole = user?.role || 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated: true,
        isLoading: false,
        login,
        register,
        logout,
        switchDemoRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
