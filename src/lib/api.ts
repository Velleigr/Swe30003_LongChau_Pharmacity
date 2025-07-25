// API client for interacting with Supabase Edge Functions
import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  details?: string;
  message?: string;
  count?: number;
}

class ApiClient {
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase environment variables not configured, using fallback');
        throw new Error('Environment variables not configured');
      }

      const url = `${supabaseUrl}/functions/v1/${endpoint}`;
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Request failed:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error('Request error:', error);
      throw error;
    }
  }

  // Fallback method for direct Supabase queries when Edge Functions fail
  private async directQuery(table: string, options: any = {}): Promise<any> {
    try {
      console.log(`Using direct Supabase query for ${table}`);
      let query = supabase.from(table).select(options.select || '*');
      
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== 'all') {
            query = query.eq(key, value);
          }
        });
      }
      
      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }
      
      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending !== false });
      }
      
      if (options.single) {
        query = query.maybeSingle();
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Direct query error:', error);
        return { error: error.message };
      }
      
      return { data, count: Array.isArray(data) ? data.length : (data ? 1 : 0) };
    } catch (error) {
      console.error('Direct query failed:', error);
      return { error: error instanceof Error ? error.message : 'Query failed' };
    }
  }

  // Direct login method using Supabase client
  private async directLogin(username: string, password: string): Promise<any> {
    try {
      console.log('Using direct login for username:', username);
      
      // Get user by username
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user:', error);
        return { error: 'Database error' };
      }
      
      if (!user) {
        console.log('User not found');
        return { error: 'Invalid username or password' };
      }
      
      console.log('Comparing passwords...');
      console.log('Input password hash:', hashedPassword);
      console.log('Stored password hash:', user.password_hash);
      
      // Compare hashed passwords
      if (hashedPassword !== user.password_hash) {
        console.log('Password mismatch');
        return { error: 'Invalid username or password' };
      }
      
      console.log('Login successful');
      
      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user;
      
      return { 
        data: userWithoutPassword,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('Direct login error:', error);
      return { error: 'Login failed' };
    }
  }

  // Product API methods using Edge Functions
  products = {
    getAll: async (params?: {
      category?: string;
      search?: string;
      sortBy?: string;
      limit?: number;
      offset?: number;
    }): Promise<ApiResponse> => {
      try {
        console.log('Fetching products with params:', params);
        
        const queryParams = new URLSearchParams();
        if (params?.category && params.category !== 'all') {
          queryParams.append('category', params.category);
        }
        if (params?.search) {
          queryParams.append('search', params.search);
        }
        if (params?.sortBy) {
          queryParams.append('sortBy', params.sortBy);
        }
        if (params?.limit) {
          queryParams.append('limit', params.limit.toString());
        }
        if (params?.offset) {
          queryParams.append('offset', params.offset.toString());
        }

        const endpoint = `products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        
        try {
          const result = await this.request(endpoint);
          return {
            data: result.data || [],
            count: result.count || 0,
            error: result.error
          };
        } catch (edgeFunctionError) {
          console.warn('Edge Function failed, using direct query:', edgeFunctionError);
          
          // Fallback to direct Supabase query
          const result = await this.directQuery('products', {
            filters: params?.category ? { category: params.category } : {},
            search: params?.search,
            orderBy: params?.sortBy || 'name',
            ascending: true
          });
          
          return {
            data: result.data || [],
            count: result.count || 0,
            error: result.error
          };
        }
      } catch (error) {
        console.error('Products fetch error:', error);
        return { 
          error: error instanceof Error ? error.message : 'Failed to fetch products',
          data: [] 
        };
      }
    },

    getById: async (id: string): Promise<ApiResponse> => {
      try {
        console.log('Fetching product by ID:', id);
        
        try {
          const result = await this.request(`products/${id}`);
          
          if (result.error) {
            return { error: result.error };
          }
          
          return { data: result.data };
        } catch (edgeFunctionError) {
          console.warn('Edge Function failed, using direct query:', edgeFunctionError);
          
          // Fallback to direct Supabase query
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .maybeSingle();
          
          if (error) {
            return { error: error.message };
          }
          
          if (!data) {
            return { error: 'Product not found' };
          }
          
          return { data };
        }
      } catch (error) {
        console.error('Product fetch by ID error:', error);
        return { 
          error: error instanceof Error ? error.message : 'Failed to fetch product'
        };
      }
    },

    create: async (product: {
      name: string;
      description?: string;
      price: number;
      category: string;
      image_url?: string;
      stock_quantity?: number;
      is_prescription_required?: boolean;
    }): Promise<ApiResponse> => {
      try {
        const result = await this.request('products', {
          method: 'POST',
          body: JSON.stringify(product),
        });
        
        return {
          data: result.data,
          error: result.error,
          message: result.message
        };
      } catch (error) {
        return { 
          error: error instanceof Error ? error.message : 'Failed to create product'
        };
      }
    },

    update: async (id: string, product: Partial<{
      name: string;
      description: string;
      price: number;
      category: string;
      image_url: string;
      stock_quantity: number;
      is_prescription_required: boolean;
    }>): Promise<ApiResponse> => {
      try {
        const result = await this.request(`products/${id}`, {
          method: 'PUT',
          body: JSON.stringify(product),
        });
        
        return {
          data: result.data,
          error: result.error,
          message: result.message
        };
      } catch (error) {
        return { 
          error: error instanceof Error ? error.message : 'Failed to update product'
        };
      }
    },

    delete: async (id: string): Promise<ApiResponse> => {
      try {
        const result = await this.request(`products/${id}`, {
          method: 'DELETE',
        });
        
        return {
          error: result.error,
          message: result.message
        };
      } catch (error) {
        return { 
          error: error instanceof Error ? error.message : 'Failed to delete product'
        };
      }
    },
  };

  // Order API methods using Edge Functions
  orders = {
    getByUserId: async (userId: string, params?: { status?: string }): Promise<ApiResponse> => {
      try {
        const queryParams = new URLSearchParams({ user_id: userId });
        if (params?.status) {
          queryParams.append('status', params.status);
        }

        const result = await this.request(`orders?${queryParams.toString()}`);
        
        return {
          data: result.data || [],
          count: result.count || 0,
          error: result.error
        };
      } catch (error) {
        return { 
          error: error instanceof Error ? error.message : 'Failed to fetch orders'
        };
      }
    },

    getById: async (id: string): Promise<ApiResponse> => {
      try {
        const result = await this.request(`orders/${id}`);
        
        if (result.error) {
          return { error: result.error };
        }
        
        return { data: result.data };
      } catch (error) {
        return { 
          error: error instanceof Error ? error.message : 'Failed to fetch order'
        };
      }
    },

    create: async (order: {
      user_id: string;
      total_amount: number;
      status?: string;
      delivery_address?: string;
      items: Array<{
        product_id: string;
        quantity: number;
        price: number;
      }>;
    }): Promise<ApiResponse> => {
      try {
        const result = await this.request('orders', {
          method: 'POST',
          body: JSON.stringify(order),
        });
        
        return {
          data: result.data,
          error: result.error,
          message: result.message
        };
      } catch (error) {
        return { 
          error: error instanceof Error ? error.message : 'Failed to create order'
        };
      }
    },

    updateStatus: async (id: string, status: string): Promise<ApiResponse> => {
      try {
        const result = await this.request(`orders/${id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status }),
        });
        
        return {
          data: result.data,
          error: result.error,
          message: result.message
        };
      } catch (error) {
        return { 
          error: error instanceof Error ? error.message : 'Failed to update order status'
        };
      }
    },
  };

  // Prescription API methods using Edge Functions
  prescriptions = {
    getAll: async (params?: {
      user_id?: string;
      pharmacist_id?: string;
      status?: string;
    }): Promise<ApiResponse> => {
      try {
        const queryParams = new URLSearchParams();
        if (params?.user_id) queryParams.append('user_id', params.user_id);
        if (params?.pharmacist_id) queryParams.append('pharmacist_id', params.pharmacist_id);
        if (params?.status) queryParams.append('status', params.status);

        const endpoint = `prescriptions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const result = await this.request(endpoint);
        
        return {
          data: result.data || [],
          count: result.count || 0,
          error: result.error
        };
      } catch (error) {
        return { 
          error: error instanceof Error ? error.message : 'Failed to fetch prescriptions'
        };
      }
    },

    getById: async (id: string): Promise<ApiResponse> => {
      try {
        const result = await this.request(`prescriptions/${id}`);
        
        if (result.error) {
          return { error: result.error };
        }
        
        return { data: result.data };
      } catch (error) {
        return { 
          error: error instanceof Error ? error.message : 'Failed to fetch prescription'
        };
      }
    },

    create: async (prescription: {
      user_id: string;
      prescription_text?: string;
      image_url?: string;
      status?: string;
    }): Promise<ApiResponse> => {
      try {
        const result = await this.request('prescriptions', {
          method: 'POST',
          body: JSON.stringify(prescription),
        });
        
        return {
          data: result.data,
          error: result.error,
          message: result.message
        };
      } catch (error) {
        return { 
          error: error instanceof Error ? error.message : 'Failed to create prescription'
        };
      }
    },

    review: async (id: string, reviewData: {
      pharmacist_id: string;
      status: string;
      notes?: string;
    }): Promise<ApiResponse> => {
      try {
        const result = await this.request(`prescriptions/${id}/review`, {
          method: 'PUT',
          body: JSON.stringify(reviewData),
        });
        
        return {
          data: result.data,
          error: result.error,
          message: result.message
        };
      } catch (error) {
        return { 
          error: error instanceof Error ? error.message : 'Failed to review prescription'
        };
      }
    },

    linkOrder: async (id: string, orderId: string): Promise<ApiResponse> => {
      try {
        const result = await this.request(`prescriptions/${id}/link-order`, {
          method: 'PUT',
          body: JSON.stringify({ order_id: orderId }),
        });
        
        return {
          data: result.data,
          error: result.error,
          message: result.message
        };
      } catch (error) {
        return { 
          error: error instanceof Error ? error.message : 'Failed to link prescription to order'
        };
      }
    },
  };

  // User API methods using Edge Functions
  users = {
    login: async (credentials: { username: string; password: string }): Promise<ApiResponse> => {
      try {
        console.log('Calling users/login Edge Function with:', credentials.username);
        
        try {
          const result = await this.request('users/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
          });
          
          return {
            data: result.data,
            error: result.error,
            message: result.message
          };
        } catch (edgeFunctionError) {
          console.warn('Edge Function failed, using direct login:', edgeFunctionError);
          
          // Fallback to direct login
          const result = await this.directLogin(credentials.username, credentials.password);
          
          return {
            data: result.data,
            error: result.error,
            message: result.message
          };
        }
      } catch (error) {
        console.error('Login API error:', error);
        return { 
          error: error instanceof Error ? error.message : 'Failed to login'
        };
      }
    },

    signUp: async (userData: {
      email: string;
      username: string;
      password: string;
      full_name: string;
      phone?: string;
      address?: string;
    }): Promise<ApiResponse> => {
      try {
        const result = await this.request('users/signup', {
          method: 'POST',
          body: JSON.stringify(userData),
        });
        
        return {
          data: result.data,
          error: result.error,
          message: result.message
        };
      } catch (error) {
        return { 
          error: error instanceof Error ? error.message : 'Failed to sign up'
        };
      }
    },

    getById: async (id: string): Promise<ApiResponse> => {
      try {
        const result = await this.request(`users/${id}`);
        
        if (result.error) {
          return { error: result.error };
        }
        
        return { data: result.data };
      } catch (error) {
        return { 
          error: error instanceof Error ? error.message : 'Failed to fetch user'
        };
      }
    },

    update: async (id: string, userData: {
      email?: string;
      full_name?: string;
      phone?: string;
      address?: string;
    }): Promise<ApiResponse> => {
      try {
        const result = await this.request(`users/${id}`, {
          method: 'PUT',
          body: JSON.stringify(userData),
        });
        
        return {
          data: result.data,
          error: result.error,
          message: result.message
        };
      } catch (error) {
        return { 
          error: error instanceof Error ? error.message : 'Failed to update user'
        };
      }
    },
  };
}

export const api = new ApiClient();
export type { ApiResponse };