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

interface LiquidationPoint {
  price: number;
  longLiquidations: number;
  shortLiquidations: number;
  cumulativeLongs: number;
  cumulativeShorts: number;
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

  console.log(`[Liquidations API] Fetching data for market: ${market}`);

  const client = createClient();
  
  try {
    await client.connect();
    
    const priceResult = await client.query(
      `SELECT markpx::numeric as mark_price 
       FROM ${MARKET_CONFIG.marketSchema}.${MARKET_CONFIG.marketTable}
       WHERE coin = $1 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [market]
    );
    
    if (!priceResult.rows.length) {
      return NextResponse.json(
        { error: "Market price not found" },
        { status: 404 }
      );
    }

    const currentPrice = parseFloat(priceResult.rows[0].mark_price);
    
    // Use configured table name
    const positionsTableName = `${userPositionsSchema}.${userPositionsTable}`;
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
      console.log(`[Liquidations API] Table ${tableNameOnly} does not exist in ${userPositionsSchema} schema`);
      return NextResponse.json({
        currentPrice,
        points: [],
        totalPositions: 0,
        timestamp: new Date().toISOString(),
        message: `Positions table for ${market} not available`
      });
    }
    
    console.log(`[Liquidations API] Table found: ${positionsTableName}, querying positions...`);
    
    const positionsResult = await client.query(
      `SELECT 
        position_size,
        liquidation_price
      FROM ${positionsTableName}
      WHERE market = $1 
        AND liquidation_price IS NOT NULL
        AND position_size != 0`,
      [market]
    );
    
    console.log(`[Liquidations API] Found ${positionsResult.rowCount} positions`);

    const minPrice = 0;
    const maxPrice = currentPrice * 2;
    const numBuckets = 100;
    const bucketSize = (maxPrice - minPrice) / numBuckets;
    
    const liquidationData: Map<number, { longs: number, shorts: number }> = new Map();
    
    for (let i = 0; i <= numBuckets; i++) {
      const price = minPrice + i * bucketSize;
      liquidationData.set(price, { longs: 0, shorts: 0 });
    }

    positionsResult.rows.forEach(row => {
      const positionSize = Math.abs(parseFloat(row.position_size));
      const liquidationPrice = parseFloat(row.liquidation_price);
      const isLong = parseFloat(row.position_size) > 0;

      const bucketIndex = Math.floor((liquidationPrice - minPrice) / bucketSize);
      const bucketPrice = minPrice + bucketIndex * bucketSize;
      
      if (bucketPrice >= minPrice && bucketPrice <= maxPrice) {
        const bucket = liquidationData.get(bucketPrice);
        if (bucket) {
          if (isLong) {
            bucket.longs += positionSize;
          } else {
            bucket.shorts += positionSize;
          }
        }
      }
    });

    const points: LiquidationPoint[] = [];
    let cumulativeLongs = 0;
    let cumulativeShorts = 0;
    
    const sortedPrices = Array.from(liquidationData.keys()).sort((a, b) => a - b);
    
    const cumulativeShortsMap = new Map<number, number>();
    sortedPrices.forEach(price => {
      const data = liquidationData.get(price)!;
      cumulativeShorts += data.shorts;
      cumulativeShortsMap.set(price, cumulativeShorts);
    });

    const cumulativeLongsMap = new Map<number, number>();
    cumulativeLongs = 0;
    [...sortedPrices].reverse().forEach(price => {
      const data = liquidationData.get(price)!;
      cumulativeLongs += data.longs;
      cumulativeLongsMap.set(price, cumulativeLongs);
    });

    sortedPrices.forEach(price => {
      const data = liquidationData.get(price)!;
      points.push({
        price,
        longLiquidations: data.longs,
        shortLiquidations: data.shorts,
        cumulativeLongs: cumulativeLongsMap.get(price) || 0,
        cumulativeShorts: cumulativeShortsMap.get(price) || 0
      });
    });

    return NextResponse.json({
      currentPrice,
      points,
      totalPositions: positionsResult.rowCount || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching liquidation data:", error);
    
    if (error instanceof Error && error.message.includes('does not exist')) {
      return NextResponse.json({
        currentPrice: 0,
        points: [],
        totalPositions: 0,
        timestamp: new Date().toISOString(),
        message: `Positions table for ${market} not available`
      });
    }
    
    return NextResponse.json(
      { error: "Failed to fetch liquidation data" },
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
