'use client'

import React, { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { formatNumber, formatTimestamp } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

type TimeWindow = '1h' | '1d' | '7d' | '30d' | 'all'

interface LiquidityChartProps {
  data: any[]
  side: 'bid' | 'ask'
  metric?: 'bps' | 'pct'
  onTimeWindowChange?: (window: TimeWindow) => void
  defaultTimeWindow?: TimeWindow
}

export function LiquidityChart({ data, side, onTimeWindowChange, defaultTimeWindow = '1d' }: LiquidityChartProps) {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(defaultTimeWindow)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Use all data since server-side aggregation provides the right granularity
  const filteredData = useMemo(() => {
    return data || []
  }, [data])

  const timeWindows: { value: TimeWindow; label: string }[] = [
    { value: '1h', label: 'Past Hour' },
    { value: '1d', label: 'Past Day' },
    { value: '7d', label: 'Past 7 Days' },
    { value: '30d', label: 'Past 30 Days' },
    { value: 'all', label: 'All Time' },
  ]

  const handleTimeChange = (window: TimeWindow) => {
    setTimeWindow(window)
    setIsDropdownOpen(false)
    // Notify parent component of time window change
    if (onTimeWindowChange) {
      onTimeWindowChange(window)
    }
  }

  const prefix = side === 'bid' ? 'bid' : 'ask'

  // All possible bps levels (old + new), ordered ascending
  // Each has a fixed color per side so colors stay consistent regardless of which subset is present
  const allDepthLevels = [
    { suffix: '3bps',    label: '3 bps',    bid: '#10b981', ask: '#fbbf24' },
    { suffix: '5bps',    label: '5 bps',    bid: '#14b8a6', ask: '#f97316' },
    { suffix: '7_5bps',  label: '7.5 bps',  bid: '#06b6d4', ask: '#ef4444' },
    { suffix: '10bps',   label: '10 bps',   bid: '#0ea5e9', ask: '#dc2626' },
    { suffix: '15bps',   label: '15 bps',   bid: '#6366f1', ask: '#e11d48' },
    { suffix: '20bps',   label: '20 bps',   bid: '#8b5cf6', ask: '#be185d' },
    { suffix: '25bps',   label: '25 bps',   bid: '#a855f7', ask: '#9d174d' },
    { suffix: '50bps',   label: '50 bps',   bid: '#7c3aed', ask: '#831843' },
    { suffix: '100bps',  label: '100 bps',  bid: '#5b21b6', ask: '#500724' },
  ]

  // Only show levels that actually have data in this dataset
  const activeLevels = useMemo(() => {
    if (!filteredData.length) return []
    return allDepthLevels.filter(level =>
      filteredData.some((d: any) => d[`${prefix}_depth_${level.suffix}`] != null)
    )
  }, [filteredData, prefix])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0a0a0a] p-3 border border-gray-700">
          <p className="font-mono-data text-sm font-medium mb-1 text-white">{formatTimestamp(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="font-mono-data text-sm" style={{ color: entry.color }}>
              {entry.name}: ${formatNumber(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold capitalize">
          {side} Side Liquidity - BPS Depth
        </h3>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0a0a0a] border border-gray-700 text-white text-xs hover:bg-gray-800 transition-colors"
          >
            {timeWindows.find(w => w.value === timeWindow)?.label}
            <ChevronDown className="w-3 h-3" />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 bg-[#0a0a0a] border border-gray-700 z-10 min-w-[100px]">
              {timeWindows.map((window) => (
                <button
                  key={window.value}
                  onClick={() => handleTimeChange(window.value)}
                  className={`w-full text-left px-2.5 py-1.5 text-xs transition-colors ${
                    timeWindow === window.value
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {window.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={filteredData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="0" stroke="#1a1a1a" vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTimestamp}
            stroke="#4a4a4a"
            style={{ fontSize: 11 }}
            axisLine={{ stroke: '#1a1a1a' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatNumber}
            stroke="#4a4a4a"
            style={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          
          {activeLevels.map((level: typeof allDepthLevels[0]) => (
            <Line
              key={level.suffix}
              type="monotone"
              dataKey={`${prefix}_depth_${level.suffix}`}
              stroke={level[side]}
              strokeWidth={2.5}
              dot={false}
              name={`Liquidity @ ${level.label}`}
              animationDuration={500}
            />
          ))}
          
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
