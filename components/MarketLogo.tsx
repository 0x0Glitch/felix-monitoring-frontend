import React from 'react';
import Image from 'next/image';

interface MarketLogoProps {
  logo?: string;
  symbol: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function MarketLogo({ logo, symbol, color, size = 'md' }: MarketLogoProps) {
  const sizeMap = {
    sm: 24,
    md: 32,
    lg: 48
  };

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg'
  };

  const pixelSize = sizeMap[size];

  // Use actual logo images if available (try PNG first for Tesla/NVIDIA, then SVG)
  if (logo && ['tesla', 'nvidia', 'xyz'].includes(logo)) {
    return (
      <div className={`${sizeClasses[size]} flex items-center justify-center relative`}>
        <Image
          src={`/logos/${logo}.png`}
          alt={`${symbol} logo`}
          width={pixelSize}
          height={pixelSize}
          className="object-contain"
          priority
          onError={(e) => {
            // Try SVG fallback
            const target = e.target as HTMLImageElement;
            target.src = `/logos/${logo}.svg`;
            target.onerror = () => {
              // Final fallback: hide image, text will show
              target.style.display = 'none';
            };
          }}
        />
      </div>
    );
  }

  // Fallback to text-based logo
  return (
    <div 
      className={`${sizeClasses[size]} flex items-center justify-center font-bold ${textSizeClasses[size]}`}
      style={{ 
        backgroundColor: color ? `${color}20` : '#6366F120',
        color: color || '#6366F1'
      }}
    >
      {symbol.slice(0, 3)}
    </div>
  );
}
