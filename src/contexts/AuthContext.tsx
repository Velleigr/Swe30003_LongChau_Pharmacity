import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'customer' | 'pharmacist' | 'manager' | 'cashier' | 'warehouse';
  full_name: string | null;
  phone: string | null;
  address: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('pharmacy_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !data) {
        console.error('User not found:', error);
        return false;
      }

      // Simple password check for demo
      // In production, use proper password hashing comparison
      if (password === '123' || password === 'password') {
        const userData: User = {
          id: data.id,
          email: data.email,
          username: data.username,
          role: data.role,
          full_name: data.full_name,
          phone: data.phone,
          address: data.address
        };
        
        setUser(userData);
        localStorage.setItem('pharmacy_user', JSON.stringify(userData));
        return true;
      }

      console.error('Invalid password');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pharmacy_user');
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};