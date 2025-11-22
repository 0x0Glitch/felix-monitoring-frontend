"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MarketDropdown from "./MarketDropdown";

interface NavigationProps {
  market: string;
}

export default function Navigation({ market }: NavigationProps) {
  const pathname = usePathname();
  const encodedMarket = encodeURIComponent(market);
  
  // Decode pathname to handle encoded characters properly
  const decodedPathname = decodeURIComponent(pathname);
  const isMarketMetrics = decodedPathname === `/markets/${market}` || pathname === `/markets/${encodedMarket}`;
  const isUserMetrics = decodedPathname === `/markets/${market}/users` || pathname === `/markets/${encodedMarket}/users`;

  return (
    <div className="flex items-center gap-3">
      {/* Market Dropdown */}
      <MarketDropdown currentMarket={market} isInNavigation={true} />
      
      {/* Navigation Tabs */}
      <nav className="inline-flex items-center bg-[#0a0a0a] p-1 border border-gray-800">
        <Link
          href={`/markets/${encodedMarket}`}
          className={`px-6 py-2.5 text-sm font-medium transition-all ${
            isMarketMetrics
              ? "bg-[#1a1a1a] text-white"
              : "text-gray-400 hover:text-white hover:bg-[#141414]"
          }`}
        >
          Market Metrics
        </Link>
        <Link
          href={`/markets/${encodedMarket}/users`}
          className={`px-6 py-2.5 text-sm font-medium transition-all ${
            isUserMetrics
              ? "bg-[#1a1a1a] text-white"
              : "text-gray-400 hover:text-white hover:bg-[#141414]"
          }`}
        >
          User Metrics
        </Link>
      </nav>
    </div>
  );
}
