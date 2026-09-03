import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, EmptyState } from "@/components/common";
import { Sidebar } from "@/components/surgeon";
import { useAppSelector } from "@/store/hooks";
import { getAllAppointments } from "@/services/api/appointmentsAPI";
import { getInvestigations } from "@/services/api/investigationRequestAPI";
import { getAllSurgeries } from "@/services/api/surgeryAPI";
import { formatNigeriaDate, formatNigeriaTime } from "@/utils/formatDateTimeUtils";
import {
  FaProcedures,
  FaNotesMedical,
  FaCalendarCheck,
  FaClock,
  FaFileAlt,
  FaUserInjured,
  FaArrowRight,
  FaCheckCircle,
  FaHourglassHalf,
  FaSyncAlt,
} from "react-icons/fa";
import { RiMentalHealthFill, RiStethoscopeLine } from "react-icons/ri";

const SurgeonDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [surgeries, setSurgeries] = useState([]);
  const [activeTab, setActiveTab] = useState("today"); // "today" | "all" | "completed"

  const surgeonName =
    user?.firstName || user?.name
      ? `${user?.firstName || ""} ${user?.lastName || user?.name || ""}`.trim()
      : "Surgeon";

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [apptRes, invRes, surgRes] = await Promise.allSettled([
        getAllAppointments(),
        getInvestigations({ type: "surgical" }),
        getAllSurgeries(),
      ]);

      const rawAppts =
        apptRes.status === "fulfilled"
          ? apptRes.value?.data?.data ?? apptRes.value?.data ?? []
          : [];
      const apptList = Array.isArray(rawAppts)
        ? rawAppts
        : rawAppts.appointments ?? [];
      const surgicalAppts = apptList.filter(
        (a) =>
          a.appointmentType === "surgery" ||
          String(a.department || "").toLowerCase() === "surgeon" ||
          String(a.department || "").toLowerCase() === "theatre",
      );
      setAppointments(surgicalAppts);

      const rawInvs =
        invRes.status === "fulfilled"
          ? invRes.value?.data?.data ?? invRes.value?.data ?? []
          : [];
      const invList = Array.isArray(rawInvs) ? rawInvs : [];
      setIncomingRequests(invList);

      const rawSurg =
        surgRes.status === "fulfilled"
          ? surgRes.value?.data?.data ?? surgRes.value?.data ?? []
          : [];
      const surgList = Array.isArray(rawSurg) ? rawSurg : [];
      setSurgeries(surgList);
    } catch (err) {
      console.error("Failed to load surgeon dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];

  const todaySurgeries = useMemo(() => {
    return appointments.filter((a) => {
      const dateStr = a.appointmentDate || a.date;
      if (!dateStr) return false;
      return dateStr.includes(todayStr);
    });
  }, [appointments, todayStr]);

  const pendingNotesCount = useMemo(() => {
    // Incoming surgical requests that haven't been completed or appointments needing notes
    return (
      incomingRequests.filter((i) => i.status !== "completed").length +
      appointments.filter(
        (a) => a.status === "scheduled" || a.status === "in_theatre",
      ).length
    );
  }, [incomingRequests, appointments]);

  const completedSurgeriesCount = useMemo(() => {
    return (
      surgeries.length +
      appointments.filter((a) => a.status === "completed").length
    );
  }, [surgeries, appointments]);

  const filteredAppointments = useMemo(() => {
    if (activeTab === "today") return todaySurgeries;
    if (activeTab === "completed") {
      return appointments.filter((a) => a.status === "completed");
    }
    return appointments;
  }, [activeTab, todaySurgeries, appointments]);

  const handleStartNoteFromAppointment = (appointment) => {
    navigate("/dashboard/surgeon/write-surgical-note", {
      state: { from: "dashboard", appointmentSnapshot: appointment },
    });
  };

  const handleStartNoteFromInvestigation = (inv) => {
    navigate(`/dashboard/surgeon/write-surgical-note/${inv._id || inv.id}`, {
      state: { from: "incoming", investigationRequest: inv },
    });
  };

  return (
    <div className="flex h-screen bg-base-200/50">
      <Sidebar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex flex-col gap-6 p-4 sm:p-6 lg:p-8 h-full">
          {/* WELCOME HERO BANNER */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/95 via-primary/85 to-indigo-600 text-white p-6 sm:p-8 shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Surgical Suite • Active Duty
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Welcome, Dr. {surgeonName}
                </h1>
                <p className="text-white/80 text-sm mt-1 max-w-xl">
                  Manage operating theater schedules, incoming procedure requests, and comprehensive surgical documentation.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={loadDashboardData}
                  className="btn btn-sm btn-ghost bg-white/10 hover:bg-white/20 text-white border-0 gap-1.5"
                  title="Refresh data"
                >
                  <FaSyncAlt className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <button
                  onClick={() => navigate("/dashboard/surgeon/appointments")}
                  className="btn btn-sm bg-white text-primary hover:bg-white/90 border-0 font-bold shadow-md"
                >
                  View All Appointments
                </button>
              </div>
            </div>

            {/* Subtle background glow circle */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          </div>

          {/* 4 STATS KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Today's Surgeries */}
            <div className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
              <div className="card-body p-5 flex-row items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                    Today's Procedures
                  </p>
                  <h2 className="text-3xl font-extrabold text-base-content mt-1">
                    {todaySurgeries.length}
                  </h2>
                  <p className="text-xs text-base-content/50 mt-1 flex items-center gap-1">
                    <FaClock className="w-3 h-3 text-primary" /> Scheduled for today
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-primary/10 text-primary">
                  <FaProcedures className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Card 2: Pending Notes */}
            <div className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
              <div className="card-body p-5 flex-row items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                    Pending Notes
                  </p>
                  <h2 className="text-3xl font-extrabold text-amber-500 mt-1">
                    {pendingNotesCount}
                  </h2>
                  <p className="text-xs text-base-content/50 mt-1 flex items-center gap-1">
                    <FaHourglassHalf className="w-3 h-3 text-amber-500" /> Awaiting write-up
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-500">
                  <FaNotesMedical className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Card 3: Incoming Requests */}
            <div className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
              <div className="card-body p-5 flex-row items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                    Incoming Queue
                  </p>
                  <h2 className="text-3xl font-extrabold text-indigo-500 mt-1">
                    {incomingRequests.length}
                  </h2>
                  <p className="text-xs text-base-content/50 mt-1 flex items-center gap-1">
                    <RiStethoscopeLine className="w-3 h-3 text-indigo-500" /> Consult requests
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-500">
                  <FaUserInjured className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Card 4: Completed Surgeries */}
            <div className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
              <div className="card-body p-5 flex-row items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                    Documented Notes
                  </p>
                  <h2 className="text-3xl font-extrabold text-emerald-500 mt-1">
                    {completedSurgeriesCount}
                  </h2>
                  <p className="text-xs text-base-content/50 mt-1 flex items-center gap-1">
                    <FaCheckCircle className="w-3 h-3 text-emerald-500" /> Complete records
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <FaCalendarCheck className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT SPLIT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* LEFT 2 COLS: THEATRE SCHEDULE & APPOINTMENTS */}
            <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-200">
              <div className="p-5 border-b border-base-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-base-content">
                    Operating Theatre & Procedure Schedule
                  </h2>
                  <p className="text-xs text-base-content/60">
                    Surgical bookings assigned to theatre and surgical teams
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="join">
                  <button
                    className={`btn btn-xs join-item ${
                      activeTab === "today" ? "btn-primary text-white" : "btn-ghost"
                    }`}
                    onClick={() => setActiveTab("today")}
                  >
                    Today ({todaySurgeries.length})
                  </button>
                  <button
                    className={`btn btn-xs join-item ${
                      activeTab === "all" ? "btn-primary text-white" : "btn-ghost"
                    }`}
                    onClick={() => setActiveTab("all")}
                  >
                    All Surgeries ({appointments.length})
                  </button>
                  <button
                    className={`btn btn-xs join-item ${
                      activeTab === "completed" ? "btn-primary text-white" : "btn-ghost"
                    }`}
                    onClick={() => setActiveTab("completed")}
                  >
                    Completed
                  </button>
                </div>
              </div>

              <div className="p-0 overflow-x-auto">
                {loading ? (
                  <div className="p-8 text-center space-y-3">
                    <span className="loading loading-spinner loading-md text-primary" />
                    <p className="text-xs text-base-content/60">Loading theatre bookings...</p>
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="p-8 text-center">
                    <EmptyState
                      title="No Scheduled Surgeries"
                      description={
                        activeTab === "today"
                          ? "No surgical procedures scheduled for today."
                          : "No surgical appointments found in this category."
                      }
                    />
                  </div>
                ) : (
                  <table className="table w-full">
                    <thead>
                      <tr className="border-b border-base-200 text-xs text-base-content/60">
                        <th>Patient</th>
                        <th>Procedure</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-200 text-sm">
                      {filteredAppointments.map((appt) => {
                        const isDep = !!appt.dependantId;
                        const patientName =
                          appt.patientName ||
                          (isDep
                            ? `${appt.dependant?.firstName || ""} ${appt.dependant?.lastName || ""}`.trim()
                            : `${appt.patient?.firstName || ""} ${appt.patient?.lastName || ""}`.trim()) ||
                          "Patient";
                        const hospitalId =
                          appt.patient?.hospitalId || appt.patientId || "—";

                        return (
                          <tr key={appt.id || appt._id} className="hover:bg-base-200/40 transition-colors">
                            <td>
                              <div className="flex flex-col">
                                <span className="font-semibold text-base-content">
                                  {patientName}
                                </span>
                                <span className="text-xs text-base-content/50 font-mono">
                                  ID: {hospitalId} {isDep && "• Dependant"}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="flex flex-col">
                                <span className="font-medium text-base-content">
                                  {appt.procedureName || "Surgical Procedure"}
                                </span>
                                {appt.procedureCode && (
                                  <span className="text-xs font-mono text-base-content/50">
                                    {appt.procedureCode}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="flex flex-col text-xs text-base-content/70">
                                <span>{appt.appointmentDate ? formatNigeriaDate(appt.appointmentDate) : "—"}</span>
                                <span className="font-medium">{appt.appointmentTime ? formatNigeriaTime(appt.appointmentTime) : "—"}</span>
                              </div>
                            </td>
                            <td>
                              <span
                                className={`badge badge-sm font-semibold capitalize ${
                                  appt.status === "completed"
                                    ? "badge-success text-white"
                                    : appt.status === "in_theatre"
                                    ? "badge-warning"
                                    : appt.status === "cancelled"
                                    ? "badge-error text-white"
                                    : "badge-ghost"
                                }`}
                              >
                                {appt.status?.replace("_", " ") || "scheduled"}
                              </span>
                            </td>
                            <td className="text-right">
                              <button
                                type="button"
                                onClick={() => handleStartNoteFromAppointment(appt)}
                                className="btn btn-xs btn-primary gap-1 font-semibold text-white shadow-xs"
                              >
                                <FaFileAlt className="w-3 h-3" />
                                Write Note
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* RIGHT COL: INCOMING SURGICAL REQUESTS & QUICK TASKS */}
            <div className="flex flex-col gap-6">
              {/* INCOMING QUEUE CARD */}
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="p-5 border-b border-base-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base-content">Incoming Surgical Queue</h3>
                    <p className="text-xs text-base-content/60">
                      Requests ordered by Doctors
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/dashboard/surgeon/incoming")}
                    className="btn btn-ghost btn-xs text-primary gap-1 font-semibold"
                  >
                    View All <FaArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  {incomingRequests.length === 0 ? (
                    <p className="text-xs text-base-content/50 text-center py-4">
                      No pending surgical requests in queue.
                    </p>
                  ) : (
                    incomingRequests.slice(0, 4).map((inv) => (
                      <div
                        key={inv._id || inv.id}
                        className="p-3.5 rounded-xl border border-base-200 hover:border-primary/40 bg-base-200/30 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-base-content">
                            {inv.patient?.fullName ||
                              `${inv.patient?.firstName || ""} ${inv.patient?.lastName || ""}`.trim() ||
                              inv.patientName ||
                              "Patient"}
                          </span>
                          <span className="text-xs text-primary font-medium">
                            {inv.type || inv.title || "Surgical Request"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleStartNoteFromInvestigation(inv)}
                          className="btn btn-xs btn-outline btn-primary"
                        >
                          Write Note
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* QUICK THEATRE SHORTCUTS */}
              <div className="card bg-gradient-to-br from-base-100 to-base-200/50 shadow-sm border border-base-200 p-5 space-y-3">
                <h3 className="font-bold text-sm text-base-content">Surgeon Quick Actions</h3>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/surgeon/write-surgical-note")}
                    className="btn btn-sm btn-outline justify-start gap-2 text-xs"
                  >
                    <FaNotesMedical className="text-primary w-3.5 h-3.5" />
                    New Surgical Operative Note
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/surgeon/assignedTask")}
                    className="btn btn-sm btn-outline justify-start gap-2 text-xs"
                  >
                    <RiMentalHealthFill className="text-secondary w-3.5 h-3.5" />
                    Surgical Checklists & Tasks
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/surgeon/appointments")}
                    className="btn btn-sm btn-outline justify-start gap-2 text-xs"
                  >
                    <FaCalendarCheck className="text-accent w-3.5 h-3.5" />
                    Theatre Bookings Calendar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurgeonDashboard;
