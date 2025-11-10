import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: "postgresql://postgres.thjyshlwqvhopflremyl:rywlYAukMHjkB7dr@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  statement_timeout: 60000,
});

try {
  console.log('Checking FLXN:TSLA tables...\n');

  // Check if market_metrics table exists
  const marketCheck = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'market_metrics' 
    AND table_name = 'flxn_tsla_metrics_raw_testnet'
  `);
  
  console.log('flxn_tsla_metrics_raw_testnet exists:', marketCheck.rows.length > 0);
  
  if (marketCheck.rows.length > 0) {
    const count = await pool.query(`
      SELECT COUNT(*) as count, MAX(timestamp) as latest
      FROM market_metrics.flxn_tsla_metrics_raw_testnet
      WHERE coin = 'flxn:tsla'
    `);
    console.log('  - Record count:', count.rows[0].count);
    console.log('  - Latest entry:', count.rows[0].latest);
  }

  // Check if user_metrics table exists
  const userCheck = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'user_metrics' 
    AND table_name = 'flxn_tsla_live_positions'
  `);
  
  console.log('\nflxn_tsla_live_positions exists:', userCheck.rows.length > 0);
  
  if (userCheck.rows.length > 0) {
    const count = await pool.query(`
      SELECT COUNT(*) as count
      FROM user_metrics.flxn_tsla_live_positions
    `);
    console.log('  - Position count:', count.rows[0].count);
  }

} catch (err) {
  console.error('Error:', err.message);
} finally {
  await pool.end();
}
