'use client'

import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush
} from 'recharts'
import { formatNumber, formatTimestamp } from '@/lib/utils'

interface OpenInterestChartProps {
  data: any[]
}

export function OpenInterestChart({ data }: OpenInterestChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium mb-1">{formatTimestamp(label)}</p>
          <p className="text-sm text-blue-600">
            Open Interest: ${formatNumber(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-full">
      <h3 className="text-lg font-semibold mb-4">Open Interest</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorOI" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
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
            tickFormatter={formatNumber}
            stroke="#6b7280"
            style={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="open_interest"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorOI)"
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
