import MarketSelector from '@/components/MarketSelector'
import { MARKET_CONFIG } from '@/lib/config'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Market Metrics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitoring {MARKET_CONFIG.defaultMarket} market
          </p>
        </div>

        <MarketSelector />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Market Metrics</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Real-time price tracking</li>
              <li>• Liquidity depth analysis (basis points & percentages)</li>
              <li>• Funding rate monitoring</li>
              <li>• Open interest tracking</li>
              <li>• Historical data visualization</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">User Metrics</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Liquidation heatmap visualization</li>
              <li>• Position tracking (longs & shorts)</li>
              <li>• Risk monitoring</li>
              <li>• User PnL analysis</li>
              <li>• Leverage statistics</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> Select a market above to view detailed metrics. Data updates every 30 seconds for user metrics and on refresh for market metrics.
          </p>
        </div>
      </div>
    </div>
  )
}
