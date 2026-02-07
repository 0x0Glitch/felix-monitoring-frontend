// Market configuration for multi-market monitoring
export interface Market {
  id: string;           // Unique identifier (e.g., "lit:BTC", "xyz:TSLA", "BTC" for hl)
  name: string;         // Display name (e.g., "TSLA")
  dex: string;          // DEX prefix (e.g., "lit", "xyz", "hl")
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
  // --------------------
  // Lighter (lit)
  // --------------------
  {
    id: "lit:HYPE",
    name: "HYPE",
    dex: "lit",
    symbol: "HYPE",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "lit_hype_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "lit_hype_positions",
    logo: "hype",
    color: "#76B900"
  },
  {
    id: "lit:SOL",
    name: "SOL",
    dex: "lit",
    symbol: "SOL",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "lit_sol_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "lit_sol_positions",
    logo: "sol",
    color: "#76B900"
  },
  {
    id: "lit:BTC",
    name: "BTC",
    dex: "lit",
    symbol: "BTC",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "lit_btc_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "lit_btc_positions",
    logo: "btc",
    color: "#76B900"
  },
  {
    id: "lit:ETH",
    name: "ETH",
    dex: "lit",
    symbol: "ETH",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "lit_eth_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "lit_eth_positions",
    logo: "eth",
    color: "#76B900"
  },
  {
    id: "lit:PAXG",
    name: "PAXG",
    dex: "lit",
    symbol: "PAXG",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "lit_paxg_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "lit_paxg_positions",
    logo: "paxg",
    color: "#76B900"
  },
  {
    id: "lit:XAG",
    name: "XAG",
    dex: "lit",
    symbol: "XAG",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "lit_xag_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "lit_xag_positions",
    logo: "xag",
    color: "#76B900"
  },
  {
    id: "lit:XAU",
    name: "XAU",
    dex: "lit",
    symbol: "XAU",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "lit_xau_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "lit_xau_positions",
    logo: "xau",
    color: "#76B900"
  },

  // --------------------
  // XYZ
  // --------------------
  {
    id: "xyz:COIN",
    name: "COIN",
    dex: "xyz",
    symbol: "COIN",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "xyz_coin_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "xyz_coin_positions",
    logo: "coin",
    color: "#76B900"
  },
  {
    id: "xyz:COPPER",
    name: "COPPER",
    dex: "xyz",
    symbol: "COPPER",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "xyz_copper_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "xyz_copper_positions",
    logo: "copper",
    color: "#76B900"
  },
  {
    id: "xyz:CRCL",
    name: "CRCL",
    dex: "xyz",
    symbol: "CRCL",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "xyz_crcl_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "xyz_crcl_positions",
    logo: "Circle.png",
    color: "#76B900"
  },
  {
    id: "xyz:GOLD",
    name: "GOLD",
    dex: "xyz",
    symbol: "GOLD",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "xyz_gold_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "xyz_gold_positions",
    logo: "goldy",
    color: "#76B900"
  },
  {
    id: "xyz:NVDA",
    name: "NVDA",
    dex: "xyz",
    symbol: "NVDA",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "xyz_nvda_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "xyz_nvda_positions",
    logo: "nvidia",
    color: "#76B900"
  },
  {
    id: "xyz:PALLADIUM",
    name: "PALLADIUM",
    dex: "xyz",
    symbol: "PALLADIUM",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "xyz_palladium_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "xyz_palladium_positions",
    logo: "palladium",
    color: "#76B900"
  },
  {
    id: "xyz:PLATINUM",
    name: "PLATINUM",
    dex: "xyz",
    symbol: "PLATINUM",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "xyz_platinum_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "xyz_platinum_positions",
    logo: "platinum",
    color: "#76B900"
  },
  {
    id: "xyz:SILVER",
    name: "SILVER",
    dex: "xyz",
    symbol: "SILVER",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "xyz_silver_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "xyz_silver_positions",
    logo: "silver",
    color: "#76B900"
  },
  {
    id: "xyz:TSLA",
    name: "TSLA",
    dex: "xyz",
    symbol: "TSLA",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "xyz_tsla_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "xyz_tsla_positions",
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
    logo: "xyz100",
    color: "#76B900"
  },

  // --------------------
  // Hyperliquid (hl)
  // NOTE: ids have NO "hl:" prefix
  // --------------------
  {
    id: "HYPE",
    name: "HYPE",
    dex: "hl",
    symbol: "HYPE",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "hype_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "hl_hype_positions",
    logo: "hype",
    color: "#76B900"
  },
  {
    id: "SOL",
    name: "SOL",
    dex: "hl",
    symbol: "SOL",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "sol_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "hl_sol_positions",
    logo: "sol",
    color: "#76B900"
  },
  {
    id: "BTC",
    name: "BTC",
    dex: "hl",
    symbol: "BTC",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "btc_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "hl_btc_positions",
    logo: "btc",
    color: "#76B900"
  },
  {
    id: "ETH",
    name: "ETH",
    dex: "hl",
    symbol: "ETH",
    marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
    marketTable: "eth_data",
    userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions",
    userPositionsTable: "hl_eth_positions",
    logo: "eth",
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

    // If it's not dex:symbol, treat it as a raw symbol (e.g., hl markets: "BTC")
    if (!normalized.includes(':')) {
      const symbol = normalized.toLowerCase();
      return {
        marketTable: `${symbol}_data`,
        userPositionsTable: `${symbol}_positions`,
        marketSchema: process.env.NEXT_PUBLIC_MARKET_SCHEMA || "market_data",
        userPositionsSchema: process.env.NEXT_PUBLIC_USER_POSITIONS_SCHEMA || "user_positions"
      };
    }

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
    'lit': 'USDC',
    'xyz': 'USDC',
    'hl': 'USDC',
  };
  return quoteCurrencies[dex.toLowerCase()] || 'USDC';
}

// Get formatted market pair name (e.g., "TSLA-USDC")
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

