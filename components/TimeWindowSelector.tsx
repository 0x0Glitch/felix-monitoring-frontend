'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'

export type TimeWindow = '1h' | '1d' | 'all'

interface TimeWindowSelectorProps {
  value: TimeWindow
  onChange: (value: TimeWindow) => void
}

const timeWindows: { value: TimeWindow; label: string }[] = [
  { value: '1h', label: 'Past Hour' },
  { value: '1d', label: 'Past Day' },
  { value: 'all', label: 'All Time' },
]

export function TimeWindowSelector({ value, onChange }: TimeWindowSelectorProps) {
  return (
    <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <Clock className="w-4 h-4 ml-2 text-gray-600 dark:text-gray-400" />
      {timeWindows.map((window) => (
        <button
          key={window.value}
          onClick={() => onChange(window.value)}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 transform active:scale-95',
            value === window.value
              ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm scale-100'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          {window.label}
        </button>
      ))}
    </div>
  )
}
