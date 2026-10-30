import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SuperAdminLayout } from '@/layouts/superadmin';
import { getTicketOverview } from '@/services/api/ticketAPI';
import KolakLoader from '@/components/common/KolakLoader';
import toast from 'react-hot-toast';
import {
  FaBug,
  FaPrint,
  FaStethoscope,
  FaFileInvoiceDollar,
  FaTools,
  FaQuestionCircle,
  FaSync,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaExternalLinkAlt,
  FaTerminal,
  FaArrowRight,
  FaShieldAlt,
  FaChartPie,
  FaTicketAlt,
} from 'react-icons/fa';

const CATEGORY_META = {
  software_bug: { label: 'Software / HMS Glitches', icon: FaBug, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' },
  hardware: { label: 'Hardware / Printers', icon: FaPrint, color: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20' },
  medical_equipment: { label: 'Medical Equipment', icon: FaStethoscope, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
  billing_hmo: { label: 'Billing & HMO Disputes', icon: FaFileInvoiceDollar, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  facility: { label: 'Facility & Ward Maintenance', icon: FaTools, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
  other: { label: 'General / User Help', icon: FaQuestionCircle, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
};

const PRIORITY_BADGES = {
  low: 'badge-ghost',
  medium: 'badge-info text-info-content',
  high: 'badge-warning text-warning-content',
  critical: 'badge-error text-error-content animate-pulse font-bold',
};

const STATUS_BADGES = {
  open: 'badge-warning text-warning-content',
  in_progress: 'badge-info text-info-content',
  awaiting_feedback: 'badge-accent text-accent-content',
  resolved: 'badge-success text-success-content',
  closed: 'badge-neutral',
};

const SuperAdminIssuesOverview = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOverview = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await getTicketOverview();
      if (res?.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load issues overview:', err);
      toast.error('Failed to load hospital issues overview');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview(false);
  }, [fetchOverview]);

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="py-28 flex justify-center">
          <KolakLoader />
        </div>
      </SuperAdminLayout>
    );
  }

  const summary = data?.summary || {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    critical: 0,
    resolutionRate: 100,
  };

  const byCategory = data?.byCategory || {};
  const byPriority = data?.byPriority || {};
  const recentIssues = data?.recentIssues || [];

  const activeIssuesCount = (summary.open || 0) + (summary.inProgress || 0);

  return (
    <SuperAdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        
        {/* Executive Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-primary/10 text-primary">
              <FaShieldAlt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-base-content tracking-tight">
                  Hospital Issues & System Support Overview
                </h1>
                <span className="badge badge-primary badge-sm font-bold uppercase tracking-wider">
                  Executive View
                </span>
              </div>
              <p className="text-xs text-base-content/65 mt-0.5">
                Centralized oversight of all reported software bugs, equipment breakdowns, and engineering hotfixes.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => fetchOverview(true)}
              disabled={isRefreshing}
              className="btn btn-sm btn-ghost gap-1.5 rounded-xl border border-base-300 text-xs"
            >
              <FaSync className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <Link
              to="/tickets"
              className="btn btn-sm btn-outline btn-primary gap-1.5 rounded-xl text-xs"
            >
              <FaTicketAlt className="w-3.5 h-3.5" />
              <span>View All Tickets</span>
            </Link>

            <Link
              to="/developer/logs"
              className="btn btn-sm btn-neutral gap-1.5 rounded-xl text-xs"
            >
              <FaTerminal className="w-3.5 h-3.5 text-warning" />
              <span>Server Logs</span>
            </Link>
          </div>
        </div>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Issues Logged */}
          <div className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                Total Hospital Tickets
              </span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <FaTicketAlt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-base-content font-mono">
              {summary.total}
            </div>
            <p className="text-[11px] text-base-content/50">
              Logged since system deployment
            </p>
          </div>

          {/* Active / Unresolved Issues */}
          <div className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                Active / Needs Resolution
              </span>
              <div className="p-2 rounded-xl bg-warning/10 text-warning">
                <FaClock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-warning font-mono">
              {activeIssuesCount}
            </div>
            <p className="text-[11px] text-base-content/50">
              {summary.open} open, {summary.inProgress} in progress with developers
            </p>
          </div>

          {/* Critical Blockers */}
          <div className={`p-5 rounded-2xl border shadow-xs space-y-2 ${
            summary.critical > 0
              ? 'bg-error/5 border-error/30'
              : 'bg-base-100 border-base-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                Critical Blockers
              </span>
              <div className="p-2 rounded-xl bg-error/10 text-error">
                <FaExclamationTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-3xl font-black font-mono ${summary.critical > 0 ? 'text-error' : 'text-base-content'}`}>
              {summary.critical}
            </div>
            <p className="text-[11px] text-base-content/50">
              {summary.critical > 0 ? 'Urgent attention required by engineering team' : 'Zero critical system outages'}
            </p>
          </div>

          {/* Resolution Rate % */}
          <div className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                Resolution Rate
              </span>
              <div className="p-2 rounded-xl bg-success/10 text-success">
                <FaCheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-success font-mono">
              {summary.resolutionRate}%
            </div>
            <div className="w-full bg-base-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-success h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${summary.resolutionRate}%` }}
              />
            </div>
          </div>

        </div>

        {/* 2-Column: Category Breakdown & Priority Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Issue Breakdown by Category (2 Cols) */}
          <div className="lg:col-span-2 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content">
                  Hospital Issues by Operational Category
                </h3>
                <p className="text-[11px] text-base-content/60 mt-0.5">
                  Helps identify which hospital operations or equipment experience frequent hurdles.
                </p>
              </div>
              <FaChartPie className="w-4 h-4 text-base-content/40" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {Object.entries(CATEGORY_META).map(([key, meta]) => {
                const count = byCategory[key] || 0;
                const percentage = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
                const Icon = meta.icon;

                return (
                  <div key={key} className="p-4 rounded-xl border border-base-200 bg-base-200/20 hover:border-primary/30 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${meta.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-base-content">
                          {meta.label}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-base text-base-content">
                        {count}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-base-300 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-base-content/50 w-8 text-right">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Breakdown & SLA Health (1 Col) */}
          <div className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-xs space-y-5">
            <div className="border-b border-base-200 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-base-content">
                Urgency & SLA Health
              </h3>
              <p className="text-[11px] text-base-content/60 mt-0.5">
                Severity weighting across all reports.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { key: 'critical', label: 'Critical / Emergency', tone: 'bg-red-500 text-red-500', count: byPriority.critical || 0 },
                { key: 'high', label: 'High Priority', tone: 'bg-amber-500 text-amber-500', count: byPriority.high || 0 },
                { key: 'medium', label: 'Medium Priority', tone: 'bg-blue-500 text-blue-500', count: byPriority.medium || 0 },
                { key: 'low', label: 'Low / Minor', tone: 'bg-gray-400 text-gray-400', count: byPriority.low || 0 },
              ].map((p) => {
                const percentage = summary.total > 0 ? Math.round((p.count / summary.total) * 100) : 0;
                return (
                  <div key={p.key} className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="capitalize text-base-content/80">{p.label}</span>
                      <span className="font-mono font-bold text-base-content">{p.count}</span>
                    </div>
                    <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${p.tone.split(' ')[0]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-neutral text-neutral-content space-y-2 mt-4">
              <div className="flex items-center gap-2 text-warning font-bold text-xs uppercase tracking-wider">
                <FaShieldAlt className="w-3.5 h-3.5" />
                <span>Executive Governance</span>
              </div>
              <p className="text-[11px] leading-relaxed text-neutral-content/75">
                Developers now handle technical resolution directly, eliminating hospital manager bottlenecks. Super Admin retains executive oversight and full audit logs.
              </p>
            </div>
          </div>

        </div>

        {/* Recent Hospital Issues Queue */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-base-content">
                Recent Hospital Issues & Resolution Status
              </h3>
              <p className="text-[11px] text-base-content/60 mt-0.5">
                Live stream of tickets filed by nurses, doctors, cashiers, and department heads.
              </p>
            </div>

            <Link
              to="/tickets"
              className="btn btn-sm btn-ghost gap-1.5 text-xs text-primary font-bold self-start sm:self-center"
            >
              <span>Explore All Hospital Tickets</span>
              <FaArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {recentIssues.length > 0 ? (
              <table className="table table-sm w-full text-xs">
                <thead>
                  <tr className="bg-base-200/50 text-base-content/70 border-b border-base-200 text-[11px]">
                    <th>Ticket #</th>
                    <th>Issue Summary</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Reported By</th>
                    <th>Status</th>
                    <th>Time Filed</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIssues.map((t) => {
                    const statusBadge = STATUS_BADGES[t.status] || 'badge-ghost';
                    const priorityBadge = PRIORITY_BADGES[t.priority] || 'badge-ghost';
                    const CategoryIcon = CATEGORY_META[t.category]?.icon || FaQuestionCircle;

                    return (
                      <tr key={t.id} className="hover:bg-base-200/40 transition-colors">
                        <td className="font-mono font-bold text-primary whitespace-nowrap">
                          {t.ticketNumber}
                        </td>
                        <td className="max-w-xs truncate">
                          <span className="font-bold text-base-content block truncate">{t.title}</span>
                          <span className="text-[11px] text-base-content/60 truncate block">{t.description}</span>
                        </td>
                        <td className="whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 capitalize text-base-content/80">
                            <CategoryIcon className="w-3 h-3 text-primary" />
                            {t.category?.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-xs font-bold uppercase tracking-wider ${priorityBadge}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="whitespace-nowrap">
                          <div className="font-semibold text-base-content">
                            {t.reportedByUser?.firstName} {t.reportedByUser?.lastName}
                          </div>
                          <div className="text-[10px] text-base-content/50 capitalize">
                            {t.reportedByUser?.accountType || 'Staff'}
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-sm font-semibold capitalize ${statusBadge}`}>
                            {t.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="whitespace-nowrap text-[11px] text-base-content/60">
                          {new Date(t.createdAt).toLocaleDateString()}{' '}
                          {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <Link
                            to={`/tickets/${t.id}`}
                            className="btn btn-ghost btn-xs gap-1 text-primary hover:bg-primary/10"
                          >
                            <span>Inspect</span>
                            <FaExternalLinkAlt className="w-2.5 h-2.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-xs text-base-content/60">
                No tickets currently reported in the hospital system.
              </div>
            )}
          </div>
        </div>

      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminIssuesOverview;

