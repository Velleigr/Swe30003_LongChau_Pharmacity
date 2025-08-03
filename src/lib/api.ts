// API client for interacting with Supabase Edge Functions
const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  details?: string;
  message?: string;
  count?: number;
}

class ApiClient {
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          ...options.headers,
        },
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If we can't parse JSON, it's likely we got HTML instead
        const text = await response.text();
        if (text.includes('<!doctype') || text.includes('<html>')) {
          throw new Error('Edge Functions not deployed. Please deploy the Supabase Edge Functions.');
        }
        throw new Error('Invalid response format');
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Product API methods
  products = {
    getAll: (params?: {
      category?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.set('category', params.category);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
      
      const query = searchParams.toString();
      return this.request(`/products${query ? `?${query}` : ''}`);
    },

    getById: (id: string) => {
      return this.request(`/products/${id}`);
    },

    create: (product: {
      name: string;
      description?: string;
      price: number;
      category: string;
      image_url?: string;
      stock_quantity?: number;
      is_prescription_required?: boolean;
    }) => {
      return this.request('/products', {
        method: 'POST',
        body: JSON.stringify(product),
      });
    },

    update: (id: string, product: Partial<{
      name: string;
      description: string;
      price: number;
      category: string;
      image_url: string;
      stock_quantity: number;
      is_prescription_required: boolean;
    }>) => {
      return this.request(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(product),
      });
    },

    delete: (id: string) => {
      return this.request(`/products/${id}`, {
        method: 'DELETE',
      });
    },
  };

  // Order API methods
  orders = {
    getByUserId: (userId: string, params?: { status?: string }) => {
      const searchParams = new URLSearchParams({ user_id: userId });
      if (params?.status) searchParams.set('status', params.status);
      
      return this.request(`/orders?${searchParams.toString()}`);
    },

    getById: (id: string) => {
      return this.request(`/orders/${id}`);
    },

    create: (order: {
      user_id: string;
      total_amount: number;
      status?: string;
      delivery_address?: string;
      items: Array<{
        product_id: string;
        quantity: number;
        price: number;
      }>;
    }) => {
      return this.request('/orders', {
        method: 'POST',
        body: JSON.stringify(order),
      });
    },

    updateStatus: (id: string, status: string) => {
      return this.request(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },
  };

  // Prescription API methods
  prescriptions = {
    getAll: (params?: {
      user_id?: string;
      pharmacist_id?: string;
      status?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.user_id) searchParams.set('user_id', params.user_id);
      if (params?.pharmacist_id) searchParams.set('pharmacist_id', params.pharmacist_id);
      if (params?.status) searchParams.set('status', params.status);
      
      const query = searchParams.toString();
      return this.request(`/prescriptions${query ? `?${query}` : ''}`);
    },

    getById: (id: string) => {
      return this.request(`/prescriptions/${id}`);
    },

    create: (prescription: {
      user_id: string;
      prescription_text?: string;
      image_url?: string;
      status?: string;
    }) => {
      return this.request('/prescriptions', {
        method: 'POST',
        body: JSON.stringify(prescription),
      });
    },

    review: (id: string, reviewData: {
      pharmacist_id: string;
      status: string;
      notes?: string;
    }) => {
      return this.request(`/prescriptions/${id}/review`, {
        method: 'PUT',
        body: JSON.stringify(reviewData),
      });
    },

    linkOrder: (id: string, orderId: string) => {
      return this.request(`/prescriptions/${id}/link-order`, {
        method: 'PUT',
        body: JSON.stringify({ order_id: orderId }),
      });
    },
  };

  // Notification API methods
  notifications = {
    sendPrescriptionNotification: (data: {
      pharmacist_id: string;
      patient_name: string;
      patient_phone: string;
      prescription_content: string;
      prescription_id: string;
      branch_name?: string;
    }) => {
      return this.request('/send-prescription-notification', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  };

  // User API methods
  users = {
    login: (credentials: { username: string; password: string }) => {
      return this.request('/users/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    signUp: (userData: {
      email: string;
      username: string;
      password: string;
      full_name: string;
      phone?: string;
      address?: string;
    }) => {
      return this.request('/users/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },

    getById: (id: string) => {
      return this.request(`/users/${id}`);
    },

    update: (id: string, userData: {
      email?: string;
      full_name?: string;
      phone?: string;
      address?: string;
    }) => {
      return this.request(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
    },
  };
}

export const api = new ApiClient();
export type { ApiResponse };
