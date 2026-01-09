"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AVAILABLE_MARKETS, getMarketPairName } from '@/lib/markets';
import { TrendingUp, TrendingDown, Users, Search, BarChart3 } from 'lucide-react';
import MarketLogo from '@/components/MarketLogo';

interface MarketStats {
  totalNotional: number;
  longNotional: number;
  shortNotional: number;
  longCount: number;
  shortCount: number;
  totalCount: number;
  volume24h: number;
}

interface MarketData {
  [marketId: string]: MarketStats;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [marketData, setMarketData] = useState<MarketData>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch data for all markets with progressive loading
  useEffect(() => {
    const fetchAllMarkets = async () => {
      // Progressive loading: fetch and update one market at a time for faster initial render
      const fetchMarketData = async (market: typeof AVAILABLE_MARKETS[0]) => {
        try {
          // Fetch both endpoints in parallel for each market
          const [positionsResponse, marketDataResponse] = await Promise.all([
            fetch(`/api/markets/${encodeURIComponent(market.id)}/positions`).catch(err => {
              console.error(`Error fetching positions for ${market.id}:`, err);
              return null;
            }),
            fetch(`/api/market-data?timeWindow=1h&coin=${encodeURIComponent(market.id)}`).catch(err => {
              console.error(`Error fetching market data for ${market.id}:`, err);
              return null;
            })
          ]);

          let volume24h = 0;
          if (marketDataResponse?.ok) {
            const marketResult = await marketDataResponse.json();
            if (marketResult.success && marketResult.data.length > 0) {
              const latestData = marketResult.data[marketResult.data.length - 1];
              volume24h = latestData.volume_24h || 0;
            }
          }

          if (positionsResponse?.ok) {
            const result = await positionsResponse.json();
            const positions = result.positions || [];

            let totalNotional = 0;
            let longNotional = 0;
            let shortNotional = 0;
            let longCount = 0;
            let shortCount = 0;

            positions.forEach((pos: any) => {
              const size = parseFloat(String(pos.position_size || 0));
              const value = Math.abs(parseFloat(String(pos.position_value || 0)));

              totalNotional += value;
              if (size > 0) {
                longNotional += value;
                longCount++;
              } else if (size < 0) {
                shortNotional += value;
                shortCount++;
              }
            });

            return {
              marketId: market.id,
              stats: {
                totalNotional,
                longNotional,
                shortNotional,
                longCount,
                shortCount,
                totalCount: positions.length,
                volume24h
              }
            };
          }
        } catch (error) {
          console.error(`Error fetching data for ${market.id}:`, error);
        }
        return null;
      };

      // Fetch all markets in parallel (not in batches) for maximum speed
      // Connection pooling and caching will handle the load
      let completedCount = 0;
      const promises = AVAILABLE_MARKETS.map(async (market) => {
        const result = await fetchMarketData(market);
        if (result) {
          // Update state immediately as each market loads (progressive rendering)
          setMarketData(prev => ({
            ...prev,
            [result.marketId]: result.stats
          }));
        }
        completedCount++;
        // Mark as not loading after first 3 markets load for better perceived speed
        if (completedCount === 3) {
          setLoading(false);
        }
        return result;
      });

      // Wait for all to complete
      await Promise.all(promises);
      setLoading(false);
    };

    // Initial load
    fetchAllMarkets();

    // Refresh every 30 seconds
    const interval = setInterval(fetchAllMarkets, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter markets based on search
  const filteredMarkets = searchQuery
    ? AVAILABLE_MARKETS.filter(market =>
      market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.dex.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : AVAILABLE_MARKETS;

  const handleRowClick = (marketId: string) => {
    router.push(`/markets/${encodeURIComponent(marketId)}`);
  };

  // Calculate global aggregated stats
  const globalStats = Object.values(marketData).reduce(
    (acc, stats) => ({
      totalNotional: acc.totalNotional + stats.totalNotional,
      longNotional: acc.longNotional + stats.longNotional,
      shortNotional: acc.shortNotional + stats.shortNotional,
      longCount: acc.longCount + stats.longCount,
      shortCount: acc.shortCount + stats.shortCount,
      totalCount: acc.totalCount + stats.totalCount,
    }),
    { totalNotional: 0, longNotional: 0, shortNotional: 0, longCount: 0, shortCount: 0, totalCount: 0 }
  );

  const lsRatio = globalStats.longCount > 0 && globalStats.shortCount > 0
    ? (globalStats.longCount / (globalStats.longCount + globalStats.shortCount) * 100)
    : 50;
  const globalBias = globalStats.longNotional > globalStats.shortNotional ? 'LONG' : 'SHORT';
  const biasColor = globalBias === 'LONG' ? 'text-emerald-400' : 'text-red-400';

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white font-mono-data">Market Overview</h1>
            <p className="text-sm text-gray-500">Positioning data of Hyperliquid leaderboard traders</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400' : 'bg-emerald-400'}`}></div>
            <span>{loading ? 'Loading...' : 'Updated less than a minute ago'}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#141414] border border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">Total Notional</span>
            </div>
            <div className="font-mono-data text-2xl font-semibold text-white mb-1">
              {formatCurrency(globalStats.totalNotional)}
            </div>
            <div className="font-mono-data text-xs text-gray-500">{globalStats.totalCount} positions</div>
          </div>

          <div className="bg-[#141414] border border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">Long Positions</span>
            </div>
            <div className="font-mono-data text-2xl font-semibold text-emerald-400 mb-1">
              {formatCurrency(globalStats.longNotional)}
            </div>
            <div className="font-mono-data text-xs text-gray-500">Long exposed</div>
          </div>

          <div className="bg-[#141414] border border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">Short Positions</span>
            </div>
            <div className="font-mono-data text-2xl font-semibold text-red-400 mb-1">
              {formatCurrency(globalStats.shortNotional)}
            </div>
            <div className="font-mono-data text-xs text-gray-500">Short exposed</div>
          </div>

          <div className="bg-[#141414] border border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className={`w-4 h-4 ${biasColor}`} />
              <span className="text-xs text-gray-500 uppercase tracking-wider">Global Bias</span>
            </div>
            <div className={`font-mono-data text-2xl font-semibold ${biasColor} mb-1`}>
              {globalBias}
            </div>
            <div className="font-mono-data text-xs text-gray-500">L/R {lsRatio.toFixed(0)}%</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${filter === 'ALL' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              ALL
            </button>
            <button
              onClick={() => setFilter('LONG')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${filter === 'LONG' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              LONG
            </button>
            <button
              onClick={() => setFilter('SHORT')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${filter === 'SHORT' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              SHORT
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search tickers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#141414] border border-gray-800 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-700 font-mono-data"
            />
          </div>
        </div>

        {/* Market Table */}
        <div className="bg-[#141414] border border-gray-800 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#0a0a0a] border-b border-gray-800">
            <div className="col-span-2 text-xs text-gray-500 uppercase tracking-wider">Asset</div>
            <div className="col-span-2 text-xs text-gray-500 uppercase tracking-wider text-right">24H Volume</div>
            <div className="col-span-2 text-xs text-gray-500 uppercase tracking-wider text-right">Total Notional</div>
            <div className="col-span-2 text-xs text-gray-500 uppercase tracking-wider text-center">Majority Side</div>
            <div className="col-span-1 text-xs text-gray-500 uppercase tracking-wider text-right">L/S Ratio</div>
            <div className="col-span-2 text-xs text-gray-500 uppercase tracking-wider text-right">Traders (L/R)</div>
            <div className="col-span-1 text-xs text-gray-500 uppercase tracking-wider text-right">OI</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-800">
            {filteredMarkets.map((market) => {
              const stats = marketData[market.id] || {
                totalNotional: 0,
                longNotional: 0,
                shortNotional: 0,
                longCount: 0,
                shortCount: 0,
                totalCount: 0,
                volume24h: 0
              };

              const marketBias = stats.longNotional > stats.shortNotional ? 'LONG' : 'SHORT';
              const lsRatioMarket = stats.longCount > 0 && stats.shortCount > 0
                ? (stats.longCount / (stats.longCount + stats.shortCount) * 100)
                : 50;

              return (
                <button
                  key={market.id}
                  onClick={() => handleRowClick(market.id)}
                  className="w-full grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[#1a1a1a] transition-colors text-left"
                >
                  <div className="col-span-2 flex items-center gap-3">
                    <MarketLogo logo={market.logo} symbol={market.symbol} color={market.color} size="sm" />
                    <span className="font-mono-data font-medium text-white">{getMarketPairName(market)}</span>
                  </div>
                  <div className="col-span-2 font-mono-data text-sm text-gray-300 text-right">
                    {formatCurrency(stats.volume24h)}
                  </div>
                  <div className="col-span-2 font-mono-data text-sm text-white text-right">
                    {formatCurrency(stats.totalNotional)}
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <span className={`font-mono-data text-sm font-medium ${marketBias === 'LONG' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                      {marketBias}
                    </span>
                  </div>
                  <div className="col-span-1 font-mono-data text-sm text-yellow-400 text-right">
                    {`${lsRatioMarket.toFixed(0)}%`}
                  </div>
                  <div className="col-span-2 font-mono-data text-sm text-gray-300 text-right">
                    {`${stats.longCount} / ${stats.shortCount}`}
                  </div>
                  <div className="col-span-1 font-mono-data text-sm text-gray-300 text-right">
                    {formatCurrency(stats.totalNotional)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {filteredMarkets.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No markets found matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}
