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
  onSortChange?: (key: string, dir: "asc" | "desc") => void;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  rowKey: (item: T) => string;
  rowClassName?: string;
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
    } catch {}
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
    <div className="flex flex-col gap-3 p-3 min-w-[240px]">
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Min"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          className="w-full px-3 py-1.5 rounded bg-surface-container-high border border-outline-variant/60 focus:border-primary focus:outline-none text-xs text-foreground placeholder:text-on-surface-muted font-mono tabular-nums"
        />
        <span className="text-on-surface-variant text-xs font-semibold">-</span>
        <input
          type="number"
          placeholder="Max"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          className="w-full px-3 py-1.5 rounded bg-surface-container-high border border-outline-variant/60 focus:border-primary focus:outline-none text-xs text-foreground placeholder:text-on-surface-muted font-mono tabular-nums"
        />
      </div>
      <div className="flex gap-2 justify-between mt-2">
        <button
          type="button"
          onClick={handleClear}
          className="flex-1 px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/10 transition-all text-center cursor-pointer"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all text-center cursor-pointer"
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
    <div className="flex flex-col gap-3 p-3 min-w-[200px]">
      <input
        type="text"
        placeholder={`Search ${columnLabel}...`}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleApply()}
        autoFocus
        className="w-full px-3 py-1.5 rounded bg-surface-container-high border border-outline-variant/60 focus:border-primary focus:outline-none text-xs text-foreground placeholder:text-on-surface-muted"
      />
      <div className="flex gap-2 justify-between mt-2">
        <button
          type="button"
          onClick={handleClear}
          className="flex-1 px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/10 transition-all text-center cursor-pointer"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all text-center cursor-pointer"
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
  onSortChange,
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

  const handleSort = useCallback(
    (key: string) => {
      const nextDir: SortDirection = sortKey === key ? (sortDir === "asc" ? "desc" : "asc") : "desc";
      setSortKey(key);
      setSortDir(nextDir);
      onSortChange?.(key, nextDir);
    },
    [sortKey, sortDir, onSortChange]
  );

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

    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;
      const col = columns.find((c) => c.key === key);
      if (!col) return;

      const trimmedVal = value.trim();

      result = result.filter((item) => {
        const sortVal = col.sortValue ? col.sortValue(item) : "";

        if (col.isNumeric && typeof sortVal === "number" && trimmedVal.startsWith("{")) {
          try {
            const { min, max } = JSON.parse(trimmedVal);
            const minNum = min !== "" && min !== undefined ? parseFloat(min) : null;
            const maxNum = max !== "" && max !== undefined ? parseFloat(max) : null;
            if (minNum !== null && sortVal < minNum) return false;
            if (maxNum !== null && sortVal > maxNum) return false;
            return true;
          } catch {}
        }

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
    <div className="w-full overflow-hidden rounded-2xl surface-card">
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/30 bg-surface-container-low/60">
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
              } catch {}
            }
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold"
              >
                {col?.label}: {displayValue}
                <button
                  type="button"
                  onClick={() => clearFilter(key)}
                  aria-label={`Remove ${col?.label} filter`}
                  className="p-1 hover:text-error transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          <button
            type="button"
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
            <tr className="border-b border-white/[0.06] bg-surface-container-low/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  aria-sort={
                    col.sortable
                      ? sortKey === col.key
                        ? sortDir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                      : undefined
                  }
                  tabIndex={col.sortable ? 0 : undefined}
                  onKeyDown={
                    col.sortable
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSort(col.key);
                          }
                        }
                      : undefined
                  }
                  className={`px-4 py-3.5 text-label-caps text-on-surface-muted font-semibold select-none relative ${
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                  } ${col.sortable ? "cursor-pointer hover:text-foreground focus-visible:outline-none focus-visible:text-foreground group/th transition-colors" : ""}`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <div className={`flex items-center gap-1.5 ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : ""}`}>
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="inline-flex flex-col">
                        {sortKey === col.key ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="w-3.5 h-3.5 text-foreground" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-foreground" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 group-hover/th:opacity-80 transition-opacity" />
                        )}
                      </span>
                    )}
                    {col.filterable && (
                      <button
                        type="button"
                        aria-label={`Filter by ${col.label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFilter(activeFilter === col.key ? null : col.key);
                        }}
                        className={`w-7 h-7 flex items-center justify-center rounded hover:bg-white/[0.06] transition-colors cursor-pointer ${
                          filters[col.key] ? "text-primary" : "text-on-surface-muted hover:text-on-surface-variant"
                        }`}
                      >
                        <Filter className="w-3 h-3" />
                      </button>
                    )}
                  </div>
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
                        className="absolute right-0 mt-2 p-4 rounded-xl border liquid-glass shadow-2xl z-50 text-left cursor-default font-normal normal-case tracking-normal"
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
          <tbody className="divide-y divide-white/[0.05]">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 px-4 text-center text-body-md text-on-surface-variant font-mono">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>{loadingMessage}</span>
                  </div>
                </td>
              </tr>
            ) : processedData.length > 0 ? (
              processedData.map((item, idx) => (
                <tr
                  key={rowKey(item)}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? "button" : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(item);
                          }
                        }
                      : undefined
                  }
                  className={`hover:bg-white/[0.03] focus-visible:outline-none focus-visible:bg-white/[0.05] transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  } ${rowClassName}`}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3.5 ${
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
                <td colSpan={columns.length} className="py-12 px-4 text-center text-body-md text-on-surface-variant">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasPagination && (
        <div className="flex items-center justify-between px-4 py-3.5 border-t border-white/[0.06] bg-surface-container-low/60">
          <span className="text-xs text-on-surface-variant font-mono tabular-nums">
            {totalElements !== undefined
              ? `${currentPage! * (pageSize || 20) + 1}–${Math.min((currentPage! + 1) * (pageSize || 20), totalElements)} of ${totalElements.toLocaleString()}`
              : `Page ${(currentPage || 0) + 1} of ${totalPages}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange!(currentPage! - 1)}
              disabled={currentPage === 0}
              className="px-3 py-1.5 rounded-md text-xs font-semibold border border-outline-variant/40 hover:bg-surface-container-high hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              ← Previous
            </button>
            {(() => {
              const pages: number[] = [];
              const start = Math.max(0, (currentPage || 0) - 2);
              const end = Math.min(totalPages!, start + 5);
              for (let i = start; i < end; i++) pages.push(i);
              return pages.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => onPageChange!(p)}
                  className={`w-8 h-8 rounded-md text-xs font-semibold font-mono tabular-nums transition-all cursor-pointer ${
                    p === currentPage
                      ? "bg-primary text-on-primary shadow-sm"
                      : "border border-outline-variant/40 hover:bg-surface-container-high hover:border-primary/30"
                  }`}
                >
                  {p + 1}
                </button>
              ));
            })()}
            <button
              type="button"
              onClick={() => onPageChange!(currentPage! + 1)}
              disabled={currentPage === totalPages! - 1}
              className="px-3 py-1.5 rounded-md text-xs font-semibold border border-outline-variant/40 hover:bg-surface-container-high hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
