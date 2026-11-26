import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import HrLayout from "@/layouts/hr/HrLayout";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMetrics } from "@/store/slices/metricsSlice";
import { getQueueCount } from "@/services/api/notificationAPI";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";
import {
  FaUsers,
  FaUserMd,
  FaUserNurse,
  FaPills,
  FaVial,
  FaUserCheck,
  FaIdBadge,
  FaCalendarCheck,
  FaArrowRight,
  FaSync,
  FaHospitalUser,
  FaClock,
} from "react-icons/fa";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { PiUsersThreeDuotone } from "react-icons/pi";
import { FiActivity, FiArrowUpRight, FiUsers, FiClock } from "react-icons/fi";

const HrDashboard = () => {
  const dispatch = useAppDispatch();
  const { metrics, isLoading: isMetricsLoading } = useAppSelector(
    (state) => state.metrics
  );

  const [doctorQueueCount, setDoctorQueueCount] = useState(0);
  const [nurseQueueCount, setNurseQueueCount] = useState(0);
  const [isQueueLoading, setIsQueueLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQueueCounts = useCallback(async () => {
    try {
      setIsQueueLoading(true);
      const [docRes, nurseRes] = await Promise.allSettled([
        getQueueCount("doctor"),
        getQueueCount("nurse"),
      ]);

      const docCount =
        docRes.status === "fulfilled"
          ? Number(docRes.value?.data?.count ?? docRes.value?.count ?? 0)
          : 0;
      const nurseCount =
        nurseRes.status === "fulfilled"
          ? Number(nurseRes.value?.data?.count ?? nurseRes.value?.count ?? 0)
          : 0;

      setDoctorQueueCount(docCount);
      setNurseQueueCount(nurseCount);
    } catch (err) {
      console.error("Failed to fetch queue counts:", err);
    } finally {
      setIsQueueLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([dispatch(fetchMetrics()), fetchQueueCounts()]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    dispatch(fetchMetrics());
    fetchQueueCounts();
    const interval = setInterval(fetchQueueCounts, 60000); // refresh queue counts every min
    return () => clearInterval(interval);
  }, [dispatch, fetchQueueCounts]);

  const totalStaffCount =
    metrics?.totalStaff ||
    (metrics?.totalDoctors || 0) +
      (metrics?.totalNurses || 0) +
      (metrics?.totalPharmacists || 0) +
      (metrics?.totalLabScientists || 0) +
      (metrics?.totalCashiers || 0) +
      (metrics?.totalAdmin || 0) +
      (metrics?.totalFrontDesk || 0) +
      (metrics?.totalOtherStaff || 0) +
      (metrics?.totalHr || 0) +
      (metrics?.totalAccountOfficers || 0);

  // Total patients minus dependants
  const primaryPatientsCount = metrics?.totalPatients || 0;
  const dependantsCount = metrics?.totalDependants || 0;

  const staffRoleBreakdown = [
    {
      role: "Doctors & Clinicians",
      count: metrics?.totalDoctors || 0,
      icon: FaUserMd,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      role: "Nursing Staff",
      count: metrics?.totalNurses || 0,
      icon: FaUserNurse,
      color: "text-pink-500 bg-pink-500/10 border-pink-500/20",
    },
    {
      role: "Pharmacists",
      count: metrics?.totalPharmacists || 0,
      icon: FaPills,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      role: "Medical Laboratory",
      count: metrics?.totalLabScientists || 0,
      icon: FaVial,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      role: "Front Desk Officers",
      count: metrics?.totalFrontDesk || 0,
      icon: FaIdBadge,
      color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      role: "Cashiers & Billing",
      count: metrics?.totalCashiers || 0,
      icon: FaUserCheck,
      color: "text-green-500 bg-green-500/10 border-green-500/20",
    },
    {
      role: "Administrators",
      count: metrics?.totalAdmin || 0,
      icon: MdOutlineAdminPanelSettings,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
    {
      role: "Human Resources",
      count: metrics?.totalHr || 0,
      icon: FaUsers,
      color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    },
  ];

  return (
    <HrLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge badge-primary badge-sm font-semibold uppercase tracking-wider">
                HR Workspace
              </span>
              <span className="text-xs text-base-content/60">
                {formatNigeriaDate(new Date())}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-base-content mt-1">
              Human Resources & Workforce Analytics
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70">
              Hospital personnel overview, real-time clinical queues, and staff leave monitoring.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isMetricsLoading}
              className="btn btn-sm btn-outline border-base-300 hover:border-primary gap-2"
            >
              <FaSync className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {/* Top Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Staff */}
          <div className="p-5 rounded-2xl border border-base-200 bg-base-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                Total Staff
              </span>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <FaUsers className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-extrabold text-base-content">
                {isMetricsLoading ? (
                  <span className="loading loading-dots loading-sm" />
                ) : (
                  totalStaffCount.toLocaleString()
                )}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-base-content/70">
                <span className="flex items-center gap-1 text-success font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                  {metrics?.totalActiveStaff || 0} active
                </span>
                <span className="flex items-center gap-1 text-warning font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning inline-block" />
                  {metrics?.totalOnLeaveStaff || 0} on leave
                </span>
              </div>
            </div>
          </div>

          {/* Total Patients minus Dependants */}
          <div className="p-5 rounded-2xl border border-base-200 bg-base-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                  Primary Patients
                </span>
                <p className="text-[10px] text-primary font-medium">Excluding Dependants</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-info/10 text-info flex items-center justify-center">
                <PiUsersThreeDuotone className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-extrabold text-base-content">
                {isMetricsLoading ? (
                  <span className="loading loading-dots loading-sm" />
                ) : (
                  primaryPatientsCount.toLocaleString()
                )}
              </p>
              <p className="mt-1.5 text-xs text-base-content/65">
                Total patients minus {dependantsCount} registered dependants
              </p>
            </div>
          </div>

          {/* Doctor Queue */}
          <Link
            to="/dashboard/hr/doctor-queue"
            className="group p-5 rounded-2xl border border-base-200 bg-base-100 shadow-sm hover:shadow-md hover:border-blue-500/40 transition-all block"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                  Doctor Queue
                </span>
                <p className="text-[10px] text-blue-500 font-medium">Awaiting Consultation</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FaUserMd className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-3xl font-extrabold text-base-content">
                  {isQueueLoading ? (
                    <span className="loading loading-dots loading-sm" />
                  ) : (
                    doctorQueueCount
                  )}
                </p>
                <p className="mt-1.5 text-xs text-base-content/65">
                  Patients waiting to see a doctor
                </p>
              </div>
              <FiArrowUpRight className="w-5 h-5 text-base-content/30 group-hover:text-blue-500 transition-colors mb-1" />
            </div>
          </Link>

          {/* Nurse Queue */}
          <Link
            to="/dashboard/hr/nurse-queue"
            className="group p-5 rounded-2xl border border-base-200 bg-base-100 shadow-sm hover:shadow-md hover:border-pink-500/40 transition-all block"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                  Nurse / Vitals Queue
                </span>
                <p className="text-[10px] text-pink-500 font-medium">Triage, Vitals & Injections</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FaUserNurse className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-3xl font-extrabold text-base-content">
                  {isQueueLoading ? (
                    <span className="loading loading-dots loading-sm" />
                  ) : (
                    nurseQueueCount
                  )}
                </p>
                <p className="mt-1.5 text-xs text-base-content/65">
                  Vitals, nurse care & injections
                </p>
              </div>
              <FiArrowUpRight className="w-5 h-5 text-base-content/30 group-hover:text-pink-500 transition-colors mb-1" />
            </div>
          </Link>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/dashboard/hr/doctor-queue"
            className="p-5 rounded-2xl border border-base-200 bg-base-100 hover:border-primary/40 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                <FaUserMd className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-base-content group-hover:text-primary transition-colors">
                Doctor Queue Monitor
              </h3>
              <p className="text-xs text-base-content/65 mt-1">
                View all patients currently queued with <span className="font-semibold text-blue-500">awaiting_consultation</span> status.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-base-200 flex items-center justify-between text-xs font-semibold text-primary">
              <span>View Doctor Queue</span>
              <FaArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/dashboard/hr/nurse-queue"
            className="p-5 rounded-2xl border border-base-200 bg-base-100 hover:border-primary/40 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center mb-3">
                <FaUserNurse className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-base-content group-hover:text-primary transition-colors">
                Nurse & Vitals Queue
              </h3>
              <p className="text-xs text-base-content/65 mt-1">
                Monitor triage vitals, injection queues, and nursing attention statuses in real time.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-base-200 flex items-center justify-between text-xs font-semibold text-primary">
              <span>View Nurse Queue</span>
              <FaArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/dashboard/hr/staff"
            className="p-5 rounded-2xl border border-base-200 bg-base-100 hover:border-primary/40 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                <FaUsers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-base-content group-hover:text-primary transition-colors">
                Staff & Leave Management
              </h3>
              <p className="text-xs text-base-content/65 mt-1">
                Manage staff personnel, view profiles, and update on-leave status to lock/unlock login access.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-base-200 flex items-center justify-between text-xs font-semibold text-primary">
              <span>Manage Staff</span>
              <FaArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/dashboard/hr/attendance"
            className="p-5 rounded-2xl border border-base-200 bg-base-100 hover:border-primary/40 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">
                <FaCalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-base-content group-hover:text-primary transition-colors">
                Staff Attendance Logs
              </h3>
              <p className="text-xs text-base-content/65 mt-1">
                Daily clock-in/clock-out attendance records, filter by department date, and export to CSV.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-base-200 flex items-center justify-between text-xs font-semibold text-primary">
              <span>View Attendance Logs</span>
              <FaArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Workforce Role Breakdown */}
        <div className="p-6 rounded-2xl border border-base-200 bg-base-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-base-content">
                Hospital Staff Distribution by Role
              </h2>
              <p className="text-xs text-base-content/60">
                Current headcount breakdown across clinical, diagnostic, and administrative cadres.
              </p>
            </div>
            <Link
              to="/dashboard/hr/staff"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View Directory</span>
              <FiArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {staffRoleBreakdown.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-base-200/80 bg-base-200/30 flex items-center gap-3"
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold text-base-content leading-tight">
                      {item.count}
                    </p>
                    <p className="text-xs text-base-content/65 truncate">{item.role}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Patient Registry Comparison Box */}
        <div className="p-6 rounded-2xl border border-base-200 bg-base-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-base-content">
                Patient Demographics & Registry Ratio
              </h2>
              <p className="text-xs text-base-content/60">
                Distribution between principal patients and registered dependents.
              </p>
            </div>
            <div className="text-xs font-semibold text-base-content/70">
              Total Individuals:{" "}
              <span className="font-bold text-primary">
                {(primaryPatientsCount + dependantsCount).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <span className="text-xs font-semibold text-primary">Principal Patients (Minus Dependants)</span>
              <p className="text-2xl font-black text-primary mt-1">
                {primaryPatientsCount.toLocaleString()}
              </p>
              <p className="text-[11px] text-base-content/60 mt-1">
                Direct hospital registrants holding unique medical records.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/20">
              <span className="text-xs font-semibold text-secondary">Family Dependants</span>
              <p className="text-2xl font-black text-secondary mt-1">
                {dependantsCount.toLocaleString()}
              </p>
              <p className="text-[11px] text-base-content/60 mt-1">
                Children, spouses, and relatives tied to principal files.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-info/5 border border-info/20">
              <span className="text-xs font-semibold text-info">Dependant-to-Principal Ratio</span>
              <p className="text-2xl font-black text-info mt-1">
                {primaryPatientsCount > 0
                  ? (dependantsCount / primaryPatientsCount).toFixed(2)
                  : "0.00"}
              </p>
              <p className="text-[11px] text-base-content/60 mt-1">
                Average dependants registered per principal patient.
              </p>
            </div>
          </div>
        </div>
      </div>
    </HrLayout>
  );
};

export default HrDashboard;
