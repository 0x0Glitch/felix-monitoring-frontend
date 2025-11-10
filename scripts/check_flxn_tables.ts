import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

async function checkTables() {
  const pool = new Pool({
    connectionString: process.env.NEXT_PUBLIC_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    statement_timeout: 60000,
  })

  try {
    console.log('Checking database tables for FLXN:TSLA...\n')

    // Check market_data tables
    const marketResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'market_data' 
      AND (table_name LIKE '%flxn%' OR table_name LIKE '%tsla%')
      ORDER BY table_name
    `)
    
    console.log('=== Market Data Tables ===')  
    if (marketResult.rows.length > 0) {
      marketResult.rows.forEach(row => console.log(`- ${row.table_name}`))
    } else {
      console.log('No FLXN/TSLA tables found in market_data schema')
    }

    // Check if flxn_tsla_data table exists and has data
    try {
      const dataCountResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM market_data.flxn_tsla_data
        WHERE coin = 'flxn:TSLA'
      `)
      console.log(`\nData count in flxn_tsla_data: ${dataCountResult.rows[0].count}`)

      // Get recent data sample
      const recentData = await pool.query(`
        SELECT timestamp, markpx, oraclepx, openinterest
        FROM market_data.flxn_tsla_data
        WHERE coin = 'flxn:TSLA'
        ORDER BY timestamp DESC
        LIMIT 5
      `)
      
      if (recentData.rows.length > 0) {
        console.log('\nMost recent data entries:')
        recentData.rows.forEach(row => {
          console.log(`  ${row.timestamp}: price=$${row.markpx}, OI=${row.openinterest}`)
        })
      }
    } catch (err: any) {
      console.log('Table flxn_tsla_data does not exist or error:', err.message)
    }

    // Check user_positions tables (new schema)
    const userResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'user_positions' 
      AND (table_name LIKE '%flxn%' OR table_name LIKE '%tsla%')
      ORDER BY table_name
    `)
    
    console.log('\n=== User Positions Tables ===')
    if (userResult.rows.length > 0) {
      userResult.rows.forEach(row => console.log(`- ${row.table_name}`))
    } else {
      console.log('No FLXN/TSLA tables found in user_positions schema')
    }

    // Check if flxn_tsla_positions table exists
    const positionsExist = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'user_positions' 
        AND table_name = 'flxn_tsla_positions'
      ) as exists
    `)
    
    console.log(`\nflxn_tsla_positions table exists: ${positionsExist.rows[0].exists}`)

    if (positionsExist.rows[0].exists) {
      const posCount = await pool.query(`
        SELECT COUNT(*) as count FROM user_positions.flxn_tsla_positions
      `)
      console.log(`Position count: ${posCount.rows[0].count}`)

      // Get sample positions
      const samplePos = await pool.query(`
        SELECT address, market, position_size, leverage_value
        FROM user_positions.flxn_tsla_positions
        LIMIT 5
      `)
      
      if (samplePos.rows.length > 0) {
        console.log('\nSample positions:')
        samplePos.rows.forEach(row => {
          console.log(`  ${row.address.substring(0,10)}...: ${row.position_size} @ ${row.leverage_value}x`)
        })
      }
    }

  } catch (err) {
    console.error('Error:', err)
  } finally {
    await pool.end()
  }
}

checkTables().catch(console.error)
