import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '-'
  
  if (Math.abs(num) >= 1e9) {
    return `${(num / 1e9).toFixed(2)}B`
  }
  if (Math.abs(num) >= 1e6) {
    return `${(num / 1e6).toFixed(2)}M`
  }
  if (Math.abs(num) >= 1e3) {
    return `${(num / 1e3).toFixed(2)}K`
  }
  
  return num.toFixed(2)
}

export function formatPercentage(num: number | null | undefined): string {
  if (num === null || num === undefined) return '-'
  return `${num.toFixed(4)}%`
}

export function formatTimestamp(timestamp: string | number): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp)
  
  // Check if we're looking at data within the last day
  const now = new Date()
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffHours <= 1) {
    // For past hour, show just time
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } else if (diffHours <= 24) {
    // For past day, show time with hour
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
    })
  } else {
    // For all time, show date and time
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
}

export function formatUSD(x: number | null | undefined): string {
  if (x == null || Number.isNaN(x)) return "—";
  return Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(x);
}

export function formatNum(x: number | null | undefined, digits = 2): string {
  if (x == null || Number.isNaN(x)) return "—";
  return Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(x);
}

export function formatPct(x: number | string | null | undefined, digits = 2): string {
  if (x == null) return "—";
  const num = typeof x === 'string' ? parseFloat(x) : x;
  if (Number.isNaN(num)) return "—";
  return `${num.toFixed(digits)}%`;
}

export function timeAgo(ts?: string | null): string {
  if (!ts) return "—";
  
  let dateStr = ts;
  if (!ts.includes('Z') && !ts.includes('+') && !ts.includes('-', 10)) {
    dateStr = ts + 'Z';
  }
  
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  
  const secs = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (secs < 60) return `${secs.toFixed(0)}s ago`;
  const mins = secs / 60;
  if (mins < 60) return `${mins.toFixed(0)}m ago`;
  const hrs = mins / 60;
  if (hrs < 24) return `${hrs.toFixed(1)}h ago`;
  const days = hrs / 24;
  return `${days.toFixed(1)}d ago`;
}

export function formatTsFull(ts?: string): string {
  if (!ts) return "—";
  
  let dateStr = ts;
  if (!ts.includes('Z') && !ts.includes('+') && !ts.includes('-', 10)) {
    dateStr = ts + 'Z';
  }
  
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  
  return d.toLocaleString([], { 
    year: "numeric",
    month: "short", 
    day: "numeric", 
    hour: "2-digit", 
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short"
  });
}
