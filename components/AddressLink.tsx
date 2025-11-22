"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

interface AddressLinkProps {
  address: string;
  className?: string;
}

export default function AddressLink({ address, className = "" }: AddressLinkProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Format address as 0xABCD...WXYZ
  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const explorerUrl = `https://app.hyperliquid.xyz/explorer/address/${address}`;

  return (
    <div className="relative inline-block">
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 hover:text-emerald-400 transition-colors ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="font-mono-data">{formatAddress(address)}</span>
        <ExternalLink className="w-3 h-3" />
      </a>

      {/* Tooltip with full address */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-0 mb-2 px-3 py-2 bg-[#0a0a0a] border border-gray-700 text-xs text-white font-mono-data whitespace-nowrap">
          {address}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-700"></div>
        </div>
      )}
    </div>
  );
}
