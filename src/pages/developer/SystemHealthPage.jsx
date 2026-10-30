import React, { useState, useEffect, useCallback } from 'react';
import RoleBasedLayout from '@/layouts/RoleBasedLayout';
import supportAPI from '@/services/api/supportAPI';
import toast from 'react-hot-toast';
import {
  FaHeartbeat,
  FaServer,
  FaDatabase,
  FaMemory,
  FaMicrochip,
  FaClock,
  FaSync,
  FaCheckCircle,
  FaExclamationCircle,
  FaBolt,
  FaUserShield,
} from 'react-icons/fa';

const SystemHealthPage = () => {
  const [healthData, setHealthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [latencyMs, setLatencyMs] = useState(null);
  const [isPinging, setIsPinging] = useState(false);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    const start = performance.now();
    try {
      const res = await supportAPI.getHealth();
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      if (res?.data) {
        setHealthData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch system health:', err);
      toast.error('Failed to reach backend health endpoint');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const handlePing = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      await supportAPI.getHealth();
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      toast.success(`API responded in ${Math.round(end - start)}ms`);
    } catch {
      toast.error('API ping failed');
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <RoleBasedLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-base-100 p-5 rounded-2xl border border-base-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success/10 text-success">
              <FaHeartbeat className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-base-content">
                  System Health & Diagnostics
                </h1>
                <span className="badge badge-success badge-sm font-semibold text-white">
                  Operational
                </span>
              </div>
              <p className="text-xs text-base-content/60 mt-0.5">
                Runtime telemetry, Node.js memory profiling, database connection, and latency monitor.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePing}
              disabled={isPinging}
              className="btn btn-sm btn-outline gap-1.5 rounded-xl text-xs"
            >
              <FaBolt className="w-3.5 h-3.5 text-warning" />
              <span>Ping API</span>
            </button>
            <button
              onClick={fetchHealth}
              disabled={isLoading}
              className="btn btn-sm btn-primary gap-1.5 rounded-xl text-xs"
            >
              <FaSync className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </button>
          </div>
        </div>

        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Latency */}
          <div className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                API Response Time
              </span>
              <FaBolt className="w-4 h-4 text-warning" />
            </div>
            <div className="text-2xl font-black text-base-content font-mono">
              {latencyMs !== null ? `${latencyMs}ms` : '--'}
            </div>
            <div className="text-[11px] text-base-content/50">
              Round-trip HTTP latency
            </div>
          </div>

          {/* Database */}
          <div className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                MySQL Database
              </span>
              <FaDatabase className="w-4 h-4 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-success"></span>
              <span className="text-lg font-bold text-base-content capitalize">
                {healthData?.database?.connected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
            <div className="text-[11px] text-base-content/50">
              TypeORM pool active
            </div>
          </div>

          {/* Heap Memory */}
          <div className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                Node.js Heap Used
              </span>
              <FaMemory className="w-4 h-4 text-accent" />
            </div>
            <div className="text-2xl font-black text-base-content font-mono">
              {healthData?.memory?.heapUsedMB ? `${healthData.memory.heapUsedMB} MB` : '--'}
            </div>
            <div className="text-[11px] text-base-content/50">
              Total Allocated: {healthData?.memory?.heapTotalMB || '--'} MB
            </div>
          </div>

          {/* Uptime */}
          <div className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                Process Uptime
              </span>
              <FaClock className="w-4 h-4 text-info" />
            </div>
            <div className="text-lg font-bold text-base-content font-mono">
              {healthData?.uptime?.formatted || '--'}
            </div>
            <div className="text-[11px] text-base-content/50">
              Since server startup
            </div>
          </div>

        </div>

        {/* Detailed Breakdown */}
        {healthData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Host System Specs */}
            <div className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-base-200 pb-3">
                <FaMicrochip className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content">
                  Host Machine & Runtime Environment
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-base-200/50">
                  <span className="text-base-content/60">Operating System:</span>
                  <span className="font-semibold text-base-content font-mono capitalize">
                    {healthData.system.platform} ({healthData.system.arch})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-base-200/50">
                  <span className="text-base-content/60">Node.js Engine:</span>
                  <span className="font-semibold text-base-content font-mono">
                    {healthData.system.nodeVersion}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-base-200/50">
                  <span className="text-base-content/60">CPU Cores:</span>
                  <span className="font-semibold text-base-content font-mono">
                    {healthData.system.cpus} Logical Cores
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-base-200/50">
                  <span className="text-base-content/60">Host RAM:</span>
                  <span className="font-semibold text-base-content font-mono">
                    {healthData.system.freeMemoryGB} GB free / {healthData.system.totalMemoryGB} GB total
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-base-content/60">Resident Set Size (RSS):</span>
                  <span className="font-semibold text-base-content font-mono">
                    {healthData.memory.rssMB} MB
                  </span>
                </div>
              </div>
            </div>

            {/* Developer Diagnostics Quick Tools */}
            <div className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-base-200 pb-3">
                <FaUserShield className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content">
                  Support Engineering Controls
                </h3>
              </div>

              <div className="space-y-3 text-xs text-base-content/80">
                <p>
                  As a Developer / IT Support member, you have full diagnostic privileges:
                </p>
                <ul className="space-y-2 list-disc list-inside text-xs">
                  <li>
                    <strong>Blackbox Error Interceptor:</strong> Captures uncaught frontend JavaScript exceptions and HTTP 4xx/5xx requests into tickets automatically.
                  </li>
                  <li>
                    <strong>Server Log Streamer:</strong> Query Winston log files on demand without server terminal or SSH credentials.
                  </li>
                  <li>
                    <strong>Ticket Assignment:</strong> Assign complex bugs directly to yourself or IT personnel to coordinate hotfixes.
                  </li>
                </ul>

                <div className="pt-2">
                  <a
                    href="/developer/logs"
                    className="btn btn-outline btn-neutral btn-sm w-full gap-2 rounded-xl"
                  >
                    <FaServer className="w-3.5 h-3.5" />
                    <span>Open Live Server Logs Viewer</span>
                  </a>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </RoleBasedLayout>
  );
};

export default SystemHealthPage;

