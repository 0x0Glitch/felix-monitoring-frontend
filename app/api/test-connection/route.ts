import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { MARKET_CONFIG } from '@/lib/config'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
  const marketTable = MARKET_CONFIG.marketTable
  const marketSchema = MARKET_CONFIG.marketSchema
  
  // Create a fresh client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false
    }
  })
  
  const tests = []
  
  // Test 1: Try public schema with configured table name
  try {
    const { data, error } = await supabase
      .from(marketTable)
      .select('*')
      .limit(1)
    
    tests.push({
      test: `Public schema - ${marketTable}`,
      success: !error,
      data: data?.length || 0,
      error: error?.message
    })
  } catch (e: any) {
    tests.push({
      test: `Public schema - ${marketTable}`,
      success: false,
      error: e.message
    })
  }
  
  // Test 2: Try with configured schema
  try {
    const supabaseWithSchema = createClient(supabaseUrl, supabaseKey, {
      db: { schema: marketSchema },
      auth: { persistSession: false }
    })
    
    const { data, error } = await supabaseWithSchema
      .from(marketTable)
      .select('*')
      .limit(1)
    
    tests.push({
      test: `${marketSchema} schema - ${marketTable}`,
      success: !error,
      data: data?.length || 0,
      error: error?.message
    })
  } catch (e: any) {
    tests.push({
      test: `${marketSchema} schema - ${marketTable}`,
      success: false,
      error: e.message
    })
  }
  
  // Test 3: Try with qualified name
  try {
    const { data, error } = await supabase
      .from(`${marketSchema}.${marketTable}`)
      .select('*')
      .limit(1)
    
    tests.push({
      test: `Qualified name - ${marketSchema}.${marketTable}`,
      success: !error,
      data: data?.length || 0,
      error: error?.message
    })
  } catch (e: any) {
    tests.push({
      test: `Qualified name - ${marketSchema}.${marketTable}`,
      success: false,
      error: e.message
    })
  }
  
  return NextResponse.json({
    supabaseUrl,
    hasKey: !!supabaseKey,
    tests
  })
}
