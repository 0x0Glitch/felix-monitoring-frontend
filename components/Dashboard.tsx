'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { LiquidityChart } from '@/components/charts/LiquidityChart'
import { FundingRateChart } from '@/components/charts/FundingRateChart'
import { OpenInterestChart } from '@/components/charts/OpenInterestChart'
import { PriceChart } from '@/components/charts/PriceChart'
import { VolumeChart } from '@/components/charts/VolumeChart'
import type { TimeWindow } from '@/components/TimeWindowSelector'
import { ChartSkeleton } from '@/components/ChartSkeleton'
import { fetchMarketData, formatChartData } from '@/lib/data-fetchers-new'
import { SCHEMA_NAME, TABLE_NAME } from '@/lib/supabase'
import { RefreshCw, AlertCircle } from 'lucide-react'

interface DashboardProps {
  coin?: string
}

export function Dashboard({ coin }: DashboardProps) {
  const [data, setData] = useState<{[key: string]: any[]}>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [isSampled, setIsSampled] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [currentTimeWindow, setCurrentTimeWindow] = useState<TimeWindow>('7d')

  // Individual time windows for each chart (default to 7d for better data visualization)
  const [priceTimeWindow, setPriceTimeWindow] = useState<TimeWindow>('7d')
  const [bidLiquidityTimeWindow, setBidLiquidityTimeWindow] = useState<TimeWindow>('7d')
  const [askLiquidityTimeWindow, setAskLiquidityTimeWindow] = useState<TimeWindow>('7d')
  const [fundingTimeWindow, setFundingTimeWindow] = useState<TimeWindow>('7d')
  const [oiTimeWindow, setOiTimeWindow] = useState<TimeWindow>('7d')
  const [volumeTimeWindow, setVolumeTimeWindow] = useState<TimeWindow>('7d')
  
  // Track which time windows are currently loading
  const [loadingWindows, setLoadingWindows] = useState<Set<TimeWindow>>(new Set())

  const loadData = useCallback(async (showLoadingState = true, forceRefresh = false, timeWindow: TimeWindow = 'all', showOverlay = false) => {
    // Only show full loading state on initial load or manual refresh
    if (showLoadingState) {
      setLoading(true)
    } else if (showOverlay) {
      // Mark this specific time window as loading (only for user-initiated actions)
      setLoadingWindows(prev => new Set(prev).add(timeWindow))
    }
    // If neither flag is true, the update happens silently (for auto-refresh)
    setError(null)
    
    try {
      // Fetch data with specified time window for proper server-side aggregation
      const result = await fetchMarketData(timeWindow, coin, forceRefresh)
      
      if (result.data.length === 0) {
        setError('No data available for the selected time period')
        setData(prev => ({ ...prev, [timeWindow]: [] }))
        setIsSampled(false)
      } else {
        const formattedData = formatChartData(result.data)
        setData(prev => ({ ...prev, [timeWindow]: formattedData }))
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
    } finally {
      setLoading(false)
      setIsRefreshing(false)
      // Remove this time window from loading set
      setLoadingWindows(prev => {
        const newSet = new Set(prev)
        newSet.delete(timeWindow)
        return newSet
      })
    }
  }, [coin])

  // Load data when component mounts or time window changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadData(true, true, currentTimeWindow)
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [currentTimeWindow, coin, loadData])

  // Auto-refresh every 30 seconds (increased from 20s to reduce load)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !isRefreshing) {
        loadData(false, true, currentTimeWindow)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [currentTimeWindow, loading, isRefreshing, loadData])

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true)
    setCurrentTime(new Date())
  }, [])

  // Update clock every second (only on client)
  useEffect(() => {
    if (!isClient) return
    
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [isClient])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadData(false, true, currentTimeWindow) // Force refresh, bypass cache
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Controls */}
        <div className="flex justify-end items-center gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-gray-400">Live:</span>
              <span className="font-mono-data text-white">
                {isClient && currentTime ? currentTime.toISOString().substr(11, 8) + ' UTC' : '--:--:-- UTC'}
              </span>
            </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Charts Stack - Full Width */}
        <div className="space-y-4">
          {/* Price Chart */}
          <div className="bg-[#0a0a0a] border border-gray-900 p-6 relative">
            {loading && !data[priceTimeWindow] ? <ChartSkeleton /> : (
              <>
                {loadingWindows.has(priceTimeWindow) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded backdrop-blur-sm">
                    <div className="flex items-center gap-2 bg-gray-900/90 px-4 py-2 rounded-lg border border-gray-700">
                      <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span className="text-white text-sm font-medium">Loading data...</span>
                    </div>
                  </div>
                )}
                <PriceChart data={data[priceTimeWindow] || []} onTimeWindowChange={(window) => {
                  setPriceTimeWindow(window)
                  if (!data[window]) {
                    loadData(false, true, window, true) // showOverlay=true for user action
                  }
                }} defaultTimeWindow={priceTimeWindow} />
              </>
            )}
          </div>

          {/* Bid Side Liquidity */}
          <div className="bg-[#0a0a0a] border border-gray-900 p-6 relative">
            {loading && !data[bidLiquidityTimeWindow] ? <ChartSkeleton /> : (
              <>
                {loadingWindows.has(bidLiquidityTimeWindow) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded backdrop-blur-sm">
                    <div className="flex items-center gap-2 bg-gray-900/90 px-4 py-2 rounded-lg border border-gray-700">
                      <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span className="text-white text-sm font-medium">Loading data...</span>
                    </div>
                  </div>
                )}
                <LiquidityChart data={data[bidLiquidityTimeWindow] || []} side="bid" onTimeWindowChange={(window) => {
                  setBidLiquidityTimeWindow(window)
                  if (!data[window]) {
                    loadData(false, true, window, true) // showOverlay=true for user action
                  }
                }} defaultTimeWindow={bidLiquidityTimeWindow} />
              </>
            )}
          </div>

          {/* Ask Side Liquidity */}
          <div className="bg-[#0a0a0a] border border-gray-900 p-6 relative">
            {loading && !data[askLiquidityTimeWindow] ? <ChartSkeleton /> : (
              <>
                {loadingWindows.has(askLiquidityTimeWindow) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded backdrop-blur-sm">
                    <div className="flex items-center gap-2 bg-gray-900/90 px-4 py-2 rounded-lg border border-gray-700">
                      <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span className="text-white text-sm font-medium">Loading data...</span>
                    </div>
                  </div>
                )}
                <LiquidityChart data={data[askLiquidityTimeWindow] || []} side="ask" onTimeWindowChange={(window) => {
                  setAskLiquidityTimeWindow(window)
                  if (!data[window]) {
                    loadData(false, true, window, true) // showOverlay=true for user action
                  }
                }} defaultTimeWindow={askLiquidityTimeWindow} />
              </>
            )}
          </div>

          {/* Funding Rate */}
          <div className="bg-[#0a0a0a] border border-gray-900 p-6 relative">
            {loading && !data[fundingTimeWindow] ? <ChartSkeleton /> : (
              <>
                {loadingWindows.has(fundingTimeWindow) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded backdrop-blur-sm">
                    <div className="flex items-center gap-2 bg-gray-900/90 px-4 py-2 rounded-lg border border-gray-700">
                      <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span className="text-white text-sm font-medium">Loading data...</span>
                    </div>
                  </div>
                )}
                <FundingRateChart data={data[fundingTimeWindow] || []} onTimeWindowChange={(window) => {
                  setFundingTimeWindow(window)
                  if (!data[window]) {
                    loadData(false, true, window, true) // showOverlay=true for user action
                  }
                }} defaultTimeWindow={fundingTimeWindow} />
              </>
            )}
          </div>

          {/* Open Interest */}
          <div className="bg-[#0a0a0a] border border-gray-900 p-6 relative">
            {loading && !data[oiTimeWindow] ? <ChartSkeleton /> : (
              <>
                {loadingWindows.has(oiTimeWindow) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded backdrop-blur-sm">
                    <div className="flex items-center gap-2 bg-gray-900/90 px-4 py-2 rounded-lg border border-gray-700">
                      <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span className="text-white text-sm font-medium">Loading data...</span>
                    </div>
                  </div>
                )}
                <OpenInterestChart data={data[oiTimeWindow] || []} onTimeWindowChange={(window) => {
                  setOiTimeWindow(window)
                  if (!data[window]) {
                    loadData(false, true, window, true) // showOverlay=true for user action
                  }
                }} defaultTimeWindow={oiTimeWindow} />
              </>
            )}
          </div>

          {/* 24h Volume Variation */}
          <div className="bg-[#0a0a0a] border border-gray-900 p-6 relative">
            {loading && !data[volumeTimeWindow] ? <ChartSkeleton /> : (
              <>
                {loadingWindows.has(volumeTimeWindow) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded backdrop-blur-sm">
                    <div className="flex items-center gap-2 bg-gray-900/90 px-4 py-2 rounded-lg border border-gray-700">
                      <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span className="text-white text-sm font-medium">Loading data...</span>
                    </div>
                  </div>
                )}
                <VolumeChart data={data[volumeTimeWindow] || []} onTimeWindowChange={(window) => {
                  setVolumeTimeWindow(window)
                  if (!data[window]) {
                    loadData(false, true, window, true) // showOverlay=true for user action
                  }
                }} defaultTimeWindow={volumeTimeWindow} />
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
