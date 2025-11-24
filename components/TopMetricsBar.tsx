"use client";

import React, { useState, useEffect } from 'react';
import { formatUSD, formatNum, formatPct } from '@/lib/utils';

interface TopMetricsBarProps {
  market: string;
}

interface MetricsData {
  price: number;
  change24h: number;
  changePct24h: number;
  volume24h: number;
  oracle: number;
  openInterest: number;
  fundingRate: number;
}

export default function TopMetricsBar({ market }: TopMetricsBarProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`/api/market-data?timeWindow=1h&coin=${encodeURIComponent(market)}`);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
          const latest = result.data[result.data.length - 1];
          const previous = result.data[0];
          
          const price = latest.mark_price || 0;
          const previousPrice = previous.mark_price || price;
          const change24h = price - previousPrice;
          const changePct24h = previousPrice > 0 ? (change24h / previousPrice) * 100 : 0;
          
          
          setMetrics({
            price,
            change24h,
            changePct24h,
            volume24h: latest.volume_24h || 0,
            oracle: latest.oracle_price || price,
            openInterest: latest.open_interest || 0,
            fundingRate: (latest.funding_rate_pct || 0)
          });
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [market]);

  if (loading || !metrics) {
    return (
      <div className="flex items-center space-x-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-3 bg-gray-800 rounded w-12 mb-1"></div>
            <div className="h-4 bg-gray-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-6">
      {/* Price */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wider font-mono-data">Price</div>
        <div className="font-mono-data text-white font-semibold text-sm">
          {formatUSD(metrics.price)}
        </div>
      </div>

      {/* 24h Volume */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wider font-mono-data">24h Volume</div>
        <div className="font-mono-data text-white font-semibold text-sm">
          {formatUSD(metrics.volume24h)}
        </div>
      </div>

      {/* Oracle */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wider font-mono-data">Oracle</div>
        <div className="font-mono-data text-white font-semibold text-sm">
          {formatUSD(metrics.oracle)}
        </div>
      </div>

      {/* Open Interest */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wider font-mono-data">Open Interest</div>
        <div className="font-mono-data text-white font-semibold text-sm">
          {formatUSD(metrics.openInterest)}
        </div>
      </div>

      {/* Funding Rate */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wider font-mono-data">Funding Rate</div>
        <div className="font-mono-data text-emerald-400 font-semibold text-sm">
          {formatPct(metrics.fundingRate, 4)}
        </div>
      </div>
    </div>
  );
}
