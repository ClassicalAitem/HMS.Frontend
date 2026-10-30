import React, { useState, useEffect, useCallback, useRef } from 'react';
import RoleBasedLayout from '@/layouts/RoleBasedLayout';
import supportAPI from '@/services/api/supportAPI';
import toast from 'react-hot-toast';
import {
  FaTerminal,
  FaSync,
  FaSearch,
  FaFilter,
  FaDownload,
  FaCopy,
  FaCheck,
  FaPause,
  FaPlay,
  FaArrowDown,
  FaArrowUp,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTrash,
  FaServer,
} from 'react-icons/fa';

const AUTO_REFRESH_INTERVALS = [
  { label: 'Off', value: 0 },
  { label: '3s', value: 3000 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
];

const SystemLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [fileStats, setFileStats] = useState({ size: '0 KB', lastModified: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [limit, setLimit] = useState(250);
  const [refreshInterval, setRefreshInterval] = useState(0);

  // UI State
  const [isCopied, setIsCopied] = useState(false);
  const terminalEndRef = useRef(null);
  const terminalTopRef = useRef(null);

  const fetchLogs = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await supportAPI.getLogs({
        level: levelFilter !== 'ALL' ? levelFilter : undefined,
        search: search.trim() || undefined,
        limit,
      });

      if (res?.data) {
        setLogs(res.data.entries || []);
        if (res.data.fileStats) {
          setFileStats(res.data.fileStats);
        }
      }
    } catch (err) {
      console.error('Failed to fetch server logs:', err);
      if (!isBackground) {
        toast.error(err.response?.data?.error || 'Failed to fetch server logs');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [levelFilter, search, limit]);

  // Initial load
  useEffect(() => {
    fetchLogs(false);
  }, [fetchLogs]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval === 0) return;
    const timer = setInterval(() => {
      fetchLogs(true);
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [refreshInterval, fetchLogs]);

  const handleCopyLogs = () => {
    if (!logs.length) return;
    const text = logs.map((l) => `${l.timestamp} | ${l.level} | ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success('Logs copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    if (!logs.length) return;
    const text = logs.map((l) => `${l.timestamp} | ${l.level} | ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hms-server-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Log export downloaded');
  };

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    terminalTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const errorCount = logs.filter((l) => l.level === 'ERROR').length;
  const warnCount = logs.filter((l) => l.level === 'WARN').length;
  const infoCount = logs.filter((l) => l.level === 'INFO').length;

  return (
    <RoleBasedLayout>
      <div className="space-y-4 max-w-7xl mx-auto pb-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-base-100 p-5 rounded-2xl border border-base-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-neutral text-neutral-content">
              <FaTerminal className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-base-content">
                  Live Server Logs
                </h1>
                <span className="badge badge-neutral font-mono text-[10px] uppercase font-bold">
                  ./logs/general.log
                </span>
                {fileStats.size && (
                  <span className="badge badge-ghost text-[10px] font-mono">
                    Size: {fileStats.size}
                  </span>
                )}
              </div>
              <p className="text-xs text-base-content/60 mt-0.5">
                Real-time Winston backend logs, HTTP requests, API exceptions, and socket events.
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] font-mono mr-2">
              <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 font-bold border border-red-500/20">
                {errorCount} Errors
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20">
                {warnCount} Warns
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-bold border border-blue-500/20">
                {infoCount} Info
              </span>
            </div>

            <button
              onClick={() => fetchLogs(false)}
              disabled={isLoading || isRefreshing}
              className="btn btn-sm btn-primary gap-1.5 rounded-xl"
              title="Refresh logs now"
            >
              <FaSync className={`w-3.5 h-3.5 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleCopyLogs}
              disabled={logs.length === 0}
              className="btn btn-sm btn-ghost gap-1.5"
              title="Copy to clipboard"
            >
              {isCopied ? <FaCheck className="w-3.5 h-3.5 text-success" /> : <FaCopy className="w-3.5 h-3.5" />}
              <span>Copy</span>
            </button>

            <button
              onClick={handleDownloadLogs}
              disabled={logs.length === 0}
              className="btn btn-sm btn-ghost gap-1.5"
              title="Download log file"
            >
              <FaDownload className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Search Box */}
          <div className="flex-1 min-w-[240px] relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keyword, route (e.g. /api/v1/prescription), doctor, or error..."
              className="input input-bordered input-sm w-full pl-9 font-mono text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-base-content/50 hover:text-base-content"
              >
                Clear
              </button>
            )}
          </div>

          {/* Level Filter Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-base-content/60">Level:</span>
            <div className="join">
              {['ALL', 'ERROR', 'WARN', 'INFO'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className={`join-item btn btn-xs ${
                    levelFilter === lvl ? 'btn-neutral btn-active font-bold' : 'btn-ghost'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Lines Limit */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-base-content/60">Lines:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="select select-bordered select-xs text-xs font-semibold"
            >
              <option value={100}>100 lines</option>
              <option value={250}>250 lines</option>
              <option value={500}>500 lines</option>
              <option value={1000}>1000 lines</option>
            </select>
          </div>

          {/* Auto Refresh Toggle */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-base-content/60">Auto-Stream:</span>
            <div className="join">
              {AUTO_REFRESH_INTERVALS.map((intv) => (
                <button
                  key={intv.label}
                  onClick={() => setRefreshInterval(intv.value)}
                  className={`join-item btn btn-xs ${
                    refreshInterval === intv.value
                      ? 'btn-success text-white font-bold'
                      : 'btn-ghost'
                  }`}
                >
                  {intv.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scroll Shortcuts */}
          <div className="flex items-center gap-1">
            <button
              onClick={scrollToTop}
              className="btn btn-ghost btn-circle btn-xs"
              title="Jump to Top (Latest)"
            >
              <FaArrowUp className="w-3 h-3" />
            </button>
            <button
              onClick={scrollToBottom}
              className="btn btn-ghost btn-circle btn-xs"
              title="Jump to Bottom (Oldest in buffer)"
            >
              <FaArrowDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Terminal Screen */}
        <div className="relative rounded-2xl bg-[#0b1120] border border-slate-800 shadow-2xl overflow-hidden">
          
          {/* Terminal Window Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#1e293b]/80 border-b border-slate-800 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
              <span className="ml-2 font-bold text-slate-300">server:./logs/general.log</span>
            </div>
            <div className="flex items-center gap-3">
              {refreshInterval > 0 && (
                <span className="flex items-center gap-1 text-emerald-400 font-semibold animate-pulse text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Streaming ({refreshInterval / 1000}s)
                </span>
              )}
              <span>Showing {logs.length} entries</span>
            </div>
          </div>

          <div ref={terminalTopRef} />

          {/* Log Lines Display */}
          <div className="p-4 max-h-[640px] overflow-y-auto space-y-1 font-mono text-[11px] leading-relaxed select-text">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                <FaSync className="w-6 h-6 animate-spin text-primary" />
                <span>Reading server logs...</span>
              </div>
            ) : logs.length > 0 ? (
              logs.map((log) => {
                const isErr = log.level === 'ERROR';
                const isWarn = log.level === 'WARN';
                const isInfo = log.level === 'INFO';

                return (
                  <div
                    key={log.id}
                    className={`flex items-start gap-2.5 py-1 px-2 rounded hover:bg-slate-800/60 transition-colors ${
                      isErr
                        ? 'bg-red-950/40 text-red-200 border-l-2 border-red-500 pl-2'
                        : isWarn
                        ? 'bg-amber-950/40 text-amber-200 border-l-2 border-amber-500 pl-2'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-500 select-none shrink-0 text-[10px] w-44">
                      {log.timestamp}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 tracking-wider ${
                        isErr
                          ? 'bg-red-600 text-white'
                          : isWarn
                          ? 'bg-amber-600 text-white'
                          : isInfo
                          ? 'bg-sky-700 text-sky-100'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className="whitespace-pre-wrap break-all flex-1">
                      {log.message}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-24 text-center text-slate-500 space-y-2">
                <p>No log events found matching the current filters.</p>
                <p className="text-[10px]">Try clearing your search keyword or switching to ALL levels.</p>
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>

        </div>

      </div>
    </RoleBasedLayout>
  );
};

export default SystemLogsPage;

