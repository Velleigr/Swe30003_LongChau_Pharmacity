import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface Product {
  id?: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  stock_quantity?: number;
  is_prescription_required?: boolean;
}

// Product Controller Functions
const ProductController = {
  // GET /products - Get all products
  async getAll(searchParams: URLSearchParams) {
    try {
      let query = supabase.from('products').select('*')
      
      // Apply filters
      const category = searchParams.get('category')
      if (category && category !== 'all') {
        query = query.eq('category', category)
      }
      
      const search = searchParams.get('search')
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
      }
      
      const sortBy = searchParams.get('sortBy') || 'name'
      const sortOrder = searchParams.get('sortOrder') || 'asc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
      
      const { data, error } = await query
      
      if (error) {
        return {
          status: 500,
          body: { error: 'Failed to fetch products', details: error.message }
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

  // GET /products/:id - Get single product
  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return {
            status: 404,
            body: { error: 'Product not found' }
          }
        }
        return {
          status: 500,
          body: { error: 'Failed to fetch product', details: error.message }
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

  // POST /products - Create new product
  async create(product: Product) {
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
        .single()
      
      if (error) {
        return {
          status: 400,
          body: { error: 'Failed to create product', details: error.message }
        }
      }
      
      return {
        status: 201,
        body: { data, message: 'Product created successfully' }
      }
    } catch (error) {
      return {
        status: 500,
        body: { error: 'Internal server error', details: error.message }
      }
    }
  },

  // PUT /products/:id - Update product
  async update(id: string, product: Partial<Product>) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...(product.name && { name: product.name }),
          ...(product.description !== undefined && { description: product.description }),
          ...(product.price && { price: product.price }),
          ...(product.category && { category: product.category }),
          ...(product.image_url !== undefined && { image_url: product.image_url }),
          ...(product.stock_quantity !== undefined && { stock_quantity: product.stock_quantity }),
          ...(product.is_prescription_required !== undefined && { is_prescription_required: product.is_prescription_required }),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return {
            status: 404,
            body: { error: 'Product not found' }
          }
        }
        return {
          status: 400,
          body: { error: 'Failed to update product', details: error.message }
        }
      }
      
      return {
        status: 200,
        body: { data, message: 'Product updated successfully' }
      }
    } catch (error) {
      return {
        status: 500,
        body: { error: 'Internal server error', details: error.message }
      }
    }
  },

  // DELETE /products/:id - Delete product
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
      
      if (error) {
        return {
          status: 400,
          body: { error: 'Failed to delete product', details: error.message }
        }
      }
      
      return {
        status: 200,
        body: { message: 'Product deleted successfully' }
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const method = req.method
    const searchParams = url.searchParams

    // Route: GET /products
    if (method === 'GET' && pathParts.length === 1) {
      const result = await ProductController.getAll(searchParams)
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route: GET /products/:id
    if (method === 'GET' && pathParts.length === 2) {
      const id = pathParts[1]
      const result = await ProductController.getById(id)
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route: POST /products
    if (method === 'POST' && pathParts.length === 1) {
      const product = await req.json()
      const result = await ProductController.create(product)
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route: PUT /products/:id
    if (method === 'PUT' && pathParts.length === 2) {
      const id = pathParts[1]
      const product = await req.json()
      const result = await ProductController.update(id, product)
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route: DELETE /products/:id
    if (method === 'DELETE' && pathParts.length === 2) {
      const id = pathParts[1]
      const result = await ProductController.delete(id)
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