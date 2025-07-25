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

interface User {
  id?: string;
  email: string;
  username: string;
  password_hash?: string;
  role?: string;
  full_name?: string;
  phone?: string;
  address?: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface SignUpRequest {
  email: string;
  username: string;
  password: string;
  full_name: string;
  phone?: string;
  address?: string;
}

// Simple password hashing (in production, use bcrypt or similar)
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

// User Controller Functions
const UserController = {
  // POST /users/login - Authenticate user
  async login(loginData: LoginRequest) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', loginData.username)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return {
            status: 401,
            body: { error: 'Invalid username or password' }
          }
        }
        return {
          status: 500,
          body: { error: 'Failed to authenticate user', details: error.message }
        }
      }
      
      // Verify password
      const isValidPassword = await verifyPassword(loginData.password, user.password_hash);
      
      if (!isValidPassword) {
        return {
          status: 401,
          body: { error: 'Invalid username or password' }
        }
      }
      
      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user;
      
      return {
        status: 200,
        body: { 
          data: userWithoutPassword,
          message: 'Login successful'
        }
      }
    } catch (error) {
      return {
        status: 500,
        body: { error: 'Internal server error', details: error.message }
      }
    }
  },

  // POST /users/signup - Create new user account
  async signUp(signUpData: SignUpRequest) {
    try {
      // Check if username or email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('username, email')
        .or(`username.eq.${signUpData.username},email.eq.${signUpData.email}`)
        .single()
      
      if (existingUser) {
        if (existingUser.username === signUpData.username) {
          return {
            status: 400,
            body: { error: 'Username already exists' }
          }
        }
        if (existingUser.email === signUpData.email) {
          return {
            status: 400,
            body: { error: 'Email already exists' }
          }
        }
      }
      
      // Hash password
      const hashedPassword = await hashPassword(signUpData.password);
      
      // Create new user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([
          {
            email: signUpData.email,
            username: signUpData.username,
            password_hash: hashedPassword,
            role: 'customer',
            full_name: signUpData.full_name,
            phone: signUpData.phone || null,
            address: signUpData.address || null,
          }
        ])
        .select()
        .single()
      
      if (error) {
        return {
          status: 400,
          body: { error: 'Failed to create user account', details: error.message }
        }
      }
      
      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = newUser;
      
      return {
        status: 201,
        body: { 
          data: userWithoutPassword,
          message: 'Account created successfully'
        }
      }
    } catch (error) {
      return {
        status: 500,
        body: { error: 'Internal server error', details: error.message }
      }
    }
  },

  // GET /users/:id - Get user profile
  async getById(id: string) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, username, role, full_name, phone, address, created_at, updated_at')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return {
            status: 404,
            body: { error: 'User not found' }
          }
        }
        return {
          status: 500,
          body: { error: 'Failed to fetch user', details: error.message }
        }
      }
      
      return {
        status: 200,
        body: { data: user }
      }
    } catch (error) {
      return {
        status: 500,
        body: { error: 'Internal server error', details: error.message }
      }
    }
  },

  // PUT /users/:id - Update user profile
  async update(id: string, updateData: Partial<User>) {
    try {
      const updateFields: any = {};
      
      if (updateData.email) updateFields.email = updateData.email;
      if (updateData.full_name) updateFields.full_name = updateData.full_name;
      if (updateData.phone !== undefined) updateFields.phone = updateData.phone;
      if (updateData.address !== undefined) updateFields.address = updateData.address;
      
      updateFields.updated_at = new Date().toISOString();
      
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updateFields)
        .eq('id', id)
        .select('id, email, username, role, full_name, phone, address, created_at, updated_at')
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return {
            status: 404,
            body: { error: 'User not found' }
          }
        }
        return {
          status: 400,
          body: { error: 'Failed to update user', details: error.message }
        }
      }
      
      return {
        status: 200,
        body: { 
          data: updatedUser,
          message: 'Profile updated successfully'
        }
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

    // Route: POST /users/login
    if (method === 'POST' && pathParts.length === 2 && pathParts[1] === 'login') {
      const loginData = await req.json()
      const result = await UserController.login(loginData)
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route: POST /users/signup
    if (method === 'POST' && pathParts.length === 2 && pathParts[1] === 'signup') {
      const signUpData = await req.json()
      const result = await UserController.signUp(signUpData)
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route: GET /users/:id
    if (method === 'GET' && pathParts.length === 2) {
      const id = pathParts[1]
      const result = await UserController.getById(id)
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Route: PUT /users/:id
    if (method === 'PUT' && pathParts.length === 2) {
      const id = pathParts[1]
      const updateData = await req.json()
      const result = await UserController.update(id, updateData)
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
