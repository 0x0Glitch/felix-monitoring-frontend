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
  Brush,
  ReferenceLine
} from 'recharts'
import { formatPercentage, formatTimestamp } from '@/lib/utils'

interface FundingRateChartProps {
  data: any[]
}

export function FundingRateChart({ data }: FundingRateChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium mb-1">{formatTimestamp(label)}</p>
          <p className="text-sm" style={{ color: payload[0].color }}>
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
      <h3 className="text-lg font-semibold mb-4">Funding Rate</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
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
