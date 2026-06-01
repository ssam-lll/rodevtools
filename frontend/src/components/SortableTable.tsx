"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Filter, X } from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  isNumeric?: boolean;
  align?: "left" | "center" | "right";
  render: (item: T, index: number) => React.ReactNode;
  sortValue?: (item: T) => number | string;
  filterOptions?: string[];
  width?: string;
}

interface SortableTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  defaultSortKey?: string;
  defaultSortDir?: "asc" | "desc";
  onRowClick?: (item: T) => void;
  loading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  rowKey: (item: T) => string;
  rowClassName?: string;
  // Server-side pagination props
  currentPage?: number;
  totalPages?: number;
  totalElements?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

function NumericFilterPopover({
  initialValue,
  onApply,
  onClear,
  onClose,
  columnLabel,
}: {
  initialValue: string;
  onApply: (value: string) => void;
  onClear: () => void;
  onClose: () => void;
  columnLabel: string;
}) {
  const parsed = useMemo(() => {
    try {
      if (initialValue && initialValue.startsWith("{")) {
        return JSON.parse(initialValue);
      }
    } catch (e) {}
    return { min: "", max: "" };
  }, [initialValue]);

  const [min, setMin] = useState(parsed.min || "");
  const [max, setMax] = useState(parsed.max || "");

  const handleApply = () => {
    if (min === "" && max === "") {
      onClear();
    } else {
      onApply(JSON.stringify({ min, max }));
    }
    onClose();
  };

  const handleClear = () => {
    setMin("");
    setMax("");
    onClear();
    onClose();
  };

  return (
    <div className="flex flex-col gap-sm p-xs min-w-[240px]">
      <div className="flex items-center gap-sm">
        <input
          type="number"
          placeholder="Min"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          className="w-full px-sm py-xs rounded bg-surface-container-high border border-outline-variant/60 focus:border-primary focus:outline-none text-xs text-foreground placeholder:text-on-surface-variant/40"
        />
        <span className="text-on-surface-variant text-xs font-semibold">—</span>
        <input
          type="number"
          placeholder="Max"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          className="w-full px-sm py-xs rounded bg-surface-container-high border border-outline-variant/60 focus:border-primary focus:outline-none text-xs text-foreground placeholder:text-on-surface-variant/40"
        />
      </div>
      <div className="flex gap-sm justify-between mt-sm">
        <button
          onClick={handleClear}
          className="flex-1 px-sm py-1.5 rounded-lg border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/10 transition-all text-center cursor-pointer"
        >
          Clear
        </button>
        <button
          onClick={handleApply}
          className="flex-1 px-sm py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all text-center cursor-pointer"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

function TextFilterPopover({
  initialValue,
  onApply,
  onClear,
  onClose,
  columnLabel,
}: {
  initialValue: string;
  onApply: (value: string) => void;
  onClear: () => void;
  onClose: () => void;
  columnLabel: string;
}) {
  const [val, setVal] = useState(initialValue || "");

  const handleApply = () => {
    onApply(val);
    onClose();
  };

  const handleClear = () => {
    setVal("");
    onClear();
    onClose();
  };

  return (
    <div className="flex flex-col gap-sm p-xs min-w-[200px]">
      <input
        type="text"
        placeholder={`Search ${columnLabel}...`}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleApply()}
        autoFocus
        className="w-full px-sm py-xs rounded bg-surface-container-high border border-outline-variant/60 focus:border-primary focus:outline-none text-xs text-foreground placeholder:text-on-surface-variant/40"
      />
      <div className="flex gap-sm justify-between mt-sm">
        <button
          onClick={handleClear}
          className="flex-1 px-sm py-1.5 rounded-lg border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/10 transition-all text-center cursor-pointer"
        >
          Clear
        </button>
        <button
          onClick={handleApply}
          className="flex-1 px-sm py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all text-center cursor-pointer"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

type SortDirection = "asc" | "desc";

export default function SortableTable<T>({
  data,
  columns,
  defaultSortKey,
  defaultSortDir = "desc",
  onRowClick,
  loading = false,
  loadingMessage = "Loading data...",
  emptyMessage = "No data found.",
  rowKey,
  rowClassName = "",
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
}: SortableTableProps<T>) {
  const hasPagination = totalPages !== undefined && totalPages > 1 && onPageChange;
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey || null);
  const [sortDir, setSortDir] = useState<SortDirection>(defaultSortDir);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }, [sortKey]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value === "") {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  }, []);

  const clearFilter = useCallback((key: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setActiveFilter(null);
  }, []);

  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;
      const col = columns.find((c) => c.key === key);
      if (!col) return;

      const trimmedVal = value.trim();

      result = result.filter((item) => {
        const sortVal = col.sortValue ? col.sortValue(item) : "";
        
        // Support Min-Max filtering for numeric columns
        if (col.isNumeric && typeof sortVal === "number" && trimmedVal.startsWith("{")) {
          try {
            const { min, max } = JSON.parse(trimmedVal);
            const minNum = min !== "" && min !== undefined ? parseFloat(min) : null;
            const maxNum = max !== "" && max !== undefined ? parseFloat(max) : null;
            if (minNum !== null && sortVal < minNum) return false;
            if (maxNum !== null && sortVal > maxNum) return false;
            return true;
          } catch (e) {
            // fallback
          }
        }

        // Support mathematical operator filtering for numeric values
        if (typeof sortVal === "number") {
          const operatorMatch = trimmedVal.match(/^(>=|<=|>|<|=)\s*(-?\d+(\.\d+)?)$/);
          if (operatorMatch) {
            const op = operatorMatch[1];
            const numLimit = parseFloat(operatorMatch[2]);
            if (op === ">") return sortVal > numLimit;
            if (op === "<") return sortVal < numLimit;
            if (op === ">=") return sortVal >= numLimit;
            if (op === "<=") return sortVal <= numLimit;
            if (op === "=") return sortVal === numLimit;
          }
        }

        return String(sortVal).toLowerCase().includes(trimmedVal.toLowerCase());
      });
    });

    // Apply sorting
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sortValue) {
        result.sort((a, b) => {
          const aVal = col.sortValue!(a);
          const bVal = col.sortValue!(b);
          if (typeof aVal === "number" && typeof bVal === "number") {
            return sortDir === "asc" ? aVal - bVal : bVal - aVal;
          }
          const aStr = String(aVal).toLowerCase();
          const bStr = String(bVal).toLowerCase();
          return sortDir === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
        });
      }
    }

    return result;
  }, [data, sortKey, sortDir, filters, columns]);

  const activeFilterCount = Object.keys(filters).length;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest/40 backdrop-blur-sm">
      {/* Active filters bar */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-sm px-md py-sm border-b border-outline-variant/30 bg-surface-container/30">
          <Filter className="w-3.5 h-3.5 text-primary" />
          <span className="text-body-sm text-on-surface-variant">Active filters:</span>
          {Object.entries(filters).map(([key, value]) => {
            const col = columns.find((c) => c.key === key);
            let displayValue = value;
            if (col?.isNumeric && value.startsWith("{")) {
              try {
                const { min, max } = JSON.parse(value);
                if (min !== "" && max !== "") {
                  displayValue = `${min} - ${max}`;
                } else if (min !== "") {
                  displayValue = `>= ${min}`;
                } else if (max !== "") {
                  displayValue = `<= ${max}`;
                }
              } catch (e) {}
            }
            return (
              <span
                key={key}
                className="inline-flex items-center gap-xs px-sm py-xs rounded-md bg-primary/10 text-primary text-xs font-semibold"
              >
                {col?.label}: {displayValue}
                <button onClick={() => clearFilter(key)} className="hover:text-error transition-colors cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          <button
            onClick={() => setFilters({})}
            className="text-xs text-on-surface-variant hover:text-error font-semibold ml-auto transition-colors cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant/60 bg-surface-container/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`p-md text-label-caps text-on-surface-variant font-semibold select-none relative ${
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                  } ${col.sortable ? "cursor-pointer hover:text-primary group/th transition-colors" : ""}`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <div className={`flex items-center gap-xs ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : ""}`}>
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="inline-flex flex-col">
                        {sortKey === col.key ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-primary" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3.5 h-3.5 opacity-30 group-hover/th:opacity-70 transition-opacity" />
                        )}
                      </span>
                    )}
                    {col.filterable && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFilter(activeFilter === col.key ? null : col.key);
                        }}
                        className={`p-0.5 rounded hover:bg-primary/10 transition-colors ${
                          filters[col.key] ? "text-primary" : "text-on-surface-variant/40 hover:text-on-surface-variant"
                        }`}
                      >
                        <Filter className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {/* Floating popover filter */}
                  {col.filterable && activeFilter === col.key && (
                    <>
                      <div 
                        className="fixed inset-0 z-40 bg-transparent cursor-default"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFilter(null);
                        }}
                      />
                      <div 
                        className="absolute right-0 mt-xs p-md rounded-xl border border-outline bg-surface-container shadow-2xl z-50 text-left cursor-default font-normal normal-case tracking-normal"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {col.isNumeric ? (
                          <NumericFilterPopover
                            initialValue={filters[col.key] || ""}
                            onApply={(val) => handleFilterChange(col.key, val)}
                            onClear={() => clearFilter(col.key)}
                            onClose={() => setActiveFilter(null)}
                            columnLabel={col.label}
                          />
                        ) : (
                          <TextFilterPopover
                            initialValue={filters[col.key] || ""}
                            onApply={(val) => handleFilterChange(col.key, val)}
                            onClear={() => clearFilter(col.key)}
                            onClose={() => setActiveFilter(null)}
                            columnLabel={col.label}
                          />
                        )}
                      </div>
                    </>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-xl text-center text-body-md text-on-surface-variant font-mono">
                  <div className="flex items-center justify-center gap-sm">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>{loadingMessage}</span>
                  </div>
                </td>
              </tr>
            ) : processedData.length > 0 ? (
              processedData.map((item, idx) => (
                <tr
                  key={rowKey(item)}
                  className={`hover:bg-surface-container-high/40 transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  } ${rowClassName}`}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`p-md ${
                        col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""
                      }`}
                    >
                      {col.render(item, idx)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-xl text-center text-body-md text-on-surface-variant">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {hasPagination && (
        <div className="flex items-center justify-between px-md py-sm border-t border-outline-variant/30 bg-surface-container/30">
          <span className="text-xs text-on-surface-variant font-mono">
            {totalElements !== undefined
              ? `${(currentPage! * (pageSize || 20)) + 1}–${Math.min((currentPage! + 1) * (pageSize || 20), totalElements)} of ${totalElements.toLocaleString()}`
              : `Page ${(currentPage || 0) + 1} of ${totalPages}`
            }
          </span>
          <div className="flex items-center gap-xs">
            <button
              onClick={() => onPageChange!(currentPage! - 1)}
              disabled={currentPage === 0}
              className="px-sm py-1 rounded-md text-xs font-semibold border border-outline-variant/40 hover:bg-surface-container-high hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              ← Previous
            </button>
            {/* Page number buttons (show up to 5) */}
            {(() => {
              const pages: number[] = [];
              const start = Math.max(0, (currentPage || 0) - 2);
              const end = Math.min(totalPages!, start + 5);
              for (let i = start; i < end; i++) pages.push(i);
              return pages.map((p) => (
                <button
                  key={p}
                  onClick={() => onPageChange!(p)}
                  className={`w-8 h-8 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    p === currentPage
                      ? "bg-primary text-on-primary shadow-[0_0_10px_rgba(0,175,244,0.3)]"
                      : "border border-outline-variant/40 hover:bg-surface-container-high hover:border-primary/30"
                  }`}
                >
                  {p + 1}
                </button>
              ));
            })()}
            <button
              onClick={() => onPageChange!(currentPage! + 1)}
              disabled={currentPage === totalPages! - 1}
              className="px-sm py-1 rounded-md text-xs font-semibold border border-outline-variant/40 hover:bg-surface-container-high hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
