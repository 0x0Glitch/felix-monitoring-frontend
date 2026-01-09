import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getMarketTableNames, normalizeMarketId } from "@/lib/markets";

// Simple cache for positions data
const positionsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds cache for positions (balance freshness vs performance)

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ market: string }> }
) {
  const params = await context.params;
  let market = decodeURIComponent(params.market);
  
  // Normalize market format: lowercase dex prefix, uppercase market symbol
  if (market.includes(':')) {
    const parts = market.split(':');
    market = parts[0].toLowerCase() + ':' + (parts[1] || '').toUpperCase();
  } else {
    market = market.toUpperCase();
  }
    
  // Get schema and table based on market
  const normalizedMarket = normalizeMarketId(market);
  const { userPositionsSchema, userPositionsTable } = getMarketTableNames(normalizedMarket);

  // Check cache first
  const cacheKey = normalizedMarket;
  const cached = positionsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Positions API] CACHE HIT for ${normalizedMarket}`);
    return NextResponse.json(cached.data);
  }

  console.log(`[Positions API] CACHE MISS - Fetching positions for market: ${normalizedMarket}`);
  console.log(`[Positions API] Using table: ${userPositionsSchema}.${userPositionsTable}`);

  const pool = getPool();
  let client;

  try {
    client = await pool.connect();
    // Use configured table name
    const tableName = `${userPositionsSchema}.${userPositionsTable}`;
    const tableNameOnly = userPositionsTable;
    
    const tableExistsResult = await client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 
        AND table_name = $2
      )`,
      [userPositionsSchema, tableNameOnly]
    );
    
    if (!tableExistsResult.rows[0].exists) {
      console.log(`[Positions API] Table ${tableNameOnly} does not exist in ${userPositionsSchema} schema`);
      return NextResponse.json({
        positions: [],
        count: 0,
        timestamp: new Date().toISOString(),
        message: `Positions table for ${normalizedMarket} not available`
      });
    }
    
    console.log(`[Positions API] Table found: ${tableName}, querying positions...`);
    
    // Add timeout wrapper for the query
    const queryPromise = client.query(
      `SELECT 
        address,
        market,
        position_size,
        entry_price,
        liquidation_price,
        margin_used,
        position_value,
        unrealized_pnl,
        return_on_equity,
        leverage_type,
        leverage_value,
        leverage_raw_usd,
        account_value,
        total_margin_used,
        withdrawable,
        last_updated AT TIME ZONE 'UTC' as last_updated,
        created_at AT TIME ZONE 'UTC' as created_at
      FROM ${tableName}
      WHERE market = $1
      ORDER BY ABS(position_size) DESC
      LIMIT 1000`,
      [normalizedMarket]
    )
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout after 15 seconds')), 15000)
    })
    
    const result = await Promise.race([queryPromise, timeoutPromise]) as any

    console.log(`[Positions API] Found ${result.rowCount} positions`);

    const response = {
      positions: result.rows,
      count: result.rowCount || 0,
      timestamp: new Date().toISOString()
    };

    // Cache the result
    positionsCache.set(cacheKey, { data: response, timestamp: Date.now() });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching positions:", error);
    
    if (error instanceof Error && error.message.includes('does not exist')) {
      return NextResponse.json({
        positions: [],
        count: 0,
        timestamp: new Date().toISOString(),
        message: `Positions table for ${normalizedMarket} not available`
      });
    }
    
    if (error instanceof Error && error.message.includes('timeout')) {
      return NextResponse.json({
        positions: [],
        count: 0,
        timestamp: new Date().toISOString(),
        error: 'Query timed out. Please try again.'
      }, { status: 408 });
    }
    
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    );
  } finally {
    if (client) {
      try {
        client.release();
      } catch (e) {
        console.error('Error releasing client back to pool:', e);
      }
    }
  }
}
