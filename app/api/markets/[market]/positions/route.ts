import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import { MARKET_CONFIG } from "@/lib/config";

function createClient() {
  return new Client({
    connectionString: process.env.NEXT_PUBLIC_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
    statement_timeout: 30000,
    query_timeout: 30000,
  });
}

export async function GET(
  req: NextRequest,
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
    
  // Get schema and table from configuration
  const userPositionsSchema = MARKET_CONFIG.userPositionsSchema;
  const userPositionsTable = MARKET_CONFIG.userPositionsTable;

  console.log(`[Positions API] Fetching positions for market: ${market}`);

  const client = createClient();
  
  try {
    await client.connect();
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
        message: `Positions table for ${market} not available`
      });
    }
    
    console.log(`[Positions API] Table found: ${tableName}, querying positions...`);
    
    const result = await client.query(
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
      ORDER BY ABS(position_size) DESC`,
      [market]
    );
    
    console.log(`[Positions API] Found ${result.rowCount} positions`);

    return NextResponse.json({
      positions: result.rows,
      count: result.rowCount || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching positions:", error);
    
    if (error instanceof Error && error.message.includes('does not exist')) {
      return NextResponse.json({
        positions: [],
        count: 0,
        timestamp: new Date().toISOString(),
        message: `Positions table for ${market} not available`
      });
    }
    
    return NextResponse.json(
      { error: "Failed to fetch positions" },
      { status: 500 }
    );
  } finally {
    try {
      await client.end();
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}
