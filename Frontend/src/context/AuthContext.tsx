import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export type UserRole = 'Fleet_Manager' | 'Driver' | 'Safety_Officer' | 'Financial_Analyst' | 'Admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize and load user if token exists
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('transitops_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.data);
        } catch (err) {
          console.error('Session initialization failed:', err);
          localStorage.removeItem('transitops_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user: userData } = res.data.data;
      localStorage.setItem('transitops_token', token);
      setUser(userData);
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('transitops_token');
    setUser(null);
  };

  // Helper to determine permissions dynamically.
  // Admin and Fleet Manager have all access, others are restricted to their domains.
  const hasPermission = (moduleName: string): boolean => {
    if (!user) return false;
    const role = user.role;
    if (role === 'Admin' || role === 'Fleet_Manager') return true;

    switch (moduleName) {
      case 'vehicles':
        return role === 'Safety_Officer'; // Safety officers can view/inspect
      case 'drivers':
        return role === 'Safety_Officer'; // Safety officers track licenses
      case 'trips':
        return role === 'Driver' || role === 'Safety_Officer'; // Drivers view/manage trips
      case 'maintenance':
        return role === 'Safety_Officer'; // Maintenance is safety related
      case 'expenses':
        return role === 'Financial_Analyst'; // Financial analyst tracks expenses
      case 'reports':
        return role === 'Financial_Analyst'; // Financial analyst runs reports
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
