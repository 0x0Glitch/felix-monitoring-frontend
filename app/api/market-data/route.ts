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

  // Normalize coin format
  if (coin.includes(':')) {
    const parts = coin.split(':')
    coin = parts[0].toLowerCase() + ':' + (parts[1] || '').toUpperCase()
  } else {
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
    client = await pool.connect()

    const normalizedCoin = normalizeMarketId(coin)
    const { marketSchema, marketTable } = getMarketTableNames(normalizedCoin)
    const fullTableName = `${marketSchema}.${marketTable}`

    console.log(`Using dynamic table for market ${normalizedCoin}: ${fullTableName}`)

    const isAllTime = timeWindow === 'all'

    let query: string
    const values: any[] = []
    const now = Date.now()

    // ULTRA-OPTIMIZED QUERIES - Direct timestamp arithmetic, no TO_TIMESTAMP conversions!
    if (isAllTime) {
      const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000)
      const bucketSize = 12 * 3600000 // 12 hours

      query = `
        SELECT
          (timestamp / ${bucketSize}) * ${bucketSize} as timestamp,
          AVG(markpx) as mark_price,
          AVG(oraclepx) as oracle_price,
          AVG(midpx) as mid_price,
          AVG(funding) as funding_rate_pct,
          AVG(markpx * openinterest) as open_interest,
          AVG((impactpxs_bid + impactpxs_ask) / 2) as meanImpactPrice,
          AVG(impactpxs_bid) as impact_px_bid,
          AVG(impactpxs_ask) as impact_px_ask,
          AVG(best_bid) as best_bid,
          AVG(best_ask) as best_ask,
          AVG(spread) as spread,
          MAX(dayntlvlm) as volume_24h,
          AVG(premium) as premium,
          AVG(bid_depth_3bps) as bid_depth_3bps,
          AVG(ask_depth_3bps) as ask_depth_3bps,
          AVG(bid_depth_7_5bps) as bid_depth_7_5bps,
          AVG(ask_depth_7_5bps) as ask_depth_7_5bps,
          AVG(bid_depth_15bps) as bid_depth_15bps,
          AVG(ask_depth_15bps) as ask_depth_15bps,
          AVG(bid_depth_20bps) as bid_depth_20bps,
          AVG(ask_depth_20bps) as ask_depth_20bps,
          AVG(bid_depth_25bps) as bid_depth_25bps,
          AVG(ask_depth_25bps) as ask_depth_25bps,
          AVG(bid_depth_3bps + ask_depth_3bps) as total_depth_3bps,
          AVG(bid_depth_7_5bps + ask_depth_7_5bps) as total_depth_7_5bps,
          AVG(bid_depth_15bps + ask_depth_15bps) as total_depth_15bps,
          AVG(bid_depth_20bps + ask_depth_20bps) as total_depth_20bps,
          AVG(bid_depth_25bps + ask_depth_25bps) as total_depth_25bps,
          MIN(coin) as coin
        FROM ${fullTableName}
        WHERE coin = $1 AND timestamp >= $2
        GROUP BY (timestamp / ${bucketSize})
        ORDER BY timestamp
        LIMIT 500
      `
      values.push(coin, ninetyDaysAgo)
    } else if (timeWindow === '30d') {
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000)
      const bucketSize = 2 * 3600000 // 2 hours

      query = `
        SELECT
          (timestamp / ${bucketSize}) * ${bucketSize} as timestamp,
          AVG(markpx) as mark_price,
          AVG(oraclepx) as oracle_price,
          AVG(midpx) as mid_price,
          AVG(funding) as funding_rate_pct,
          AVG(markpx * openinterest) as open_interest,
          AVG((impactpxs_bid + impactpxs_ask) / 2) as meanImpactPrice,
          AVG(impactpxs_bid) as impact_px_bid,
          AVG(impactpxs_ask) as impact_px_ask,
          AVG(best_bid) as best_bid,
          AVG(best_ask) as best_ask,
          AVG(spread) as spread,
          MAX(dayntlvlm) as volume_24h,
          AVG(premium) as premium,
          AVG(bid_depth_3bps) as bid_depth_3bps,
          AVG(ask_depth_3bps) as ask_depth_3bps,
          AVG(bid_depth_7_5bps) as bid_depth_7_5bps,
          AVG(ask_depth_7_5bps) as ask_depth_7_5bps,
          AVG(bid_depth_15bps) as bid_depth_15bps,
          AVG(ask_depth_15bps) as ask_depth_15bps,
          AVG(bid_depth_20bps) as bid_depth_20bps,
          AVG(ask_depth_20bps) as ask_depth_20bps,
          AVG(bid_depth_25bps) as bid_depth_25bps,
          AVG(ask_depth_25bps) as ask_depth_25bps,
          AVG(bid_depth_3bps + ask_depth_3bps) as total_depth_3bps,
          AVG(bid_depth_7_5bps + ask_depth_7_5bps) as total_depth_7_5bps,
          AVG(bid_depth_15bps + ask_depth_15bps) as total_depth_15bps,
          AVG(bid_depth_20bps + ask_depth_20bps) as total_depth_20bps,
          AVG(bid_depth_25bps + ask_depth_25bps) as total_depth_25bps,
          MIN(coin) as coin
        FROM ${fullTableName}
        WHERE coin = $1 AND timestamp >= $2
        GROUP BY (timestamp / ${bucketSize})
        ORDER BY timestamp
        LIMIT 500
      `
      values.push(coin, thirtyDaysAgo)
    } else if (timeWindow === '7d') {
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000)
      const bucketSize = 30 * 60000 // 30 minutes

      query = `
        SELECT
          (timestamp / ${bucketSize}) * ${bucketSize} as timestamp,
          AVG(markpx) as mark_price,
          AVG(oraclepx) as oracle_price,
          AVG(midpx) as mid_price,
          AVG(funding) as funding_rate_pct,
          AVG(markpx * openinterest) as open_interest,
          AVG((impactpxs_bid + impactpxs_ask) / 2) as meanImpactPrice,
          AVG(impactpxs_bid) as impact_px_bid,
          AVG(impactpxs_ask) as impact_px_ask,
          AVG(best_bid) as best_bid,
          AVG(best_ask) as best_ask,
          AVG(spread) as spread,
          MAX(dayntlvlm) as volume_24h,
          AVG(premium) as premium,
          AVG(bid_depth_3bps) as bid_depth_3bps,
          AVG(ask_depth_3bps) as ask_depth_3bps,
          AVG(bid_depth_7_5bps) as bid_depth_7_5bps,
          AVG(ask_depth_7_5bps) as ask_depth_7_5bps,
          AVG(bid_depth_15bps) as bid_depth_15bps,
          AVG(ask_depth_15bps) as ask_depth_15bps,
          AVG(bid_depth_20bps) as bid_depth_20bps,
          AVG(ask_depth_20bps) as ask_depth_20bps,
          AVG(bid_depth_25bps) as bid_depth_25bps,
          AVG(ask_depth_25bps) as ask_depth_25bps,
          AVG(bid_depth_3bps + ask_depth_3bps) as total_depth_3bps,
          AVG(bid_depth_7_5bps + ask_depth_7_5bps) as total_depth_7_5bps,
          AVG(bid_depth_15bps + ask_depth_15bps) as total_depth_15bps,
          AVG(bid_depth_20bps + ask_depth_20bps) as total_depth_20bps,
          AVG(bid_depth_25bps + ask_depth_25bps) as total_depth_25bps,
          MIN(coin) as coin
        FROM ${fullTableName}
        WHERE coin = $1 AND timestamp >= $2
        GROUP BY (timestamp / ${bucketSize})
        ORDER BY timestamp
        LIMIT 500
      `
      values.push(coin, sevenDaysAgo)
    } else if (timeWindow === '1d') {
      const oneDayAgo = now - (24 * 60 * 60 * 1000)
      const bucketSize = 10 * 60000 // 10 minutes

      query = `
        SELECT
          (timestamp / ${bucketSize}) * ${bucketSize} as timestamp,
          AVG(markpx) as mark_price,
          AVG(oraclepx) as oracle_price,
          AVG(midpx) as mid_price,
          AVG(funding) as funding_rate_pct,
          AVG(markpx * openinterest) as open_interest,
          AVG((impactpxs_bid + impactpxs_ask) / 2) as meanImpactPrice,
          AVG(impactpxs_bid) as impact_px_bid,
          AVG(impactpxs_ask) as impact_px_ask,
          AVG(best_bid) as best_bid,
          AVG(best_ask) as best_ask,
          AVG(spread) as spread,
          MAX(dayntlvlm) as volume_24h,
          AVG(premium) as premium,
          AVG(bid_depth_3bps) as bid_depth_3bps,
          AVG(ask_depth_3bps) as ask_depth_3bps,
          AVG(bid_depth_7_5bps) as bid_depth_7_5bps,
          AVG(ask_depth_7_5bps) as ask_depth_7_5bps,
          AVG(bid_depth_15bps) as bid_depth_15bps,
          AVG(ask_depth_15bps) as ask_depth_15bps,
          AVG(bid_depth_20bps) as bid_depth_20bps,
          AVG(ask_depth_20bps) as ask_depth_20bps,
          AVG(bid_depth_25bps) as bid_depth_25bps,
          AVG(ask_depth_25bps) as ask_depth_25bps,
          AVG(bid_depth_3bps + ask_depth_3bps) as total_depth_3bps,
          AVG(bid_depth_7_5bps + ask_depth_7_5bps) as total_depth_7_5bps,
          AVG(bid_depth_15bps + ask_depth_15bps) as total_depth_15bps,
          AVG(bid_depth_20bps + ask_depth_20bps) as total_depth_20bps,
          AVG(bid_depth_25bps + ask_depth_25bps) as total_depth_25bps,
          MIN(coin) as coin
        FROM ${fullTableName}
        WHERE coin = $1 AND timestamp >= $2
        GROUP BY (timestamp / ${bucketSize})
        ORDER BY timestamp
        LIMIT 300
      `
      values.push(coin, oneDayAgo)
    } else {
      // 1h default
      const oneHourAgo = now - (60 * 60 * 1000)
      const bucketSize = 2 * 60000 // 2 minutes

      query = `
        SELECT
          (timestamp / ${bucketSize}) * ${bucketSize} as timestamp,
          AVG(markpx) as mark_price,
          AVG(oraclepx) as oracle_price,
          AVG(midpx) as mid_price,
          AVG(funding) as funding_rate_pct,
          AVG(markpx * openinterest) as open_interest,
          AVG((impactpxs_bid + impactpxs_ask) / 2) as meanImpactPrice,
          AVG(impactpxs_bid) as impact_px_bid,
          AVG(impactpxs_ask) as impact_px_ask,
          AVG(best_bid) as best_bid,
          AVG(best_ask) as best_ask,
          AVG(spread) as spread,
          MAX(dayntlvlm) as volume_24h,
          AVG(premium) as premium,
          AVG(bid_depth_3bps) as bid_depth_3bps,
          AVG(ask_depth_3bps) as ask_depth_3bps,
          AVG(bid_depth_7_5bps) as bid_depth_7_5bps,
          AVG(ask_depth_7_5bps) as ask_depth_7_5bps,
          AVG(bid_depth_15bps) as bid_depth_15bps,
          AVG(ask_depth_15bps) as ask_depth_15bps,
          AVG(bid_depth_20bps) as bid_depth_20bps,
          AVG(ask_depth_20bps) as ask_depth_20bps,
          AVG(bid_depth_25bps) as bid_depth_25bps,
          AVG(ask_depth_25bps) as ask_depth_25bps,
          AVG(bid_depth_3bps + ask_depth_3bps) as total_depth_3bps,
          AVG(bid_depth_7_5bps + ask_depth_7_5bps) as total_depth_7_5bps,
          AVG(bid_depth_15bps + ask_depth_15bps) as total_depth_15bps,
          AVG(bid_depth_20bps + ask_depth_20bps) as total_depth_20bps,
          AVG(bid_depth_25bps + ask_depth_25bps) as total_depth_25bps,
          MIN(coin) as coin
        FROM ${fullTableName}
        WHERE coin = $1 AND timestamp >= $2
        GROUP BY (timestamp / ${bucketSize})
        ORDER BY timestamp
        LIMIT 100
      `
      values.push(coin, oneHourAgo)
    }

    console.log(`Executing ULTRA-OPTIMIZED query for timeWindow: ${timeWindow}`)

    // Adaptive timeout
    const timeoutDuration = timeWindow === 'all' ? 15000 : (timeWindow === '30d' ? 10000 : 5000)
    const queryPromise = client.query(query, values)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Query timeout after ${timeoutDuration/1000}s`)), timeoutDuration)
    })

    const result = await Promise.race([queryPromise, timeoutPromise]) as any

    // Convert numeric strings to numbers
    const processedData = result.rows.map((row: any) => ({
      timestamp: row.timestamp ? parseInt(row.timestamp) : null,
      mark_price: row.mark_price ? parseFloat(row.mark_price) : null,
      oracle_price: row.oracle_price ? parseFloat(row.oracle_price) : null,
      mid_price: row.mid_price ? parseFloat(row.mid_price) : null,
      best_bid: row.best_bid ? parseFloat(row.best_bid) : null,
      best_ask: row.best_ask ? parseFloat(row.best_ask) : null,
      spread: row.spread ? parseFloat(row.spread) : null,
      spread_pct: row.spread ? parseFloat(row.spread) : null,
      funding_rate_pct: row.funding_rate_pct ? parseFloat(row.funding_rate_pct) * 100 : null,
      open_interest: row.open_interest ? parseFloat(row.open_interest) : null,
      volume_24h: row.volume_24h ? parseFloat(row.volume_24h) : null,
      bid_depth_3bps: row.bid_depth_3bps ? parseFloat(row.bid_depth_3bps) : null,
      ask_depth_3bps: row.ask_depth_3bps ? parseFloat(row.ask_depth_3bps) : null,
      bid_depth_7_5bps: row.bid_depth_7_5bps ? parseFloat(row.bid_depth_7_5bps) : null,
      ask_depth_7_5bps: row.ask_depth_7_5bps ? parseFloat(row.ask_depth_7_5bps) : null,
      bid_depth_15bps: row.bid_depth_15bps ? parseFloat(row.bid_depth_15bps) : null,
      ask_depth_15bps: row.ask_depth_15bps ? parseFloat(row.ask_depth_15bps) : null,
      bid_depth_20bps: row.bid_depth_20bps ? parseFloat(row.bid_depth_20bps) : null,
      ask_depth_20bps: row.ask_depth_20bps ? parseFloat(row.ask_depth_20bps) : null,
      bid_depth_25bps: row.bid_depth_25bps ? parseFloat(row.bid_depth_25bps) : null,
      ask_depth_25bps: row.ask_depth_25bps ? parseFloat(row.ask_depth_25bps) : null,
      total_depth_3bps: row.total_depth_3bps ? parseFloat(row.total_depth_3bps) : null,
      total_depth_7_5bps: row.total_depth_7_5bps ? parseFloat(row.total_depth_7_5bps) : null,
      total_depth_15bps: row.total_depth_15bps ? parseFloat(row.total_depth_15bps) : null,
      total_depth_20bps: row.total_depth_20bps ? parseFloat(row.total_depth_20bps) : null,
      total_depth_25bps: row.total_depth_25bps ? parseFloat(row.total_depth_25bps) : null,
      meanImpactPrice: row.meanimpactprice ? parseFloat(row.meanimpactprice) : null,
      impact_px_bid: row.impact_px_bid ? parseFloat(row.impact_px_bid) : null,
      impact_px_ask: row.impact_px_ask ? parseFloat(row.impact_px_ask) : null,
      premium: row.premium ? parseFloat(row.premium) : null,
      coin: row.coin
    }))

    if (processedData.length > 0) {
      console.log(`[${timeWindow}] ⚡ ULTRA-FAST: Returned ${processedData.length} records`)
    }

    // Cache the processed data
    dataCache.set(timeWindow, coin, processedData, timeWindow !== '1h')

    return NextResponse.json({
      success: true,
      data: processedData,
      count: processedData.length,
      sampled: timeWindow !== '1h',
      cached: false
    })

  } catch (error: any) {
    console.error('Database error:', error)

    if (error.message?.includes('does not exist') || error.code === '42P01') {
      return NextResponse.json({
        success: false,
        error: `Market data table not found for ${coin}. This market may not be available yet.`,
        code: 'TABLE_NOT_FOUND'
      }, { status: 404 })
    }

    if (error.message?.includes('timeout') || error.message?.includes('Query timeout')) {
      const timeoutDuration = timeWindow === 'all' ? 15000 : (timeWindow === '30d' ? 10000 : 5000)
      console.error(`⏱️  Query timeout for ${timeWindow} - ${coin} after ${timeoutDuration/1000}s`)
      return NextResponse.json({
        success: false,
        error: `Query timeout after ${timeoutDuration/1000}s. Try a shorter time range.`,
        data: [],
        count: 0,
        timeout: true,
        code: 'QUERY_TIMEOUT'
      }, { status: 408 })
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Database error occurred',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  } finally {
    if (client) {
      try {
        client.release()
      } catch (e) {
        console.error('Error releasing client back to pool:', e)
      }
    }
  }
}
