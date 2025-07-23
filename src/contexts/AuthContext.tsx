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

  // Demo accounts for when Supabase is not configured
  const demoAccounts = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'manager@longchau.com',
      username: 'manager',
      role: 'manager' as const,
      full_name: 'Nguyễn Văn Quản Lý',
      phone: '0901234567',
      address: '123 Nguyễn Huệ, Q.1, TP.HCM'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'pharmacist@longchau.com',
      username: 'pharmacist',
      role: 'pharmacist' as const,
      full_name: 'Trần Thị Dược Sĩ',
      phone: '0901234568',
      address: '456 Lê Lợi, Q.1, TP.HCM'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'customer1@gmail.com',
      username: 'customer1',
      role: 'customer' as const,
      full_name: 'Lê Văn Khách',
      phone: '0901234569',
      address: '789 Hai Bà Trưng, Q.3, TP.HCM'
    }
  ];

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
      
      // First check demo accounts
      const demoUser = demoAccounts.find(account => account.username === username);
      
      if (demoUser && password === '123') {
        const userObj: User = {
          id: demoUser.id,
          email: demoUser.email,
          username: demoUser.username,
          role: demoUser.role,
          full_name: demoUser.full_name,
          phone: demoUser.phone,
          address: demoUser.address,
        };

        setUser(userObj);
        localStorage.setItem('pharmacy_user', JSON.stringify(userObj));
        return true;
      }

      // Check for user accounts created via signup
      const existingUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
      const signedUpUser = existingUsers.find((user: any) => 
        user.username === username && user.password === password
      );
      
      if (signedUpUser) {
        const userObj: User = {
          id: signedUpUser.id,
          email: signedUpUser.email,
          username: signedUpUser.username,
          role: signedUpUser.role,
          full_name: signedUpUser.full_name,
          phone: signedUpUser.phone,
          address: signedUpUser.address,
        };

        setUser(userObj);
        localStorage.setItem('pharmacy_user', JSON.stringify(userObj));
        return true;
      }

      return false;
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
      
      // For demo purposes, create a new user account locally
      // In a real application, this would be handled by Supabase Auth
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'https://your-project.supabase.co' || 
          supabaseKey === 'your-anon-key') {
        // Create demo user account locally
        const newUserId = `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const userObj: User = {
          id: newUserId,
          email: data.email,
          username: data.username,
          role: 'customer',
          full_name: data.fullName,
          phone: data.phone || null,
          address: data.address || null,
        };

        // Store the new user in localStorage for demo purposes
        const existingUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
        
        // Check if username or email already exists
        const userExists = existingUsers.some((user: any) => 
          user.username === data.username || user.email === data.email
        );
        
        if (userExists) {
          throw new Error('Tên đăng nhập hoặc email đã được sử dụng');
        }
        
        existingUsers.push({
          ...userObj,
          password: data.password // In real app, this would be hashed
        });
        localStorage.setItem('demo_users', JSON.stringify(existingUsers));

        // Auto-login the new user
        setUser(userObj);
        localStorage.setItem('pharmacy_user', JSON.stringify(userObj));
        return true;
      }

      // If Supabase is configured, try to use it
      try {
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        
        // Insert into database
        const { data: newUser, error } = await supabase
          .from('users')
          .insert([
            {
              email: data.email,
              username: data.username,
              password_hash: hashedPassword,
              role: 'customer',
              full_name: data.fullName,
              phone: data.phone || null,
              address: data.address || null,
            }
          ])
          .select()
          .single();

        if (error) {
          console.error('Database signup error:', error);
          // Check for specific constraint violations
          if (error.code === '23505') {
            if (error.message.includes('email')) {
              throw new Error('Email đã được sử dụng');
            } else if (error.message.includes('username')) {
              throw new Error('Tên đăng nhập đã được sử dụng');
            }
          }
          throw new Error('Không thể tạo tài khoản. Vui lòng thử lại.');
        }

        // Auto-login the new user
        const userObj: User = {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          role: newUser.role,
          full_name: newUser.full_name,
          phone: newUser.phone,
          address: newUser.address,
        };

        setUser(userObj);
        localStorage.setItem('pharmacy_user', JSON.stringify(userObj));
        return true;
      } catch (supabaseError) {
        console.warn('Supabase signup failed, falling back to demo mode:', supabaseError);
        
        // Fallback to demo mode
        const newUserId = `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const userObj: User = {
          id: newUserId,
          email: data.email,
          username: data.username,
          role: 'customer',
          full_name: data.fullName,
          phone: data.phone || null,
          address: data.address || null,
        };

        // Store the new user in localStorage for demo purposes
        const existingUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
        
        // Check if username or email already exists
        const userExists = existingUsers.some((user: any) => 
          user.username === data.username || user.email === data.email
        );
        
        if (userExists) {
          throw new Error('Tên đăng nhập hoặc email đã được sử dụng');
        }
        
        existingUsers.push({
          ...userObj,
          password: data.password // In real app, this would be hashed
        });
        localStorage.setItem('demo_users', JSON.stringify(existingUsers));

        // Auto-login the new user
        setUser(userObj);
        localStorage.setItem('pharmacy_user', JSON.stringify(userObj));
        return true;
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
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