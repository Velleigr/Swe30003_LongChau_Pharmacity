import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import bcrypt from 'bcryptjs';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'customer' | 'pharmacist' | 'manager' | 'cashier' | 'warehouse';
  full_name: string | null;
  phone: string | null;
  address: string | null;
}

interface SignUpData {
  email: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  address: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signUp: (data: SignUpData) => Promise<boolean>;
  logout: () => void;
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
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('pharmacy_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('pharmacy_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('Attempting login via Edge Function for username:', username);
      
      // Use the Edge Function for login
      const response = await api.users.login({ username, password });
      
      if (response.error) {
        console.error('Login error:', response.error);
        return false;
      }
      
      if (!response.data) {
        console.log('No user data returned');
        return false;
      }
      
      console.log('Login successful for user:', response.data.username);
      
      const userObj: User = response.data;
      
      setUser(userObj);
      localStorage.setItem('pharmacy_user', JSON.stringify(userObj));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: SignUpData): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('Attempting signup via Edge Function for username:', data.username);
      
      // Use the Edge Function for signup
      const response = await api.users.signUp({
        email: data.email,
        username: data.username,
        password: data.password,
        full_name: data.fullName,
        phone: data.phone,
        address: data.address
      });
      
      if (response.error) {
        console.error('Signup error:', response.error);
        return false;
      }
      
      if (!response.data) {
        console.log('No user data returned from signup');
        return false;
      }
      
      console.log('Signup successful for user:', response.data.username);
      
      const userObj: User = response.data;
      
      setUser(userObj);
      localStorage.setItem('pharmacy_user', JSON.stringify(userObj));
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    localStorage.removeItem('pharmacy_user');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signUp,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};