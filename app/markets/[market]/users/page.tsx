"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import MarketDropdown from "@/components/MarketDropdown";

const PositionsTable = dynamic(() => import("@/components/PositionsTable"), { ssr: false });
const LiquidationChart = dynamic(() => import("@/components/LiquidationChart"), { ssr: false });

interface PositionData {
  positions: any[];
  count: number;
  timestamp: string;
}

interface LiquidationData {
  currentPrice: number;
  points: any[];
  totalPositions: number;
  timestamp: string;
}

export default function UsersPage({ params: paramsPromise }: { params: Promise<{ market: string }> }) {
  const params = use(paramsPromise);
  const market = decodeURIComponent(params.market);

  const [positionsData, setPositionsData] = useState<PositionData | null>(null);
  const [liquidationData, setLiquidationData] = useState<LiquidationData | null>(null);
  const [positionsLoading, setPositionsLoading] = useState(true);
  const [liquidationLoading, setLiquidationLoading] = useState(true);
  const [positionsError, setPositionsError] = useState<string | null>(null);
  const [liquidationError, setLiquidationError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setPositionsLoading(true);
        const response = await fetch(`/api/markets/${encodeURIComponent(market)}/positions`);
        if (!response.ok) throw new Error("Failed to fetch positions");
        const data = await response.json();
        setPositionsData(data);
      } catch (error: any) {
        setPositionsError(error.message);
      } finally {
        setPositionsLoading(false);
      }
    };
    fetchData();

    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [market]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLiquidationLoading(true);
        const response = await fetch(`/api/markets/${encodeURIComponent(market)}/liquidations`);
        if (!response.ok) throw new Error("Failed to fetch liquidations");
        const data = await response.json();
        setLiquidationData(data);
      } catch (error: any) {
        setLiquidationError(error.message);
      } finally {
        setLiquidationLoading(false);
      }
    };
    fetchData();

    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [market]);

  const pathname = usePathname();
  const encodedMarket = encodeURIComponent(market);
  
  const decodedPathname = decodeURIComponent(pathname);
  const isMarketMetrics = decodedPathname === `/markets/${market}` || pathname === `/markets/${encodedMarket}`;
  const isUserMetrics = decodedPathname === `/markets/${market}/users` || pathname === `/markets/${encodedMarket}/users`;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top Navigation Bar */}
      <div className="bg-[#0a0a0a] border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Dropdown */}
          <div className="flex items-center gap-4">
            <MarketDropdown currentMarket={market} isInNavigation={false} />
          </div>
          
          {/* Right: Navigation Tabs */}
          <nav className="flex items-center gap-1">
            <Link
              href={`/markets/${encodedMarket}`}
              className={`px-6 py-2.5 text-sm font-medium transition-all ${
                isMarketMetrics
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white hover:bg-[#141414]"
              }`}
            >
              Market Metrics
            </Link>
            <Link
              href={`/markets/${encodedMarket}/users`}
              className={`px-6 py-2.5 text-sm font-medium transition-all ${
                isUserMetrics
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white hover:bg-[#141414]"
              }`}
            >
              User Metrics
            </Link>
          </nav>
        </div>
      </div>
      
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">

        {positionsData && positionsData.positions && (
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#141414] p-5 border border-gray-800">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Positions</div>
              <div className="font-mono-data text-2xl font-semibold text-white">{positionsData.count}</div>
            </div>
            <div className="bg-[#141414] p-5 border border-gray-800">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Long Positions</div>
              <div className="font-mono-data text-2xl font-semibold text-emerald-400">
                {positionsData.positions.filter((p: { position_size: string | number }) => parseFloat(String(p.position_size)) > 0).length}
              </div>
            </div>
            <div className="bg-[#141414] p-5 border border-gray-800">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Short Positions</div>
              <div className="font-mono-data text-2xl font-semibold text-red-400">
                {positionsData.positions.filter((p: { position_size: string | number }) => parseFloat(String(p.position_size)) < 0).length}
              </div>
            </div>
            <div className="bg-[#141414] p-5 border border-gray-800">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">At Risk</div>
              <div className="font-mono-data text-2xl font-semibold text-orange-400">
                {positionsData.positions.filter((p: { liquidation_price: string | number | null }) => p.liquidation_price !== null).length}
              </div>
            </div>
          </section>
        )}

        {(positionsError || liquidationError) && (
          <div className="bg-red-900/20 border border-red-800 p-4 mb-6">
            <p className="text-red-300 font-medium">Error loading data</p>
            <p className="text-red-400 text-sm mt-1">
              {positionsError || liquidationError || "Failed to fetch data. Please try again."}
            </p>
          </div>
        )}

        <section className="space-y-6">
          <LiquidationChart 
            data={liquidationData} 
            isLoading={liquidationLoading}
          />
        </section>

        <section className="space-y-6 mt-6">
          <PositionsTable 
            positions={positionsData?.positions || []} 
            isLoading={positionsLoading}
          />
        </section>
        </div>
      </div>
    </div>
  );
}
