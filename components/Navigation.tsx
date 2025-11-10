"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <nav className="inline-flex items-center bg-gray-800 dark:bg-gray-900 rounded-full p-1.5 shadow-lg">
      <Link
        href={`/markets/${encodedMarket}`}
        className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
          isMarketMetrics
            ? "bg-gray-700 text-white shadow-sm"
            : "text-gray-300 hover:text-white hover:bg-gray-700/50"
        }`}
      >
        Market Metrics
      </Link>
      <Link
        href={`/markets/${encodedMarket}/users`}
        className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
          isUserMetrics
            ? "bg-gray-700 text-white shadow-sm"
            : "text-gray-300 hover:text-white hover:bg-gray-700/50"
        }`}
      >
        User Metrics
      </Link>
    </nav>
  );
}
