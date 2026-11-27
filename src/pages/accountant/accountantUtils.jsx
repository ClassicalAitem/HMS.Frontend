import React, { useState, useMemo, useEffect } from "react";
import { FaCalendarAlt, FaDownload, FaSyncAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";

export const formatNaira = (val) => {
  const num = Number(val || 0);
  return `₦${num.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const exportToCsv = (filename, headers, rows) => {
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const PERIOD_OPTIONS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Custom Range" },
  { key: "all", label: "All Time" },
];

export const PeriodFilterBar = ({
  period,
  setPeriod,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onExportCsv,
  exportLabel = "Export CSV",
  onRefresh,
  refreshing = false,
}) => {
  return (
    <div className="bg-base-100 rounded-2xl border border-base-200 p-4 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-base-content/70 mr-1">
          <FaCalendarAlt className="w-3.5 h-3.5 text-primary" />
          Period:
        </span>
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setPeriod(opt.key)}
            className={`btn btn-xs sm:btn-sm rounded-xl transition-all ${
              period === opt.key
                ? "btn-primary text-primary-content shadow-xs"
                : "btn-ghost bg-base-200/60 hover:bg-base-200 text-base-content/80"
            }`}
          >
            {opt.label}
          </button>
        ))}

        {period === "custom" && (
          <div className="flex flex-wrap items-center gap-2 ml-0 sm:ml-2 mt-2 sm:mt-0">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input input-bordered input-xs sm:input-sm rounded-xl bg-base-100"
              aria-label="Start date"
            />
            <span className="text-xs text-base-content/60">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input input-bordered input-xs sm:input-sm rounded-xl bg-base-100"
              aria-label="End date"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 self-end lg:self-auto">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="btn btn-xs sm:btn-sm btn-ghost bg-base-200/70 hover:bg-base-200 rounded-xl gap-1.5"
          >
            <FaSyncAlt className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        )}
        {onExportCsv && (
          <button
            type="button"
            onClick={onExportCsv}
            className="btn btn-xs sm:btn-sm btn-primary rounded-xl gap-1.5"
          >
            <FaDownload className="w-3.5 h-3.5" />
            {exportLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export const usePagination = (items = [], initialPageSize = 15) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [totalItems, pageSize]);

  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return {
    currentPage: safePage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems,
  };
};

const getPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("...");
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
};

export const PaginationBar = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 15, 25, 50, 100],
}) => {
  if (totalItems === 0) return null;

  const startEntry = (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, totalItems);
  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 mt-4 border-t border-base-200 text-xs">
      <div className="flex flex-wrap items-center gap-3 text-base-content/70">
        <span>
          Showing <strong>{startEntry}</strong>–<strong>{endEntry}</strong> of{" "}
          <strong>{totalItems}</strong>
        </span>
        {onPageSizeChange && (
          <label className="inline-flex items-center gap-1.5">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="select select-bordered select-xs rounded-lg bg-base-100"
            >
              {pageSizeOptions.map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="btn btn-xs btn-ghost bg-base-200/70 rounded-lg disabled:opacity-40"
          aria-label="Previous page"
        >
          <FaChevronLeft className="w-3 h-3" />
        </button>

        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={`dots-${idx}`} className="px-1.5 text-base-content/50">
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`btn btn-xs rounded-lg min-w-7 ${
                p === currentPage
                  ? "btn-primary text-primary-content"
                  : "btn-ghost bg-base-200/50 hover:bg-base-200"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="btn btn-xs btn-ghost bg-base-200/70 rounded-lg disabled:opacity-40"
          aria-label="Next page"
        >
          <FaChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
