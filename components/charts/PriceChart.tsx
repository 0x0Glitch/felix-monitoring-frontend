'use client'

import React, { useState, useMemo, useCallback, memo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChevronDown } from 'lucide-react'
import { formatNumber, formatTimestamp } from '@/lib/utils'

type TimeWindow = '1h' | '1d' | '7d' | '30d' | 'all'

interface PriceChartProps {
  data: any[]
  onTimeWindowChange?: (window: TimeWindow) => void
  defaultTimeWindow?: TimeWindow
}

// Memoized tooltip component for better performance
const CustomTooltip = memo(({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a0a] p-3 border border-gray-700">
        <p className="font-mono-data text-sm font-medium mb-2 text-white">{formatTimestamp(label)}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="font-mono-data text-sm" style={{ color: entry.color }}>
            {entry.name}: ${formatNumber(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
})
CustomTooltip.displayName = 'CustomTooltip'

export function PriceChart({ data, onTimeWindowChange, defaultTimeWindow = '1d' }: PriceChartProps) {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(defaultTimeWindow)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Use all data since server-side aggregation provides the right granularity
  const filteredData = useMemo(() => {
    return data || []
  }, [data])

  const timeWindows: { value: TimeWindow; label: string }[] = useMemo(() => [
    { value: '1h', label: 'Past Hour' },
    { value: '1d', label: 'Past Day' },
    { value: '7d', label: 'Past 7 Days' },
    { value: '30d', label: 'Past 30 Days' },
    { value: 'all', label: 'All Time' },
  ], [])

  const handleTimeChange = useCallback((window: TimeWindow) => {
    setTimeWindow(window)
    setIsDropdownOpen(false)
    // Notify parent component of time window change
    if (onTimeWindowChange) {
      onTimeWindowChange(window)
    }
  }, [onTimeWindowChange])

  return (
    <div className="w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Price Comparison</h3>
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
      <ResponsiveContainer width="100%" height={400}>
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
            domain={['dataMin - 10', 'dataMax + 10']}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="mark_price"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={false}
            name="Mark Price"
            animationDuration={500}
          />
          <Line
            type="monotone"
            dataKey="meanImpactPrice"
            stroke="#f97316"
            strokeWidth={2.5}
            dot={false}
            name="Mean Impact Price"
            animationDuration={500}
          />
          <Line
            type="monotone"
            dataKey="oracle_price"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
            name="Oracle Price"
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
