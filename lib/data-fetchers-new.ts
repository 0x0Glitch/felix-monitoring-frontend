import { MarketMetrics } from './supabase'
import { dataCache } from './cache'

export type TimeWindow = '1h' | '1d' | 'all'

export interface FetchResult {
  data: MarketMetrics[]
  sampled: boolean
}

export async function fetchMarketData(
  timeWindow: TimeWindow,
  coin?: string,
  forceRefresh = false
): Promise<FetchResult> {
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = dataCache.get(timeWindow, coin)
    if (cached) {
      console.log(`Using cached data for ${timeWindow}`)
      return {
        data: cached.data,
        sampled: cached.sampled
      }
    }
  }
  
  console.log(`Fetching fresh data for window: ${timeWindow}`)
  
  // Build query params
  const params = new URLSearchParams({
    timeWindow
  })
  
  if (coin) {
    params.append('coin', coin)
  }
  
  // Retry logic with exponential backoff
  let lastError: Error | null = null
  const maxRetries = 3
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout to fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch(`/api/market-data?${params}`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const error = await response.json()
        
        // If it's a 503 (service unavailable), retry
        if (response.status === 503 && attempt < maxRetries) {
          lastError = new Error(error.error || 'Service temporarily unavailable')
          console.warn(`Attempt ${attempt} failed with 503, retrying...`)
          await new Promise(resolve => setTimeout(resolve, attempt * 2000))
          continue
        }
        
        throw new Error(error.error || 'Failed to fetch data')
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data')
      }
      
      console.log(`Fetched ${result.count} records${result.sampled ? ' (sampled)' : ''}`)
      
      // Cache the successful result
      dataCache.set(timeWindow, coin, result.data, result.sampled)
      
      return {
        data: result.data || [],
        sampled: result.sampled || false
      }
      
    } catch (error: any) {
      lastError = error
      
      // If it's a network/timeout error and we have retries left, retry
      if ((error.name === 'AbortError' || error.message.includes('fetch')) && attempt < maxRetries) {
        console.warn(`Attempt ${attempt} failed with network error, retrying...`)
        await new Promise(resolve => setTimeout(resolve, attempt * 2000))
        continue
      }
      
      // For other errors or last attempt, throw
      if (attempt === maxRetries) {
        console.error('All fetch attempts failed:', error)
        throw lastError
      }
    }
  }
  
  throw lastError || new Error('Failed to fetch data after multiple attempts')
}

// Helper function to compute mean of impact prices
export function computeMeanImpactPrice(data: any[]): (number | null)[] {
  return data.map(d => {
    if (d.impact_px_bid !== null && d.impact_px_ask !== null) {
      return (d.impact_px_bid + d.impact_px_ask) / 2
    }
    return null
  })
}

// Helper function to format data for charts
export function formatChartData(data: any[]) {
  return data.map(d => ({
    ...d,
    timestamp: d.timestamp ? Number(d.timestamp) : null,
    meanImpactPrice: d.impact_px_bid !== null && d.impact_px_ask !== null 
      ? (d.impact_px_bid + d.impact_px_ask) / 2 
      : null
  }))
}
