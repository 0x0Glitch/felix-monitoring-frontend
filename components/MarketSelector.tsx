"use client";

import React from "react";
import { useRouter } from "next/navigation";

// Client components need to use environment variables directly for build-time replacement
const MARKET = process.env.NEXT_PUBLIC_DEFAULT_MARKET!;

export default function MarketSelector() {
  const router = useRouter();

  const handleViewMarket = () => {
    router.push(`/markets/${encodeURIComponent(MARKET)}`);
  };

  const handleViewUsers = () => {
    router.push(`/markets/${encodeURIComponent(MARKET)}/users`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{MARKET} Market</h2>
      
      <div className="space-y-4">
        <div className="flex gap-3">
          <button
            onClick={handleViewMarket}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all transform active:scale-95 font-medium"
          >
            View Market Metrics
          </button>
          <button
            onClick={handleViewUsers}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-all transform active:scale-95 font-medium"
          >
            View User Metrics
          </button>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Navigation</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            <span>Market Metrics: Price, liquidity, funding rate, and open interest</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-600 rounded-full"></span>
            <span>User Metrics: Liquidation heatmaps and position tracking</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
