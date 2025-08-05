import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Standard Supabase client for public schema
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Supabase client for city_of_toronto schema
export const supabaseCity = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'city_of_toronto' }
})