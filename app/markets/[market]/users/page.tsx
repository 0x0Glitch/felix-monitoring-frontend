"use client";

import { use, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Navigation from "@/components/Navigation";

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              User Metrics - {market}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor user positions and liquidation risks
            </p>
          </div>
          <Navigation market={market} />
        </div>

        {positionsData && positionsData.positions && (
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Positions</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{positionsData.count}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Long Positions</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {positionsData.positions.filter((p: { position_size: string | number }) => parseFloat(String(p.position_size)) > 0).length}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Short Positions</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {positionsData.positions.filter((p: { position_size: string | number }) => parseFloat(String(p.position_size)) < 0).length}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">At Risk</div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {positionsData.positions.filter((p: { liquidation_price: string | number | null }) => p.liquidation_price !== null).length}
              </div>
            </div>
          </section>
        )}

        {(positionsError || liquidationError) && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-300 font-medium">Error loading data</p>
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
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
  );
}
