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
  const currentMetric = 'bps' // Always use BPS
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

  // Color schemes
  const colors = {
    bid: ['#10b981', '#14b8a6', '#06b6d4', '#0ea5e9'], // Vibrant blues/greens for bid
    ask: ['#f97316', '#ef4444', '#dc2626', '#e11d48']  // Vibrant oranges/reds for ask
  }

  // Data keys based on metric type
  const getDepthKeys = (metricType: 'bps' | 'pct') => {
    if (metricType === 'bps') {
      return {
        key1: side === 'bid' ? 'bid_depth_5bps' : 'ask_depth_5bps',
        key2: side === 'bid' ? 'bid_depth_10bps' : 'ask_depth_10bps',
        key3: side === 'bid' ? 'bid_depth_50bps' : 'ask_depth_50bps',
        key4: side === 'bid' ? 'bid_depth_100bps' : 'ask_depth_100bps',
        labels: ['5 bps', '10 bps', '50 bps', '100 bps']
      }
    } else {
      return {
        key1: side === 'bid' ? 'bid_depth_5pct' : 'ask_depth_5pct',
        key2: side === 'bid' ? 'bid_depth_10pct' : 'ask_depth_10pct',
        key3: side === 'bid' ? 'bid_depth_25pct' : 'ask_depth_25pct',
        key4: null,
        labels: ['5%', '10%', '25%']
      }
    }
  }

  const { key1, key2, key3, key4, labels } = getDepthKeys(currentMetric)

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
          
          <Line
            type="monotone"
            dataKey={key1}
            stroke={colors[side][0]}
            strokeWidth={2.5}
            dot={false}
            name={`Liquidity @ ${labels[0]}`}
            animationDuration={500}
          />
          <Line
            type="monotone"
            dataKey={key2}
            stroke={colors[side][1]}
            strokeWidth={2.5}
            dot={false}
            name={`Liquidity @ ${labels[1]}`}
            animationDuration={500}
          />
          <Line
            type="monotone"
            dataKey={key3}
            stroke={colors[side][2]}
            strokeWidth={2.5}
            dot={false}
            name={`Liquidity @ ${labels[2]}`}
            animationDuration={500}
          />
          {key4 && (
            <Line
              type="monotone"
              dataKey={key4}
              stroke={colors[side][3]}
              strokeWidth={2.5}
              dot={false}
              name={`Liquidity @ ${labels[3]}`}
              animationDuration={500}
            />
          )}
          
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
