"use client";

import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, Search } from "lucide-react";
import { formatUSD, formatNum, formatPct, timeAgo, formatTsFull } from "@/lib/utils";
import AddressLink from "@/components/AddressLink";

interface Position {
  address: string;
  market: string;
  position_size: number | string;
  entry_price: number | string;
  liquidation_price: number | string | null;
  margin_used: number | string;
  position_value: number | string;
  unrealized_pnl: number | string;
  return_on_equity: number | string;
  leverage_type: string;
  leverage_value: number | string;
  leverage_raw_usd: number | string;
  account_value: number | string;
  total_margin_used: number | string;
  withdrawable: number | string;
  last_updated: string;
  created_at: string;
}

type SortField = "address" | "position_size" | "liquidation_price" | "unrealized_pnl" | "leverage_value";
type SortOrder = "asc" | "desc";
type PositionFilter = "all" | "long" | "short";

interface PositionsTableProps {
  positions: Position[];
  isLoading?: boolean;
}

export default function PositionsTable({ positions, isLoading }: PositionsTableProps) {
  const [sortField, setSortField] = useState<SortField>("position_size");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [positionFilter, setPositionFilter] = useState<PositionFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const filteredPositions = useMemo(() => {
    if (positionFilter === "all") return positions;
    return positions.filter(p => {
      const posSize = parseFloat(String(p.position_size));
      return positionFilter === "long" ? posSize > 0 : posSize < 0;
    });
  }, [positions, positionFilter]);

  const searchedPositions = useMemo(() => {
    if (!searchQuery) return filteredPositions;
    return filteredPositions.filter(p => p.address.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [filteredPositions, searchQuery]);

  const sortedPositions = useMemo(() => {
    const sorted = [...searchedPositions].sort((a, b) => {
      let aVal: string | number | null = a[sortField];
      let bVal: string | number | null = b[sortField];

      if (sortField !== "address") {
        aVal = aVal !== null ? parseFloat(String(aVal)) : null;
        bVal = bVal !== null ? parseFloat(String(bVal)) : null;
      }

      if (sortField === "liquidation_price") {
        if (aVal === null) aVal = sortOrder === "asc" ? Infinity : -Infinity;
        if (bVal === null) bVal = sortOrder === "asc" ? Infinity : -Infinity;
      }

      if (sortField === "position_size" && typeof aVal === "number" && typeof bVal === "number") {
        aVal = Math.abs(aVal);
        bVal = Math.abs(bVal);
      }

      if (aVal === null) aVal = 0;
      if (bVal === null) bVal = 0;

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [searchedPositions, sortField, sortOrder]);

  const paginatedPositions = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedPositions.slice(startIndex, endIndex);
  }, [sortedPositions, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedPositions.length / rowsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [positionFilter, rowsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const toggleRowExpansion = (address: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(address)) {
      newExpanded.delete(address);
    } else {
      newExpanded.add(address);
    }
    setExpandedRows(newExpanded);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-400 ml-1">⇅</span>;
    }
    return (
      <span className="ml-1">
        {sortOrder === "desc" ? "↓" : "↑"}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-[#141414] border border-gray-800 p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin h-10 w-10 border-b-2 border-emerald-400"></div>
          <p className="text-gray-400">Loading positions...</p>
        </div>
      </div>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <div className="bg-[#141414] border border-gray-800 p-8">
        <p className="text-gray-400 text-center">No positions found for this market.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#141414] border border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-white">
            User Positions ({sortedPositions.length})
          </h3>
          
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by address..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="w-full pl-9 pr-4 py-2 bg-[#0a0a0a] border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
            />
          </div>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setPositionFilter("all")}
            className={`px-4 py-2 text-sm font-medium border transition-colors ${
              positionFilter === "all"
                ? "bg-white border-white text-black"
                : "text-gray-400 border-gray-700 hover:bg-gray-700/50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setPositionFilter("long")}
            className={`px-4 py-2 text-sm font-medium border transition-colors ${
              positionFilter === "long"
                ? "bg-white border-white text-black"
                : "text-gray-400 border-gray-700 hover:bg-gray-700/50"
            }`}
          >
            Long
          </button>
          <button
            onClick={() => setPositionFilter("short")}
            className={`px-4 py-2 text-sm font-medium border transition-colors ${
              positionFilter === "short"
                ? "bg-white border-white text-black"
                : "text-gray-400 border-gray-700 hover:bg-gray-700/50"
            }`}
          >
            Short
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0a0a0a] border-b border-gray-800">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  className="text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-gray-200 flex items-center"
                  onClick={() => handleSort("address")}
                >
                  Address
                  <SortIcon field="address" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  className="text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-gray-200 flex items-center"
                  onClick={() => handleSort("position_size")}
                >
                  Position Size
                  <SortIcon field="position_size" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  className="text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-gray-200 flex items-center"
                  onClick={() => handleSort("liquidation_price")}
                >
                  Liquidation Price
                  <SortIcon field="liquidation_price" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  className="text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-gray-200 flex items-center"
                  onClick={() => handleSort("unrealized_pnl")}
                >
                  Unrealized PnL
                  <SortIcon field="unrealized_pnl" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  className="text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-gray-200 flex items-center"
                  onClick={() => handleSort("leverage_value")}
                >
                  Leverage
                  <SortIcon field="leverage_value" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-[#141414] divide-y divide-gray-800">
            {paginatedPositions.map((position) => {
              const isExpanded = expandedRows.has(position.address);
              const posSize = parseFloat(String(position.position_size));
              const pnl = parseFloat(String(position.unrealized_pnl));
              const isLong = posSize > 0;
              const pnlClass = pnl >= 0 ? "text-emerald-400" : "text-red-400";
              
              return (
                <React.Fragment key={position.address}>
                  <tr className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <AddressLink address={position.address} className="text-sm font-medium text-white" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-mono-data text-sm font-medium text-white">
                          {formatNum(Math.abs(posSize), 4)}
                        </div>
                        <div className={`font-mono-data text-xs ${isLong ? "text-emerald-400" : "text-red-400"}`}>
                          {isLong ? "LONG" : "SHORT"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono-data text-sm text-white">
                        {position.liquidation_price ? formatUSD(parseFloat(String(position.liquidation_price))) : "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`font-mono-data text-sm font-medium ${pnlClass}`}>
                        {formatUSD(pnl)}
                      </div>
                      {position.return_on_equity && (
                        <div className={`font-mono-data text-xs ${pnlClass}`}>
                          {parseFloat(String(position.return_on_equity)) >= 0 ? "+" : ""}{formatPct(position.return_on_equity, 2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono-data text-sm text-white">
                        {parseFloat(String(position.leverage_value))}x
                      </div>
                      <div className="font-mono-data text-xs text-gray-400">
                        {position.leverage_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleRowExpansion(position.address)}
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                      >
                        {isExpanded ? "Hide" : "Details"}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-[#0a0a0a]">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Entry Price</div>
                            <div className="font-mono-data font-medium text-white">{formatUSD(parseFloat(String(position.entry_price)))}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Position Value</div>
                            <div className="font-mono-data font-medium text-white">{formatUSD(parseFloat(String(position.position_value)))}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Margin Used</div>
                            <div className="font-mono-data font-medium text-white">{formatUSD(parseFloat(String(position.margin_used)))}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Account Value</div>
                            <div className="font-mono-data font-medium text-white">{formatUSD(parseFloat(String(position.account_value)))}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Margin</div>
                            <div className="font-mono-data font-medium text-white">{formatUSD(parseFloat(String(position.total_margin_used)))}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Withdrawable</div>
                            <div className="font-mono-data font-medium text-white">{formatUSD(parseFloat(String(position.withdrawable)))}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Opened</div>
                            <div className="font-mono-data font-medium text-white" title={formatTsFull(position.created_at)}>
                              {timeAgo(position.created_at)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Last Updated</div>
                            <div className="font-mono-data font-medium text-white" title={formatTsFull(position.last_updated)}>
                              {timeAgo(position.last_updated)}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Rows per page:</label>
          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="px-3 py-1 text-sm border border-gray-700 focus:outline-none focus:border-emerald-500 bg-[#0a0a0a] text-white"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, sortedPositions.length)} of {sortedPositions.length}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={`px-2 py-1 text-sm border transition-colors ${
              currentPage === 1
                ? "text-gray-600 border-gray-800 cursor-not-allowed"
                : "text-gray-300 border-gray-700 hover:bg-gray-700/50"
            }`}
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`px-2 py-1 text-sm border transition-colors ${
              currentPage === 1
                ? "text-gray-600 border-gray-800 cursor-not-allowed"
                : "text-gray-300 border-gray-700 hover:bg-gray-700/50"
            }`}
          >
            Previous
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = currentPage <= 3 
                ? i + 1 
                : currentPage >= totalPages - 2 
                  ? totalPages - 4 + i 
                  : currentPage - 2 + i;
              
              if (pageNum < 1 || pageNum > totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 text-sm border transition-colors ${
                    currentPage === pageNum
                      ? "bg-white border-white text-black font-medium"
                      : "text-gray-300 border-gray-700 hover:bg-gray-700/50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            }).filter(Boolean)}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={`px-2 py-1 text-sm border transition-colors ${
              currentPage === totalPages
                ? "text-gray-600 border-gray-800 cursor-not-allowed"
                : "text-gray-300 border-gray-700 hover:bg-gray-700/50"
            }`}
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className={`px-2 py-1 text-sm border transition-colors ${
              currentPage === totalPages
                ? "text-gray-600 border-gray-800 cursor-not-allowed"
                : "text-gray-300 border-gray-700 hover:bg-gray-700/50"
            }`}
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}
