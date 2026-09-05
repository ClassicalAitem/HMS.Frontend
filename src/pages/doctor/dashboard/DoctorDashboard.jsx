import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UpcomingAppointments from "./UpcomingAppointments";
import { getMetrics } from "@/services/api/metricsAPI";
import { getPatients } from "@/services/api/patientsAPI";
import { getDependants } from "@/services/api/dependantAPI";
import { useAppSelector } from "@/store/hooks";
import KolakLoader from "@/components/common/KolakLoader";
import { DoctorLayout } from "@/components/doctor/doctor";
import {
  FaCalendarAlt,
  FaBed,
  FaUserCheck,
  FaPlusCircle,
  FaUserClock,
  FaStethoscope,
} from "react-icons/fa";
import { RiArrowLeftRightFill, RiArrowRightLine } from "react-icons/ri";
import { TbCalendarPlus } from "react-icons/tb";
import { EmptyState, PatientStatusBadge } from "@/components/common";

const DOCTOR_STATUSES = new Set([
  "awaiting_doctor",
  "awaiting_consultation",
  "in_consultation",
]);

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({});
  const [incomingPatients, setIncomingPatients] = useState([]);
  const [incomingTotal, setIncomingTotal] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [metricsRes, patientsRes, dependantsRes] = await Promise.allSettled([
          getMetrics(),
          getPatients(),
          getDependants(),
        ]);

        if (metricsRes.status === "fulfilled") {
          setMetrics(metricsRes.value?.data || {});
        }

        const patients =
          patientsRes.status === "fulfilled" && Array.isArray(patientsRes.value?.data)
            ? patientsRes.value.data
            : [];

        const rawDeps =
          dependantsRes.status === "fulfilled"
            ? dependantsRes.value?.data?.data ?? dependantsRes.value?.data ?? []
            : [];
        const dependants = Array.isArray(rawDeps) ? rawDeps : rawDeps?.dependants ?? [];

        const hasDoctorStatus = (status) => {
          if (!status) return false;
          const list = Array.isArray(status) ? status : [status];
          return list.some((s) =>
            DOCTOR_STATUSES.has(String(s).toLowerCase().replace(/\s+/g, "_"))
          );
        };

        const mappedPatients = patients
          .filter((p) => hasDoctorStatus(p?.status))
          .map((p) => ({
            patientId: p?.id || p?._id,
            hospitalId: p?.hospitalId,
            name: `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || "Unknown",
            status: Array.isArray(p?.status) ? p.status[p.status.length - 1] : p?.status,
            time: (p?.updatedAt || p?.createdAt)
              ? new Date(p?.updatedAt || p?.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—",
            updatedAt: p?.updatedAt || p?.createdAt,
            snapshot: p,
          }));

        const mappedDependants = dependants
          .filter((d) => hasDoctorStatus(d?.status))
          .map((d) => ({
            patientId: d?.patientId || d?.id,
            dependantId: d?.id || d?._id,
            hospitalId: d?.hospitalId || null,
            name: `${d?.firstName || ""} ${d?.lastName || ""}`.trim() || "Unknown",
            status: Array.isArray(d?.status) ? d.status[d.status.length - 1] : d?.status,
            time: (d?.updatedAt || d?.createdAt)
              ? new Date(d?.updatedAt || d?.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—",
            updatedAt: d?.updatedAt || d?.createdAt,
            snapshot: d,
            isDependant: true,
          }));

        const merged = [...mappedPatients, ...mappedDependants].sort((a, b) => {
          const aTime = new Date(a.updatedAt || 0).getTime();
          const bTime = new Date(b.updatedAt || 0).getTime();
          return bTime - aTime;
        });

        if (mounted) {
          setIncomingTotal(merged.length);
          setIncomingPatients(merged.slice(0, 4));
        }
      } catch (e) {
        console.error("DoctorDashboard: data fetch error", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  // Formatted date in Nigeria
  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-NG", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Personalized greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const doctorDisplayName = user?.firstName
    ? `Dr. ${user.firstName} ${user.lastName || ""}`.trim()
    : "Doctor";

  return (
    <DoctorLayout>
      {loading && <KolakLoader fullscreen />}

      {/* Clinical Welcome & Shift Status Banner */}
      <div className="bg-base-100 border border-base-200 shadow-sm rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          
          <p className="text-xs sm:text-sm text-base-content/60 flex items-center gap-2">
            <FaCalendarAlt className="w-3.5 h-3.5 text-primary" />
            <span>{currentDateFormatted}</span>
            <span>·</span>
            <span>Clinical Consultation &amp; Inpatient Care</span>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate("/dashboard/doctor/incoming")}
            className="btn btn-sm btn-primary rounded-xl font-semibold gap-1.5 shadow-sm"
          >
            <FaPlusCircle className="w-3.5 h-3.5" />
            <span>Consult Incoming</span>
          </button>

          <button
            onClick={() => navigate("/dashboard/doctor/admitted")}
            className="btn btn-sm btn-outline btn-primary rounded-xl font-semibold gap-1.5 shadow-sm"
          >
            <FaBed className="w-3.5 h-3.5" />
            <span>Inpatient Ward</span>
          </button>
        </div>
      </div>

      {/* 4 Sleek KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Appointments */}
        <div
          onClick={() => navigate("/dashboard/doctor/appointments")}
          className="bg-base-100 border border-base-200 hover:border-primary/40 shadow-sm rounded-2xl p-4 sm:p-5 flex items-center justify-between cursor-pointer transition-all hover:shadow-md"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
              Appointments
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-primary">
              {loading ? "—" : Number(metrics?.totalTodayAppointment || 0)}
            </p>
            <p className="text-[11px] text-base-content/50">Scheduled for today</p>
          </div>
          <div className="p-3.5 rounded-xl bg-primary/10 text-primary">
            <TbCalendarPlus className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Incoming Queue Waiting */}
        <div
          onClick={() => navigate("/dashboard/doctor/incoming")}
          className="bg-base-100 border border-base-200 hover:border-primary/40 shadow-sm rounded-2xl p-4 sm:p-5 flex items-center justify-between cursor-pointer transition-all hover:shadow-md"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
              Incoming Queue
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-base-content">
              {loading ? "—" : incomingTotal}
            </p>
            <p className="text-[11px] text-base-content/50">Awaiting consultation</p>
          </div>
          <div className="p-3.5 rounded-xl bg-primary/10 text-primary">
            <RiArrowLeftRightFill className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Admitted Inpatients */}
        <div
          onClick={() => navigate("/dashboard/doctor/admitted")}
          className="bg-base-100 border border-base-200 hover:border-primary/40 shadow-sm rounded-2xl p-4 sm:p-5 flex items-center justify-between cursor-pointer transition-all hover:shadow-md"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
              Admitted Inpatients
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-base-content">
              {loading ? "—" : Number(metrics?.totalAdmittedPatients || 0)}
            </p>
            <p className="text-[11px] text-base-content/50">Current bed occupancy</p>
          </div>
          <div className="p-3.5 rounded-xl bg-primary/10 text-primary">
            <FaBed className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Patients Discharged */}
        <div
          onClick={() => navigate("/dashboard/doctor/attended-today")}
          className="bg-base-100 border border-base-200 hover:border-primary/40 shadow-sm rounded-2xl p-4 sm:p-5 flex items-center justify-between cursor-pointer transition-all hover:shadow-md"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
              Discharged Patients
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-base-content">
              {loading ? "—" : Number(metrics?.totalDischargedPatients || 0)}
            </p>
            <p className="text-[11px] text-base-content/50">Completed ward stays</p>
          </div>
          <div className="p-3.5 rounded-xl bg-primary/10 text-primary">
            <FaUserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Dual Section: Incoming Consultation Queue Preview & Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Incoming Queue Quick Action Card */}
        <div className="lg:col-span-6 bg-base-100 border border-base-200 shadow-sm rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-base-200 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <FaUserClock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-base-content">
                    Consultation Queue
                  </h3>
                  <span className="badge badge-primary badge-sm font-bold">
                    {incomingTotal}
                  </span>
                </div>
                <p className="text-xs text-base-content/60">
                  Triaged patients ready for examination
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/dashboard/doctor/incoming")}
              className="btn btn-xs btn-ghost text-primary font-semibold gap-1 hover:bg-primary/10 rounded-lg"
            >
              <span>View All</span>
              <RiArrowRightLine className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="min-h-[220px]">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-base-200 bg-base-200/30 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-base-300" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-28 rounded bg-base-300" />
                        <div className="h-3 w-16 rounded bg-base-300" />
                      </div>
                    </div>
                    <div className="h-6 w-16 rounded bg-base-300" />
                  </div>
                ))}
              </div>
            ) : incomingPatients.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  title="Queue is clear"
                  description="No patients currently waiting for doctor consultation."
                  actionLabel="Refresh Queue"
                  onAction={() => navigate("/dashboard/doctor/incoming")}
                />
              </div>
            ) : (
              <div className="space-y-2.5">
                {incomingPatients.map((patient, index) => {
                  const initials = (patient.name || "P")
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <div
                      key={index}
                      className="p-3 rounded-xl border border-base-200 hover:border-primary/40 bg-base-200/20 hover:bg-base-200/50 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-base-content truncate">
                              {patient.name}
                            </span>
                            {patient.hospitalId && (
                              <span className="badge badge-ghost badge-xs font-mono">
                                {patient.hospitalId}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-base-content/60">
                            <span>Arrived: {patient.time}</span>
                            <PatientStatusBadge
                              status={patient.status}
                              statusSenderName={patient.snapshot?.statusSenderName}
                              statusUser={patient.snapshot?.statusUser}
                              updatedAt={patient.snapshot?.updatedAt}
                              tooltipAlign="left"
                            />
                            {patient.isDependant && (
                              <span className="badge badge-outline badge-primary badge-xs">
                                Dependant
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          navigate(
                            patient.isDependant
                              ? `/dashboard/doctor/dependant/${patient.dependantId}`
                              : `/dashboard/doctor/patient/${patient.patientId}`,
                            { state: { from: "incoming" } }
                          )
                        }
                        className="btn btn-xs btn-primary rounded-lg font-medium shadow-2xs gap-1"
                      >
                        <FaStethoscope className="w-3 h-3" />
                        <span>Consult</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Upcoming Appointments */}
        <div className="lg:col-span-6">
          <UpcomingAppointments />
        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorDashboard;