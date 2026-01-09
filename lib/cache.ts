// Simple in-memory cache for API responses
interface CacheEntry {
  data: any
  timestamp: number
  sampled: boolean
  ttl: number
}

class DataCache {
  private cache: Map<string, CacheEntry> = new Map()

  // Adaptive TTL based on time window
  private getTTL(timeWindow: string): number {
    switch (timeWindow) {
      case '1h':
        return 60000 // 1 minute for real-time data
      case '1d':
        return 120000 // 2 minutes for daily
      case '7d':
        return 300000 // 5 minutes for weekly
      case '30d':
        return 600000 // 10 minutes for monthly
      case 'all':
        return 900000 // 15 minutes for all-time
      default:
        return 120000 // 2 minutes default
    }
  }

  getCacheKey(timeWindow: string, coin?: string): string {
    return `${timeWindow}-${coin || 'none'}`
  }

  get(timeWindow: string, coin?: string): CacheEntry | null {
    const key = this.getCacheKey(timeWindow, coin)
    const entry = this.cache.get(key)

    if (!entry) return null

    // Check if cache is expired using entry-specific TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry
  }

  set(timeWindow: string, coin: string | undefined, data: any, sampled: boolean): void {
    const key = this.getCacheKey(timeWindow, coin)
    const ttl = this.getTTL(timeWindow)

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      sampled,
      ttl
    })

    // Clean up old entries
    this.cleanup()
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  invalidate(timeWindow?: string, coin?: string): void {
    if (timeWindow) {
      const key = this.getCacheKey(timeWindow, coin)
      this.cache.delete(key)
    } else {
      this.clear()
    }
  }
  
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

export const dataCache = new DataCache()
