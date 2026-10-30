import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import RoleBasedLayout from '@/layouts/RoleBasedLayout';
import QuickReportModal from '@/components/ticket/QuickReportModal';
import { getAllTickets, getTicketStats } from '@/services/api/ticketAPI';
import KolakLoader from '@/components/common/KolakLoader';
import {
  FaTicketAlt,
  FaPlus,
  FaSearch,
  FaFilter,
  FaExclamationCircle,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaComments,
  FaBug,
  FaPrint,
  FaStethoscope,
  FaFileInvoiceDollar,
  FaTools,
  FaQuestionCircle,
  FaUser,
  FaChevronRight,
} from 'react-icons/fa';

const STATUS_CONFIG = {
  open: { label: 'Open', badge: 'badge-warning text-warning-content' },
  in_progress: { label: 'In Progress', badge: 'badge-info text-info-content' },
  awaiting_feedback: { label: 'Awaiting Info', badge: 'badge-accent text-accent-content' },
  resolved: { label: 'Resolved', badge: 'badge-success text-success-content' },
  closed: { label: 'Closed', badge: 'badge-neutral' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', class: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  medium: { label: 'Medium', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  high: { label: 'High', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  critical: { label: 'Critical', class: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse' },
};

const CATEGORY_ICONS = {
  software_bug: FaBug,
  hardware: FaPrint,
  medical_equipment: FaStethoscope,
  billing_hmo: FaFileInvoiceDollar,
  facility: FaTools,
  other: FaQuestionCircle,
};

const TicketListPage = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const isAdmin =
    user?.role === 'super-admin' ||
    user?.role === 'developer' ||
    user?.role === 'it-support' ||
    user?.accountType === 'super-admin' ||
    user?.accountType === 'developer' ||
    user?.accountType === 'it-support';

  // State
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    critical: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyMine, setOnlyMine] = useState(!isAdmin);
  const [page, setPage] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const limit = 15;

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        limit,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: search.trim() || undefined,
        onlyMine: onlyMine ? true : undefined,
      };

      const [ticketsRes, statsRes] = await Promise.all([
        getAllTickets(params),
        getTicketStats(),
      ]);

      if (ticketsRes?.data) {
        setTickets(ticketsRes.data.data || []);
        setTotalTickets(ticketsRes.data.total || 0);
      }
      if (statsRes?.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, priorityFilter, categoryFilter, search, onlyMine]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const totalPages = Math.ceil(totalTickets / limit) || 1;

  return (
    <RoleBasedLayout>
      <div className="space-y-6 pb-12">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-base-100 p-5 rounded-2xl border border-base-200 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <FaTicketAlt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-base-content">
                Support & Issue Tickets
              </h1>
              <p className="text-xs text-base-content/70 mt-0.5">
                Report, track, and resolve system issues, medical device faults, and facility requests.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary btn-sm gap-2 rounded-xl shadow-sm"
            >
              <FaPlus className="w-3.5 h-3.5" />
              <span>Create New Ticket</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs">
            <div className="flex items-center justify-between text-base-content/60 text-xs">
              <span>Total Tickets</span>
              <FaTicketAlt className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-bold mt-1.5 text-base-content">{stats.total}</div>
          </div>

          <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs border-l-4 border-l-warning">
            <div className="flex items-center justify-between text-warning text-xs font-semibold">
              <span>Open / Unresolved</span>
              <FaClock className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-bold mt-1.5 text-base-content">{stats.open}</div>
          </div>

          <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs border-l-4 border-l-info">
            <div className="flex items-center justify-between text-info text-xs font-semibold">
              <span>In Progress</span>
              <FaExclamationCircle className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-bold mt-1.5 text-base-content">{stats.inProgress}</div>
          </div>

          <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs border-l-4 border-l-success">
            <div className="flex items-center justify-between text-success text-xs font-semibold">
              <span>Resolved</span>
              <FaCheckCircle className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-bold mt-1.5 text-base-content">{stats.resolved}</div>
          </div>

          <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs border-l-4 border-l-error col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-error text-xs font-semibold">
              <span>Critical Issues</span>
              <FaExclamationTriangle className="w-3.5 h-3.5" />
            </div>
            <div className="text-2xl font-bold mt-1.5 text-base-content">{stats.critical}</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Search */}
            <div className="relative flex-1">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search ticket code, subject, or description..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="input input-bordered input-sm w-full pl-9 text-xs rounded-xl"
              />
            </div>

            {/* Admin scope toggle */}
            {isAdmin && (
              <div className="flex items-center gap-1 p-1 bg-base-200 rounded-xl text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setOnlyMine(false);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    !onlyMine ? 'bg-primary text-primary-content shadow-xs font-bold' : 'text-base-content/70'
                  }`}
                >
                  All Hospital Tickets
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOnlyMine(true);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    onlyMine ? 'bg-primary text-primary-content shadow-xs font-bold' : 'text-base-content/70'
                  }`}
                >
                  Reported by Me
                </button>
              </div>
            )}
          </div>

          {/* Secondary Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-base-200 text-xs">
            <span className="flex items-center gap-1.5 text-base-content/60 font-medium mr-1">
              <FaFilter className="w-3 h-3" /> Filter by:
            </span>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="select select-bordered select-xs rounded-lg"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_feedback">Awaiting Feedback</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="select select-bordered select-xs rounded-lg"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical / Urgent</option>
            </select>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="select select-bordered select-xs rounded-lg"
            >
              <option value="all">All Categories</option>
              <option value="software_bug">Software Bug</option>
              <option value="hardware">Hardware / Printer</option>
              <option value="medical_equipment">Medical Equipment</option>
              <option value="billing_hmo">Billing / HMO</option>
              <option value="facility">Facility / Ward</option>
              <option value="other">Other / Inquiry</option>
            </select>

            {(statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || search) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setCategoryFilter('all');
                  setSearch('');
                  setPage(1);
                }}
                className="btn btn-ghost btn-xs text-error"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Tickets List / Table */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <KolakLoader />
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-16 text-center space-y-3 px-4">
              <div className="w-14 h-14 rounded-full bg-base-200 mx-auto flex items-center justify-center text-base-content/40">
                <FaTicketAlt className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-base-content">No Tickets Found</h4>
              <p className="text-xs text-base-content/60 max-w-sm mx-auto">
                {search || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'No tickets match your active filter criteria. Try resetting filters.'
                  : 'Everything looks good! No issues or support tickets currently reported.'}
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary btn-sm rounded-xl mt-2"
              >
                <FaPlus className="w-3.5 h-3.5 mr-1" /> Report an Issue
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="bg-base-200/50 text-[11px] uppercase tracking-wider text-base-content/70 border-b border-base-200">
                    <th className="py-3">Ticket ID</th>
                    <th>Issue Summary</th>
                    <th>Reporter</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200 text-xs">
                  {tickets.map((t) => {
                    const CategoryIcon = CATEGORY_ICONS[t.category] || FaQuestionCircle;
                    const statusInfo = STATUS_CONFIG[t.status] || { label: t.status, badge: 'badge-ghost' };
                    const priorityInfo = PRIORITY_CONFIG[t.priority] || { label: t.priority, class: 'bg-gray-100' };
                    const commentsCount = t.comments?.length || 0;

                    return (
                      <tr
                        key={t.id}
                        onClick={() => navigate(`/tickets/${t.id}`)}
                        className="hover:bg-base-200/40 cursor-pointer transition-colors"
                      >
                        {/* Ticket Number */}
                        <td className="font-mono font-bold text-primary whitespace-nowrap">
                          {t.ticketNumber}
                        </td>

                        {/* Title & Category */}
                        <td className="max-w-xs sm:max-w-md">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-base-200 text-[10px] font-medium text-base-content/80 capitalize">
                              <CategoryIcon className="w-3 h-3 text-base-content/60" />
                              {t.category?.replace('_', ' ')}
                            </span>
                            {commentsCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-semibold">
                                <FaComments className="w-3 h-3" />
                                {commentsCount}
                              </span>
                            )}
                            {t.diagnostics && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-neutral text-neutral-content text-[9px] font-mono font-bold" title="Auto-Diagnostics Attached">
                                ⚡ Logs
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-sm text-base-content line-clamp-1">
                            {t.title}
                          </div>
                          <div className="text-[11px] text-base-content/60 line-clamp-1 mt-0.5">
                            {t.description}
                          </div>
                        </td>

                        {/* Reporter */}
                        <td className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-base-200 flex items-center justify-center text-base-content/60 font-bold text-xs uppercase">
                              {t.reportedByUser?.firstName?.[0] || 'U'}
                            </div>
                            <div>
                              <div className="font-medium text-xs">
                                {t.reportedByUser?.firstName} {t.reportedByUser?.lastName}
                              </div>
                              <div className="text-[10px] text-base-content/50 uppercase">
                                {t.reportedByUser?.accountType || t.reportedByUser?.role || 'Staff'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${priorityInfo.class}`}>
                            {priorityInfo.label}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="whitespace-nowrap">
                          <span className={`badge badge-sm font-semibold capitalize ${statusInfo.badge}`}>
                            {statusInfo.label}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="whitespace-nowrap text-base-content/60 text-[11px]">
                          {new Date(t.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Action */}
                        <td className="text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/tickets/${t.id}`);
                            }}
                            className="btn btn-ghost btn-xs text-primary gap-1"
                          >
                            <span>Details</span>
                            <FaChevronRight className="w-2.5 h-2.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-base-200 text-xs text-base-content/70">
              <span>
                Showing Page {page} of {totalPages} ({totalTickets} total)
              </span>
              <div className="join">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="join-item btn btn-xs"
                >
                  « Prev
                </button>
                <button className="join-item btn btn-xs btn-active">
                  {page}
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="join-item btn btn-xs"
                >
                  Next »
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Quick Report Modal */}
      <QuickReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchTickets();
        }}
      />
    </RoleBasedLayout>
  );
};

export default TicketListPage;

