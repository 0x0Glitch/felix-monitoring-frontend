/**
 * Dynamic Database Index Generator
 *
 * This script generates SQL for creating indexes based on markets.ts configuration.
 * Run this whenever you add new markets to automatically generate the required indexes.
 *
 * Usage:
 *   npx tsx scripts/generate-db-indexes.ts
 *   npx tsx scripts/generate-db-indexes.ts > db-indexes.sql
 */

import { AVAILABLE_MARKETS } from '../lib/markets'

function generateIndexSQL(): string {
  const sql: string[] = []

  sql.push('-- Auto-generated Database Indexes')
  sql.push('-- Generated from markets.ts configuration')
  sql.push(`-- Generated at: ${new Date().toISOString()}`)
  sql.push('-- Run this script on your PostgreSQL database to create all required indexes')
  sql.push('')
  sql.push('-- ============================================================================')
  sql.push('-- MARKET DATA TABLES INDEXES')
  sql.push('-- ============================================================================')
  sql.push('')

  // Generate indexes for each market
  AVAILABLE_MARKETS.forEach((market) => {
    const { marketSchema, marketTable } = market
    const fullTableName = `${marketSchema}.${marketTable}`

    sql.push(`-- Indexes for ${market.id} (${market.name})`)

    // Timestamp index (most critical for time-based queries)
    sql.push(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_${marketTable}_timestamp`,
      `ON ${fullTableName} (timestamp DESC);`
    )
    sql.push('')

    // Composite index for coin + timestamp (for filtered queries)
    sql.push(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_${marketTable}_coin_timestamp`,
      `ON ${fullTableName} (coin, timestamp DESC);`
    )
    sql.push('')

    // Index for time range queries (commonly used in WHERE clauses)
    sql.push(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_${marketTable}_time_range`,
      `ON ${fullTableName} (coin, TO_TIMESTAMP(timestamp / 1000));`
    )
    sql.push('')
  })

  sql.push('-- ============================================================================')
  sql.push('-- USER POSITIONS TABLES INDEXES')
  sql.push('-- ============================================================================')
  sql.push('')

  AVAILABLE_MARKETS.forEach((market) => {
    const { userPositionsSchema, userPositionsTable } = market
    const fullTableName = `${userPositionsSchema}.${userPositionsTable}`

    sql.push(`-- Indexes for ${market.id} positions`)

    // Market + position_size index (used for sorting positions)
    sql.push(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_${userPositionsTable}_market_size`,
      `ON ${fullTableName} (market, ABS(position_size) DESC);`
    )
    sql.push('')

    // Address index (for user lookups)
    sql.push(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_${userPositionsTable}_address`,
      `ON ${fullTableName} (address);`
    )
    sql.push('')

    // Last updated index (for freshness checks)
    sql.push(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_${userPositionsTable}_last_updated`,
      `ON ${fullTableName} (last_updated DESC);`
    )
    sql.push('')
  })

  sql.push('-- ============================================================================')
  sql.push('-- ANALYZE TABLES FOR QUERY PLANNER')
  sql.push('-- ============================================================================')
  sql.push('')
  sql.push('-- Update statistics for the query planner to make better decisions')

  AVAILABLE_MARKETS.forEach((market) => {
    sql.push(`ANALYZE ${market.marketSchema}.${market.marketTable};`)
    sql.push(`ANALYZE ${market.userPositionsSchema}.${market.userPositionsTable};`)
  })

  sql.push('')
  sql.push('-- ============================================================================')
  sql.push('-- VERIFY INDEXES')
  sql.push('-- ============================================================================')
  sql.push('')
  sql.push('-- Query to verify all indexes were created successfully')
  sql.push('SELECT')
  sql.push('    schemaname,')
  sql.push('    tablename,')
  sql.push('    indexname,')
  sql.push('    indexdef')
  sql.push('FROM pg_indexes')
  sql.push(`WHERE schemaname IN ('market_data', 'user_positions')`)
  sql.push('ORDER BY schemaname, tablename, indexname;')

  return sql.join('\n')
}

// Main execution
const indexSQL = generateIndexSQL()
console.log(indexSQL)

// Also provide summary
console.error('\n=== Index Generation Summary ===')
console.error(`Total markets: ${AVAILABLE_MARKETS.length}`)
console.error(`Indexes per market: ~6 (3 for market data + 3 for positions)`)
console.error(`Total indexes to create: ~${AVAILABLE_MARKETS.length * 6}`)
console.error('\nTo apply these indexes:')
console.error('  1. npx tsx scripts/generate-db-indexes.ts > db-indexes.sql')
console.error('  2. psql -f db-indexes.sql YOUR_DATABASE_URL')
console.error('  or run the SQL output directly in your database client')
