import React from 'react'

export function ChartSkeleton() {
  return (
    <div className="relative">
      {/* Title skeleton */}
      <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
      
      {/* Chart area skeleton */}
      <div className="h-[300px] bg-gray-100 dark:bg-gray-800 rounded-lg relative overflow-hidden">
        {/* Animated gradient overlay for loading effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent animate-shimmer"></div>
        
        {/* Fake chart lines */}
        <div className="absolute inset-0 p-8">
          <div className="h-full w-full relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-2 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
            
            {/* X-axis labels */}
            <div className="absolute bottom-0 left-12 right-0 flex justify-between">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-2 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
            
            {/* Fake chart line */}
            <svg className="absolute inset-0 left-12" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path
                d="M 0,50 Q 25,30 50,45 T 100,40"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-gray-300 dark:text-gray-600 animate-pulse"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
