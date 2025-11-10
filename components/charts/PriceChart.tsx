'use client'

import React from 'react'
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

interface PriceChartProps {
  data: any[]
}

export function PriceChart({ data }: PriceChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium mb-2">{formatTimestamp(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
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
      <h3 className="text-lg font-semibold mb-4">Price Comparison</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
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
            domain={['dataMin - 10', 'dataMax + 10']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="mark_price"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            name="Mark Price"
            animationDuration={500}
          />
          <Line
            type="monotone"
            dataKey="meanImpactPrice"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            name="Mean Impact Price"
            animationDuration={500}
          />
          <Line
            type="monotone"
            dataKey="oracle_price"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Oracle Price"
            animationDuration={500}
          />
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
