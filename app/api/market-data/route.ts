import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { dataCache } from '@/lib/cache'
import { MARKET_CONFIG } from '@/lib/config'
import { getMarketTableNames, normalizeMarketId } from '@/lib/markets'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const timeWindow = searchParams.get('timeWindow') || 'all'
  let coin = searchParams.get('coin')

  // Default to configured market if no coin specified
  if (!coin) {
    coin = MARKET_CONFIG.defaultMarket
  }

  // Normalize coin format: lowercase dex prefix, uppercase market symbol
  if (coin.includes(':')) {
    const parts = coin.split(':')
    coin = parts[0].toLowerCase() + ':' + (parts[1] || '').toUpperCase()
  } else {
    // For non-DEX markets, keep original case
    coin = coin.toUpperCase()
  }

  // Check cache first
  const cachedData = dataCache.get(timeWindow, coin)
  if (cachedData) {
    console.log(`[CACHE HIT] Returning cached data for ${coin} - ${timeWindow}`)
    return NextResponse.json({
      success: true,
      data: cachedData.data,
      count: cachedData.data.length,
      sampled: cachedData.sampled,
      cached: true
    })
  }

  console.log(`[CACHE MISS] Fetching fresh data for ${coin} - ${timeWindow}`)

  const pool = getPool()
  let client

  try {
    // Get a client from the pool
    client = await pool.connect()

    // Get table name based on the market
    const normalizedCoin = normalizeMarketId(coin)
    const { marketSchema, marketTable } = getMarketTableNames(normalizedCoin)
    const fullTableName = `${marketSchema}.${marketTable}`

    console.log(`Using dynamic table for market ${normalizedCoin}: ${fullTableName}`)

    // For "all" time window, we'll sample the data to avoid too much data
    const isAllTime = timeWindow === 'all'

    // Build the query
    let query: string
    const values: any[] = []
    
    if (isAllTime) {
      // For all-time data, use 4-hour aggregation for efficient data loading
      query = `
        SELECT
          EXTRACT(EPOCH FROM (DATE_TRUNC('day', TO_TIMESTAMP(timestamp / 1000)) +
            (FLOOR(EXTRACT(HOUR FROM TO_TIMESTAMP(timestamp / 1000)) / 4) * 4) * INTERVAL '1 hour')) * 1000 as timestamp,
          AVG(markpx::numeric) as mark_price,
          AVG(oraclepx::numeric) as oracle_price,
          AVG(midpx::numeric) as mid_price,
          AVG(funding::numeric) as funding_rate_pct,
          AVG(markpx::numeric * openinterest::numeric) as open_interest,
          AVG(bid_depth_5bps::numeric) as bid_depth_5bps,
          AVG(ask_depth_5bps::numeric) as ask_depth_5bps,
          AVG(bid_depth_10bps::numeric) as bid_depth_10bps,
          AVG(ask_depth_10bps::numeric) as ask_depth_10bps,
          AVG(bid_depth_50bps::numeric) as bid_depth_50bps,
          AVG(ask_depth_50bps::numeric) as ask_depth_50bps,
          AVG(bid_depth_100bps::numeric) as bid_depth_100bps,
          AVG(ask_depth_100bps::numeric) as ask_depth_100bps,
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
          MAX(dayntlvlm::numeric) as volume_24h,
          AVG(premium::numeric) as premium,
          MIN(coin) as coin,
          null as bid_depth_5pct,
          null as ask_depth_5pct,
          null as bid_depth_10pct,
          null as ask_depth_10pct,
          null as bid_depth_25pct,
          null as ask_depth_25pct,
          null as total_depth_5pct,
          null as total_depth_10pct
        FROM ${fullTableName}
        WHERE coin = $1
        GROUP BY (DATE_TRUNC('day', TO_TIMESTAMP(timestamp / 1000)) +
                 (FLOOR(EXTRACT(HOUR FROM TO_TIMESTAMP(timestamp / 1000)) / 4) * 4) * INTERVAL '1 hour')
        ORDER BY timestamp ASC
      `
      if (coin) values.push(coin)
      console.log(`Time filter: ALL TIME (no time restriction) with 4-hour aggregation`)
    } else if (timeWindow === '1d') {
      // For 1-day data, use 2-minute aggregation to ensure we get the full 24 hours with good balance of detail and performance
      query = `
        WITH time_buckets AS (
          SELECT 
            EXTRACT(EPOCH FROM (DATE_TRUNC('hour', TO_TIMESTAMP(timestamp / 1000)) + 
              (FLOOR(EXTRACT(MINUTE FROM TO_TIMESTAMP(timestamp / 1000)) / 2) * 2) * INTERVAL '1 minute')) * 1000 as timestamp,
            AVG(markpx::numeric) as mark_price,
            AVG(oraclepx::numeric) as oracle_price,
            AVG(midpx::numeric) as mid_price,
            AVG(funding::numeric) as funding_rate_pct,
            AVG(markpx::numeric * openinterest::numeric) as open_interest,
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
            (ARRAY_AGG(dayntlvlm::numeric ORDER BY timestamp DESC))[1] as volume_24h,
            null as total_depth_5pct,
            null as total_depth_10pct,
            AVG(premium::numeric) as premium,
            MIN(coin) as coin
          FROM ${fullTableName}
          WHERE TO_TIMESTAMP(timestamp / 1000) >= NOW() - INTERVAL '24 hours'
            AND coin = $1
          GROUP BY (DATE_TRUNC('hour', TO_TIMESTAMP(timestamp / 1000)) + 
                   (FLOOR(EXTRACT(MINUTE FROM TO_TIMESTAMP(timestamp / 1000)) / 2) * 2) * INTERVAL '1 minute')
        )
        SELECT * FROM time_buckets
        ORDER BY timestamp ASC
      `
      if (coin) values.push(coin)
      console.log(`Time filter: last 24 hours with 2-minute aggregation`)
    } else if (timeWindow === '30d') {
      // For 30-day data, use 30-minute aggregation
      query = `
        WITH time_buckets AS (
          SELECT
            EXTRACT(EPOCH FROM (DATE_TRUNC('hour', TO_TIMESTAMP(timestamp / 1000)) +
              (FLOOR(EXTRACT(MINUTE FROM TO_TIMESTAMP(timestamp / 1000)) / 30) * 30) * INTERVAL '1 minute')) * 1000 as timestamp,
            AVG(markpx::numeric) as mark_price,
            AVG(oraclepx::numeric) as oracle_price,
            AVG(midpx::numeric) as mid_price,
            AVG(funding::numeric) as funding_rate_pct,
            AVG(markpx::numeric * openinterest::numeric) as open_interest,
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
            (ARRAY_AGG(dayntlvlm::numeric ORDER BY timestamp DESC))[1] as volume_24h,
            null as total_depth_5pct,
            null as total_depth_10pct,
            AVG(premium::numeric) as premium,
            MIN(coin) as coin
          FROM ${fullTableName}
          WHERE TO_TIMESTAMP(timestamp / 1000) >= NOW() - INTERVAL '30 days'
            AND coin = $1
          GROUP BY (DATE_TRUNC('hour', TO_TIMESTAMP(timestamp / 1000)) +
                   (FLOOR(EXTRACT(MINUTE FROM TO_TIMESTAMP(timestamp / 1000)) / 30) * 30) * INTERVAL '1 minute')
        )
        SELECT * FROM time_buckets
        ORDER BY timestamp ASC
      `
      if (coin) values.push(coin)
      console.log(`Time filter: last 30 days with 30-minute aggregation`)
    } else if (timeWindow === '7d') {
      // For 7-day data, use 10-minute aggregation
      query = `
        WITH time_buckets AS (
          SELECT
            EXTRACT(EPOCH FROM (DATE_TRUNC('hour', TO_TIMESTAMP(timestamp / 1000)) +
              (FLOOR(EXTRACT(MINUTE FROM TO_TIMESTAMP(timestamp / 1000)) / 10) * 10) * INTERVAL '1 minute')) * 1000 as timestamp,
            AVG(markpx::numeric) as mark_price,
            AVG(oraclepx::numeric) as oracle_price,
            AVG(midpx::numeric) as mid_price,
            AVG(funding::numeric) as funding_rate_pct,
            AVG(markpx::numeric * openinterest::numeric) as open_interest,
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
            (ARRAY_AGG(dayntlvlm::numeric ORDER BY timestamp DESC))[1] as volume_24h,
            null as total_depth_5pct,
            null as total_depth_10pct,
            AVG(premium::numeric) as premium,
            MIN(coin) as coin
          FROM ${fullTableName}
          WHERE TO_TIMESTAMP(timestamp / 1000) >= NOW() - INTERVAL '7 days'
            AND coin = $1
          GROUP BY (DATE_TRUNC('hour', TO_TIMESTAMP(timestamp / 1000)) +
                   (FLOOR(EXTRACT(MINUTE FROM TO_TIMESTAMP(timestamp / 1000)) / 10) * 10) * INTERVAL '1 minute')
        )
        SELECT * FROM time_buckets
        ORDER BY timestamp ASC
      `
      if (coin) values.push(coin)
      console.log(`Time filter: last 7 days with 10-minute aggregation`)
    } else {
      // For 1-hour view, use 1-minute aggregation for better granularity
      query = `
        WITH time_buckets AS (
          SELECT 
            EXTRACT(EPOCH FROM DATE_TRUNC('minute', TO_TIMESTAMP(timestamp / 1000))) * 1000 as timestamp,
            AVG(markpx::numeric) as mark_price,
            AVG(oraclepx::numeric) as oracle_price,
            AVG(midpx::numeric) as mid_price,
            AVG(funding::numeric) as funding_rate_pct,
            AVG(markpx::numeric * openinterest::numeric) as open_interest,
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
            (ARRAY_AGG(dayntlvlm::numeric ORDER BY timestamp DESC))[1] as volume_24h,
            null as total_depth_5pct,
            null as total_depth_10pct,
            AVG(premium::numeric) as premium,
            MIN(coin) as coin
          FROM ${fullTableName}
          WHERE TO_TIMESTAMP(timestamp / 1000) >= NOW() - INTERVAL '1 hour'
            AND coin = $1
          GROUP BY DATE_TRUNC('minute', TO_TIMESTAMP(timestamp / 1000))
        )
        SELECT * FROM time_buckets
        ORDER BY timestamp ASC
      `
      
      // Add coin parameter
      values.push(coin)
      console.log(`Time filter: last 1 hour with 1-minute aggregation`)
    }
    
    console.log(`Executing query for timeWindow: ${timeWindow}`)
    console.log('Query:', query.substring(0, 200) + '...')
    console.log('Values:', values)
    
    // Add timeout wrapper for the query (longer timeout for all-time queries)
    const queryPromise = client.query(query, values)
    const timeoutDuration = isAllTime ? 30000 : 10000 // 30s for all-time, 10s for others
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Query timeout after ${timeoutDuration/1000} seconds`)), timeoutDuration)
    })
    
    const result = await Promise.race([queryPromise, timeoutPromise]) as any
    
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
      console.log(`[${timeWindow}] Returning ${processedData.length} records`)
      
      // Safely handle timestamp logging
      try {
        const timestamps = processedData
          .map((d: any) => d.timestamp)
          .filter((t: any) => t != null && !isNaN(t))
          .sort()
        
        if (timestamps.length > 0) {
          const firstTimestamp = new Date(processedData[0].timestamp)
          const lastTimestamp = new Date(processedData[processedData.length - 1].timestamp)
          const timeSpanHours = (processedData[processedData.length - 1].timestamp - processedData[0].timestamp) / (1000 * 60 * 60)
          const timeSpanDays = timeSpanHours / 24
          
          console.log(`[${timeWindow}] Time range: ${firstTimestamp.toISOString()} to ${lastTimestamp.toISOString()}`)
          console.log(`[${timeWindow}] Data spans ${timeSpanHours.toFixed(1)} hours (${timeSpanDays.toFixed(1)} days)`)
          console.log(`[${timeWindow}] Oldest data is ${((Date.now() - processedData[0].timestamp) / (1000 * 60 * 60)).toFixed(1)} hours ago from now`)
          
          if (isAllTime) {
            console.log(`[${timeWindow}] 📊 ALL TIME DATA: Fetched complete history from ${firstTimestamp.toISOString().split('T')[0]} to ${lastTimestamp.toISOString().split('T')[0]}`)
          }
        }
      } catch (err) {
        console.log(`[${timeWindow}] Could not parse timestamps for debugging`)
      }
    } else {
      console.log(`[${timeWindow}] Returning 0 records`)
    }
    
    // Cache the processed data
    dataCache.set(timeWindow, coin, processedData, timeWindow !== '1h')

    return NextResponse.json({
      success: true,
      data: processedData,
      count: processedData.length,
      sampled: timeWindow !== '1h', // All except 1h use sampling
      cached: false
    })

  } catch (error: any) {
    console.error('Database error:', error)
    
    // Handle specific error types
    if (error.message?.includes('does not exist') || error.code === '42P01') {
      return NextResponse.json({
        success: false,
        error: `Market data table not found for ${coin}. This market may not be available yet.`,
        code: 'TABLE_NOT_FOUND'
      }, { status: 404 })
    }
    
    if (error.message?.includes('timeout') || error.message?.includes('Query timeout')) {
      return NextResponse.json({
        success: false,
        error: 'Database query timed out. Please try again or select a shorter time range.',
        code: 'QUERY_TIMEOUT'
      }, { status: 408 })
    }
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Database error occurred',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  } finally {
    // Release client back to the pool (don't end it)
    if (client) {
      try {
        client.release()
      } catch (e) {
        console.error('Error releasing client back to pool:', e)
      }
    }
  }
}
