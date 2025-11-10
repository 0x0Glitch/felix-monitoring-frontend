#!/usr/bin/env node
import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function debugTables() {
  const pool = new Pool({
    connectionString: process.env.NEXT_PUBLIC_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    statement_timeout: 60000,
  })

  try {
    console.log('🔍 Debugging table structure and data...\n')

    // Check all schemas
    const schemas = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name IN ('market_data', 'user_positions')
      ORDER BY schema_name
    `)
    
    console.log('📂 Available schemas:')
    schemas.rows.forEach(row => console.log(`  - ${row.schema_name}`))

    // Check all tables with FLXN/TSLA in both schemas
    const allTables = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema IN ('market_data', 'user_positions')
      AND (table_name LIKE '%flxn%' OR table_name LIKE '%tsla%')
      ORDER BY table_schema, table_name
    `)
    
    console.log('\n📋 All FLXN/TSLA tables:')
    if (allTables.rows.length > 0) {
      allTables.rows.forEach(row => {
        console.log(`  - ${row.table_schema}.${row.table_name}`)
      })
    } else {
      console.log('  ❌ No FLXN/TSLA tables found!')
    }

    // Check data in each table found
    for (const table of allTables.rows) {
      const fullTableName = `${table.table_schema}.${table.table_name}`
      console.log(`\n📊 Checking data in ${fullTableName}:`)
      
      try {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${fullTableName}`)
        const count = countResult.rows[0].count
        console.log(`  📈 Total records: ${count}`)
        
        if (count > 0) {
          const sampleResult = await pool.query(`
            SELECT address, market, position_size, leverage_type, leverage_value 
            FROM ${fullTableName} 
            LIMIT 3
          `)
          
          console.log('  📋 Sample records:')
          sampleResult.rows.forEach(row => {
            console.log(`    ${row.address?.substring(0,10)}...: ${row.position_size} (${row.leverage_type} ${row.leverage_value}x)`)
          })
        }
      } catch (err: any) {
        console.log(`  ❌ Error querying table: ${err.message}`)
      }
    }

    // Test the exact API query that frontend uses
    console.log('\n🔧 Testing frontend API query...')
    const market = 'FLXN:TSLA'
    const tableMarket = market.toLowerCase().replace(':', '_')
    const tableName = `user_positions.${tableMarket}_positions`
    const tableNameOnly = `${tableMarket}_positions`
    
    console.log(`Looking for table: ${tableName}`)
    console.log(`Table name only: ${tableNameOnly}`)
    
    const tableExistsResult = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'user_positions' 
        AND table_name = $1
      )`,
      [tableNameOnly]
    )
    
    console.log(`Table exists: ${tableExistsResult.rows[0].exists}`)
    
    if (tableExistsResult.rows[0].exists) {
      const dataResult = await pool.query(`
        SELECT COUNT(*) as count FROM ${tableName}
        WHERE market = $1
      `, [market])
      
      console.log(`Records for market '${market}': ${dataResult.rows[0].count}`)
    }

  } catch (err) {
    console.error('❌ Debug failed:', err)
  } finally {
    await pool.end()
  }
}

debugTables().catch(console.error)
