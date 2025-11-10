-- Create the user_positions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS user_positions;

-- Create the flxn_tsla_positions table
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
) TABLESPACE pg_default;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_flxn_tsla_positions_updated 
ON user_positions.flxn_tsla_positions USING btree (last_updated) TABLESPACE pg_default;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON user_positions.flxn_tsla_positions TO your_user;
-- GRANT USAGE ON SCHEMA user_positions TO your_user;
