'use client'

import React, { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Brush
} from 'recharts'
import { formatPercentage, formatTimestamp } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

type TimeWindow = '1h' | '1d' | 'all'

interface FundingRateChartProps {
  data: any[]
  onTimeWindowChange?: (window: TimeWindow) => void
  defaultTimeWindow?: TimeWindow
}

export function FundingRateChart({ data }: FundingRateChartProps) {
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0a0a0a] p-3 border border-gray-700">
          <p className="font-mono-data text-sm font-medium mb-1 text-white">{formatTimestamp(label)}</p>
          <p key={0} className="font-mono-data text-sm" style={{ color: payload[0].color }}>
            Funding Rate: {formatPercentage(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  // Determine if funding rate is positive or negative for color coding
  const getGradientColor = (value: number) => {
    return value >= 0 ? '#10b981' : '#ef4444'
  }

  return (
    <div className="w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Funding Rate</h3>
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
        <AreaChart
          data={filteredData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorFunding" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTimestamp}
            stroke="#6b7280"
            style={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={formatPercentage}
            stroke="#6b7280"
            style={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="funding_rate_pct"
            stroke="#8b5cf6"
            fillOpacity={1}
            fill="url(#colorFunding)"
            strokeWidth={2}
            animationDuration={500}
          />
          <Brush
            dataKey="timestamp"
            height={30}
            stroke="#8884d8"
            tickFormatter={formatTimestamp}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
