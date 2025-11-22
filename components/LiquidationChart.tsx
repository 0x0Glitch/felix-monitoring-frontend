"use client";

import React from "react";
import {
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { formatUSD, formatNum } from "@/lib/utils";

interface LiquidationData {
  currentPrice: number;
  points: Array<{
    price: number;
    longLiquidations: number;
    shortLiquidations: number;
    cumulativeLongs: number;
    cumulativeShorts: number;
  }>;
}

interface LiquidationChartProps {
  data: LiquidationData | null;
  isLoading?: boolean;
}

export default function LiquidationChart({ data, isLoading }: LiquidationChartProps) {
  if (isLoading) {
    return (
      <div className="bg-[#141414] border border-gray-800 p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin h-10 w-10 border-b-2 border-emerald-400"></div>
          <p className="text-gray-400">Loading liquidation data...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.points || data.points.length === 0) {
    return (
      <div className="bg-[#141414] border border-gray-800 p-8">
        <p className="text-gray-400 text-center">No liquidation data available.</p>
      </div>
    );
  }

  const chartData = data.points.map(point => ({
    price: point.price,
    longs: point.longLiquidations,
    shorts: point.shortLiquidations,
    cumulativeLongs: point.cumulativeLongs,
    cumulativeShorts: point.cumulativeShorts,
  }));

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      dataKey: string;
      value: number;
      color: string;
    }>;
    label?: number;
  }) => {
    if (active && payload && payload.length) {
      const longLiquidation = payload.find((p) => p.dataKey === "longs");
      const shortLiquidation = payload.find((p) => p.dataKey === "shorts");
      const cumulativeLongs = payload.find((p) => p.dataKey === "cumulativeLongs");
      const cumulativeShorts = payload.find((p) => p.dataKey === "cumulativeShorts");

      return (
        <div className="bg-[#0a0a0a] border border-gray-700 p-4">
          <p className="font-mono-data font-semibold text-white mb-2">
            Price: {formatUSD(label)}
          </p>
          {((longLiquidation?.value ?? 0) > 0 || (shortLiquidation?.value ?? 0) > 0) && (
            <>
              <div className="space-y-1 mb-2">
                <p className="font-mono-data text-sm text-emerald-400">
                  Longs: {formatNum(longLiquidation?.value || 0, 4)} tokens
                </p>
                <p className="font-mono-data text-sm text-red-400">
                  Shorts: {formatNum(shortLiquidation?.value || 0, 4)} tokens
                </p>
              </div>
            </>
          )}
          <div className="border-t border-gray-700 pt-2 mt-2 space-y-1">
            <p className="font-mono-data text-xs text-gray-400">
              Cumulative Longs: {formatNum(cumulativeLongs?.value || 0, 2)} tokens
            </p>
            <p className="font-mono-data text-xs text-gray-400">
              Cumulative Shorts: {formatNum(cumulativeShorts?.value || 0, 2)} tokens
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const maxLong = Math.max(...chartData.map(d => d.longs));
  const maxShort = Math.max(...chartData.map(d => d.shorts));
  const maxCumulativeLongs = Math.max(...chartData.map(d => d.cumulativeLongs));
  const maxCumulativeShorts = Math.max(...chartData.map(d => d.cumulativeShorts));
  
  const maxValue = Math.max(maxLong, maxShort, maxCumulativeLongs, maxCumulativeShorts) * 1.1;

  return (
    <div className="bg-[#141414] border border-gray-800 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Liquidation Chart</h3>
        <p className="font-mono-data text-sm text-gray-400 mt-1">
          Token amounts liquidatable at different price points. Current price: {formatUSD(data.currentPrice)}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart 
          data={chartData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
          barGap={0}
          barCategoryGap={0}
        >
          <defs>
            <linearGradient id="colorLongs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
            </linearGradient>
            <linearGradient id="colorShorts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
          
          <XAxis 
            dataKey="price" 
            domain={[0, data.currentPrice * 2]}
            type="number"
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            angle={-45}
            textAnchor="end"
            height={60}
            stroke="#6b7280"
            tick={{ fontSize: 11 }}
          />
          
          <YAxis 
            domain={[0, maxValue]}
            tickFormatter={(value) => formatNum(value, 2)}
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            verticalAlign="top" 
            height={36}
            wrapperStyle={{ fontSize: '12px' }}
            content={(props) => {
              const { payload } = props;
              return (
                <ul className="flex items-center justify-center gap-4 text-sm">
                  {payload?.map((entry, index) => {
                    const isBar = entry.value === "Long Liquidations" || entry.value === "Short Liquidations";
                    return (
                      <li key={`item-${index}`} className="flex items-center gap-1">
                        {isBar ? (
                          <span 
                            className="inline-block w-3 h-3" 
                            style={{ backgroundColor: entry.color }}
                          />
                        ) : (
                          <span 
                            className="inline-block w-4 h-0.5" 
                            style={{ backgroundColor: entry.color }}
                          />
                        )}
                        <span className="text-gray-900 dark:text-gray-100">{entry.value}</span>
                      </li>
                    );
                  })}
                </ul>
              );
            }}
          />
          
          <ReferenceLine 
            x={data.currentPrice} 
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 5"
            label={{ 
              value: "Current Price", 
              position: "top",
              fill: "#3b82f6",
              fontSize: 12
            }}
          />
          
          <Bar 
            dataKey="longs" 
            fill="#10b981" 
            name="Long Liquidations"
            opacity={0.8}
            barSize={20}
          />
          <Bar 
            dataKey="shorts" 
            fill="#ef4444" 
            name="Short Liquidations"
            opacity={0.8}
            barSize={20}
          />
          
          <Area
            type="monotone"
            dataKey="cumulativeLongs"
            stroke="#059669"
            strokeWidth={2}
            fill="url(#colorLongs)"
            name="Cumulative Longs"
          />
          <Area
            type="monotone"
            dataKey="cumulativeShorts"
            stroke="#dc2626"
            strokeWidth={2}
            fill="url(#colorShorts)"
            name="Cumulative Shorts"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
