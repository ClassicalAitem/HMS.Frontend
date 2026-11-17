import React, { useState, useEffect, useMemo, useCallback } from "react";
import HrLayout from "@/layouts/hr/HrLayout";
import { getAttendanceLogs } from "@/services/api/attendanceAPI";
import { formatNigeriaDate, formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";
import { exportRowsToCsv } from "@/pages/superadmin/reports/reportUtils";
import { showErrorToast } from "@/utils/errorHandler";
import KolakLoader from "@/components/common/KolakLoader";
import { EmptyState } from "@/components/common";
import toast from "react-hot-toast";
import {
  FaIdBadge,
  FaCalendarAlt,
  FaSearch,
  FaSync,
  FaDownload,
  FaClock,
  FaUsers,
  FaUserCheck,
  FaTimes,
  FaFilter,
} from "react-icons/fa";

const ROLES_LIST = [
  { value: "all", label: "All Hospital Roles" },
  { value: "doctor", label: "Doctor" },
  { value: "medical-director", label: "Medical Director" },
  { value: "surgeon", label: "Surgeon" },
  { value: "nurse", label: "Nurse" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "medical-laboratory", label: "Medical Laboratory" },
  { value: "lab-technician", label: "Lab Technician" },
  { value: "cashier", label: "Cashier" },
  { value: "front-desk", label: "Front Desk" },
  { value: "receptionist", label: "Receptionist" },
  { value: "admin", label: "Administrator" },
  { value: "human-resource", label: "Human Resources" },
  { value: "account-officer", label: "Account Officer" },
  { value: "hmo", label: "HMO Officer" },
  { value: "sonographer", label: "Sonographer" },
];

const getRoleBadgeStyle = (role) => {
  const r = String(role || "").toLowerCase();
  switch (r) {
    case "doctor":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
    case "surgeon":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20";
    case "nurse":
      return "bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20";
    case "pharmacist":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
    case "medical-laboratory":
    case "lab-technician":
      return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20";
    case "cashier":
    case "account-officer":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
    case "receptionist":
    case "front-desk":
      return "bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20";
    case "human-resource":
    case "hr":
      return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20";
    case "admin":
      return "bg-error/10 text-error border border-error/20 font-bold";
    default:
      return "bg-base-200 text-base-content/70 border border-base-300";
  }
};

const HrAttendance = () => {
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendanceTotal, setAttendanceTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedDate, setSelectedDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  const [page, setPage] = useState(1);
  const pageSize = 15;

  const fetchAttendance = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);

        const params = {
          date: selectedDate || undefined,
          limit: 100,
        };

        const res = await getAttendanceLogs(params);
        const data = res?.data?.data ?? res?.data ?? res ?? {};
        const items = Array.isArray(data.items) ? data.items : [];
        setAttendanceLogs(items);
        setAttendanceTotal(data.totalItems || items.length);

        if (isManualRefresh) toast.success("Attendance logs refreshed");
      } catch (err) {
        showErrorToast(err, "Failed to fetch attendance records");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedDate]
  );

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(() => fetchAttendance(false), 300000); // 5 mins auto refresh
    return () => clearInterval(interval);
  }, [fetchAttendance]);

  // Client-side filtering for search & role
  const filteredLogs = useMemo(() => {
    return attendanceLogs.filter((log) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        String(log.userName || "").toLowerCase().includes(q) ||
        String(log.userRole || "").toLowerCase().includes(q);

      const matchesRole =
        selectedRole === "all" ||
        String(log.userRole || "").toLowerCase() === selectedRole.toLowerCase();

      return matchesSearch && matchesRole;
    });
  }, [attendanceLogs, searchTerm, selectedRole]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, page, pageSize]);

  // Statistics
  const stats = useMemo(() => {
    const uniqueUsers = new Set();
    let totalMinutes = 0;
    let countedLogs = 0;

    attendanceLogs.forEach((log) => {
      if (log.userName) uniqueUsers.add(log.userName);
      if (log.checkInTime && log.checkOutTime) {
        const diffMs = new Date(log.checkOutTime) - new Date(log.checkInTime);
        if (diffMs > 0) {
          totalMinutes += diffMs / (1000 * 60);
          countedLogs++;
        }
      }
    });

    const avgMins = countedLogs > 0 ? Math.round(totalMinutes / countedLogs) : 0;
    const avgHours = Math.floor(avgMins / 60);
    const remainingMins = avgMins % 60;

    return {
      totalEntries: attendanceLogs.length,
      uniqueStaff: uniqueUsers.size,
      avgDuration: `${avgHours}h ${remainingMins}m`,
    };
  }, [attendanceLogs]);

  // Export to CSV
  const handleExportCsv = () => {
    if (!filteredLogs.length) {
      toast.error("No attendance logs available to export.");
      return;
    }

    const columns = [
      { key: "date", label: "Date" },
      { key: "userName", label: "Staff Name" },
      { key: "userRole", label: "Role" },
      { key: "checkInTime", label: "Check-In Time" },
      { key: "checkOutTime", label: "Check-Out Time" },
    ];

    const formattedRows = filteredLogs.map((log) => ({
      ...log,
      checkInTime: log.checkInTime ? new Date(log.checkInTime).toLocaleString() : "—",
      checkOutTime: log.checkOutTime ? new Date(log.checkOutTime).toLocaleString() : "—",
    }));

    exportRowsToCsv(
      formattedRows,
      columns,
      `staff_attendance_${selectedDate || new Date().toISOString().slice(0, 10)}.csv`
    );
    toast.success("Attendance logs downloaded as CSV");
  };

  const handleResetFilters = () => {
    setSelectedDate("");
    setSearchTerm("");
    setSelectedRole("all");
    setPage(1);
  };

  return (
    <HrLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge badge-primary badge-sm font-semibold uppercase tracking-wider">
                HR Governance
              </span>
              <span className="text-xs text-base-content/60">
                Staff Login & Duty Logs
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-base-content mt-1">
              Staff Attendance & Activity Logs
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70">
              Verified records of employee login check-in, active duty timestamps, and session durations (synced with Super Admin attendance data).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAttendance(true)}
              disabled={refreshing || loading}
              className="btn btn-sm btn-outline border-base-300 hover:border-primary gap-2"
            >
              <FaSync className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh Logs</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={loading || filteredLogs.length === 0}
              className="btn btn-sm btn-primary gap-2"
            >
              <FaDownload className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Attendance Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-base-200 bg-base-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-base-content/60">
                Total Attendance Records
              </span>
              <FaIdBadge className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-extrabold text-base-content mt-2">
              {loading ? <span className="loading loading-dots loading-sm" /> : stats.totalEntries}
            </p>
            <p className="text-xs text-base-content/60 mt-1">
              {selectedDate ? `Recorded on ${selectedDate}` : "Recent check-in entries"}
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-success/20 bg-success/5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-success">
                Unique Staff Logged
              </span>
              <FaUsers className="w-5 h-5 text-success" />
            </div>
            <p className="text-3xl font-extrabold text-success mt-2">
              {loading ? <span className="loading loading-dots loading-sm" /> : stats.uniqueStaff}
            </p>
            <p className="text-xs text-base-content/60 mt-1">
              Distinct hospital staff members
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-info/20 bg-info/5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-info">
                Average Duty Session
              </span>
              <FaClock className="w-5 h-5 text-info" />
            </div>
            <p className="text-3xl font-extrabold text-info mt-2">
              {loading ? <span className="loading loading-dots loading-sm" /> : stats.avgDuration}
            </p>
            <p className="text-xs text-base-content/60 mt-1">
              Active login duration average
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="p-4 rounded-2xl border border-base-200 bg-base-100 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by staff name or role..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="input input-sm input-bordered w-full pl-10 h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date filter */}
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setPage(1);
                }}
                className="input input-sm input-bordered h-10 rounded-xl text-xs"
              />
            </div>

            {/* Role filter */}
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setPage(1);
              }}
              className="select select-sm select-bordered h-10 rounded-xl text-xs"
            >
              {ROLES_LIST.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            {(selectedDate || searchTerm || selectedRole !== "all") && (
              <button
                onClick={handleResetFilters}
                className="btn btn-sm btn-ghost gap-1 text-xs"
              >
                <FaTimes className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Attendance Records Table */}
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <KolakLoader />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 rounded-2xl border border-base-200 bg-base-100 text-center">
            <EmptyState
              title="No Attendance Logs Found"
              message={
                selectedDate
                  ? `No attendance check-in records found for ${selectedDate}.`
                  : "No attendance logs match your search filters."
              }
            />
          </div>
        ) : (
          <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-base-content">
                  Staff Attendance Records ({filteredLogs.length})
                </h3>
                <p className="text-xs text-base-content/60">
                  Tracked first-login check-in & last active check-out records
                </p>
              </div>

              <span className="badge badge-sm badge-neutral font-mono">
                Page {page} of {totalPages}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead className="bg-base-200/50 text-xs font-semibold uppercase tracking-wider text-base-content/70">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Role Cadre</th>
                    <th className="py-3 px-4">Check-In Time (First Login)</th>
                    <th className="py-3 px-4">Check-Out Time (Last Active)</th>
                    <th className="py-3 px-4">Total Session Hours</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-base-200">
                  {paginatedLogs.map((log) => {
                    const checkIn = new Date(log.checkInTime);
                    const checkOut = new Date(log.checkOutTime);
                    const diffMs = checkOut - checkIn;
                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                    return (
                      <tr
                        key={log._id || log.id || `${log.userId}-${log.date}`}
                        className="hover:bg-base-200/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-semibold text-xs text-base-content/80">
                            {formatNigeriaDate(log.date)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {log.userName?.[0]?.toUpperCase() || "S"}
                            </div>
                            <div className="font-bold text-base-content text-xs">
                              {log.userName}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${getRoleBadgeStyle(
                              log.userRole
                            )}`}
                          >
                            {String(log.userRole || "staff").replace(/-/g, " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono text-xs text-success font-semibold flex items-center gap-1.5">
                            <FaClock className="w-3 h-3 opacity-60" />
                            {checkIn.toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono text-xs text-error font-semibold flex items-center gap-1.5">
                            <FaClock className="w-3 h-3 opacity-60" />
                            {checkOut.toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-bold text-xs text-base-content">
                            {hours}h {mins}m
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-4 border-t border-base-200 flex items-center justify-between text-xs text-base-content/65">
              <span>
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, filteredLogs.length)} of{" "}
                {filteredLogs.length} entries
              </span>

              {totalPages > 1 && (
                <div className="join">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="join-item btn btn-xs btn-outline"
                  >
                    Previous
                  </button>
                  <button className="join-item btn btn-xs btn-active">
                    {page} / {totalPages}
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="join-item btn btn-xs btn-outline"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </HrLayout>
  );
};

export default HrAttendance;
