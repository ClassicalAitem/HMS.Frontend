import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMetrics } from "@/services/api/metricsAPI";
import { getPatients } from "@/services/api/patientsAPI";
import { getDependants } from "@/services/api/dependantAPI";
import { getAdmissions } from "@/services/api/admissionApi";
import { useAppSelector } from "@/store/hooks";
import KolakLoader from "@/components/common/KolakLoader";
import { MedicalDirectorLayout } from "@/layouts/medical-director";
import { EmptyState, PatientStatusBadge } from "@/components/common";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";
import {
  FaCalendarAlt,
  FaBed,
  FaUserCheck,
  FaUserClock,
  FaStethoscope,
  FaFlask,
  FaUserInjured,
  FaNotesMedical,
  FaHospital,
  FaShieldAlt,
} from "react-icons/fa";
import { RiArrowRightLine } from "react-icons/ri";

const MD_CONSULTATION_STATUSES = new Set([
  "awaiting_md"
]);

const MDDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({});
  const [incomingPatients, setIncomingPatients] = useState([]);
  const [incomingTotal, setIncomingTotal] = useState(0);
  const [admittedTotal, setAdmittedTotal] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [metricsRes, patientsRes, dependantsRes, admissionsRes] =
          await Promise.allSettled([
            getMetrics(),
            getPatients(),
            getDependants(),
            getAdmissions(),
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

        const allAdmissions =
          admissionsRes.status === "fulfilled"
            ? (() => {
                const raw = admissionsRes.value?.data ?? admissionsRes.value ?? [];
                return Array.isArray(raw) ? raw : [];
              })()
            : [];

        // Count confirmed active admissions
        const activeAdmissions = allAdmissions.filter(
          (a) => a.status !== "discharged" && !!a.confirmedAt
        );
        if (mounted) {
          setAdmittedTotal(activeAdmissions.length);
        }

        const hasMDStatus = (status) => {
          if (!status) return false;
          const list = Array.isArray(status) ? status : [status];
          return list.some((s) =>
            MD_CONSULTATION_STATUSES.has(String(s).toLowerCase().replace(/\s+/g, "_"))
          );
        };

        const mappedPatients = patients
          .filter((p) => hasMDStatus(p?.status))
          .map((p) => ({
            patientId: p?.id || p?._id,
            hospitalId: p?.hospitalId,
            name: `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || "Unknown",
            status: Array.isArray(p?.status) ? p.status[p.status.length - 1] : p?.status,
            time: p?.updatedAt || p?.createdAt
              ? new Date(p?.updatedAt || p?.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—",
            updatedAt: p?.updatedAt || p?.createdAt,
            snapshot: p,
            isDependant: false,
          }));

        const mappedDependants = dependants
          .filter((d) => hasMDStatus(d?.status))
          .map((d) => ({
            patientId: d?.patientId || d?.id,
            dependantId: d?.id || d?._id,
            hospitalId: d?.hospitalId || null,
            name: `${d?.firstName || ""} ${d?.lastName || ""}`.trim() || "Unknown",
            status: Array.isArray(d?.status) ? d.status[d.status.length - 1] : d?.status,
            time: d?.updatedAt || d?.createdAt
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
          setIncomingPatients(merged.slice(0, 5));
        }
      } catch (e) {
        console.error("MDDashboard: data fetch error", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // Metric numbers
  const totalTodayAppointment = Number(metrics?.totalTodayAppointment || 0);
  const totalDischargedPatients = Number(metrics?.totalDischargedPatients || 0);
  const totalLabResultCritical = Number(metrics?.totalLabResultCritical || 0);
  const totalLabResultHigh = Number(metrics?.totalLabResultHigh || 0);
  const totalLabResultLow = Number(metrics?.totalLabResultLow || 0);
  const totalLabResultNormal = Number(metrics?.totalLabResultNormal || 0);
  const pendingLabResults =
    totalLabResultCritical + totalLabResultHigh + totalLabResultLow + totalLabResultNormal;

  const doctorName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : "Medical Director";

  const cards = [
    {
      label: "Today's Appointments",
      value: totalTodayAppointment,
      subtext: "Scheduled Consultations",
      icon: FaCalendarAlt,
      tone: "text-primary bg-primary/10",
      border: "border-primary/20",
    },
    {
      label: "Consultation Queue",
      value: incomingTotal,
      subtext: "Waiting for Consultation",
      icon: FaUserClock,
      tone: "text-warning bg-warning/10",
      border: "border-warning/20",
    },
    {
      label: "Admitted Inpatients",
      value: admittedTotal || Number(metrics?.totalAdmittedPatients || 0),
      subtext: "Ward Occupancy",
      icon: FaBed,
      tone: "text-info bg-info/10",
      border: "border-info/20",
    },
    {
      label: "Lab Diagnostics",
      value: pendingLabResults,
      subtext: "Tests & Sign-offs",
      icon: FaFlask,
      tone: "text-secondary bg-secondary/10",
      border: "border-secondary/20",
    },
    {
      label: "Discharged Inpatients",
      value: totalDischargedPatients,
      subtext: "Completed Stays",
      icon: FaUserCheck,
      tone: "text-success bg-success/10",
      border: "border-success/20",
    },
  ];

  return (
    <MedicalDirectorLayout>
      {loading && <KolakLoader fullscreen />}

      <div className="space-y-6">
        {/* Executive Clinical Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-6 sm:p-8 text-primary-content shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="badge badge-sm bg-white/20 text-white border-none font-semibold flex items-center gap-1.5 px-3 py-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Medical Director 
                </span>
                <span className="text-xs text-white/80 flex items-center gap-1">
                  <FaCalendarAlt className="w-3 h-3" />
                  {formatNigeriaDate(new Date())}
                </span>
              </div>
            
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => navigate("/dashboard/medical-director/incoming")}
                className="btn btn-sm bg-white text-primary hover:bg-white/90 border-none font-semibold shadow-sm gap-1.5"
              >
                <FaStethoscope className="w-3.5 h-3.5" />
                Consult Queue
                {incomingTotal > 0 && (
                  <span className="badge badge-xs badge-error text-white font-bold ml-1 animate-pulse">
                    {incomingTotal}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigate("/dashboard/medical-director/admitted")}
                className="btn btn-sm bg-white/15 text-white hover:bg-white/25 border-white/30 font-medium gap-1.5"
              >
                <FaBed className="w-3.5 h-3.5" />
                Inpatient Ward
              </button>

              <button
                onClick={() => navigate("/dashboard/medical-director/labResults")}
                className="btn btn-sm bg-white/15 text-white hover:bg-white/25 border-white/30 font-medium gap-1.5"
              >
                <FaFlask className="w-3.5 h-3.5" />
                Lab Diagnostics
              </button>

              <button
                onClick={() => navigate("/dashboard/medical-director/allPatients")}
                className="btn btn-sm bg-white/15 text-white hover:bg-white/25 border-white/30 font-medium gap-1.5"
              >
                <FaHospital className="w-3.5 h-3.5" />
                Patient Directory
              </button>
            </div>
          </div>

          {/* Subtle Background Accent Pattern */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className={`card bg-base-100 border ${card.border} shadow-sm hover:shadow-md transition-all p-4 flex flex-col justify-between`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider block">
                      {card.label}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-base-content mt-1">
                      {loading ? (
                        <div className="skeleton h-8 w-14 rounded" />
                      ) : (
                        card.value.toLocaleString()
                      )}
                    </h2>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.tone}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-base-content/50 font-medium">
                  {card.subtext}
                </div>
              </div>
            );
          })}
        </div>

        {/* Consultation Queue Preview */}
        <div className="grid grid-cols-1 gap-6">
          <div className="card bg-base-100 border border-base-300 shadow-sm p-4 sm:p-5 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-base-200">
                <div className="flex items-center gap-2">
                  <FaUserClock className="text-primary w-4 h-4" />
                  <h3 className="font-bold text-sm text-base-content">
                    Consultation Queue
                  </h3>
                  <span className="badge badge-primary badge-sm font-semibold">
                    {incomingTotal} Waiting
                  </span>
                </div>
                <button
                  onClick={() => navigate("/dashboard/medical-director/incoming")}
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  View All <RiArrowRightLine />
                </button>
              </div>

              <div className="mt-3 space-y-2.5">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-base-200 bg-base-200/30 flex items-center gap-3"
                    >
                      <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="skeleton h-4 w-32 rounded" />
                        <div className="skeleton h-3 w-20 rounded" />
                      </div>
                    </div>
                  ))
                ) : incomingPatients.length === 0 ? (
                  <div className="py-10 text-center text-base-content/50 text-xs">
                    <FaUserCheck className="w-8 h-8 mx-auto text-success/60 mb-2" />
                    No incoming patients waiting in queue right now.
                  </div>
                ) : (
                  incomingPatients.map((patient, index) => {
                    const initials = patient.name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n) => n[0]?.toUpperCase())
                      .join("");

                    return (
                      <div
                        key={index}
                        className="p-3 rounded-xl border border-base-200 hover:border-primary/40 bg-base-200/20 hover:bg-base-200/50 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {initials || "P"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-xs sm:text-sm text-base-content truncate min-w-0">
                                {patient.name}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-base-content/60 mt-0.5">
                              <PatientStatusBadge
                                status={patient.status}
                                statusSenderName={patient.snapshot?.statusSenderName}
                                statusUser={patient.snapshot?.statusUser}
                                updatedAt={patient.snapshot?.updatedAt}
                                tooltipAlign="left"
                              />
                              {patient.isDependant && (
                                <span className="badge badge-secondary badge-outline badge-xs">
                                  Dependant
                                </span>
                              )}
                              <span className="truncate">{patient.time}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            navigate("/dashboard/medical-director/incoming")
                          }
                          className="btn btn-xs btn-primary gap-1 shrink-0 self-end sm:self-auto"
                        >
                          Consult
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <button
              onClick={() => navigate("/dashboard/medical-director/incoming")}
              className="btn btn-sm btn-outline border-base-300 w-full mt-3 gap-1.5 text-xs font-semibold"
            >
              Open Complete Consultation Queue
            </button>
          </div>
        </div>
      </div>
    </MedicalDirectorLayout>
  );
};

export default MDDashboard;