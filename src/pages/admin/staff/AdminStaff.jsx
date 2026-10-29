/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/layouts/admin/AdminLayout";
import {
  FaUsers,
  FaUserMd,
  FaUserNurse,
  FaPills,
  FaVial,
  FaUserCheck,
  FaUserPlus,
  FaSearch,
  FaSync,
  FaShieldAlt,
  FaIdBadge,
  FaLock,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaTimes,
  FaCheckCircle,
} from "react-icons/fa";
import { MdSupervisorAccount, MdOutlineAdminPanelSettings } from "react-icons/md";
import { TbStethoscope } from "react-icons/tb";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import toast from "react-hot-toast";

import { usersAPI } from "@/services/api/usersAPI";
import { getCachedData, clearAdminCache } from "@/utils/adminDataCache";
import { formatNigeriaDate, formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";

const registrationSchema = yup.object().shape({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  age: yup.number().typeError("Age must be a number").required("Age is required").positive().integer(),
  email: yup.string().email("Invalid email").required("Email is required"),
  dateOfBirth: yup.string().required("Date of birth is required"),
  role: yup.string().required("Role is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

const ROLE_CONFIG = {
  doctor: {
    label: "Doctor / Clinician",
    badge: "badge-primary",
    color: "text-primary bg-primary/10 border-primary/20",
    icon: FaUserMd,
    description: "Medical consultations, clinical prescriptions, diagnosis, and ward rounds.",
  },
  nurse: {
    label: "Nurse",
    badge: "badge-accent",
    color: "text-accent bg-accent/10 border-accent/20",
    icon: FaUserNurse,
    description: "Triage vitals, inpatient nursing care, medication delivery, and maternal support.",
  },
  pharmacist: {
    label: "Pharmacist",
    badge: "badge-secondary",
    color: "text-secondary bg-secondary/10 border-secondary/20",
    icon: FaPills,
    description: "Prescription dispensations, pharmacy inventory, and drug safety reviews.",
  },
  "lab-scientist": {
    label: "Lab Scientist",
    badge: "badge-warning",
    color: "text-warning bg-warning/10 border-warning/20",
    icon: FaVial,
    description: "Pathology tests, blood banking, specimen analysis, and diagnostic flags.",
  },
  "front-desk": {
    label: "Front Desk",
    badge: "badge-info",
    color: "text-info bg-info/10 border-info/20",
    icon: FaIdBadge,
    description: "Patient card opening, registrations, check-ins, and appointments scheduling.",
  },
  cashier: {
    label: "Cashier / Billing",
    badge: "badge-success",
    color: "text-success bg-success/10 border-success/20",
    icon: FaUserCheck,
    description: "Patient billing invoices, payments collection, and hospital receipt issuance.",
  },
  admin: {
    label: "Hospital Admin",
    badge: "badge-error",
    color: "text-error bg-error/10 border-error/20",
    icon: MdOutlineAdminPanelSettings,
    description: "Hospital administrative operations, reporting, inventory oversight, and staff management.",
  },
};

const AdminStaff = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [viewTab, setViewTab] = useState("directory"); // 'directory' | 'roles'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedStaffDetails, setSelectedStaffDetails] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: yupResolver(registrationSchema),
    defaultValues: {
      role: "doctor",
    },
  });

  const loadStaff = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = await getCachedData(
        "admin_staff_users_list",
        async () => {
          const res = await usersAPI.getUsers();
          const list = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
          return list;
        },
        60000,
        forceRefresh
      );
      setUsers(data);
    } catch (err) {
      console.error("Failed to load staff:", err);
      toast.error("Failed to load staff directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [refreshKey]);

  // Role Breakdown
  const roleCounts = useMemo(() => {
    const counts = {
      total: users.length,
      doctor: 0,
      nurse: 0,
      pharmacist: 0,
      "lab-scientist": 0,
      "front-desk": 0,
      cashier: 0,
      admin: 0,
    };

    users.forEach((u) => {
      const r = (u.accountType || u.role || "").toLowerCase();
      if (r.includes("doctor") || r.includes("surgeon")) counts.doctor++;
      else if (r.includes("nurse")) counts.nurse++;
      else if (r.includes("pharm")) counts.pharmacist++;
      else if (r.includes("lab") || r.includes("sono")) counts["lab-scientist"]++;
      else if (r.includes("front") || r.includes("recep")) counts["front-desk"]++;
      else if (r.includes("cashier")) counts.cashier++;
      else counts.admin++;
    });

    return counts;
  }, [users]);

  const quickStats = [
    {
      label: "Total Staff Personnel",
      value: roleCounts.total,
      sub: "Active hospital staff accounts",
      icon: FaUsers,
      color: "text-primary bg-primary/10 border-primary/20",
    },
    {
      label: "Doctors & Clinicians",
      value: roleCounts.doctor,
      sub: "General & specialist doctors",
      icon: FaUserMd,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Nursing Personnel",
      value: roleCounts.nurse,
      sub: "Inpatient & outpatient nurses",
      icon: FaUserNurse,
      color: "text-accent bg-accent/10 border-accent/20",
    },
    {
      label: "Pharmacy & Laboratory",
      value: roleCounts.pharmacist + roleCounts["lab-scientist"],
      sub: `${roleCounts.pharmacist} Pharmacists, ${roleCounts["lab-scientist"]} Scientists`,
      icon: FaPills,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
  ];

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const userRole = (u.accountType || u.role || "").toLowerCase();
      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "doctor" && (userRole.includes("doctor") || userRole.includes("surgeon"))) ||
        (roleFilter === "nurse" && userRole.includes("nurse")) ||
        (roleFilter === "pharmacist" && userRole.includes("pharm")) ||
        (roleFilter === "lab-scientist" && (userRole.includes("lab") || userRole.includes("sono"))) ||
        (roleFilter === "front-desk" && (userRole.includes("front") || userRole.includes("recep"))) ||
        (roleFilter === "cashier" && userRole.includes("cashier")) ||
        (roleFilter === "admin" && userRole.includes("admin"));

      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesRole;

      const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const email = (u.email || "").toLowerCase();
      const phone = (u.phone || u.phoneNumber || "").toLowerCase();
      const roleText = userRole;

      return matchesRole && (name.includes(q) || email.includes(q) || phone.includes(q) || roleText.includes(q));
    });
  }, [users, roleFilter, searchQuery]);

  const handleCreateStaff = async (data) => {
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        age: Number(data.age),
        email: data.email,
        dateOfBirth: data.dateOfBirth,
        accountType: data.role,
        password: data.password,
      };

      await toast.promise(usersAPI.createUser(payload), {
        loading: "Creating staff account...",
        success: "Staff created successfully!",
        error: (err) => err?.response?.data?.message || "Failed to create staff",
      });

      reset();
      setIsCreateModalOpen(false);
      clearAdminCache("admin_staff_users_list");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Staff creation failed:", err);
    }
  };

  const getRoleBadge = (rawRole) => {
    const r = (rawRole || "").toLowerCase();
    if (r.includes("doctor")) return <span className="badge badge-sm badge-primary font-semibold">Doctor</span>;
    if (r.includes("nurse")) return <span className="badge badge-sm badge-accent font-semibold">Nurse</span>;
    if (r.includes("pharm")) return <span className="badge badge-sm badge-secondary font-semibold">Pharmacist</span>;
    if (r.includes("lab") || r.includes("sono")) return <span className="badge badge-sm badge-warning font-semibold">Lab Scientist</span>;
    if (r.includes("cashier")) return <span className="badge badge-sm badge-success font-semibold">Cashier</span>;
    if (r.includes("front")) return <span className="badge badge-sm badge-info font-semibold">Front Desk</span>;
    return <span className="badge badge-sm badge-error font-semibold">{rawRole || "Admin"}</span>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-2">
              <MdSupervisorAccount className="w-3.5 h-3.5" />
              Staff & User Role Administration
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
              Staff & Roles Directory
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1 max-w-2xl">
              Supervise all hospital staff accounts, clinical privileges, user roles, and onboard new hospital personnel.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                clearAdminCache("admin_staff_users_list");
                setRefreshKey((k) => k + 1);
              }}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-base-200 hover:bg-base-300 text-base-content transition-colors"
              title="Refresh Staff List"
            >
              <FaSync className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              <span>Sync Staff</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary btn-sm rounded-xl text-xs font-semibold flex items-center gap-2"
            >
              <FaUserPlus className="w-3.5 h-3.5" />
              <span>Onboard New Staff</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-black text-base-content mt-1">{stat.value}</p>
                  <p className="text-[11px] text-base-content/50 mt-0.5">{stat.sub}</p>
                </div>
                <div className={`p-3.5 rounded-2xl border ${stat.color} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* View Switcher & Filters */}
        <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewTab("directory")}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors ${
                  viewTab === "directory"
                    ? "bg-primary text-primary-content"
                    : "bg-base-200 text-base-content/70 hover:bg-base-300"
                }`}
              >
                Staff Directory ({filteredUsers.length})
              </button>
              <button
                onClick={() => setViewTab("roles")}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors ${
                  viewTab === "roles"
                    ? "bg-primary text-primary-content"
                    : "bg-base-200 text-base-content/70 hover:bg-base-300"
                }`}
              >
                Role Overview & Cards
              </button>
            </div>

            <div className="relative w-full sm:w-80">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search by name, role, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-sm w-full pl-9 bg-base-200/60 border-base-300 rounded-xl text-xs focus:outline-primary"
              />
            </div>
          </div>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "all", label: `All Staff (${roleCounts.total})` },
              { id: "doctor", label: `Doctors (${roleCounts.doctor})` },
              { id: "nurse", label: `Nurses (${roleCounts.nurse})` },
              { id: "pharmacist", label: `Pharmacists (${roleCounts.pharmacist})` },
              { id: "lab-scientist", label: `Lab Scientists (${roleCounts["lab-scientist"]})` },
              { id: "front-desk", label: `Front Desk (${roleCounts["front-desk"]})` },
              { id: "cashier", label: `Cashiers (${roleCounts.cashier})` },
              { id: "admin", label: `Admins (${roleCounts.admin})` },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setRoleFilter(pill.id)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                  roleFilter === pill.id
                    ? "bg-neutral text-neutral-content"
                    : "bg-base-200 hover:bg-base-300 text-base-content/70"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode: Directory Table */}
        {viewTab === "directory" ? (
          <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead className="bg-base-200/60 text-xs font-bold text-base-content/70">
                  <tr>
                    <th>#</th>
                    <th>Staff Member</th>
                    <th>Role & Privilege</th>
                    <th>Email Contact</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-base-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8">
                        <span className="loading loading-spinner loading-md text-primary" />
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-base-content/50">
                        No staff members found matching this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, idx) => (
                      <tr key={user._id || idx} className="hover:bg-base-200/40">
                        <td className="font-semibold text-base-content/50">{idx + 1}</td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                              {(user.firstName?.[0] || "U") + (user.lastName?.[0] || "")}
                            </div>
                            <div>
                              <p className="font-bold text-base-content">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-[10px] text-base-content/50">ID: {user._id?.slice(-6) || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td>{getRoleBadge(user.accountType || user.role)}</td>
                        <td className="text-base-content/70">{user.email || "—"}</td>
                        <td className="text-base-content/70">{user.phoneNumber || user.phone || "—"}</td>
                        <td>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success">
                            <FaCheckCircle className="w-2.5 h-2.5" />
                            Active
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedStaffDetails(user)}
                            className="btn btn-ghost btn-xs text-primary font-semibold"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* View Mode: Role Cards Grid (SuperAdminSettings Style) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Object.entries(ROLE_CONFIG).map(([roleKey, roleInfo]) => {
              const count = roleCounts[roleKey] || 0;
              const Icon = roleInfo.icon;
              return (
                <div
                  key={roleKey}
                  onClick={() => {
                    setRoleFilter(roleKey);
                    setViewTab("directory");
                  }}
                  className="bg-base-100 rounded-2xl border border-base-200 p-5 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-xl ${roleInfo.color} group-hover:scale-105 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`badge badge-sm font-bold ${roleInfo.badge} text-[10px]`}>
                        {count} Staff
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-base-content group-hover:text-primary transition-colors">
                        {roleInfo.label}
                      </h3>
                      <p className="text-xs text-base-content/70 mt-1 line-clamp-2 leading-relaxed">
                        {roleInfo.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-base-200/80 flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">
                      {count} Assigned {count === 1 ? "User" : "Users"}
                    </span>
                    <span className="text-xs font-semibold text-base-content/60 group-hover:text-primary transition-all">
                      View Personnel →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Onboard New Staff */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-base-100 rounded-2xl border border-base-200 shadow-xl w-full max-w-lg p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-base-200 pb-3">
                <div className="flex items-center gap-2">
                  <FaUserPlus className="text-primary w-5 h-5" />
                  <h3 className="text-lg font-bold text-base-content">Onboard New Hospital Staff</h3>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit(handleCreateStaff)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-base-content/70 block mb-1">First Name</label>
                    <input
                      type="text"
                      {...register("firstName")}
                      className="input input-sm input-bordered w-full text-xs"
                      placeholder="e.g. Samuel"
                    />
                    {errors.firstName && <p className="text-[10px] text-error mt-0.5">{errors.firstName.message}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-base-content/70 block mb-1">Last Name</label>
                    <input
                      type="text"
                      {...register("lastName")}
                      className="input input-sm input-bordered w-full text-xs"
                      placeholder="e.g. Adeyemi"
                    />
                    {errors.lastName && <p className="text-[10px] text-error mt-0.5">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-base-content/70 block mb-1">Email Address</label>
                    <input
                      type="email"
                      {...register("email")}
                      className="input input-sm input-bordered w-full text-xs"
                      placeholder="staff@kolak.com"
                    />
                    {errors.email && <p className="text-[10px] text-error mt-0.5">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-base-content/70 block mb-1">Age</label>
                    <input
                      type="number"
                      {...register("age")}
                      className="input input-sm input-bordered w-full text-xs"
                      placeholder="32"
                    />
                    {errors.age && <p className="text-[10px] text-error mt-0.5">{errors.age.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-base-content/70 block mb-1">Date of Birth</label>
                    <input
                      type="date"
                      {...register("dateOfBirth")}
                      className="input input-sm input-bordered w-full text-xs"
                    />
                    {errors.dateOfBirth && <p className="text-[10px] text-error mt-0.5">{errors.dateOfBirth.message}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-base-content/70 block mb-1">Assigned Role</label>
                    <select
                      {...register("role")}
                      className="select select-sm select-bordered w-full text-xs font-semibold"
                    >
                      <option value="doctor">Doctor</option>
                      <option value="nurse">Nurse</option>
                      <option value="pharmacist">Pharmacist</option>
                      <option value="lab-scientist">Lab Scientist</option>
                      <option value="front-desk">Front Desk</option>
                      <option value="cashier">Cashier</option>
                      <option value="admin">Administrator</option>
                    </select>
                    {errors.role && <p className="text-[10px] text-error mt-0.5">{errors.role.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-base-content/70 block mb-1">Account Password</label>
                  <input
                    type="password"
                    {...register("password")}
                    className="input input-sm input-bordered w-full text-xs"
                    placeholder="Minimum 6 characters"
                  />
                  {errors.password && <p className="text-[10px] text-error mt-0.5">{errors.password.message}</p>}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-base-200">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="btn btn-sm btn-ghost text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-sm btn-primary text-xs"
                  >
                    {isSubmitting ? "Creating..." : "Create Staff Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Staff Details */}
        {selectedStaffDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-base-100 rounded-2xl border border-base-200 shadow-xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-base-200 pb-3">
                <h3 className="text-base font-bold text-base-content">Staff Profile & Credentials</h3>
                <button
                  onClick={() => setSelectedStaffDetails(null)}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                    {(selectedStaffDetails.firstName?.[0] || "U") + (selectedStaffDetails.lastName?.[0] || "")}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-base-content">
                      {selectedStaffDetails.firstName} {selectedStaffDetails.lastName}
                    </h4>
                    <p className="text-xs text-primary font-semibold">
                      {selectedStaffDetails.accountType || selectedStaffDetails.role}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2">
                  <div>
                    <span className="text-base-content/50 block">Email Address:</span>
                    <span className="font-semibold text-base-content">{selectedStaffDetails.email || "—"}</span>
                  </div>
                  <div>
                    <span className="text-base-content/50 block">Phone Number:</span>
                    <span className="font-semibold text-base-content">
                      {selectedStaffDetails.phoneNumber || selectedStaffDetails.phone || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-base-content/50 block">Age:</span>
                    <span className="font-semibold text-base-content">{selectedStaffDetails.age || "—"} yrs</span>
                  </div>
                  <div>
                    <span className="text-base-content/50 block">Account Status:</span>
                    <span className="font-semibold text-success">Active & Verified</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-base-content/50 block">System ID:</span>
                    <span className="font-mono text-base-content/80">{selectedStaffDetails._id}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-base-200 flex justify-end">
                <button
                  onClick={() => setSelectedStaffDetails(null)}
                  className="btn btn-sm btn-primary text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminStaff;

