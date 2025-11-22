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
    id: "xyz:XYZ100",
    name: "XYZ100",
    dex: "xyz",
    symbol: "XYZ100",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "xyz_xyz100_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "xyz_xyz100_positions",
    logo: "xyz",
    color: "#6366F1"
  },
  {
    id: "flx:NVDA",
    name: "NVDA",
    dex: "flx",
    symbol: "NVDA",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "flx_nvda_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "flx_nvda_positions",
    logo: "nvidia",
    color: "#76B900"
  }
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
      marketTable: `${tablePrefix}_data`,
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
  };
  return quoteCurrencies[dex.toLowerCase()] || 'USD';
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
