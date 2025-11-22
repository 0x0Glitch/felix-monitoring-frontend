import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'
import { MARKET_CONFIG } from '@/lib/config'
import { getMarketTableNames, AVAILABLE_MARKETS } from '@/lib/markets'

// Function to create a new client for each request (better for serverless)
function createClient() {
  return new Client({
    connectionString: process.env.NEXT_PUBLIC_DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
  })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const marketParam = searchParams.get('market') || AVAILABLE_MARKETS[0]?.id || 'flx:TSLA';
  let client: Client | null = null
  
  // Get table name based on market
  const { marketSchema, marketTable } = getMarketTableNames(marketParam);
  const fullTableName = `${marketSchema}.${marketTable}`
  
  try {
    // Test database connection
    client = createClient()
    await client.connect()
    
    // Run a simple query to verify connectivity
    const result = await client.query(`
      SELECT COUNT(*) as count 
      FROM ${fullTableName} 
      WHERE TO_TIMESTAMP(timestamp / 1000) > NOW() - INTERVAL '1 minute'
        -- No coin filter - checks any recent data
    `)
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      market: marketParam,
      table: fullTableName,
      recentRecords: parseInt(result.rows[0]?.count || 0),
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 503 })
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
