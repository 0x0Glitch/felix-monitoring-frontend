import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import { SCHEMA_NAME, TABLE_NAME } from "@/lib/supabase";

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
  const marketParam = params.market.toUpperCase();
  // Convert to match database format: flxn:TSLA (lowercase dex, uppercase symbol)
  const market = marketParam.toLowerCase().startsWith('flxn:') 
    ? 'flxn:' + marketParam.split(':')[1] 
    : marketParam;

  console.log(`[Liquidations API] Fetching data for market: ${market}`);

  const client = createClient();
  
  try {
    await client.connect();
    // Market is already in correct format from above conversion
    const marketForQuery = market;
    
    const priceResult = await client.query(
      `SELECT markpx::numeric as mark_price 
       FROM ${SCHEMA_NAME}.${TABLE_NAME}
       WHERE coin = $1 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [marketForQuery]
    );
    
    if (!priceResult.rows.length) {
      return NextResponse.json(
        { error: "Market price not found" },
        { status: 404 }
      );
    }

    const currentPrice = parseFloat(priceResult.rows[0].mark_price);
    
    // Convert market name like "FLXN:TSLA" to "flxn_tsla_positions"
    const tableMarket = market.toLowerCase().replace(':', '_');
    const positionsTableName = `user_positions.${tableMarket}_positions`;
    const tableNameOnly = `${tableMarket}_positions`;
    
    const tableExistsResult = await client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'user_positions' 
        AND table_name = $1
      )`,
      [tableNameOnly]
    );
    
    if (!tableExistsResult.rows[0].exists) {
      console.log(`[Liquidations API] Table ${tableNameOnly} does not exist in user_positions schema`);
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
