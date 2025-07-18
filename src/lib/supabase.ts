import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          password_hash: string;
          role: 'customer' | 'pharmacist' | 'manager' | 'cashier' | 'warehouse';
          full_name: string | null;
          phone: string | null;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          password_hash: string;
          role?: 'customer' | 'pharmacist' | 'manager' | 'cashier' | 'warehouse';
          full_name?: string | null;
          phone?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          password_hash?: string;
          role?: 'customer' | 'pharmacist' | 'manager' | 'cashier' | 'warehouse';
          full_name?: string | null;
          phone?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          category: string;
          image_url: string | null;
          stock_quantity: number;
          is_prescription_required: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          total_amount: number;
          status: 'pending' | 'confirmed' | 'preparing' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
          delivery_address: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price: number;
          created_at: string;
        };
      };
      prescriptions: {
        Row: {
          id: string;
          user_id: string;
          pharmacist_id: string | null;
          prescription_text: string | null;
          image_url: string | null;
          status: 'pending' | 'reviewed' | 'approved' | 'rejected';
          order_id: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
      };
      sales_analytics: {
        Row: {
          id: string;
          date: string;
          total_sales: number;
          total_orders: number;
          total_customers: number;
          popular_category: string | null;
          created_at: string;
        };
      };
    };
  };
};