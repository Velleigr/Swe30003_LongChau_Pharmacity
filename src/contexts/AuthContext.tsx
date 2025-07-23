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
      
      // Use demo accounts for authentication
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
      
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);
      
      // Try to insert into database first
      try {
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
          return false;
        }

        // Auto-login the new user
        setUser(newUser);
        localStorage.setItem('pharmacy_user', JSON.stringify(newUser));
        return true;
      } catch (dbError) {
        console.error('Database connection error during signup:', dbError);
        return false;
      }
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