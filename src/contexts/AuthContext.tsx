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
  created_at: string;
  updated_at: string;
}

interface SignUpData {
  email: string;
  username: string;
  password: string;
  fullName: string;
  phone?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  connectionStatus: 'checking' | 'connected' | 'disconnected';
  login: (username: string, password: string) => Promise<boolean>;
  signUp: (data: SignUpData) => Promise<boolean>;
  logout: () => void;
  error: string | null;
  checkConnection: () => Promise<boolean>;
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

// SHA256 password hashing utility
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [error, setError] = useState<string | null>(null);

  // Check Supabase connection
  const checkConnection = async (): Promise<boolean> => {
    try {
      setConnectionStatus('checking');
      
      // Simple query to test connection
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Supabase connection error:', error);
        setConnectionStatus('disconnected');
        setError('Không thể kết nối đến cơ sở dữ liệu. Vui lòng kiểm tra cấu hình Supabase.');
        return false;
      }
      
      setConnectionStatus('connected');
      setError(null);
      return true;
    } catch (error) {
      console.error('Connection check failed:', error);
      setConnectionStatus('disconnected');
      setError('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.');
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // First check Supabase connection
      const isConnected = await checkConnection();
      
      if (isConnected) {
        // Check if user is logged in from localStorage
        const savedUser = localStorage.getItem('pharmacy_user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
          } catch (error) {
            console.error('Error parsing saved user:', error);
            localStorage.removeItem('pharmacy_user');
          }
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Check connection before attempting login
      const isConnected = await checkConnection();
      if (!isConnected) {
        return false;
      }

      // Query user by username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (userError) {
        setError('Lỗi kết nối cơ sở dữ liệu');
        return false;
      }

      if (!userData) {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
        return false;
      }

      // Verify password using SHA256
      const isValidPassword = await verifyPassword(password, userData.password_hash);
      
      if (!isValidPassword) {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
        return false;
      }

      // Remove password hash from user object
      const { password_hash, ...userWithoutPassword } = userData;
      const userObj: User = userWithoutPassword;

      setUser(userObj);
      localStorage.setItem('pharmacy_user', JSON.stringify(userObj));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setError('Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: SignUpData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Check connection before attempting signup
      const isConnected = await checkConnection();
      if (!isConnected) {
        return false;
      }

      // Check if username or email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('username, email')
        .or(`username.eq.${data.username},email.eq.${data.email}`)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        setError('Lỗi kết nối cơ sở dữ liệu');
        return false;
      }

      if (existingUser) {
        if (existingUser.username === data.username) {
          setError('Tên đăng nhập đã tồn tại');
          return false;
        }
        if (existingUser.email === data.email) {
          setError('Email đã được sử dụng');
          return false;
        }
      }

      // Hash password using SHA256
      const hashedPassword = await hashPassword(data.password);

      // Create new user
      const { data: newUser, error: insertError } = await supabase
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

      if (insertError) {
        console.error('Insert error:', insertError);
        setError('Không thể tạo tài khoản. Vui lòng thử lại.');
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
      setError('Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    setError(null);
    localStorage.removeItem('pharmacy_user');
  };

  const value: AuthContextType = {
    user,
    loading,
    connectionStatus,
    login,
    signUp,
    logout,
    error,
    checkConnection,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};