'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { LiquidityChart } from '@/components/charts/LiquidityChart'
import { FundingRateChart } from '@/components/charts/FundingRateChart'
import { OpenInterestChart } from '@/components/charts/OpenInterestChart'
import { PriceChart } from '@/components/charts/PriceChart'
import { TimeWindowSelector, TimeWindow } from '@/components/TimeWindowSelector'
import { ChartSkeleton } from '@/components/ChartSkeleton'
import { fetchMarketData, formatChartData } from '@/lib/data-fetchers-new'
import { SCHEMA_NAME, TABLE_NAME } from '@/lib/supabase'
import { RefreshCw, AlertCircle } from 'lucide-react'

interface DashboardProps {
  coin?: string
}

export function Dashboard({ coin }: DashboardProps) {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('1d')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [isSampled, setIsSampled] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadData = useCallback(async (showLoadingState = true, forceRefresh = false) => {
    // Only show full loading state on initial load or manual refresh
    if (showLoadingState) {
      setLoading(true)
    }
    setError(null)
    
    try {
      const result = await fetchMarketData(timeWindow, coin, forceRefresh)
      
      if (result.data.length === 0) {
        setError('No data available for the selected time period')
        setData([])
        setIsSampled(false)
      } else {
        const formattedData = formatChartData(result.data)
        setData(formattedData)
        setLastFetched(new Date())
        setIsSampled(result.sampled)
      }
    } catch (err: any) {
      console.error('Error loading data:', err)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load data.'
      
      if (err.message?.includes('timeout') || err.message?.includes('Connection')) {
        errorMessage = 'Database connection timeout. The server might be under load. Please try again in a moment.'
      } else if (err.message?.includes('503') || err.message?.includes('unavailable')) {
        errorMessage = 'Service temporarily unavailable. Please try again in a few seconds.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      
      // Keep existing data on error to maintain UI stability
      if (showLoadingState && data.length === 0) {
        setData([])
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [timeWindow, coin])

  // Load data when component mounts or timeWindow changes
  useEffect(() => {
    loadData(true, true) // Force refresh when timeWindow changes
  }, [loadData, timeWindow])

  // Handle time window changes with optimistic UI
  const handleTimeWindowChange = useCallback((newWindow: TimeWindow) => {
    setTimeWindow(newWindow)
    // Show loading state immediately for better UX
    setLoading(true)
    setError(null) // Clear any previous errors
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadData(false, true) // Force refresh, bypass cache
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <TimeWindowSelector value={timeWindow} onChange={handleTimeWindowChange} />
          
          <div className="flex items-center gap-4">
            {isSampled && (
              <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded">
                {timeWindow === '1d' 
                  ? '2-minute averages' 
                  : timeWindow === 'all' 
                  ? '10-minute averages' 
                  : 'Data sampled'}
              </span>
            )}
            {lastFetched && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {lastFetched.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 transition-transform duration-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid gap-6">
          {/* Price Chart - Full Width */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            {loading ? <ChartSkeleton /> : <PriceChart data={data} />}
          </div>

          {/* Liquidity Charts - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              {loading ? <ChartSkeleton /> : <LiquidityChart data={data} side="bid" />}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              {loading ? <ChartSkeleton /> : <LiquidityChart data={data} side="ask" />}
            </div>
          </div>

          {/* Funding Rate and Open Interest - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              {loading ? <ChartSkeleton /> : <FundingRateChart data={data} />}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              {loading ? <ChartSkeleton /> : <OpenInterestChart data={data} />}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            Data fetched from Supabase • Charts update on refresh only • Sliders available on each chart for detailed exploration
          </p>
        </div>
      </div>
    </div>
  )
}
