"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { AVAILABLE_MARKETS, getMarketsByCategory, getMarketPairName, type Market } from "@/lib/markets";
import MarketLogo from "@/components/MarketLogo";

interface MarketDropdownProps {
  currentMarket: string;
  isInNavigation?: boolean;
}

export default function MarketDropdown({ currentMarket, isInNavigation = false }: MarketDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  // Get current market info
  const currentMarketInfo = AVAILABLE_MARKETS.find(m => m.id === currentMarket);
  const marketsByCategory = getMarketsByCategory();
  
  // Filter markets based on search
  const filteredMarkets = searchQuery
    ? AVAILABLE_MARKETS.filter(market => 
        market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        market.dex.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle market selection
  const handleMarketSelect = (marketId: string) => {
    // Determine which page type we're on (market metrics or user metrics)
    const isUserMetrics = pathname.includes("/users");
    const newPath = isUserMetrics 
      ? `/markets/${encodeURIComponent(marketId)}/users`
      : `/markets/${encodeURIComponent(marketId)}`;
    
    router.push(newPath);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Render market item
  const renderMarketItem = (market: Market) => (
    <button
      key={market.id}
      onClick={() => handleMarketSelect(market.id)}
      className={`w-full px-4 py-2.5 text-left hover:bg-[#1a1a1a] transition-colors flex items-center justify-between group ${
        market.id === currentMarket ? "bg-[#1a1a1a]" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <MarketLogo logo={market.logo} symbol={market.symbol} color={market.color} size="sm" />
        <span className={`font-medium ${
          market.id === currentMarket ? "text-emerald-400" : "text-white"
        }`}>
          {getMarketPairName(market)}
        </span>
      </div>
      {market.id === currentMarket && (
        <span className="text-emerald-400">✓</span>
      )}
    </button>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-[#0a0a0a] hover:bg-[#141414] text-white transition-all"
      >
        <div className="flex items-center gap-3">
          {currentMarketInfo && <MarketLogo logo={currentMarketInfo.logo} symbol={currentMarketInfo.symbol} color={currentMarketInfo.color} size="sm" />}
          <div className="font-semibold text-lg">{currentMarketInfo ? getMarketPairName(currentMarketInfo) : currentMarket}</div>
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-[#0a0a0a] shadow-xl border border-gray-800 overflow-hidden left-0 min-w-[280px] max-h-[500px] overflow-y-auto">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#141414] border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                autoFocus
              />
            </div>
          </div>

          {/* Market List */}
          <div className="py-1">
            {searchQuery ? (
              // Show filtered results
              filteredMarkets && filteredMarkets.length > 0 ? (
                <div>
                  <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider">
                    Search Results
                  </div>
                  {filteredMarkets.map(renderMarketItem)}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  No markets found
                </div>
              )
            ) : (
              // Show all markets grouped by DEX
              Object.entries(marketsByCategory).map(([dex, markets]) => (
                <div key={dex}>
                  <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider">
                    {dex.toUpperCase()}
                  </div>
                  {markets.map(renderMarketItem)}
                </div>
              ))
            )}
          </div>

          {/* Quick Stats */}
          {!searchQuery && (
            <div className="border-t border-gray-800 px-4 py-3 bg-[#0a0a0a]">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{AVAILABLE_MARKETS.length} markets available</span>
                <span>{Object.keys(marketsByCategory).length} DEX platforms</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
