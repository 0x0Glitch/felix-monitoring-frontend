#!/usr/bin/env node
import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function migrateUserPositions() {
  const pool = new Pool({
    connectionString: process.env.NEXT_PUBLIC_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    statement_timeout: 60000,
  })

  try {
    console.log('Starting user positions migration...\n')

    // Create the user_positions schema
    await pool.query('CREATE SCHEMA IF NOT EXISTS user_positions')
    console.log('✅ Created user_positions schema')

    // Create the new table structure
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS user_positions.flxn_tsla_positions (
        address character varying(42) NOT NULL,
        market character varying(20) NULL,
        position_size numeric NULL,
        entry_price numeric NULL,
        liquidation_price numeric NULL,
        margin_used numeric NULL,
        position_value numeric NULL,
        unrealized_pnl numeric NULL,
        return_on_equity numeric NULL,
        leverage_type character varying(10) NULL,
        leverage_value integer NULL,
        leverage_raw_usd numeric NULL,
        account_value numeric NULL,
        total_margin_used numeric NULL,
        withdrawable numeric NULL,
        last_updated timestamp without time zone NULL DEFAULT NOW(),
        created_at timestamp without time zone NULL DEFAULT NOW(),
        CONSTRAINT flxn_tsla_positions_pkey PRIMARY KEY (address)
      )
    `
    await pool.query(createTableQuery)
    console.log('✅ Created flxn_tsla_positions table')

    // Create index
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_flxn_tsla_positions_updated 
      ON user_positions.flxn_tsla_positions USING btree (last_updated)
    `
    await pool.query(createIndexQuery)
    console.log('✅ Created index on last_updated')

    // Check if old table exists and migrate data
    const oldTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'user_metrics' 
        AND table_name = 'flxn_tsla_live_positions'
      ) as exists
    `)

    if (oldTableExists.rows[0].exists) {
      console.log('\n📋 Found old table, checking for data to migrate...')
      
      const oldDataCount = await pool.query('SELECT COUNT(*) as count FROM user_metrics.flxn_tsla_live_positions')
      console.log(`Old table has ${oldDataCount.rows[0].count} records`)

      if (parseInt(oldDataCount.rows[0].count) > 0) {
        console.log('🔄 Migrating data...')
        
        // Migrate data with proper column mapping
        const migrateQuery = `
          INSERT INTO user_positions.flxn_tsla_positions (
            address, market, position_size, entry_price, liquidation_price,
            margin_used, position_value, unrealized_pnl, return_on_equity,
            leverage_type, leverage_value, leverage_raw_usd,
            account_value, total_margin_used, withdrawable, last_updated, created_at
          )
          SELECT 
            address, market, position_size, entry_price, liquidation_price,
            margin_used, position_value, unrealized_pnl, return_on_equity,
            leverage_type, leverage_value, leverage_raw_usd,
            account_value, total_margin_used, withdrawable, 
            COALESCE(last_updated, NOW()), COALESCE(created_at, NOW())
          FROM user_metrics.flxn_tsla_live_positions 
          ON CONFLICT (address) DO UPDATE SET
            market = EXCLUDED.market,
            position_size = EXCLUDED.position_size,
            entry_price = EXCLUDED.entry_price,
            liquidation_price = EXCLUDED.liquidation_price,
            margin_used = EXCLUDED.margin_used,
            position_value = EXCLUDED.position_value,
            unrealized_pnl = EXCLUDED.unrealized_pnl,
            return_on_equity = EXCLUDED.return_on_equity,
            leverage_type = EXCLUDED.leverage_type,
            leverage_value = EXCLUDED.leverage_value,
            leverage_raw_usd = EXCLUDED.leverage_raw_usd,
            account_value = EXCLUDED.account_value,
            total_margin_used = EXCLUDED.total_margin_used,
            withdrawable = EXCLUDED.withdrawable,
            last_updated = EXCLUDED.last_updated
        `
        
        const result = await pool.query(migrateQuery)
        console.log(`✅ Migrated ${result.rowCount} records`)
      }
    } else {
      console.log('\n📋 No old table found, starting fresh')
    }

    // Verify new table
    const newTableCount = await pool.query('SELECT COUNT(*) as count FROM user_positions.flxn_tsla_positions')
    console.log(`\n📊 New table has ${newTableCount.rows[0].count} records`)

    // Show sample data
    const sampleData = await pool.query(`
      SELECT address, market, position_size, leverage_type, leverage_value
      FROM user_positions.flxn_tsla_positions
      LIMIT 3
    `)

    if (sampleData.rows.length > 0) {
      console.log('\n📋 Sample data:')
      sampleData.rows.forEach(row => {
        console.log(`  ${row.address.substring(0,10)}...: ${row.position_size} (${row.leverage_type} ${row.leverage_value}x)`)
      })
    }

    console.log('\n🎉 Migration completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Restart your felix user monitoring service to use the new table')
    console.log('2. Test the frontend to ensure it shows position data correctly')

  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrateUserPositions().catch(console.error)
