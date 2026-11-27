import React, { useState, useEffect, useMemo, useCallback } from "react";
import HrLayout from "@/layouts/hr/HrLayout";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchUsers,
  toggleUserLeaveStatus,
  toggleUserStatus,
  clearUsersError,
} from "@/store/slices/usersSlice";
import { formatNigeriaDate, formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";
import { getErrorMessage } from "@/utils/errorHandler";
import KolakLoader from "@/components/common/KolakLoader";
import { EmptyState } from "@/components/common";
import { StaffProfileModal } from "@/components/modals";
import toast from "react-hot-toast";
import {
  FaUsers,
  FaUserMd,
  FaUserNurse,
  FaPills,
  FaVial,
  FaUserCheck,
  FaUserShield,
  FaUserTie,
  FaSearch,
  FaSync,
  FaPlus,
  FaEdit,
  FaKey,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaCheckCircle,
  FaBan,
  FaEye,
  FaTimes,
  FaInfoCircle,
  FaExclamationTriangle,
  FaUserClock,
} from "react-icons/fa";
import { MdOutlineAdminPanelSettings } from "react-icons/md";

const ROLES_LIST = [
  { value: "all", label: "All Hospital Cadres" },
  { value: "doctor", label: "Doctors & Clinicians" },
  { value: "nurse", label: "Nursing Personnel" },
  { value: "pharmacist", label: "Pharmacists" },
  { value: "medical-laboratory", label: "Medical Laboratory" },
  { value: "front-desk", label: "Front Desk & Reception" },
  { value: "cashier", label: "Cashiers & Billing" },
  { value: "human-resource", label: "Human Resources" },
  { value: "admin", label: "Hospital Administration" },
  { value: "account-officer", label: "Account Officers" },
  { value: "accountant", label: "Accountants" },
  { value: "other-staff", label: "Support & Other Staff" },
];

const getRoleBadgeStyle = (accountType) => {
  const r = String(accountType || "").toLowerCase();
  switch (r) {
    case "doctor":
    case "surgeon":
      return "badge-primary text-primary-content";
    case "nurse":
      return "badge-accent text-accent-content";
    case "pharmacist":
      return "badge-secondary text-secondary-content";
    case "medical-laboratory":
    case "lab-technician":
      return "badge-warning text-warning-content";
    case "cashier":
    case "account-officer":
    case "accountant":
      return "badge-success text-success-content";
    case "front-desk":
    case "receptionist":
      return "badge-info text-info-content";
    case "admin":
    case "super-admin":
      return "badge-error text-error-content";
    case "human-resource":
    case "hr":
      return "bg-indigo-600 text-white";
    default:
      return "badge-ghost";
  }
};

const getRoleIcon = (accountType) => {
  const r = String(accountType || "").toLowerCase();
  switch (r) {
    case "doctor":
    case "surgeon":
      return <FaUserMd className="w-3.5 h-3.5" />;
    case "nurse":
      return <FaUserNurse className="w-3.5 h-3.5" />;
    case "pharmacist":
      return <FaPills className="w-3.5 h-3.5" />;
    case "medical-laboratory":
    case "lab-technician":
      return <FaVial className="w-3.5 h-3.5" />;
    case "cashier":
    case "account-officer":
    case "accountant":
      return <FaUserCheck className="w-3.5 h-3.5" />;
    case "admin":
    case "super-admin":
      return <MdOutlineAdminPanelSettings className="w-3.5 h-3.5" />;
    case "human-resource":
    case "hr":
      return <FaUsers className="w-3.5 h-3.5" />;
    default:
      return <FaUserTie className="w-3.5 h-3.5" />;
  }
};

const HrStaffManagement = () => {
  const dispatch = useAppDispatch();
  const { users, isLoading, error } = useAppSelector((state) => state.users);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedLeaveStatus, setSelectedLeaveStatus] = useState("all"); // 'all' | 'on_leave' | 'on_duty'
  const [selectedAccountStatus, setSelectedAccountStatus] = useState("all"); // 'all' | 'active' | 'disabled'

  // Details modal
  const [detailsUser, setDetailsUser] = useState(null);

  // Leave Confirmation Dialog State
  const [leaveModalData, setLeaveModalData] = useState({
    isOpen: false,
    user: null,
    targetStatus: false, // true = set on leave, false = return to duty
  });

  const [togglingLeaveId, setTogglingLeaveId] = useState(null);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error));
      dispatch(clearUsersError());
    }
  }, [error, dispatch]);

  const handleRefresh = () => {
    dispatch(fetchUsers());
    toast.success("Staff directory updated");
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        fullName.includes(q) ||
        String(u.email || "").toLowerCase().includes(q) ||
        String(u.phoneNumber || "").toLowerCase().includes(q) ||
        String(u.accountType || "").toLowerCase().includes(q);

      // Role filter
      const matchesRole =
        selectedRole === "all" ||
        u.accountType === selectedRole ||
        (selectedRole === "medical-laboratory" &&
          (u.accountType === "lab-technician" || u.accountType === "lab-scientist"));

      // Leave status filter
      const isOnLeave = Boolean(u.isOnLeave);
      const matchesLeave =
        selectedLeaveStatus === "all" ||
        (selectedLeaveStatus === "on_leave" && isOnLeave) ||
        (selectedLeaveStatus === "on_duty" && !isOnLeave);

      // Account status
      const matchesAccount =
        selectedAccountStatus === "all" ||
        (selectedAccountStatus === "active" && !u.isDisabled) ||
        (selectedAccountStatus === "disabled" && u.isDisabled);

      return matchesSearch && matchesRole && matchesLeave && matchesAccount;
    });
  }, [users, searchTerm, selectedRole, selectedLeaveStatus, selectedAccountStatus]);

  // Summary counts
  const summary = useMemo(() => {
    const total = users.length;
    let onLeave = 0;
    let onDuty = 0;
    let disabled = 0;

    users.forEach((u) => {
      if (u.isOnLeave) onLeave++;
      else onDuty++;
      if (u.isDisabled) disabled++;
    });

    return { total, onLeave, onDuty, disabled };
  }, [users]);

  // Open confirmation modal when checkbox is clicked
  const handleLeaveCheckboxClick = (user, currentLeaveStatus) => {
    setLeaveModalData({
      isOpen: true,
      user,
      targetStatus: !currentLeaveStatus,
    });
  };

  // Execute leave status change
  const confirmLeaveStatusChange = async () => {
    const { user, targetStatus } = leaveModalData;
    if (!user) return;

    setTogglingLeaveId(user.id);
    setLeaveModalData({ isOpen: false, user: null, targetStatus: false });

    try {
      const result = await dispatch(
        toggleUserLeaveStatus({ userId: user.id, isOnLeave: targetStatus })
      );

      if (toggleUserLeaveStatus.fulfilled.match(result)) {
        toast.success(
          targetStatus
            ? `${user.firstName} ${user.lastName} is now ON LEAVE. System login has been locked.`
            : `${user.firstName} ${user.lastName} returned from leave. System login is restored.`
        );
      } else {
        toast.error(result.payload || "Failed to update leave status");
      }
    } catch (err) {
      toast.error("Failed to update leave status");
    } finally {
      setTogglingLeaveId(null);
    }
  };

  return (
    <HrLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge badge-primary badge-sm font-semibold uppercase tracking-wider">
                HR Personnel Directory
              </span>
              <span className="text-xs text-base-content/60">
                Staff Records & Leave Governance
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-base-content mt-1">
              Staff Management & Leave Administration
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70">
              Manage hospital staff, update on-leave status (which instantly blocks login until leave ends), and view complete employee profiles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="btn btn-sm btn-outline border-base-300 hover:border-primary gap-2"
            >
              <FaSync className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh Directory</span>
            </button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-base-200 bg-base-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-base-content/60">
                Total Staff
              </span>
              <FaUsers className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-base-content mt-2">
              {summary.total}
            </p>
            <p className="text-xs text-base-content/60 mt-1">Total hospital headcount</p>
          </div>

          <div className="p-4 rounded-2xl border border-success/20 bg-success/5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-success">
                Active On Duty
              </span>
              <FaCheckCircle className="w-4 h-4 text-success" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-success mt-2">
              {summary.onDuty}
            </p>
            <p className="text-xs text-base-content/60 mt-1">Normal system login access</p>
          </div>

          <div className="p-4 rounded-2xl border border-warning/20 bg-warning/5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-warning">
                Currently On Leave
              </span>
              <FaUserClock className="w-4 h-4 text-warning" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-warning mt-2">
              {summary.onLeave}
            </p>
            <p className="text-xs text-base-content/60 mt-1">Login strictly blocked</p>
          </div>

          <div className="p-4 rounded-2xl border border-error/20 bg-error/5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-error">
                Disabled Accounts
              </span>
              <FaBan className="w-4 h-4 text-error" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-error mt-2">
              {summary.disabled}
            </p>
            <p className="text-xs text-base-content/60 mt-1">Deactivated accounts</p>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="p-4 rounded-2xl border border-base-200 bg-base-100 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search staff by name, email, phone number, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-sm input-bordered w-full pl-10 h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="select select-sm select-bordered h-10 rounded-xl text-xs"
            >
              {ROLES_LIST.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            {/* Leave Status Filter */}
            <select
              value={selectedLeaveStatus}
              onChange={(e) => setSelectedLeaveStatus(e.target.value)}
              className="select select-sm select-bordered h-10 rounded-xl text-xs"
            >
              <option value="all">All Leave Statuses</option>
              <option value="on_duty">On Duty / Active</option>
              <option value="on_leave">On Leave (Blocked)</option>
            </select>

            {/* Account Status Filter */}
            <select
              value={selectedAccountStatus}
              onChange={(e) => setSelectedAccountStatus(e.target.value)}
              className="select select-sm select-bordered h-10 rounded-xl text-xs"
            >
              <option value="all">All Account Statuses</option>
              <option value="active">Active Only</option>
              <option value="disabled">Disabled Only</option>
            </select>
          </div>
        </div>

        {/* Staff Table */}
        {isLoading ? (
          <div className="py-20 flex justify-center items-center">
            <KolakLoader />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 rounded-2xl border border-base-200 bg-base-100 text-center">
            <EmptyState
              title="No Staff Found"
              message={
                searchTerm || selectedRole !== "all" || selectedLeaveStatus !== "all"
                  ? "No staff personnel match your chosen filters."
                  : "No hospital staff members registered yet."
              }
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-base-200 bg-base-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead>
                  <tr className="bg-base-200/50 text-base-content/70 text-xs">
                    <th className="py-3 pl-4">Staff Personnel</th>
                    <th>Role / Cadre</th>
                    <th>Department / Shift</th>
                    <th>Contact Phone</th>
                    <th className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <FaUserClock className="w-3.5 h-3.5 text-warning" />
                        <span>On Leave (Lock Login)</span>
                      </div>
                    </th>
                    <th>Account Status</th>
                    <th className="text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200">
                  {filteredUsers.map((user) => {
                    const isOnLeave = Boolean(user.isOnLeave);
                    const isToggling = togglingLeaveId === user.id;

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-base-200/30 transition-colors ${
                          isOnLeave ? "bg-warning/5" : ""
                        }`}
                      >
                        {/* Name & Email */}
                        <td className="py-3 pl-4">
                          <div
                            onClick={() => setDetailsUser(user)}
                            className="flex items-center gap-3 cursor-pointer group"
                            title="Click to view full staff profile details"
                          >
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-primary group-hover:text-primary-content transition-colors">
                              {user.firstName?.[0]?.toUpperCase() || "S"}
                              {user.lastName?.[0]?.toUpperCase() || ""}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-primary group-hover:underline truncate">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-xs text-base-content/60 truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`badge badge-sm font-semibold capitalize flex items-center gap-1 ${getRoleBadgeStyle(
                                user.accountType
                              )}`}
                            >
                              {getRoleIcon(user.accountType)}
                              <span>{String(user.accountType || "staff").replace(/-/g, " ")}</span>
                            </span>
                          </div>
                        </td>

                        {/* Department / Shift */}
                        <td>
                          <div className="text-xs">
                            <p className="font-semibold text-base-content">
                              {user.departmentName || "General Hospital"}
                            </p>
                            <p className="text-base-content/60 capitalize">
                              Shift: {user.shift || "Standard"}
                            </p>
                          </div>
                        </td>

                        {/* Phone */}
                        <td>
                          <span className="text-xs text-base-content/80 font-mono">
                            {user.phoneNumber || "—"}
                          </span>
                        </td>

                        {/* On Leave Checkbox / Toggle */}
                        <td className="text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            {isToggling ? (
                              <span className="loading loading-spinner loading-xs text-warning" />
                            ) : (
                              <label
                                className={`cursor-pointer inline-flex items-center gap-2 px-3 py-1 rounded-xl border transition-all ${
                                  isOnLeave
                                    ? "bg-warning/15 border-warning/40 text-warning-content font-bold shadow-xs"
                                    : "bg-base-200/40 border-base-300 hover:border-warning/50 text-base-content/70"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isOnLeave}
                                  onChange={() => handleLeaveCheckboxClick(user, isOnLeave)}
                                  className="checkbox checkbox-xs checkbox-warning"
                                />
                                <span className="text-xs">
                                  {isOnLeave ? "On Leave" : "On Duty"}
                                </span>
                              </label>
                            )}

                            {isOnLeave && (
                              <span className="text-[10px] text-error font-medium flex items-center gap-0.5">
                                <FaBan className="w-2.5 h-2.5" /> Login Blocked
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Account Status */}
                        <td>
                          {user.isDisabled ? (
                            <span className="badge badge-xs badge-error gap-1">
                              Disabled
                            </span>
                          ) : (
                            <span className="badge badge-xs badge-success gap-1">
                              Active
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="text-right pr-4">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => setDetailsUser(user)}
                              title="View Staff Profile Details"
                              className="btn btn-xs btn-ghost btn-square text-base-content/70 hover:text-primary"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-base-200 bg-base-200/20 flex items-center justify-between text-xs text-base-content/65">
              <span>
                Showing {filteredUsers.length} of {users.length} staff records
              </span>
              <span className="italic">
                Note: Checking "On Leave" immediately blocks the employee from logging in until unchecked.
              </span>
            </div>
          </div>
        )}

        {/* Confirmation Modal for Leave Toggle */}
        {leaveModalData.isOpen && leaveModalData.user && (
          <div className="modal modal-open">
            <div className="modal-box rounded-2xl max-w-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    leaveModalData.targetStatus
                      ? "bg-warning/15 text-warning"
                      : "bg-success/15 text-success"
                  }`}
                >
                  <FaUserClock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-base-content">
                    {leaveModalData.targetStatus
                      ? "Mark Staff as On Leave?"
                      : "Return Staff to Active Duty?"}
                  </h3>
                  <p className="text-xs text-base-content/60">
                    Staff: {leaveModalData.user.firstName}{" "}
                    {leaveModalData.user.lastName} ({leaveModalData.user.email})
                  </p>
                </div>
              </div>

              {leaveModalData.targetStatus ? (
                <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-xs text-base-content/80 space-y-2">
                  <div className="flex items-start gap-2">
                    <FaExclamationTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <p className="font-bold text-warning-content">
                      Login Access Will Be Blocked:
                    </p>
                  </div>
                  <p>
                    While marked as <strong>On Leave</strong>, this staff member will{" "}
                    <strong>NOT be able to log in</strong> to their HMS account. Any active session will also be restricted until HR returns them from leave.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-xs text-base-content/80 space-y-2">
                  <div className="flex items-start gap-2">
                    <FaCheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <p className="font-bold text-success-content">
                      Restore System Login:
                    </p>
                  </div>
                  <p>
                    Returning this staff member from leave will{" "}
                    <strong>immediately restore their system login access</strong> so they can resume duty.
                  </p>
                </div>
              )}

              <div className="modal-action flex items-center justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() =>
                    setLeaveModalData({ isOpen: false, user: null, targetStatus: false })
                  }
                  className="btn btn-sm btn-ghost rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmLeaveStatusChange}
                  className={`btn btn-sm rounded-xl gap-2 ${
                    leaveModalData.targetStatus ? "btn-warning" : "btn-success text-white"
                  }`}
                >
                  {leaveModalData.targetStatus ? (
                    <>
                      <FaBan className="w-3.5 h-3.5" />
                      <span>Confirm & Lock Login</span>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="w-3.5 h-3.5" />
                      <span>Restore Access</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Staff Profile Details Modal */}
        <StaffProfileModal
          isOpen={Boolean(detailsUser)}
          onClose={() => setDetailsUser(null)}
          user={detailsUser}
          onUserUpdated={() => dispatch(fetchUsers())}
          onToggleLeave={handleLeaveCheckboxClick}
        />
      </div>
    </HrLayout>
  );
};

export default HrStaffManagement;
