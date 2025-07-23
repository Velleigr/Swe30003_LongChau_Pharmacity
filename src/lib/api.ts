// API client for interacting with Supabase
import { supabase } from './supabase';
interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  details?: string;
  message?: string;
  count?: number;
}

class ApiClient {
class ApiClient {
          
          resolve({ data: data || [], count: data?.length || 0, error: error?.message });
        } catch (error) {
          resolve({ error: 'Failed to fetch products' });
        }
      });
    },

    getById: (id: string) => {
      return new Promise<ApiResponse>(async (resolve) => {
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) {
            resolve({ error: error.code === 'PGRST116' ? 'Product not found' : error.message });
          } else {
            resolve({ data });
          }
        } catch (error) {
          resolve({ error: 'Failed to fetch product' });
        }
      });
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
      return new Promise<ApiResponse>(async (resolve) => {
        try {
          const { data, error } = await supabase
            .from('products')
            .insert([{
              name: product.name,
              description: product.description || null,
              price: product.price,
              category: product.category,
              image_url: product.image_url || null,
              stock_quantity: product.stock_quantity || 0,
              is_prescription_required: product.is_prescription_required || false
            }])
            .select()
            .single();
          
          resolve({ data, error: error?.message });
        } catch (error) {
          resolve({ error: 'Failed to create product' });
        }
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
      return new Promise<ApiResponse>(async (resolve) => {
        try {
          const updateFields: any = {};
          if (product.name) updateFields.name = product.name;
          if (product.description !== undefined) updateFields.description = product.description;
          if (product.price) updateFields.price = product.price;
          if (product.category) updateFields.category = product.category;
          if (product.image_url !== undefined) updateFields.image_url = product.image_url;
          if (product.stock_quantity !== undefined) updateFields.stock_quantity = product.stock_quantity;
          if (product.is_prescription_required !== undefined) updateFields.is_prescription_required = product.is_prescription_required;
          
          const { data, error } = await supabase
            .from('products')
            .update(updateFields)
            .eq('id', id)
            .select()
            .single();
          
          resolve({ data, error: error?.message });
        } catch (error) {
          resolve({ error: 'Failed to update product' });
        }
      });
    },

    delete: (id: string) => {
      return new Promise<ApiResponse>(async (resolve) => {
        try {
          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);
          
          resolve({ error: error?.message });
        } catch (error) {
          resolve({ error: 'Failed to delete product' });
        }
      });
    },
  };

  // Order API methods
  orders = {
    getByUserId: (userId: string, params?: { status?: string }) => {
      return new Promise<ApiResponse>(async (resolve) => {
        try {
          let query = supabase
            .from('orders')
            .select(`
              *,
              order_items (
                *,
                products (
                  id,
                  name,
                  image_url
                )
              )
            `)
            .eq('user_id', userId);
          
          if (params?.status) {
            query = query.eq('status', params.status);
          }
          
          query = query.order('created_at', { ascending: false });
          
          const { data, error } = await query;
          
          resolve({ data: data || [], count: data?.length || 0, error: error?.message });
        } catch (error) {
          resolve({ error: 'Failed to fetch orders' });
        }
      });
    },

    getById: (id: string) => {
      return new Promise<ApiResponse>(async (resolve) => {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select(`
              *,
              order_items (
                *,
                products (
                  id,
                  name,
                  image_url,
                  category
                )
              ),
              users (
                full_name,
                email,
                phone
              )
            `)
            .eq('id', id)
            .single();
          
          if (error) {
            resolve({ error: error.code === 'PGRST116' ? 'Order not found' : error.message });
          } else {
            resolve({ data });
          }
        } catch (error) {
          resolve({ error: 'Failed to fetch order' });
        }
      });
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
      return new Promise<ApiResponse>(async (resolve) => {
        try {
          // Create order
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([{
              user_id: order.user_id,
              total_amount: order.total_amount,
              status: order.status || 'pending',
              delivery_address: order.delivery_address || null
            }])
            .select()
            .single();
          
          if (orderError) {
            resolve({ error: 'Failed to create order' });
            return;
          }
          
          // Create order items
          const orderItems = order.items.map(item => ({
            order_id: orderData.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price
          }));
          
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);
          
          if (itemsError) {
            // Rollback: delete the order if items creation fails
            await supabase.from('orders').delete().eq('id', orderData.id);
            resolve({ error: 'Failed to create order items' });
            return;
          }
          
          resolve({ data: orderData });
        } catch (error) {
          resolve({ error: 'Failed to create order' });
        }
      });
    },

    updateStatus: (id: string, status: string) => {
      return new Promise<ApiResponse>(async (resolve) => {
        try {
          const validStatuses = ['pending', 'confirmed', 'preparing', 'packed', 'shipped', 'delivered', 'cancelled'];
          
          if (!validStatuses.includes(status)) {
            resolve({ error: 'Invalid status' });
            return;
          }
          
          const { data, error } = await supabase
            .from('orders')
            .update({ 
              status,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
          
          if (error) {
            resolve({ error: error.code === 'PGRST116' ? 'Order not found' : error.message });
          } else {
            resolve({ data });
          }
        } catch (error) {
          resolve({ error: 'Failed to update order status' });
        }
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
      return new Promise<ApiResponse>(async (resolve) => {
        try {
          let query = supabase
            .from('prescriptions')
            .select(`
              *,
              users!prescriptions_user_id_fkey (
                full_name,
                email,
                phone
              ),
              pharmacist:users!prescriptions_pharmacist_id_fkey (
                full_name,
                email
              )
            `);
          
          if (params?.user_id) {
            query = query.eq('user_id', params.user_id);
          }
          
          if (params?.pharmacist_id) {
            query = query.eq('pharmacist_id', params.pharmacist_id);
          }
          
          if (params?.status) {
            query = query.eq('status', params.status);
          }
          
          query = query.order('created_at', { ascending: false });
          
          const { data, error } = await query;
          
          resolve({ data: data || [], count: data?.length || 0, error: error?.message });
        } catch (error) {
          resolve({ error: 'Failed to fetch prescriptions' });
        }
      });
    },

    getById: (id: string) => {
      return new Promise<ApiResponse>(async (resolve) => {
        try {
          const { data, error } = await supabase
            .from('prescriptions')
            .select(`
              *,
              users!prescriptions_user_id_fkey (
                full_name,
                email,
                phone,
                address
              ),
              pharmacist:users!prescriptions_pharmacist_id_fkey (
                full_name,
                email
              ),
              orders (
                id,
                status,
                total_amount,
                delivery_address
              )
            `)
            .eq('id', id)
            .single();
          
          if (error) {
            resolve({ error: error.code === 'PGRST116' ? 'Prescription not found' : error.message });
          } else {
            resolve({ data });
          }
        } catch (error) {
          resolve({ error: 'Failed to fetch prescription' });
        }
      });
    },

    create: (prescription: {
      user_id: string;
      prescription_text?: string;
      image_url?: string;
      status?: string;
    }) => {
      return new Promise<ApiResponse>(async (resolve) => {
        try {
          const { data, error } = await supabase
            .from('prescriptions')
            .insert([{
              user_id: prescription.user_id,
              prescription_text: prescription.prescription_text || null,
              image_url: prescription.image_url || null,
              status: prescription.status || 'pending'
            }])
            .select()
            .single();
          
          resolve({ data, error: error?.message });
        } catch (error) {
          resolve({ error: 'Failed to create prescription' });
        }
      });
    },

    review: (id: string, reviewData: {
      pharmacist_id: string;
      status: string;
      notes?: string;
    }) => {
      return new Promise<ApiResponse>(async (resolve) => {
        try {
          const validStatuses = ['pending', 'reviewed', 'approved', 'rejected'];
          
          if (!validStatuses.includes(reviewData.status)) {
            resolve({ error: 'Invalid status' });
            return;
          }
          
          const { data, error } = await supabase
            .from('prescriptions')
            .update({
              pharmacist_id: reviewData.pharmacist_id,
              status: reviewData.status,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
          
          if (error) {
            resolve({ error: error.code === 'PGRST116' ? 'Prescription not found' : error.message });
          } else {
            resolve({ data });
          }
        } catch (error) {
          resolve({ error: 'Failed to review prescription' });
        }
      });
    },

    linkOrder: (id: string, orderId: string) => {
      return new Promise<ApiResponse>(async (resolve) => {
        try {
          const { data, error } = await supabase
            .from('prescriptions')
            .update({
              order_id: orderId,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
          
          if (error) {
            resolve({ error: error.code === 'PGRST116' ? 'Prescription not found' : error.message });
          } else {
            resolve({ data });
          }
        } catch (error) {
          resolve({ error: 'Failed to link prescription to order' });
        }
      });
    },
  };

  // User API methods
  users = {
    login: (credentials: { username: string; password: string }) => {
      return new Promise<ApiResponse>(async (resolve) => {
        // This method is now handled directly in AuthContext
        resolve({ error: 'Use AuthContext login method instead' });
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
      return new Promise<ApiResponse>(async (resolve) => {
        // This method is now handled directly in AuthContext
        resolve({ error: 'Use AuthContext signUp method instead' });
      });
    },

    getById: (id: string) => {
      return new Promise<ApiResponse>(async (resolve) => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('id, email, username, role, full_name, phone, address, created_at, updated_at')
            .eq('id', id)
            .single();
          
          if (error) {
            resolve({ error: error.code === 'PGRST116' ? 'User not found' : error.message });
          } else {
            resolve({ data });
          }
        } catch (error) {
          resolve({ error: 'Failed to fetch user' });
        }
      });
    },

    update: (id: string, userData: {
      email?: string;
      full_name?: string;
      phone?: string;
      address?: string;
    }) => {
      return new Promise<ApiResponse>(async (resolve) => {
        try {
          const updateFields: any = {};
          
          if (userData.email) updateFields.email = userData.email;
          if (userData.full_name) updateFields.full_name = userData.full_name;
          if (userData.phone !== undefined) updateFields.phone = userData.phone;
          if (userData.address !== undefined) updateFields.address = userData.address;
          
          updateFields.updated_at = new Date().toISOString();
          
          const { data, error } = await supabase
            .from('users')
            .update(updateFields)
            .eq('id', id)
            .select('id, email, username, role, full_name, phone, address, created_at, updated_at')
            .single();
          
          if (error) {
            resolve({ error: error.code === 'PGRST116' ? 'User not found' : error.message });
          } else {
            resolve({ data });
          }
        } catch (error) {
          resolve({ error: 'Failed to update user' });
        }
      });
    },
  };
}

export const api = new ApiClient();
export type { ApiResponse };