"use client";

import { use } from "react";
import { Dashboard } from "@/components/Dashboard";
import Navigation from "@/components/Navigation";

export default function MarketPage({ params: paramsPromise }: { params: Promise<{ market: string }> }) {
  const params = use(paramsPromise);
  const market = decodeURIComponent(params.market);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Market Metrics - {market}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time market data visualization
            </p>
          </div>
          <Navigation market={market} />
        </div>
      </div>
      <Dashboard coin={market} />
    </div>
  );
}
