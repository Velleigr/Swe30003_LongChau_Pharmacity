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

interface Prescription {
  id?: string;
  user_id: string;
  pharmacist_id?: string;
  prescription_text?: string;
  image_url?: string;
  status?: string;
  order_id?: string;
}

// Prescription Controller Functions
const PrescriptionController = {
  // GET /prescriptions - Get prescriptions (filtered by user or pharmacist)
  async getAll(searchParams: URLSearchParams) {
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
        `)
      
      const userId = searchParams.get('user_id')
      const pharmacistId = searchParams.get('pharmacist_id')
      const status = searchParams.get('status')
      
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      if (pharmacistId) {
        query = query.eq('pharmacist_id', pharmacistId)
      }
      
      if (status) {
        query = query.eq('status', status)
      }
      
      query = query.order('created_at', { ascending: false })
      
      const { data, error } = await query
      
      if (error) {
        return {
          status: 500,
          body: { error: 'Failed to fetch prescriptions', details: error.message }
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

  // GET /prescriptions/:id - Get single prescription
  async getById(id: string) {
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
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return {
            status: 404,
            body: { error: 'Prescription not found' }
          }
        }
        return {
          status: 500,
          body: { error: 'Failed to fetch prescription', details: error.message }
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

  // POST /prescriptions - Create new prescription
  async create(prescription: Prescription) {
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
        .single()
      
      if (error) {
        return {
          status: 400,
          body: { error: 'Failed to create prescription', details: error.message }
        }
      }
      
      return {
        status: 201,
        body: { data, message: 'Prescription created successfully' }
      }
    } catch (error) {
      return {
        status: 500,
        body: { error: 'Internal server error', details: error.message }
      }
    }
  },

  // PUT /prescriptions/:id/review - Review prescription (pharmacist action)
  async review(id: string, reviewData: { pharmacist_id: string; status: string; notes?: string }) {
    try {
      const validStatuses = ['pending', 'reviewed', 'approved', 'rejected']
      
      if (!validStatuses.includes(reviewData.status)) {
        return {
          status: 400,
          body: { error: 'Invalid status', validStatuses }
        }
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
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return {
            status: 404,
            body: { error: 'Prescription not found' }
          }
        }
        return {
          status: 400,
          body: { error: 'Failed to review prescription', details: error.message }
        }
      }
      
      return {
        status: 200,
        body: { data, message: 'Prescription reviewed successfully' }
      }
    } catch (error) {
      return {
        status: 500,
        body: { error: 'Internal server error', details: error.message }
      }
    }
  },

  // PUT /prescriptions/:id/link-order - Link prescription to order
  async linkOrder(id: string, orderId: string) {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .update({
          order_id: orderId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return {
            status: 404,
            body: { error: 'Prescription not found' }
          }
        }
        return {
          status: 400,
          body: { error: 'Failed to link prescription to order', details: error.message }
        }
      }
      
      return {
        status: 200,
        body: { data, message: 'Prescription linked to order successfully' }
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

    // Route: GET /prescriptions
    if (method === 'GET' && pathParts.length === 1) {
      const result = await PrescriptionController.getAll(searchParams)
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route: GET /prescriptions/:id
    if (method === 'GET' && pathParts.length === 2) {
      const id = pathParts[1]
      const result = await PrescriptionController.getById(id)
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route: POST /prescriptions
    if (method === 'POST' && pathParts.length === 1) {
      const prescription = await req.json()
      const result = await PrescriptionController.create(prescription)
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route: PUT /prescriptions/:id/review
    if (method === 'PUT' && pathParts.length === 3 && pathParts[2] === 'review') {
      const id = pathParts[1]
      const reviewData = await req.json()
      const result = await PrescriptionController.review(id, reviewData)
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route: PUT /prescriptions/:id/link-order
    if (method === 'PUT' && pathParts.length === 3 && pathParts[2] === 'link-order') {
      const id = pathParts[1]
      const { order_id } = await req.json()
      const result = await PrescriptionController.linkOrder(id, order_id)
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