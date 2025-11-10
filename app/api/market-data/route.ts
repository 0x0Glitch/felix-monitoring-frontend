import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

// Function to create a new client for each request (better for serverless)
function createClient() {
  return new Client({
    connectionString: process.env.NEXT_PUBLIC_DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000, // 10 seconds for connection establishment
    statement_timeout: 60000, // 60 seconds for queries
    query_timeout: 60000, // 60 seconds
  })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const timeWindow = searchParams.get('timeWindow') || 'all'
  let coin = searchParams.get('coin')
  
  // Default to flxn:TSLA if no coin specified
  if (!coin) {
    coin = 'flxn:TSLA'
  } else {
    // Handle coin format: keep prefix lowercase, but market uppercase for consistency
    if (coin.toLowerCase().startsWith('flxn:')) {
      // For FLXN markets, keep the format as 'flxn:TSLA' (lowercase prefix, uppercase symbol)
      const parts = coin.split(':')
      coin = parts[0].toLowerCase() + ':' + (parts[1] || '').toUpperCase()
    } else {
      // For other markets, convert to lowercase
      coin = coin.toLowerCase()
    }
  }
  
  const limit = parseInt(searchParams.get('limit') || '10000') // Default limit
  const offset = parseInt(searchParams.get('offset') || '0')
  
  let client: Client | null = null
  let retries = 3
  
  // Retry logic for connection
  while (retries > 0) {
    try {
      client = createClient()
      await client.connect()
      break // Success, exit the retry loop
    } catch (connError: any) {
      retries--
      console.error(`Connection attempt failed, retries remaining: ${retries}`, connError.message)
      if (client) {
        try {
          await client.end()
        } catch (e) {
          // Ignore cleanup errors
        }
        client = null
      }
      if (retries === 0) {
        console.error('All connection attempts failed')
        return NextResponse.json({
          success: false,
          error: 'Database connection failed after multiple attempts. Please try again later.',
          details: connError.message
        }, { status: 503 })
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, (3 - retries) * 1000))
    }
  }
  
  if (!client) {
    return NextResponse.json({
      success: false,
      error: 'Unable to establish database connection'
    }, { status: 503 })
  }
  
  try {
    
    // For "all" time window, we'll sample the data to avoid too much data
    const isAllTime = timeWindow === 'all'
    
    // Build the query
    let query: string
    const conditions = []
    const values: any[] = []
    
    if (isAllTime) {
      // For all-time data, use 10-minute aggregation for better detail while maintaining performance
      query = `
        WITH time_buckets AS (
          SELECT 
            DATE_TRUNC('hour', TO_TIMESTAMP(timestamp / 1000)) + 
              (FLOOR(EXTRACT(MINUTE FROM TO_TIMESTAMP(timestamp / 1000)) / 10) * 10) * INTERVAL '1 minute' as timestamp,
            AVG(markpx::numeric) as mark_price,
            AVG(oraclepx::numeric) as oracle_price,
            AVG(midpx::numeric) as mid_price,
            AVG(funding::numeric) as funding_rate_pct,
            AVG(openinterest::numeric) as open_interest,
            AVG(bid_depth_5bps::numeric) as bid_depth_5bps,
            AVG(ask_depth_5bps::numeric) as ask_depth_5bps,
            AVG(bid_depth_10bps::numeric) as bid_depth_10bps,
            AVG(ask_depth_10bps::numeric) as ask_depth_10bps,
            AVG(bid_depth_50bps::numeric) as bid_depth_50bps,
            AVG(ask_depth_50bps::numeric) as ask_depth_50bps,
            AVG(bid_depth_100bps::numeric) as bid_depth_100bps,
            AVG(ask_depth_100bps::numeric) as ask_depth_100bps,
            null as bid_depth_5pct,
            null as ask_depth_5pct,
            null as bid_depth_10pct,
            null as ask_depth_10pct,
            null as bid_depth_25pct,
            null as ask_depth_25pct,
            (AVG(bid_depth_5bps::numeric) + AVG(ask_depth_5bps::numeric)) as total_depth_5bps,
            (AVG(bid_depth_10bps::numeric) + AVG(ask_depth_10bps::numeric)) as total_depth_10bps,
            (AVG(bid_depth_50bps::numeric) + AVG(ask_depth_50bps::numeric)) as total_depth_50bps,
            (AVG(bid_depth_100bps::numeric) + AVG(ask_depth_100bps::numeric)) as total_depth_100bps,
            AVG(impactpxs_bid::numeric) as impact_px_bid,
            AVG(impactpxs_ask::numeric) as impact_px_ask,
            AVG(best_bid::numeric) as best_bid,
            AVG(best_ask::numeric) as best_ask,
            AVG(spread::numeric) as spread,
            AVG(spread::numeric) as spread_pct,
            AVG(dayntlvlm::numeric) as volume_24h,
            null as total_depth_5pct,
            null as total_depth_10pct,
            AVG(premium::numeric) as premium,
            MIN(coin) as coin
          FROM market_data.flxn_tsla_data
          WHERE coin = $1
          GROUP BY DATE_TRUNC('hour', TO_TIMESTAMP(timestamp / 1000)) + 
                   (FLOOR(EXTRACT(MINUTE FROM TO_TIMESTAMP(timestamp / 1000)) / 10) * 10) * INTERVAL '1 minute'
        )
        SELECT * FROM time_buckets
        ORDER BY timestamp ASC
        LIMIT 5000
      `
      if (coin) values.push(coin)
    } else if (timeWindow === '1d') {
      // For 1-day data, use 2-minute aggregation to ensure we get the full 24 hours with good balance of detail and performance
      query = `
        WITH time_buckets AS (
          SELECT 
            DATE_TRUNC('hour', TO_TIMESTAMP(timestamp / 1000)) + 
              (FLOOR(EXTRACT(MINUTE FROM TO_TIMESTAMP(timestamp / 1000)) / 2) * 2) * INTERVAL '1 minute' as timestamp,
            AVG(markpx::numeric) as mark_price,
            AVG(oraclepx::numeric) as oracle_price,
            AVG(midpx::numeric) as mid_price,
            AVG(funding::numeric) as funding_rate_pct,
            AVG(openinterest::numeric) as open_interest,
            AVG(bid_depth_5bps::numeric) as bid_depth_5bps,
            AVG(ask_depth_5bps::numeric) as ask_depth_5bps,
            AVG(bid_depth_10bps::numeric) as bid_depth_10bps,
            AVG(ask_depth_10bps::numeric) as ask_depth_10bps,
            AVG(bid_depth_50bps::numeric) as bid_depth_50bps,
            AVG(ask_depth_50bps::numeric) as ask_depth_50bps,
            AVG(bid_depth_100bps::numeric) as bid_depth_100bps,
            AVG(ask_depth_100bps::numeric) as ask_depth_100bps,
            null as bid_depth_5pct,
            null as ask_depth_5pct,
            null as bid_depth_10pct,
            null as ask_depth_10pct,
            null as bid_depth_25pct,
            null as ask_depth_25pct,
            (AVG(bid_depth_5bps::numeric) + AVG(ask_depth_5bps::numeric)) as total_depth_5bps,
            (AVG(bid_depth_10bps::numeric) + AVG(ask_depth_10bps::numeric)) as total_depth_10bps,
            (AVG(bid_depth_50bps::numeric) + AVG(ask_depth_50bps::numeric)) as total_depth_50bps,
            (AVG(bid_depth_100bps::numeric) + AVG(ask_depth_100bps::numeric)) as total_depth_100bps,
            AVG(impactpxs_bid::numeric) as impact_px_bid,
            AVG(impactpxs_ask::numeric) as impact_px_ask,
            AVG(best_bid::numeric) as best_bid,
            AVG(best_ask::numeric) as best_ask,
            AVG(spread::numeric) as spread,
            AVG(spread::numeric) as spread_pct,
            AVG(dayntlvlm::numeric) as volume_24h,
            null as total_depth_5pct,
            null as total_depth_10pct,
            AVG(premium::numeric) as premium,
            MIN(coin) as coin
          FROM market_data.flxn_tsla_data
          WHERE TO_TIMESTAMP(timestamp / 1000) >= NOW() - INTERVAL '24 hours'
            AND coin = $1
          GROUP BY DATE_TRUNC('hour', TO_TIMESTAMP(timestamp / 1000)) + 
                   (FLOOR(EXTRACT(MINUTE FROM TO_TIMESTAMP(timestamp / 1000)) / 2) * 2) * INTERVAL '1 minute'
        )
        SELECT * FROM time_buckets
        ORDER BY timestamp ASC
      `
      if (coin) values.push(coin)
      console.log(`Time filter: last 24 hours with 2-minute aggregation`)
    } else {
      // For 1-hour view, get raw data (should be manageable)
      query = `
        SELECT 
          id, TO_TIMESTAMP(timestamp / 1000) as timestamp, coin,
          markpx as mark_price, oraclepx as oracle_price, midpx as mid_price,
          best_bid, best_ask, spread, spread as spread_pct,
          funding as funding_rate_pct, openinterest as open_interest, dayntlvlm as volume_24h,
          bid_depth_5bps, ask_depth_5bps, (bid_depth_5bps + ask_depth_5bps) as total_depth_5bps,
          bid_depth_10bps, ask_depth_10bps, (bid_depth_10bps + ask_depth_10bps) as total_depth_10bps,
          bid_depth_50bps, ask_depth_50bps, (bid_depth_50bps + ask_depth_50bps) as total_depth_50bps,
          bid_depth_100bps, ask_depth_100bps, (bid_depth_100bps + ask_depth_100bps) as total_depth_100bps,
          null as bid_depth_5pct, null as ask_depth_5pct, null as total_depth_5pct,
          null as bid_depth_10pct, null as ask_depth_10pct, null as total_depth_10pct,
          null as bid_depth_25pct, null as ask_depth_25pct, null as total_depth_25pct,
          impactpxs_bid as impact_px_bid, impactpxs_ask as impact_px_ask, premium
        FROM market_data.flxn_tsla_data
        WHERE TO_TIMESTAMP(timestamp / 1000) >= NOW() - INTERVAL '1 hour'
          AND coin = $1
      `
      
      // Add coin parameter
      values.push(coin)
      
      query += ' ORDER BY timestamp ASC'
      query += ` LIMIT ${limit} OFFSET ${offset}`
      console.log(`Time filter: last 1 hour`)
    }
    
    console.log(`Executing query for timeWindow: ${timeWindow}`)
    console.log('Query:', query.substring(0, 200) + '...')
    console.log('Values:', values)
    
    const result = await client.query(query, values)
    
    // Convert numeric strings to numbers for proper chart rendering
    const processedData = result.rows.map((row: any) => ({
      ...row,
      mark_price: row.mark_price ? parseFloat(row.mark_price) : null,
      oracle_price: row.oracle_price ? parseFloat(row.oracle_price) : null,
      mid_price: row.mid_price ? parseFloat(row.mid_price) : null,
      best_bid: row.best_bid ? parseFloat(row.best_bid) : null,
      best_ask: row.best_ask ? parseFloat(row.best_ask) : null,
      spread: row.spread ? parseFloat(row.spread) : null,
      spread_pct: row.spread_pct ? parseFloat(row.spread_pct) : null,
      funding_rate_pct: row.funding_rate_pct ? parseFloat(row.funding_rate_pct) * 100 : null,
      open_interest: row.open_interest ? parseFloat(row.open_interest) : null,
      volume_24h: row.volume_24h ? parseFloat(row.volume_24h) : null,
      bid_depth_5bps: row.bid_depth_5bps ? parseFloat(row.bid_depth_5bps) : null,
      ask_depth_5bps: row.ask_depth_5bps ? parseFloat(row.ask_depth_5bps) : null,
      bid_depth_10bps: row.bid_depth_10bps ? parseFloat(row.bid_depth_10bps) : null,
      ask_depth_10bps: row.ask_depth_10bps ? parseFloat(row.ask_depth_10bps) : null,
      bid_depth_50bps: row.bid_depth_50bps ? parseFloat(row.bid_depth_50bps) : null,
      ask_depth_50bps: row.ask_depth_50bps ? parseFloat(row.ask_depth_50bps) : null,
      bid_depth_100bps: row.bid_depth_100bps ? parseFloat(row.bid_depth_100bps) : null,
      ask_depth_100bps: row.ask_depth_100bps ? parseFloat(row.ask_depth_100bps) : null,
      total_depth_5bps: row.total_depth_5bps ? parseFloat(row.total_depth_5bps) : null,
      total_depth_10bps: row.total_depth_10bps ? parseFloat(row.total_depth_10bps) : null,
      total_depth_50bps: row.total_depth_50bps ? parseFloat(row.total_depth_50bps) : null,
      total_depth_100bps: row.total_depth_100bps ? parseFloat(row.total_depth_100bps) : null,
      bid_depth_5pct: row.bid_depth_5pct ? parseFloat(row.bid_depth_5pct) : null,
      ask_depth_5pct: row.ask_depth_5pct ? parseFloat(row.ask_depth_5pct) : null,
      bid_depth_10pct: row.bid_depth_10pct ? parseFloat(row.bid_depth_10pct) : null,
      ask_depth_10pct: row.ask_depth_10pct ? parseFloat(row.ask_depth_10pct) : null,
      bid_depth_25pct: row.bid_depth_25pct ? parseFloat(row.bid_depth_25pct) : null,
      ask_depth_25pct: row.ask_depth_25pct ? parseFloat(row.ask_depth_25pct) : null,
      total_depth_5pct: row.total_depth_5pct ? parseFloat(row.total_depth_5pct) : null,
      total_depth_10pct: row.total_depth_10pct ? parseFloat(row.total_depth_10pct) : null,
      total_depth_25pct: row.total_depth_25pct ? parseFloat(row.total_depth_25pct) : null,
      impact_px_bid: row.impact_px_bid ? parseFloat(row.impact_px_bid) : null,
      impact_px_ask: row.impact_px_ask ? parseFloat(row.impact_px_ask) : null,
      premium: row.premium ? parseFloat(row.premium) : null
    }))
    
    // Log timestamp range for debugging
    if (processedData.length > 0) {
      const timestamps = processedData.map((d: any) => d.timestamp).sort()
      const first = new Date(timestamps[0])
      const last = new Date(timestamps[timestamps.length - 1])
      const now = new Date()
      const hoursDiff = (now.getTime() - first.getTime()) / (1000 * 60 * 60)
      const totalHours = (last.getTime() - first.getTime()) / (1000 * 60 * 60)
      
      console.log(`[${timeWindow}] Returning ${processedData.length} records`)
      console.log(`[${timeWindow}] Time range: ${first.toISOString()} to ${last.toISOString()}`)
      console.log(`[${timeWindow}] Data spans ${totalHours.toFixed(1)} hours`)
      console.log(`[${timeWindow}] Oldest data is ${hoursDiff.toFixed(1)} hours ago from now`)
      
      // Warning if 1d is returning less than expected
      if (timeWindow === '1d' && hoursDiff < 20) {
        console.warn(`[WARNING] 1d query only returned ${hoursDiff.toFixed(1)} hours of data, expected ~24 hours`)
      }
    } else {
      console.log(`[${timeWindow}] Returning 0 records`)
    }
    
    return NextResponse.json({
      success: true,
      data: processedData,
      count: processedData.length,
      sampled: timeWindow === 'all' || timeWindow === '1d' // Both all-time and 1-day use sampling
    })
    
  } catch (error: any) {
    console.error('Database error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error
    }, { status: 500 })
  } finally {
    if (client) {
      try {
        await client.end()
      } catch (e) {
        console.error('Error closing database connection:', e)
      }
    }
  }
}
