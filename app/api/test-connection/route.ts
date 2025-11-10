import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || ''
  
  // Create a fresh client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false
    }
  })
  
  const tests = []
  
  // Test 1: Try public schema with full table name
  try {
    const { data, error } = await supabase
      .from('xyz_xyz100_metrics_raw')
      .select('*')
      .limit(1)
    
    tests.push({
      test: 'Public schema - xyz_xyz100_metrics_raw',
      success: !error,
      data: data?.length || 0,
      error: error?.message
    })
  } catch (e: any) {
    tests.push({
      test: 'Public schema - xyz_xyz100_metrics_raw',
      success: false,
      error: e.message
    })
  }
  
  // Test 2: Try with market_metrics schema
  try {
    const supabaseWithSchema = createClient(supabaseUrl, supabaseKey, {
      db: { schema: 'market_metrics' },
      auth: { persistSession: false }
    })
    
    const { data, error } = await supabaseWithSchema
      .from('xyz_xyz100_metrics_raw')
      .select('*')
      .limit(1)
    
    tests.push({
      test: 'market_metrics schema - xyz_xyz100_metrics_raw',
      success: !error,
      data: data?.length || 0,
      error: error?.message
    })
  } catch (e: any) {
    tests.push({
      test: 'market_metrics schema - xyz_xyz100_metrics_raw',
      success: false,
      error: e.message
    })
  }
  
  // Test 3: Try with qualified name
  try {
    const { data, error } = await supabase
      .from('market_metrics.xyz_xyz100_metrics_raw')
      .select('*')
      .limit(1)
    
    tests.push({
      test: 'Qualified name - market_metrics.xyz_xyz100_metrics_raw',
      success: !error,
      data: data?.length || 0,
      error: error?.message
    })
  } catch (e: any) {
    tests.push({
      test: 'Qualified name - market_metrics.xyz_xyz100_metrics_raw',
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
