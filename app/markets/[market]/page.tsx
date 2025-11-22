"use client";

import { use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";
import MarketDropdown from "@/components/MarketDropdown";
import Image from "next/image";

export default function MarketPage({ params: paramsPromise }: { params: Promise<{ market: string }> }) {
  const params = use(paramsPromise);
  const market = decodeURIComponent(params.market);
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
      
      <Dashboard coin={market} />
    </div>
  );
}
