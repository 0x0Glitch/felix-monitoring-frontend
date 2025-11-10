import { NextResponse } from 'next/server'
import { Client } from 'pg'

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

export async function GET() {
  let client: Client | null = null
  
  try {
    // Test database connection
    client = createClient()
    await client.connect()
    
    // Run a simple query to verify connectivity
    const result = await client.query(`
      SELECT COUNT(*) as count 
      FROM market_data.flxn_tsla_data 
      WHERE TO_TIMESTAMP(timestamp / 1000) > NOW() - INTERVAL '1 minute'
        AND coin = 'flxn:TSLA'
    `)
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
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
