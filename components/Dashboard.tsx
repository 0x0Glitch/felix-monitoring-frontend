'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { LiquidityChart } from '@/components/charts/LiquidityChart'
import { FundingRateChart } from '@/components/charts/FundingRateChart'
import { OpenInterestChart } from '@/components/charts/OpenInterestChart'
import { PriceChart } from '@/components/charts/PriceChart'
import type { TimeWindow } from '@/components/TimeWindowSelector'
import { ChartSkeleton } from '@/components/ChartSkeleton'
import { fetchMarketData, formatChartData } from '@/lib/data-fetchers-new'
import { SCHEMA_NAME, TABLE_NAME } from '@/lib/supabase'
import { RefreshCw, AlertCircle } from 'lucide-react'

interface DashboardProps {
  coin?: string
}

export function Dashboard({ coin }: DashboardProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [isSampled, setIsSampled] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isClient, setIsClient] = useState(false)

  const loadData = useCallback(async (showLoadingState = true, forceRefresh = false) => {
    // Only show full loading state on initial load or manual refresh
    if (showLoadingState) {
      setLoading(true)
    }
    setError(null)
    
    try {
      // Always fetch all data and let individual charts filter it
      const result = await fetchMarketData('all', coin, forceRefresh)
      
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
  }, [coin])

  // Load data when component mounts
  useEffect(() => {
    loadData(true, true)
  }, [loadData])

  // Auto-refresh every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false, true) // Refresh without showing loading state
    }, 20000) // 20 seconds

    return () => clearInterval(interval)
  }, [loadData])

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
    loadData(false, true) // Force refresh, bypass cache
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Controls */}
        <div className="flex justify-end items-center gap-4 mb-6">
            {isSampled && (
              <span className="text-xs px-3 py-1.5 bg-[#1a1a1a] text-amber-400 border border-gray-800">
                Data sampled
              </span>
            )}
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
          <div className="bg-[#0a0a0a] border border-gray-900 p-6">
            {loading ? <ChartSkeleton /> : <PriceChart data={data} />}
          </div>

          {/* Bid Side Liquidity */}
          <div className="bg-[#0a0a0a] border border-gray-900 p-6">
            {loading ? <ChartSkeleton /> : <LiquidityChart data={data} side="bid" />}
          </div>

          {/* Ask Side Liquidity */}
          <div className="bg-[#0a0a0a] border border-gray-900 p-6">
            {loading ? <ChartSkeleton /> : <LiquidityChart data={data} side="ask" />}
          </div>

          {/* Funding Rate */}
          <div className="bg-[#0a0a0a] border border-gray-900 p-6">
            {loading ? <ChartSkeleton /> : <FundingRateChart data={data} />}
          </div>

          {/* Open Interest */}
          <div className="bg-[#0a0a0a] border border-gray-900 p-6">
            {loading ? <ChartSkeleton /> : <OpenInterestChart data={data} />}
          </div>
        </div>

      </div>
    </div>
  )
}
