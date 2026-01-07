import { Pool } from 'pg'

// Create a singleton connection pool
let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.NEXT_PUBLIC_DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      // Connection pool settings optimized for performance
      max: 20, // Maximum number of clients in the pool
      min: 2, // Minimum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 5000, // 5 seconds to establish connection
      statement_timeout: 30000, // 30 seconds for queries
      query_timeout: 30000, // 30 seconds query timeout

      // Enable keep-alive to prevent connection drops
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    })

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
    })

    console.log('✅ Database connection pool created')
  }

  return pool
}

// For serverless environments, gracefully close pool on shutdown
export async function closePool() {
  if (pool) {
    await pool.end()
    pool = null
    console.log('Database pool closed')
  }
}
