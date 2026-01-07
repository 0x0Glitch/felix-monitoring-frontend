-- Auto-generated Database Indexes
-- Generated from markets.ts configuration
-- Generated at: 2026-01-07T09:47:22.229Z
-- Run this script on your PostgreSQL database to create all required indexes

-- ============================================================================
-- MARKET DATA TABLES INDEXES
-- ============================================================================

-- Indexes for flx:TSLA (TSLA)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_tsla_data_timestamp
ON market_data.flx_tsla_data (timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_tsla_data_coin_timestamp
ON market_data.flx_tsla_data (coin, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_tsla_data_time_range
ON market_data.flx_tsla_data (coin, TO_TIMESTAMP(timestamp / 1000));

-- Indexes for flx:CRCL (CRCL)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_crcl_data_timestamp
ON market_data.flx_crcl_data (timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_crcl_data_coin_timestamp
ON market_data.flx_crcl_data (coin, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_crcl_data_time_range
ON market_data.flx_crcl_data (coin, TO_TIMESTAMP(timestamp / 1000));

-- Indexes for flx:COIN (COIN)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_coin_data_timestamp
ON market_data.flx_coin_data (timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_coin_data_coin_timestamp
ON market_data.flx_coin_data (coin, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_coin_data_time_range
ON market_data.flx_coin_data (coin, TO_TIMESTAMP(timestamp / 1000));

-- Indexes for flx:GOLD (GOLD)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_gold_data_timestamp
ON market_data.flx_gold_data (timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_gold_data_coin_timestamp
ON market_data.flx_gold_data (coin, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_gold_data_time_range
ON market_data.flx_gold_data (coin, TO_TIMESTAMP(timestamp / 1000));

-- Indexes for flx:XMR (XMR)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_xmr_data_timestamp
ON market_data.flx_xmr_data (timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_xmr_data_coin_timestamp
ON market_data.flx_xmr_data (coin, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_xmr_data_time_range
ON market_data.flx_xmr_data (coin, TO_TIMESTAMP(timestamp / 1000));

-- Indexes for flx:SILVER (SILVER)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_silver_data_timestamp
ON market_data.flx_silver_data (timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_silver_data_coin_timestamp
ON market_data.flx_silver_data (coin, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_silver_data_time_range
ON market_data.flx_silver_data (coin, TO_TIMESTAMP(timestamp / 1000));

-- ============================================================================
-- USER POSITIONS TABLES INDEXES
-- ============================================================================

-- Indexes for flx:TSLA positions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_tsla_positions_market_size
ON user_positions.flx_tsla_positions (market, ABS(position_size) DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_tsla_positions_address
ON user_positions.flx_tsla_positions (address);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_tsla_positions_last_updated
ON user_positions.flx_tsla_positions (last_updated DESC);

-- Indexes for flx:CRCL positions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_crcl_positions_market_size
ON user_positions.flx_crcl_positions (market, ABS(position_size) DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_crcl_positions_address
ON user_positions.flx_crcl_positions (address);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_crcl_positions_last_updated
ON user_positions.flx_crcl_positions (last_updated DESC);

-- Indexes for flx:COIN positions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_coin_positions_market_size
ON user_positions.flx_coin_positions (market, ABS(position_size) DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_coin_positions_address
ON user_positions.flx_coin_positions (address);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_coin_positions_last_updated
ON user_positions.flx_coin_positions (last_updated DESC);

-- Indexes for flx:GOLD positions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_gold_positions_market_size
ON user_positions.flx_gold_positions (market, ABS(position_size) DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_gold_positions_address
ON user_positions.flx_gold_positions (address);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_gold_positions_last_updated
ON user_positions.flx_gold_positions (last_updated DESC);

-- Indexes for flx:XMR positions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_xmr_positions_market_size
ON user_positions.flx_xmr_positions (market, ABS(position_size) DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_xmr_positions_address
ON user_positions.flx_xmr_positions (address);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_xmr_positions_last_updated
ON user_positions.flx_xmr_positions (last_updated DESC);

-- Indexes for flx:SILVER positions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_silver_positions_market_size
ON user_positions.flx_silver_positions (market, ABS(position_size) DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_silver_positions_address
ON user_positions.flx_silver_positions (address);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flx_silver_positions_last_updated
ON user_positions.flx_silver_positions (last_updated DESC);

-- ============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

-- Update statistics for the query planner to make better decisions
ANALYZE market_data.flx_tsla_data;
ANALYZE user_positions.flx_tsla_positions;
ANALYZE market_data.flx_crcl_data;
ANALYZE user_positions.flx_crcl_positions;
ANALYZE market_data.flx_coin_data;
ANALYZE user_positions.flx_coin_positions;
ANALYZE market_data.flx_gold_data;
ANALYZE user_positions.flx_gold_positions;
ANALYZE market_data.flx_xmr_data;
ANALYZE user_positions.flx_xmr_positions;
ANALYZE market_data.flx_silver_data;
ANALYZE user_positions.flx_silver_positions;

-- ============================================================================
-- VERIFY INDEXES
-- ============================================================================

-- Query to verify all indexes were created successfully
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname IN ('market_data', 'user_positions')
ORDER BY schemaname, tablename, indexname;
