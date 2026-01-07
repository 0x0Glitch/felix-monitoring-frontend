'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'

export type TimeWindow = '1h' | '1d' | '7d' | '30d' | 'all'

interface TimeWindowSelectorProps {
  value: TimeWindow
  onChange: (value: TimeWindow) => void
}

const timeWindows: { value: TimeWindow; label: string }[] = [
  { value: '1h', label: '1H' },
  { value: '1d', label: '1D' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: 'all', label: 'All' },
]

export function TimeWindowSelector({ value, onChange }: TimeWindowSelectorProps) {
  return (
    <div className="flex items-center gap-2 p-1 bg-[#141414] border border-gray-800">
      <Clock className="w-4 h-4 ml-2 text-gray-500" />
      {timeWindows.map((window) => (
        <button
          key={window.value}
          onClick={() => onChange(window.value)}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            value === window.value
              ? 'bg-emerald-600 text-white border border-emerald-500'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
          )}
        >
          {window.label}
        </button>
      ))}
    </div>
  )
}
