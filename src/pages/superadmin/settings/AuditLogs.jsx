import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import {
  FaArrowLeft,
  FaDownload,
  FaSearch,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaChevronDown,
  FaShieldAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaUserShield,
  FaFilter,
  FaSyncAlt,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getAuditLogs, getAuditLogStats } from '@/services/api/auditLogAPI';
import { exportRowsToCsv } from '../reports/reportUtils';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';
import { showErrorToast } from '@/utils/errorHandler';

const ROLES_LIST = [
  { value: 'all', label: 'All Hospital Roles' },
  { value: 'super-admin', label: 'Super Admin' },
  { value: 'admin', label: 'Administrator' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'medical-director', label: 'Medical Director' },
  { value: 'surgeon', label: 'Surgeon' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'lab-technician', label: 'Lab Technician' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'hmo', label: 'HMO Officer' },
];

const STATUS_LIST = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Success', label: 'Success' },
  { value: 'Warning', label: 'Warning' },
  { value: 'Failed', label: 'Failed' },
];

const getRoleBadgeStyle = (role) => {
  const r = String(role || '').toLowerCase();
  switch (r) {
    case 'doctor':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
    case 'surgeon':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
    case 'nurse':
      return 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20';
    case 'pharmacist':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    case 'lab-technician':
      return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20';
    case 'cashier':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    case 'super-admin':
    case 'admin':
      return 'bg-primary/10 text-primary border border-primary/20 font-bold';
    case 'receptionist':
      return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20';
    case 'hmo':
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
    default:
      return 'bg-base-200 text-base-content/70 border border-base-300';
  }
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'Success':
      return (
        <span className="badge badge-success badge-sm font-semibold gap-1">
          <FaCheckCircle className="w-2.5 h-2.5" /> Success
        </span>
      );
    case 'Warning':
      return (
        <span className="badge badge-warning badge-sm font-semibold gap-1">
          <FaExclamationTriangle className="w-2.5 h-2.5" /> Warning
        </span>
      );
    case 'Failed':
      return (
        <span className="badge badge-error badge-sm font-semibold gap-1">
          <FaTimesCircle className="w-2.5 h-2.5" /> Failed
        </span>
      );
    default:
      return <span className="badge badge-ghost badge-sm">{status || 'Info'}</span>;
  }
};

const AuditLogs = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLogs: 0,
    successfulActions: 0,
    failedActions: 0,
    warningActions: 0,
    uniqueUsers: 0,
  });

  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  const fetchStats = async () => {
    try {
      const res = await getAuditLogStats();
      if (res?.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load audit stats:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 15,
        search: searchTerm.trim() || undefined,
        role: selectedRole !== 'all' ? selectedRole : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        startDate: selectedDate || undefined,
        endDate: selectedDate || undefined,
      };

      const res = await getAuditLogs(params);
      const data = res?.data || {};
      setLogs(Array.isArray(data.logs) ? data.logs : []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);
    } catch (err) {
      showErrorToast(err, 'Failed to fetch audit records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, selectedRole, selectedStatus, selectedDate]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1);
      fetchLogs();
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleExportLogs = () => {
    if (!logs.length) {
      toast.error('No logs available to export.');
      return;
    }
    const columns = [
      { key: 'createdAt', label: 'Timestamp' },
      { key: 'userName', label: 'User Name' },
      { key: 'userRole', label: 'Role' },
      { key: 'action', label: 'Action' },
      { key: 'resource', label: 'Resource' },
      { key: 'status', label: 'Status' },
      { key: 'description', label: 'Description' },
      { key: 'ipAddress', label: 'IP Address' },
    ];
    exportRowsToCsv(logs, columns, `hospital_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Audit logs downloaded as CSV');
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedRole('all');
    setSelectedStatus('all');
    setSelectedDate('');
    setCurrentPage(1);
  };

  return (
    <div className="flex h-screen bg-base-300/20">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      {/* Main Content */}
      <div className="flex overflow-hidden flex-col flex-1">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-4 sm:p-6 h-full space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <button
                onClick={() => navigate('/superadmin/settings')}
                className="flex items-center text-xs font-semibold text-base-content/70 hover:text-primary transition-colors mb-2"
              >
                <FaArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Back to Settings
              </button>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
                  System Audit & Role Activity
                </h1>
                <span className="badge badge-primary badge-sm font-bold">Every-Role Trail</span>
              </div>
              <p className="text-xs sm:text-sm text-base-content/70 mt-0.5">
                Monitor clinical, administrative, financial, and diagnostic operations across all hospital personnel
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  fetchStats();
                  fetchLogs();
                  toast.success('Audit records refreshed');
                }}
                className="btn btn-outline btn-sm rounded-xl"
                title="Refresh logs"
              >
                <FaSyncAlt className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleExportLogs}
                className="btn btn-primary btn-sm rounded-xl px-4 shadow-sm shadow-primary/20"
              >
                <FaDownload className="w-3.5 h-3.5 mr-1.5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-base-100 border border-base-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider block mb-0.5">
                  Total Events Logged
                </span>
                <span className="text-2xl font-black text-base-content">
                  {(stats.totalLogs || totalCount).toLocaleString()}
                </span>
                <span className="text-[11px] text-base-content/50 block mt-1">Cross-departmental</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                <FaShieldAlt />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-base-100 border border-base-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider block mb-0.5">
                  Successful Actions
                </span>
                <span className="text-2xl font-black text-success">
                  {(stats.successfulActions || 0).toLocaleString()}
                </span>
                <span className="text-[11px] text-success/70 block mt-1">Verified operations</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center text-xl font-bold">
                <FaCheckCircle />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-base-100 border border-base-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider block mb-0.5">
                  Security Alerts / Failed
                </span>
                <span className="text-2xl font-black text-error">
                  {(stats.failedActions || 0) + (stats.warningActions || 0)}
                </span>
                <span className="text-[11px] text-error/70 block mt-1">Warnings & Failed logins</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center text-xl font-bold">
                <FaExclamationTriangle />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-base-100 border border-base-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider block mb-0.5">
                  Active Personnel
                </span>
                <span className="text-2xl font-black text-warning">
                  {(stats.uniqueUsers || 11).toLocaleString()}
                </span>
                <span className="text-[11px] text-warning/80 block mt-1">Actors identified</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-warning/10 text-warning flex items-center justify-center text-xl font-bold">
                <FaUserShield />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-4 sm:p-5">
            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-base-content/70">
                <FaFilter className="text-primary w-3 h-3" /> Filter Real-Time Logs
                {(searchTerm || selectedRole !== 'all' || selectedStatus !== 'all' || selectedDate) && (
                  <span className="badge badge-primary badge-xs">Active</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {(searchTerm || selectedRole !== 'all' || selectedStatus !== 'all' || selectedDate) && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      resetFilters();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        event.stopPropagation();
                        resetFilters();
                      }
                    }}
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    Reset all filters
                  </span>
                )}
                {isFilterOpen ? (
                  <FaChevronUp className="w-3 h-3 text-base-content/50" />
                ) : (
                  <FaChevronDown className="w-3 h-3 text-base-content/50" />
                )}
              </div>
            </button>

            {isFilterOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search user, action, resource..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input input-bordered input-sm rounded-xl pl-9 w-full"
                />
              </div>

              {/* Role filter */}
              <div>
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="select select-bordered select-sm rounded-xl w-full"
                >
                  {ROLES_LIST.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="select select-bordered select-sm rounded-xl w-full"
                >
                  {STATUS_LIST.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date picker */}
              <div className="relative">
                <FaCalendarAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input input-bordered input-sm rounded-xl pl-9 w-full"
                />
              </div>
            </div>
            )}
          </div>

          {/* Activity Logs Table */}
          <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-base-content">
                  Audit Records ({totalCount})
                </h3>
                <p className="text-xs text-base-content/60">
                  Showing page {currentPage} of {totalPages}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead className="bg-base-200/50 text-xs font-semibold uppercase tracking-wider text-base-content/70">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor / User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-base-200">
                  {loading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3.5 px-4"><div className="h-4 bg-base-300 rounded w-24"></div></td>
                        <td className="py-3.5 px-4"><div className="h-4 bg-base-300 rounded w-32"></div></td>
                        <td className="py-3.5 px-4"><div className="h-5 bg-base-300 rounded-full w-20"></div></td>
                        <td className="py-3.5 px-4"><div className="h-4 bg-base-300 rounded w-28"></div></td>
                        <td className="py-3.5 px-4"><div className="h-4 bg-base-300 rounded w-28"></div></td>
                        <td className="py-3.5 px-4"><div className="h-5 bg-base-300 rounded-full w-16"></div></td>
                        <td className="py-3.5 px-4"><div className="h-4 bg-base-300 rounded w-48"></div></td>
                      </tr>
                    ))
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-base-content/60">
                        <FaShieldAlt className="w-10 h-10 mx-auto text-base-content/20 mb-2" />
                        <p className="font-semibold text-sm">No audit records found</p>
                        <p className="text-xs text-base-content/40 mt-1">
                          Try adjusting your role, action, or date filter
                        </p>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id || log.id} className="hover:bg-base-200/40 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono text-xs text-base-content/70">
                            {formatNigeriaDate(log.createdAt || log.timestamp)}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-base-content text-xs">
                            {log.userName || 'System User'}
                          </div>
                          {log.ipAddress && (
                            <span className="text-[10px] text-base-content/40 font-mono">
                              {log.ipAddress}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${getRoleBadgeStyle(
                              log.userRole
                            )}`}
                          >
                            {log.userRole || 'User'}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-medium text-xs text-base-content">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="badge badge-ghost badge-sm text-[11px] font-mono">
                            {log.resource || 'System'}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getStatusBadge(log.status)}
                        </td>
                        <td className="py-3 px-4 min-w-[200px] text-xs text-base-content/70">
                          {log.description}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-base-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-base-content/60">
                  Showing {logs.length} of {totalCount} total entries
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-outline btn-xs rounded-lg"
                  >
                    <FaChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="px-3 text-xs font-semibold text-base-content">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="btn btn-outline btn-xs rounded-lg"
                  >
                    <FaChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
