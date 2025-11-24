"use client";

import { use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";
import MarketDropdown from "@/components/MarketDropdown";
import TopMetricsBar from "@/components/TopMetricsBar";
import { AVAILABLE_MARKETS } from "@/lib/markets";
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
      <div className="bg-[#0a0a0a] border-b border-gray-900 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Anthias Branding and Market Data */}
          <div className="flex items-center gap-8 pl-4">
            {/* Anthias Branding */}
            <div className="flex items-center gap-2">
              <Image 
                src="/logos/Anthias.png" 
                alt="Anthias" 
                width={28} 
                height={28}
                className="object-contain"
                priority
                unoptimized
              />
              <span className="text-gray-500 text-xs font-mono uppercase tracking-wider">
                Anthias Labs
              </span>
            </div>
            
            {/* Market Selector and Metrics */}
            <div className="flex items-center gap-6">
              <MarketDropdown currentMarket={market} isInNavigation={false} />
              <TopMetricsBar market={market} />
            </div>
          </div>
          
          {/* Right: Navigation Tabs */}
          <nav className="flex items-center gap-1 pr-4">
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
