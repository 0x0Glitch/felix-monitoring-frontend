# Market Metrics Dashboard

A real-time market data visualization dashboard built with Next.js, TypeScript, and Supabase. This dashboard displays multiple interactive charts showing liquidity, funding rates, open interest, and price data.

## Features

- **Multiple Chart Types:**
  - **Liquidity Charts**: Separate bid and ask side charts showing depth at 5% and 10%
  - **Funding Rate Chart**: Area chart displaying funding rate percentage over time
  - **Open Interest Chart**: Visualizes open interest trends
  - **Price Chart**: Compares mark price, mean impact price, and oracle price

- **Interactive Features:**
  - Time window selector (Past Hour, Past Day, All Time)
  - Zoom and pan functionality with brush sliders on each chart
  - Responsive design for mobile and desktop
  - Dark mode support
  - Manual refresh capability

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

Update the `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Direct connection string
NEXT_PUBLIC_DATABASE_URL=postgresql://user:password@host:port/database?schema=market_metrics
```

### 3. Schema and Table Configuration

The schema (`market_metrics`) and table name (`xyz_xyz100_metrics_raw`) are defined in `lib/supabase.ts`. If you need to change these, update the constants in that file:

```typescript
export const SCHEMA_NAME = 'market_metrics'
export const TABLE_NAME = 'xyz_xyz100_metrics_raw'
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Database Schema

The dashboard expects a table with the following columns:
- `timestamp` (timestamp with time zone)
- `coin` (varchar)
- `mark_price` (numeric)
- `oracle_price` (numeric)
- `impact_px_bid` (numeric)
- `impact_px_ask` (numeric)
- `funding_rate_pct` (numeric)
- `open_interest` (numeric)
- `bid_depth_5pct` (numeric)
- `ask_depth_5pct` (numeric)
- `bid_depth_10pct` (numeric)
- `ask_depth_10pct` (numeric)

## Project Structure

```
market-metrics-dashboard/
├── app/
│   ├── page.tsx          # Main page component
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── Dashboard.tsx     # Main dashboard component
│   ├── TimeWindowSelector.tsx
│   ├── ChartSkeleton.tsx
│   └── charts/
│       ├── LiquidityChart.tsx
│       ├── FundingRateChart.tsx
│       ├── OpenInterestChart.tsx
│       └── PriceChart.tsx
├── lib/
│   ├── supabase.ts       # Supabase client configuration
│   ├── data-fetchers.ts  # Data fetching functions
│   └── utils.ts          # Utility functions
└── .env.local            # Environment variables
```

## Key Features Implementation

- **No Live Updates**: Data is fetched once when the time window changes or when manually refreshed
- **Chart Interactivity**: Each chart includes a brush slider for focusing on specific time ranges
- **Responsive Design**: Adapts to different screen sizes with a mobile-first approach
- **Error Handling**: Graceful error states when data fetching fails
- **Loading States**: Skeleton loaders while data is being fetched

## Deployment

To deploy to production:

```bash
npm run build
npm run start
```

Or deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/market-metrics-dashboard)
