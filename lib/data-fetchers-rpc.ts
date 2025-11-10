import { supabase, MarketMetrics, SCHEMA_NAME, TABLE_NAME } from './supabase'
import { subHours, subDays } from 'date-fns'

export type TimeWindow = '1h' | '1d' | 'all'

// RPC function approach for custom schema
export async function fetchMarketDataRPC(
  timeWindow: TimeWindow,
  coin?: string
): Promise<MarketMetrics[]> {
  try {
    console.log(`Attempting RPC query for ${SCHEMA_NAME}.${TABLE_NAME}`)
    
    let startDate: string | null = null
    
    if (timeWindow !== 'all') {
      const now = new Date()
      let date: Date
      
      switch (timeWindow) {
        case '1h':
          date = subHours(now, 1)
          break
        case '1d':
          date = subDays(now, 1)
          break
        default:
          date = new Date(0)
      }
      startDate = date.toISOString()
    }

    // Try direct SQL query using RPC
    const query = `
      SELECT * FROM ${SCHEMA_NAME}.${TABLE_NAME}
      ${startDate ? `WHERE timestamp >= '${startDate}'::timestamptz` : ''}
      ${coin ? `${startDate ? 'AND' : 'WHERE'} coin = '${coin}'` : ''}
      ORDER BY timestamp ASC
    `
    
    console.log('Executing SQL:', query)
    
    // Use Supabase's SQL execution if available
    const { data, error } = await supabase.rpc('execute_sql', { 
      query_text: query 
    }).throwOnError()

    if (error) throw error
    
    console.log(`RPC fetched ${data?.length || 0} records`)
    return data || []
  } catch (error) {
    console.error('RPC fetch failed:', error)
    // Fall back to regular query
    return fetchMarketDataDirect(timeWindow, coin)
  }
}

// Direct table access (if table is in public schema or accessible)
export async function fetchMarketDataDirect(
  timeWindow: TimeWindow,
  coin?: string
): Promise<MarketMetrics[]> {
  console.log(`Direct query attempt for table: ${TABLE_NAME}`)
  
  // Try without schema prefix first (in case it's in public schema)
  let query = supabase
    .from(TABLE_NAME)
    .select('*')
    .order('timestamp', { ascending: true })

  // Apply time window filter
  if (timeWindow !== 'all') {
    const now = new Date()
    let startDate: Date
    
    switch (timeWindow) {
      case '1h':
        startDate = subHours(now, 1)
        break
      case '1d':
        startDate = subDays(now, 1)
        break
      default:
        startDate = new Date(0)
    }
    
    query = query.gte('timestamp', startDate.toISOString())
  }

  // Apply coin filter if provided
  if (coin) {
    query = query.eq('coin', coin)
  }

  const { data, error } = await query

  if (error) {
    console.error('Direct query error:', {
      error,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    
    // If direct fails, the table might be in the schema, not public
    // We'd need server-side API or RPC function for this
    return []
  }

  console.log(`Direct query fetched ${data?.length || 0} records`)
  return data || []
}
