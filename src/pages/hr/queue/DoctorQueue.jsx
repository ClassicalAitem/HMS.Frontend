import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import HrLayout from "@/layouts/hr/HrLayout";
import { getPatients } from "@/services/api/patientsAPI";
import { getDependants } from "@/services/api/dependantAPI";
import { formatNigeriaDateTime, formatNigeriaDateTimeShort } from "@/utils/formatDateTimeUtils";
import { PatientStatusBadge, EmptyState } from "@/components/common";
import KolakLoader from "@/components/common/KolakLoader";
import {
  FaUserMd,
  FaSearch,
  FaSync,
  FaClock,
  FaUser,
  FaPhone,
  FaHospital,
  FaVenusMars,
  FaCalendarAlt,
  FaFilter,
  FaEye,
} from "react-icons/fa";
import { FiArrowUpRight } from "react-icons/fi";
import toast from "react-hot-toast";

const DOCTOR_QUEUE_STATUSES = ["awaiting_consultation", "awaiting_doctor", "in_consultation"];

const DoctorQueue = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all"); // 'all' | 'principal' | 'dependant'
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const fetchDoctorQueue = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const statusQuery = DOCTOR_QUEUE_STATUSES.join(",");

      const [patientsRes, dependantsRes] = await Promise.allSettled([
        getPatients({ status: statusQuery, limit: 100 }),
        getDependants({ status: statusQuery, limit: 100 }),
      ]);

      const primaryList =
        patientsRes.status === "fulfilled" && Array.isArray(patientsRes.value?.data)
          ? patientsRes.value.data
          : [];

      const rawDeps =
        dependantsRes.status === "fulfilled"
          ? (() => {
              const d = dependantsRes.value?.data?.data ?? dependantsRes.value?.data;
              return Array.isArray(d) ? d : d?.dependants ?? [];
            })()
          : [];

      const mappedPrimary = primaryList
        .filter((p) => {
          if (!p?.status) return false;
          const statuses = Array.isArray(p.status) ? p.status : [p.status];
          return statuses.some((s) =>
            DOCTOR_QUEUE_STATUSES.includes(String(s).toLowerCase())
          );
        })
        .map((p) => {
          const s = Array.isArray(p.status) ? p.status[p.status.length - 1] : p.status;
          return {
            id: p.id || p._id,
            primaryPatientId: p.id || p._id,
            isDependant: false,
            firstName: p.firstName,
            lastName: p.lastName,
            hospitalId: p.hospitalId || "N/A",
            gender: p.gender || "—",
            age: p.age || p.dateOfBirth || "—",
            phoneNumber: p.phoneNumber || "—",
            status: s,
            queuedAt: p.updatedAt || p.createdAt,
            snapshot: p,
          };
        });

      const mappedDeps = rawDeps
        .filter((d) => {
          if (!d?.status) return false;
          const statuses = Array.isArray(d.status) ? d.status : [d.status];
          return statuses.some((s) =>
            DOCTOR_QUEUE_STATUSES.includes(String(s).toLowerCase())
          );
        })
        .map((d) => {
          const s = Array.isArray(d.status) ? d.status[d.status.length - 1] : d.status;
          return {
            id: d.id || d._id,
            primaryPatientId: d.patientId || d.patient?.id || d.patient?._id,
            isDependant: true,
            firstName: d.firstName,
            lastName: d.lastName,
            hospitalId: d.hospitalId || d.patient?.hospitalId || "N/A (Dep)",
            gender: d.gender || "—",
            age: d.age || d.dateOfBirth || "—",
            phoneNumber: d.patient?.phoneNumber || "—",
            status: s,
            queuedAt: d.updatedAt || d.createdAt,
            principalName: d.patient
              ? `${d.patient.firstName || ""} ${d.patient.lastName || ""}`.trim()
              : "Principal File",
            snapshot: d,
          };
        });

      // Combine and sort by arrival / update time (newest or oldest waiting first)
      const combined = [...mappedPrimary, ...mappedDeps].sort(
        (a, b) => new Date(b.queuedAt || 0) - new Date(a.queuedAt || 0)
      );

      setPatients(combined);
      if (isManualRefresh) toast.success("Doctor queue updated");
    } catch (err) {
      console.error("Error loading doctor queue:", err);
      toast.error("Failed to load doctor queue");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctorQueue();
    const interval = setInterval(() => fetchDoctorQueue(false), 30000);
    return () => clearInterval(interval);
  }, [fetchDoctorQueue]);

  // Filtering
  const filteredPatients = useMemo(() => {
    return patients.filter((item) => {
      // Search
      const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        fullName.includes(q) ||
        String(item.hospitalId).toLowerCase().includes(q) ||
        String(item.phoneNumber).toLowerCase().includes(q);

      // Status
      const matchesStatus =
        statusFilter === "all" ||
        String(item.status).toLowerCase() === statusFilter.toLowerCase();

      // Type
      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "principal" && !item.isDependant) ||
        (typeFilter === "dependant" && item.isDependant);

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [patients, searchQuery, statusFilter, typeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / pageSize) || 1;
  const paginatedPatients = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPatients.slice(start, start + pageSize);
  }, [filteredPatients, page, pageSize]);

  const awaitingConsultationCount = useMemo(() => {
    return patients.filter(
      (p) => String(p.status).toLowerCase() === "awaiting_consultation"
    ).length;
  }, [patients]);

  const inConsultationCount = useMemo(() => {
    return patients.filter(
      (p) => String(p.status).toLowerCase() === "in_consultation"
    ).length;
  }, [patients]);

  return (
    <HrLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge badge-primary badge-sm font-semibold uppercase tracking-wider">
                Clinical Queue
              </span>
              <span className="text-xs text-base-content/60">
                Live Doctor Consultation Queue
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-base-content mt-1">
              Doctor Consultation Queue Monitor
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70">
              Real-time monitoring of patients queued for consultation (<span className="font-semibold text-blue-600 dark:text-blue-400">awaiting_consultation</span> status).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDoctorQueue(true)}
              disabled={refreshing || loading}
              className="btn btn-sm btn-outline border-base-300 hover:border-primary gap-2"
            >
              <FaSync className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Status Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Awaiting Consultation
              </span>
              <FaUserMd className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
              {loading ? <span className="loading loading-dots loading-sm" /> : awaitingConsultationCount}
            </p>
            <p className="text-xs text-base-content/60 mt-1">
              Immediate doctor review needed
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-warning/20 bg-warning/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-warning">
                Currently In Consultation
              </span>
              <FaClock className="w-5 h-5 text-warning" />
            </div>
            <p className="text-3xl font-extrabold text-warning mt-2">
              {loading ? <span className="loading loading-dots loading-sm" /> : inConsultationCount}
            </p>
            <p className="text-xs text-base-content/60 mt-1">
              Active doctor sessions
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-base-200 bg-base-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/70">
                Total In Doctor Stream
              </span>
              <FaHospital className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-extrabold text-base-content mt-2">
              {loading ? <span className="loading loading-dots loading-sm" /> : patients.length}
            </p>
            <p className="text-xs text-base-content/60 mt-1">
              Total waiting + in session
            </p>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 rounded-2xl border border-base-200 bg-base-100 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by patient name, Hospital ID or phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="input input-sm input-bordered w-full pl-10 h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="select select-sm select-bordered h-10 rounded-xl text-xs"
            >
              <option value="all">All Consultation Statuses</option>
              <option value="awaiting_consultation">Awaiting Consultation</option>
              <option value="awaiting_doctor">Awaiting Doctor</option>
              <option value="in_consultation">In Consultation</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="select select-sm select-bordered h-10 rounded-xl text-xs"
            >
              <option value="all">All Patient Types</option>
              <option value="principal">Principal Patients Only</option>
              <option value="dependant">Dependants Only</option>
            </select>
          </div>
        </div>

        {/* Patient Queue Cards / Table */}
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <KolakLoader />
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-12 rounded-2xl border border-base-200 bg-base-100 text-center">
            <EmptyState
              title="No Patients in Doctor Queue"
              message={
                searchQuery
                  ? "No queued patients match your search filter."
                  : "There are currently no patients waiting for doctor consultation."
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedPatients.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-base-200 bg-base-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 font-bold text-sm">
                        {item.firstName?.[0] || "P"}
                        {item.lastName?.[0] || ""}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-base-content truncate">
                            {item.firstName} {item.lastName}
                          </h3>
                          {item.isDependant && (
                            <span className="badge badge-xs badge-secondary">
                              Dependant
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-base-content/60 font-mono">
                          ID: {item.hospitalId}
                        </p>
                      </div>
                    </div>

                    <PatientStatusBadge status={item.status} />
                  </div>

                  {item.isDependant && item.principalName && (
                    <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-base-200/50 text-[11px] text-base-content/70">
                      Linked to: <span className="font-semibold">{item.principalName}</span>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-base-200 grid grid-cols-2 gap-2 text-xs text-base-content/70">
                    <div className="flex items-center gap-1.5">
                      <FaVenusMars className="w-3.5 h-3.5 text-base-content/40" />
                      <span className="capitalize">{item.gender}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FaPhone className="w-3.5 h-3.5 text-base-content/40" />
                      <span className="truncate">{item.phoneNumber}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-base-content/55 pt-2 border-t border-base-200/60">
                    <span className="flex items-center gap-1">
                      <FaClock className="w-3 h-3 text-base-content/40" />
                      Queued: {formatNigeriaDateTimeShort(item.queuedAt)}
                    </span>
                    <span className="font-semibold text-primary">
                      Status: {String(item.status).replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-base-200 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.isDependant) {
                          navigate(
                            `/dashboard/hr/patients/${item.primaryPatientId || item.id}?dependantId=${item.id}`,
                            {
                              state: {
                                dependantId: item.id,
                                patientSnapshot: item.snapshot?.patient || null,
                                dependantSnapshot: item.snapshot,
                              },
                            }
                          );
                        } else {
                          navigate(`/dashboard/hr/patients/${item.id}`, {
                            state: { patientSnapshot: item.snapshot },
                          });
                        }
                      }}
                      className="btn btn-xs btn-primary btn-outline gap-1.5 font-semibold hover:!text-white"
                      title="View full patient details and history"
                    >
                      <FaEye className="w-3 h-3" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 rounded-2xl border border-base-200 bg-base-100">
                <span className="text-xs text-base-content/70">
                  Showing {(page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, filteredPatients.length)} of{" "}
                  {filteredPatients.length} patients
                </span>
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
              </div>
            )}
          </div>
        )}
      </div>
    </HrLayout>
  );
};

export default DoctorQueue;
