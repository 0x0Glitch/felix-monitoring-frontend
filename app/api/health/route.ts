import { NextResponse } from 'next/server'
import { Client } from 'pg'
import { MARKET_CONFIG } from '@/lib/config'

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
  
  // Get table name from configuration
  const schema = MARKET_CONFIG.marketSchema
  const table = MARKET_CONFIG.marketTable
  const fullTableName = `${schema}.${table}`
  
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
