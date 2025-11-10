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
  })
}

export async function GET() {
  let client: Client | null = null
  
  try {
    client = createClient()
    await client.connect()
    
    // Check what data we have for different time ranges
    const queries = [
      {
        name: 'last_1_hour',
        query: `
          SELECT COUNT(*) as count, 
                 MIN(TO_TIMESTAMP(timestamp / 1000)) as oldest, 
                 MAX(TO_TIMESTAMP(timestamp / 1000)) as newest,
                 ((MAX(timestamp) - MIN(timestamp)) / 1000 / 3600)::numeric(10,2) as hours_span
          FROM market_data.flxn_tsla_data
          WHERE TO_TIMESTAMP(timestamp / 1000) >= (NOW() AT TIME ZONE 'UTC') - INTERVAL '1 hour'
            AND coin = 'flxn:TSLA'
        `
      },
      {
        name: 'last_24_hours',
        query: `
          SELECT COUNT(*) as count, 
                 MIN(TO_TIMESTAMP(timestamp / 1000)) as oldest, 
                 MAX(TO_TIMESTAMP(timestamp / 1000)) as newest,
                 ((MAX(timestamp) - MIN(timestamp)) / 1000 / 3600)::numeric(10,2) as hours_span
          FROM market_data.flxn_tsla_data
          WHERE TO_TIMESTAMP(timestamp / 1000) >= (NOW() AT TIME ZONE 'UTC') - INTERVAL '1 day'
            AND coin = 'flxn:TSLA'
        `
      },
      {
        name: 'all_data',
        query: `
          SELECT COUNT(*) as count, 
                 MIN(TO_TIMESTAMP(timestamp / 1000)) as oldest, 
                 MAX(TO_TIMESTAMP(timestamp / 1000)) as newest,
                 ((MAX(timestamp) - MIN(timestamp)) / 1000 / 3600)::numeric(10,2) as hours_span
          FROM market_data.flxn_tsla_data
          WHERE coin = 'flxn:TSLA'
        `
      },
      {
        name: 'current_time',
        query: `
          SELECT 
            NOW() as server_now,
            NOW() AT TIME ZONE 'UTC' as server_utc,
            timezone('UTC', NOW()) as utc_now
        `
      }
    ]
    
    const results: any = {}
    
    for (const { name, query } of queries) {
      const result = await client.query(query)
      results[name] = result.rows[0]
    }
    
    return NextResponse.json({
      status: 'success',
      results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Debug query failed:', error)
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
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
