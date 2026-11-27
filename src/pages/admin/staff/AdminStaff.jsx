import React, { useState, useEffect, useMemo, useCallback } from "react";
import AdminLayout from "@/layouts/admin/AdminLayout";
import KolakLoader from "@/components/common/KolakLoader";
import { StaffProfileModal } from "@/components/modals";
import { usersAPI } from "@/services/api/usersAPI";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";
import {
  exportToCsv,
  usePagination,
  PaginationBar,
} from "@/pages/accountant/accountantUtils";
import {
  FaSearch,
  FaSync,
  FaDownload,
  FaEye,
  FaUserPlus,
  FaTimes,
} from "react-icons/fa";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";

const registrationSchema = yup.object().shape({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  age: yup.number().typeError("Age must be a number").required("Age is required").positive().integer(),
  email: yup.string().email("Invalid email").required("Email is required"),
  dateOfBirth: yup.string().required("Date of birth is required"),
  role: yup.string().required("Role is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "medical-laboratory", label: "Medical Laboratory" },
  { value: "front-desk", label: "Front Desk" },
  { value: "cashier", label: "Cashier" },
  { value: "accountant", label: "Accountant" },
  { value: "account-officer", label: "Account Officer" },
  { value: "hmo", label: "HMO Officer" },
  { value: "sonographer", label: "Sonographer" },
  { value: "surgeon", label: "Surgeon" },
  { value: "human-resource", label: "Human Resources" },
  { value: "admin", label: "Admin" },
];

const AdminStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Full Staff Profile Modal
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Onboard Staff Modal
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registrationSchema),
  });

  const loadStaff = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await usersAPI.getUsers();
      const list = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setStaff(list);
      setHasLoadedOnce(true);
    } catch (err) {
      console.error("Failed to load staff:", err);
      toast.error("Failed to load staff list");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const filteredStaff = useMemo(() => {
    return staff.filter((u) => {
      const role = String(u.accountType || u.role || "").toLowerCase();
      if (roleFilter !== "all" && role !== roleFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      return (
        name.includes(q) ||
        String(u.email || "").toLowerCase().includes(q) ||
        String(u.phoneNumber || u.phone || "").toLowerCase().includes(q) ||
        role.includes(q)
      );
    });
  }, [staff, roleFilter, searchQuery]);

  const pagination = usePagination(filteredStaff, 15);

  const handleOnboard = async (data) => {
    setSubmitting(true);
    try {
      await usersAPI.createUser({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        age: Number(data.age),
        email: data.email.trim().toLowerCase(),
        dateOfBirth: data.dateOfBirth,
        accountType: data.role,
        password: data.password,
      });
      toast.success("Staff member onboarded successfully");
      reset();
      setShowOnboardModal(false);
      loadStaff(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to onboard staff");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    exportToCsv(
      `hospital-staff-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Name", "Role", "Email", "Phone", "Account Status", "Duty Status", "Joined"],
      filteredStaff.map((u) => [
        `${u.firstName || ""} ${u.lastName || ""}`.trim(),
        u.accountType || u.role || "—",
        u.email || "—",
        u.phoneNumber || u.phone || "—",
        u.isDisabled ? "Disabled" : "Active",
        u.isLoggedIn ? "On Duty" : "Off Duty",
        formatNigeriaDate(u.createdAt),
      ])
    );
    toast.success("Staff directory exported to CSV");
  };

  return (
    <AdminLayout>
      {loading && !hasLoadedOnce && <KolakLoader fullscreen text="Loading staff directory..." />}

      <div className="space-y-6">
        {/* Clean Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
              Staff & Roles Directory
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1">
              {staff.length} total hospital personnel — view full profile, duty status, and login history.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadStaff(true)}
              disabled={refreshing}
              className="btn btn-sm btn-ghost bg-base-200/70 rounded-xl gap-1.5"
            >
              <FaSync className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="btn btn-sm btn-outline rounded-xl gap-1.5"
            >
              <FaDownload className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => setShowOnboardModal(true)}
              className="btn btn-sm btn-primary rounded-xl gap-1.5"
            >
              <FaUserPlus className="w-3.5 h-3.5" />
              Onboard Staff
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="select select-bordered select-sm rounded-xl bg-base-100 w-full sm:w-60"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <div className="relative w-full sm:w-72">
            <FaSearch className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Search name, email, phone, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered input-sm w-full pl-9 rounded-xl bg-base-100"
            />
          </div>
        </div>

        {/* Paginated Staff Table */}
        <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr className="text-xs uppercase text-base-content/60">
                <th>Staff Member</th>
                <th>Role</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Duty</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedItems.map((u) => {
                const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown";
                const role = u.accountType || u.role || "staff";
                return (
                  <tr key={u.id || u._id} className="hover">
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStaff(u);
                          setIsProfileOpen(true);
                        }}
                        className="font-bold text-primary hover:underline text-left"
                      >
                        {fullName}
                      </button>
                    </td>
                    <td>
                      <span className="badge badge-outline badge-sm capitalize font-semibold">
                        {role.replace(/-/g, " ")}
                      </span>
                    </td>
                    <td className="text-xs text-base-content/80">{u.email || "—"}</td>
                    <td className="text-xs">{u.phoneNumber || u.phone || "—"}</td>
                    <td>
                      <span
                        className={`badge badge-xs font-semibold ${
                          u.isDisabled ? "badge-error text-white" : "badge-success text-white"
                        }`}
                      >
                        {u.isDisabled ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge badge-xs font-semibold ${
                          u.isLoggedIn ? "badge-info text-white" : "badge-ghost"
                        }`}
                      >
                        {u.isLoggedIn ? "On Duty" : "Off Duty"}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStaff(u);
                          setIsProfileOpen(true);
                        }}
                        className="btn btn-xs btn-ghost text-primary gap-1"
                      >
                        <FaEye className="w-3 h-3" />
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
              {pagination.paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-sm text-base-content/50">
                    No staff members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <PaginationBar
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setCurrentPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </div>

      {/* Full Staff Profile Modal (includes contact, emergency contact, duty status, shift & login history) */}
      <StaffProfileModal
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          setSelectedStaff(null);
        }}
        user={selectedStaff}
        onUserUpdated={() => loadStaff(true)}
      />

      {/* Onboard New Staff Modal */}
      {showOnboardModal && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Onboard New Staff</h3>
              <button
                type="button"
                onClick={() => setShowOnboardModal(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit(handleOnboard)} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs font-semibold">First Name *</label>
                  <input
                    type="text"
                    {...register("firstName")}
                    className="input input-bordered input-sm w-full rounded-xl"
                  />
                  {errors.firstName && (
                    <p className="text-error text-xs mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="label text-xs font-semibold">Last Name *</label>
                  <input
                    type="text"
                    {...register("lastName")}
                    className="input input-bordered input-sm w-full rounded-xl"
                  />
                  {errors.lastName && (
                    <p className="text-error text-xs mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs font-semibold">Age *</label>
                  <input
                    type="number"
                    {...register("age")}
                    className="input input-bordered input-sm w-full rounded-xl"
                  />
                  {errors.age && <p className="text-error text-xs mt-1">{errors.age.message}</p>}
                </div>
                <div>
                  <label className="label text-xs font-semibold">Date of Birth *</label>
                  <input
                    type="date"
                    {...register("dateOfBirth")}
                    className="input input-bordered input-sm w-full rounded-xl"
                  />
                  {errors.dateOfBirth && (
                    <p className="text-error text-xs mt-1">{errors.dateOfBirth.message}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="label text-xs font-semibold">Email *</label>
                <input
                  type="email"
                  {...register("email")}
                  className="input input-bordered input-sm w-full rounded-xl"
                />
                {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="label text-xs font-semibold">Role *</label>
                <select
                  {...register("role")}
                  className="select select-bordered select-sm w-full rounded-xl"
                >
                  <option value="">Select role</option>
                  {ROLE_OPTIONS.filter((r) => r.value !== "all" && r.value !== "admin").map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {errors.role && <p className="text-error text-xs mt-1">{errors.role.message}</p>}
              </div>
              <div>
                <label className="label text-xs font-semibold">Default Password *</label>
                <input
                  type="password"
                  {...register("password")}
                  className="input input-bordered input-sm w-full rounded-xl"
                />
                {errors.password && (
                  <p className="text-error text-xs mt-1">{errors.password.message}</p>
                )}
              </div>
              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="btn btn-ghost btn-sm rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary btn-sm rounded-xl"
                >
                  {submitting ? "Saving..." : "Create Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminStaff;
