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
  ResponsiveContainer,
  Brush
} from 'recharts'
import { formatNumber, formatTimestamp } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

type TimeWindow = '1h' | '1d' | 'all'

interface LiquidityChartProps {
  data: any[]
  side: 'bid' | 'ask'
  metric?: 'bps' | 'pct'
  onTimeWindowChange?: (window: TimeWindow) => void
  defaultTimeWindow?: TimeWindow
}

export function LiquidityChart({ data, side }: LiquidityChartProps) {
  const currentMetric = 'bps' // Always use BPS
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('1d')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Filter data based on selected time window
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return data
    
    const now = new Date()
    let cutoffTime: Date
    
    switch (timeWindow) {
      case '1h':
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000) // 1 hour ago
        break
      case '1d':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 1 day ago
        break
      case 'all':
      default:
        return data // Return all data
    }
    
    return data.filter(item => {
      const itemTime = new Date(item.timestamp)
      return itemTime >= cutoffTime
    })
  }, [data, timeWindow])

  const timeWindows: { value: TimeWindow; label: string }[] = [
    { value: '1h', label: 'Past Hour' },
    { value: '1d', label: 'Past Day' },
    { value: 'all', label: 'All Time' },
  ]

  const handleTimeChange = (window: TimeWindow) => {
    setTimeWindow(window)
    setIsDropdownOpen(false)
    // Each chart maintains its own independent time window
  }

  // Color schemes
  const colors = {
    bid: ['#10b981', '#059669', '#047857', '#065f46'], // Green shades
    ask: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b']  // Red shades
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
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={filteredData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTimestamp}
            stroke="#6b7280"
            style={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={formatNumber}
            stroke="#6b7280"
            style={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          
          <Line
            type="monotone"
            dataKey={key1}
            stroke={colors[side][0]}
            strokeWidth={2}
            dot={false}
            name={`Liquidity @ ${labels[0]}`}
            animationDuration={500}
          />
          <Line
            type="monotone"
            dataKey={key2}
            stroke={colors[side][1]}
            strokeWidth={2}
            dot={false}
            name={`Liquidity @ ${labels[1]}`}
            animationDuration={500}
          />
          <Line
            type="monotone"
            dataKey={key3}
            stroke={colors[side][2]}
            strokeWidth={2}
            dot={false}
            name={`Liquidity @ ${labels[2]}`}
            animationDuration={500}
          />
          {key4 && (
            <Line
              type="monotone"
              dataKey={key4}
              stroke={colors[side][3]}
              strokeWidth={2}
              dot={false}
              name={`Liquidity @ ${labels[3]}`}
              animationDuration={500}
            />
          )}
          
          <Brush
            dataKey="timestamp"
            height={30}
            stroke="#8884d8"
            tickFormatter={formatTimestamp}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
