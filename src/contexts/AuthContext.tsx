import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
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
      console.log('Attempting login for username:', username);
      
      // Get user from database first
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      
      console.log('User query result:', { user, error });
      
      if (error) {
        console.error('Database error:', error);
        return false;
      }
      
      if (!user) {
        console.log('User not found');
        return false;
      }
      
      // Hash the provided password with SHA-256
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      console.log('Password hash comparison:', {
        providedHash: hashedPassword,
        storedHash: user.password_hash,
        match: hashedPassword === user.password_hash
      });
      
      // Compare the hashed password with stored hash
      if (hashedPassword !== user.password_hash) {
        console.log('Password mismatch');
        return false;
      }
      
      console.log('Login successful for user:', user.username);
      
      // Remove password hash from user object
      const { password_hash, ...userWithoutPassword } = user;
      const userObj: User = userWithoutPassword;
      
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
      
      // Hash password with SHA-256
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(data.password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Create user in database
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          email: data.email,
          username: data.username,
          password_hash: hashedPassword,
          role: 'customer',
          full_name: data.fullName,
          phone: data.phone || null,
          address: data.address || null
        }])
        .select()
        .single();
      
      if (error || !newUser) {
        return false;
      }
      
      // Remove password hash from user object
      const { password_hash, ...userWithoutPassword } = newUser;
      const userObj: User = userWithoutPassword;
      
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