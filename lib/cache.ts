// Simple in-memory cache for API responses
interface CacheEntry {
  data: any
  timestamp: number
  sampled: boolean
}

class DataCache {
  private cache: Map<string, CacheEntry> = new Map()
  private readonly maxAge = 30000 // Cache for 30 seconds (faster updates)
  
  getCacheKey(timeWindow: string, coin?: string): string {
    return `${timeWindow}-${coin || 'none'}`
  }
  
  get(timeWindow: string, coin?: string): CacheEntry | null {
    const key = this.getCacheKey(timeWindow, coin)
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Check if cache is expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key)
      return null
    }
    
    return entry
  }
  
  set(timeWindow: string, coin: string | undefined, data: any, sampled: boolean): void {
    const key = this.getCacheKey(timeWindow, coin)
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      sampled
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
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key)
      }
    }
  }
}

export const dataCache = new DataCache()
