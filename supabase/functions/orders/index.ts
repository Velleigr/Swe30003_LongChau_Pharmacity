import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Dynamic CORS headers function
function getCorsHeaders(request: Request) {
  const origin = request.headers.get('Origin')
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  }
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
}

interface Order {
  id?: string;
  user_id: string;
  total_amount: number;
  status?: string;
  delivery_address?: string;
  items: OrderItem[];
}

// Order Controller Functions
const OrderController = {
  // GET /orders - Get all orders for a user
  async getByUserId(userId: string, searchParams: URLSearchParams) {
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
        .eq('user_id', userId)
      
      const status = searchParams.get('status')
      if (status) {
        query = query.eq('status', status)
      }
      
      query = query.order('created_at', { ascending: false })
      
      const { data, error } = await query
      
      if (error) {
        return {
          status: 500,
          body: { error: 'Failed to fetch orders', details: error.message }
        }
      }
      
      return {
        status: 200,
        body: { data, count: data?.length || 0 }
      }
    } catch (error) {
      return {
        status: 500,
        body: { error: 'Internal server error', details: error.message }
      }
    }
  },

  // GET /orders/:id - Get single order
  async getById(id: string) {
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
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return {
            status: 404,
            body: { error: 'Order not found' }
          }
        }
        return {
          status: 500,
          body: { error: 'Failed to fetch order', details: error.message }
        }
      }
      
      return {
        status: 200,
        body: { data }
      }
    } catch (error) {
      return {
        status: 500,
        body: { error: 'Internal server error', details: error.message }
      }
    }
  },

  // POST /orders - Create new order
  async create(order: Order) {
    try {
      // Start a transaction-like operation
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: order.user_id,
          total_amount: order.total_amount,
          status: order.status || 'pending',
          delivery_address: order.delivery_address || null
        }])
        .select()
        .single()
      
      if (orderError) {
        return {
          status: 400,
          body: { error: 'Failed to create order', details: orderError.message }
        }
      }
      
      // Create order items
      const orderItems = order.items.map(item => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }))
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
      
      if (itemsError) {
        // Rollback: delete the order if items creation fails
        await supabase.from('orders').delete().eq('id', orderData.id)
        return {
          status: 400,
          body: { error: 'Failed to create order items', details: itemsError.message }
        }
      }
      
      return {
        status: 201,
        body: { data: orderData, message: 'Order created successfully' }
      }
    } catch (error) {
      return {
        status: 500,
        body: { error: 'Internal server error', details: error.message }
      }
    }
  },

  // PUT /orders/:id/status - Update order status
  async updateStatus(id: string, status: string) {
    try {
      const validStatuses = ['pending', 'confirmed', 'preparing', 'packed', 'shipped', 'delivered', 'cancelled']
      
      if (!validStatuses.includes(status)) {
        return {
          status: 400,
          body: { error: 'Invalid status', validStatuses }
        }
      }
      
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return {
            status: 404,
            body: { error: 'Order not found' }
          }
        }
        return {
          status: 400,
          body: { error: 'Failed to update order status', details: error.message }
        }
      }
      
      return {
        status: 200,
        body: { data, message: 'Order status updated successfully' }
      }
    } catch (error) {
      return {
        status: 500,
        body: { error: 'Internal server error', details: error.message }
      }
    }
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const method = req.method
    const searchParams = url.searchParams

    // Route: GET /orders?user_id=xxx
    if (method === 'GET' && pathParts.length === 1) {
      const userId = searchParams.get('user_id')
      if (!userId) {
        return new Response(JSON.stringify({ error: 'user_id parameter is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      const result = await OrderController.getByUserId(userId, searchParams)
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route: GET /orders/:id
    if (method === 'GET' && pathParts.length === 2) {
      const id = pathParts[1]
      const result = await OrderController.getById(id)
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route: POST /orders
    if (method === 'POST' && pathParts.length === 1) {
      const order = await req.json()
      const result = await OrderController.create(order)
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route: PUT /orders/:id/status
    if (method === 'PUT' && pathParts.length === 3 && pathParts[2] === 'status') {
      const id = pathParts[1]
      const { status } = await req.json()
      const result = await OrderController.updateStatus(id, status)
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route not found
    return new Response(JSON.stringify({ error: 'Route not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})