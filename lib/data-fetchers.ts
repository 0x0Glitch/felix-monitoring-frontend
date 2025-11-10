import { supabase, MarketMetrics, SCHEMA_NAME, TABLE_NAME } from './supabase'
import { subHours, subDays } from 'date-fns'

export type TimeWindow = '1h' | '1d' | 'all'

export async function fetchMarketData(
  timeWindow: TimeWindow,
  coin?: string
): Promise<MarketMetrics[]> {
  console.log(`Fetching data from table: ${TABLE_NAME} for window: ${timeWindow}`)
  
  // Use just the table name - it might be in the public schema
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
        startDate = new Date(0) // Beginning of time for 'all'
    }
    
    query = query.gte('timestamp', startDate.toISOString())
  }

  // Apply coin filter if provided
  if (coin) {
    query = query.eq('coin', coin)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching market data:', {
      error,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    throw new Error(`Failed to fetch data: ${error.message || 'Unknown error'}`)
  }

  console.log(`Fetched ${data?.length || 0} records`)
  return data || []
}

// Helper function to compute mean of impact prices
export function computeMeanImpactPrice(data: MarketMetrics[]): (number | null)[] {
  return data.map(d => {
    if (d.impactpxs_bid !== null && d.impactpxs_ask !== null) {
      return (d.impactpxs_bid + d.impactpxs_ask) / 2
    }
    return null
  })
}

// Helper function to format data for charts
export function formatChartData(data: MarketMetrics[]) {
  return data.map(d => ({
    ...d,
    timestamp: d.timestamp ? Number(d.timestamp) : null,
    meanImpactPrice: d.impactpxs_bid !== null && d.impactpxs_ask !== null 
      ? (d.impactpxs_bid + d.impactpxs_ask) / 2 
      : null
  }))
}
