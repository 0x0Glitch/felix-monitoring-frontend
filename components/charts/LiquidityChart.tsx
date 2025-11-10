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
  Brush,
  ReferenceLine
} from 'recharts'
import { formatNumber, formatTimestamp } from '@/lib/utils'

interface LiquidityChartProps {
  data: any[]
  side: 'bid' | 'ask'
  metric?: 'bps' | 'pct'
}

export function LiquidityChart({ data, side, metric = 'bps' }: LiquidityChartProps) {
  const [currentMetric, setCurrentMetric] = React.useState<'bps' | 'pct'>(metric)

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
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium mb-1">{formatTimestamp(label)}</p>
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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold capitalize">
          {side} Side Liquidity - {currentMetric.toUpperCase()} Depth
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentMetric('bps')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              currentMetric === 'bps'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Basis Points
          </button>
          <button
            onClick={() => setCurrentMetric('pct')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              currentMetric === 'pct'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Percentage
          </button>
        </div>
      </div>
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
