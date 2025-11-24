'use client'

import React, { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChevronDown } from 'lucide-react'
import { formatNumber, formatTimestamp } from '@/lib/utils'

type TimeWindow = '1h' | '1d' | 'all'

interface OpenInterestChartProps {
  data: any[]
  onTimeWindowChange?: (window: TimeWindow) => void
  defaultTimeWindow?: TimeWindow
}

export function OpenInterestChart({ data, onTimeWindowChange, defaultTimeWindow = '1d' }: OpenInterestChartProps) {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(defaultTimeWindow)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Use all data since server-side aggregation provides the right granularity
  const filteredData = useMemo(() => {
    return data || []
  }, [data])

  const timeWindows: { value: TimeWindow; label: string }[] = [
    { value: '1h', label: 'Past Hour' },
    { value: '1d', label: 'Past Day' },
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
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0a0a0a] p-3 border border-gray-700">
          <p className="font-mono-data text-sm font-medium mb-1 text-white">{formatTimestamp(label)}</p>
          <p className="font-mono-data text-sm" style={{ color: payload[0].color }}>
            Open Interest: ${formatNumber(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Open Interest</h3>
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
        <AreaChart
          data={filteredData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorOI" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey="open_interest"
            stroke="#06b6d4"
            fillOpacity={1}
            fill="url(#colorOI)"
            strokeWidth={2.5}
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
