// Market configuration for multi-market monitoring
export interface Market {
  id: string;           // Unique identifier (e.g., "flx:TSLA")
  name: string;         // Display name (e.g., "TSLA")
  dex: string;          // DEX prefix (e.g., "flx")
  symbol: string;       // Market symbol (e.g., "TSLA")
  marketSchema: string; // Database schema for market data
  marketTable: string;  // Database table for market data
  userPositionsSchema: string; // Database schema for user positions
  userPositionsTable: string;  // Database table for user positions
  logo?: string;        // Optional logo URL or path
  color?: string;       // Brand color for the market
}

// Available markets configuration
// These can be moved to environment variables or fetched from an API
export const AVAILABLE_MARKETS: Market[] = [
  {
    id: "flx:TSLA",
    name: "TSLA",
    dex: "flx",
    symbol: "TSLA",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "flx_tsla_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "flx_tsla_positions",
    logo: "tesla",
    color: "#E82127"
  },
  {
    id: "flx:CRCL",
    name: "CRCL",
    dex: "flx",
    symbol:"CRCL",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "flx_crcl_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "flx_crcl_positions",
    logo: "Circle.png",
    color: "#76B900"
  },
  {
    id: "flx:COIN",
    name: "COIN",
    dex: "flx",
    symbol:"COIN",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "flx_coin_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "flx_coin_positions",
    logo: "coin",
    color: "#76B900"
  },
  {
    id: "flx:GOLD",
    name: "GOLD",
    dex: "flx",
    symbol: "GOLD",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "flx_gold_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "flx_gold_positions",
    logo: "goldy",
    color: "#76B900"
  },
  {
    id: "flx:XMR",
    name: "XMR",
    dex: "flx",
    symbol: "XMR",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "flx_xmr_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "flx_xmr_positions",
    logo: "xmr",
    color: "#76B900"
 },
 {
    id: "flx:SILVER",
    name: "SILVER",
    dex: "flx",
    symbol: "SILVER",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "flx_silver_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "flx_silver_positions",
    logo: "silver",
    color: "#76B900"
 },
 {
    id: "flx:OIL",
    name: "OIL",
    dex: "flx",
    symbol: "OIL",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "flx_oil_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "flx_oil_positions",
    logo: "oily",
    color: "#76B900"
 },
];

// Helper function to get market configuration by ID
export function getMarketConfig(marketId: string): Market | undefined {
  return AVAILABLE_MARKETS.find(m => m.id === marketId);
}

// Helper function to normalize market ID
export function normalizeMarketId(marketId: string): string {
  if (marketId.includes(':')) {
    const parts = marketId.split(':');
    return parts[0].toLowerCase() + ':' + (parts[1] || '').toUpperCase();
  }
  return marketId.toUpperCase();
}

// Helper function to get table names for a market
export function getMarketTableNames(marketId: string) {
  const market = getMarketConfig(normalizeMarketId(marketId));

  if (!market) {
    // Fallback to default naming convention
    const normalized = normalizeMarketId(marketId);
    const [dex, symbol] = normalized.split(':');
    const tablePrefix = `${dex}_${symbol.toLowerCase()}`;
    
    return {
      marketTable: `${tablePrefix}_data_lighter`,
      userPositionsTable: `${tablePrefix}_positions`,
      marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
      userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions"
    };
  }
  
  return {
    marketTable: market.marketTable,
    userPositionsTable: market.userPositionsTable,
    marketSchema: market.marketSchema,
    userPositionsSchema: market.userPositionsSchema
  };
}

// Get quote currency for a DEX
export function getQuoteCurrency(dex: string): string {
  const quoteCurrencies: Record<string, string> = {
    'flx': 'USDH',
    'xyz': 'USDC',
    'hl': 'USDC',
  };
  return quoteCurrencies[dex.toLowerCase()] || 'USDC';
}

// Get formatted market pair name (e.g., "TSLA-USDH", "BTC-USDC")
export function getMarketPairName(market: Market): string {
  const quote = getQuoteCurrency(market.dex);
  return `${market.symbol}-${quote}`;
}

// Get all markets (kept for backward compatibility)
export function getMarketsByCategory() {
  // Return markets grouped by DEX for backward compatibility
  const grouped: Record<string, Market[]> = {};
  
  AVAILABLE_MARKETS.forEach(market => {
    const dex = market.dex || 'other';
    if (!grouped[dex]) {
      grouped[dex] = [];
    }
    grouped[dex].push(market);
  });
  
  return grouped;
}
