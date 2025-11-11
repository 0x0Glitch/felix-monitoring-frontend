import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://thjyshlwqvhopflremyl.supabase.co'
const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || ''

// PostgreSQL connection string for reference
const connectionString = process.env.NEXT_PUBLIC_DATABASE_URL || ''

// Define schema from environment or use defaults
export const SCHEMA_NAME = process.env.NEXT_PUBLIC_MARKET_SCHEMA || 'market_data'
export const TABLE_NAME = process.env.NEXT_PUBLIC_MARKET_TABLE || 'flxn_tsla_data'
export const USER_POSITIONS_SCHEMA = process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || 'user_positions'
export const USER_POSITIONS_TABLE = process.env.NEXT_PUBLIC_USER_POSITIONS_TABLE || 'flxn_tsla_positions'

// Create Supabase client with service role key (bypasses RLS)
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  },
  db: {
    schema: 'public' // Explicitly use public schema
  }
})

// Type definitions for our database schema
export interface MarketMetrics {
  id: number
  timestamp: bigint | null
  szdecimals: number | null
  coin: string | null
  markpx: number | null
  prevdaypx: number | null
  marginmode: string | null
  oraclepx: number | null
  maxleverage: number | null
  midpx: number | null
  best_bid: number | null
  best_ask: number | null
  spread: number | null
  daybasevlm: number | null
  funding: number | null
  openinterest: number | null
  dayntlvlm: number | null
  bid_depth_5bps: number | null
  ask_depth_5bps: number | null
  bid_depth_10bps: number | null
  ask_depth_10bps: number | null
  bid_depth_50bps: number | null
  ask_depth_50bps: number | null
  bid_depth_100bps: number | null
  ask_depth_100bps: number | null
  premium: number | null
  impactpxs_bid: number | null
  impactpxs_ask: number | null
}
