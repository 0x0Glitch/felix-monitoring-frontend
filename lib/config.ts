// Market configuration - all values from environment variables, no hardcoded defaults
export const MARKET_CONFIG = {
  defaultMarket: process.env.NEXT_PUBLIC_DEFAULT_MARKET!,
  marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA!,
  marketTable: process.env.NEXT_PUBLIC_MARKET_TABLE!,
  userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA!,
  userPositionsTable: process.env.NEXT_PUBLIC_USER_POSITIONS_TABLE!,
};
