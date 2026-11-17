import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import HrLayout from "@/layouts/hr/HrLayout";
import { getPatients } from "@/services/api/patientsAPI";
import { getDependants } from "@/services/api/dependantAPI";
import { formatNigeriaDateTime, formatNigeriaDateTimeShort } from "@/utils/formatDateTimeUtils";
import { PatientStatusBadge, EmptyState } from "@/components/common";
import KolakLoader from "@/components/common/KolakLoader";
import {
  FaUserNurse,
  FaSearch,
  FaSync,
  FaClock,
  FaPhone,
  FaVenusMars,
  FaHeartbeat,
  FaSyringe,
  FaHospitalUser,
  FaEye,
} from "react-icons/fa";
import toast from "react-hot-toast";

const NURSE_STATUS_KEYS = [
  "awaiting_vitals",
  "awaiting_injection",
  "awaiting_nurse",
  "awaiting_sampling",
];

const NurseQueue = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const fetchNurseQueue = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const statusQuery = NURSE_STATUS_KEYS.join(",");

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
            NURSE_STATUS_KEYS.includes(String(s).toLowerCase())
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
            NURSE_STATUS_KEYS.includes(String(s).toLowerCase())
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

      const combined = [...mappedPrimary, ...mappedDeps].sort(
        (a, b) => new Date(b.queuedAt || 0) - new Date(a.queuedAt || 0)
      );

      setPatients(combined);
      if (isManualRefresh) toast.success("Nurse queue updated");
    } catch (err) {
      console.error("Error loading nurse queue:", err);
      toast.error("Failed to load nurse queue");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNurseQueue();
    const interval = setInterval(() => fetchNurseQueue(false), 30000);
    return () => clearInterval(interval);
  }, [fetchNurseQueue]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    const counts = {
      all: patients.length,
      awaiting_vitals: 0,
      awaiting_injection: 0,
      awaiting_nurse: 0,
      awaiting_sampling: 0,
    };
    patients.forEach((p) => {
      const st = String(p.status).toLowerCase();
      if (counts[st] !== undefined) counts[st]++;
    });
    return counts;
  }, [patients]);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter((item) => {
      const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        fullName.includes(q) ||
        String(item.hospitalId).toLowerCase().includes(q) ||
        String(item.phoneNumber).toLowerCase().includes(q);

      const matchesTab =
        activeTab === "all" ||
        String(item.status).toLowerCase() === activeTab.toLowerCase();

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "principal" && !item.isDependant) ||
        (typeFilter === "dependant" && item.isDependant);

      return matchesSearch && matchesTab && matchesType;
    });
  }, [patients, searchQuery, activeTab, typeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / pageSize) || 1;
  const paginatedPatients = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPatients.slice(start, start + pageSize);
  }, [filteredPatients, page, pageSize]);

  return (
    <HrLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge badge-accent badge-sm font-semibold uppercase tracking-wider">
                Nursing Station
              </span>
              <span className="text-xs text-base-content/60">
                Triage, Vitals & Treatment Queue
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-base-content mt-1">
              Nurse & Vitals Queue Monitor
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70">
              Patients currently in queue for vitals check, nursing intervention, or prescribed injections (<span className="font-semibold text-pink-600 dark:text-pink-400">awaiting_vitals | awaiting_injections | awaiting_nurse</span>).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchNurseQueue(true)}
              disabled={refreshing || loading}
              className="btn btn-sm btn-outline border-base-300 hover:border-primary gap-2"
            >
              <FaSync className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Tab Filters with Badges */}
        <div className="flex flex-wrap items-center gap-2 border-b border-base-200 pb-3">
          <button
            onClick={() => {
              setActiveTab("all");
              setPage(1);
            }}
            className={`btn btn-sm rounded-xl gap-2 ${
              activeTab === "all" ? "btn-primary" : "btn-ghost text-base-content/70"
            }`}
          >
            <span>All Nurse Queues</span>
            <span className="badge badge-sm badge-neutral">{tabCounts.all}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("awaiting_vitals");
              setPage(1);
            }}
            className={`btn btn-sm rounded-xl gap-2 ${
              activeTab === "awaiting_vitals"
                ? "btn-primary"
                : "btn-ghost text-base-content/70"
            }`}
          >
            <FaHeartbeat className="w-3.5 h-3.5 text-accent" />
            <span>Awaiting Vitals</span>
            <span className="badge badge-sm badge-accent">
              {tabCounts.awaiting_vitals}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("awaiting_injection");
              setPage(1);
            }}
            className={`btn btn-sm rounded-xl gap-2 ${
              activeTab === "awaiting_injection"
                ? "btn-primary"
                : "btn-ghost text-base-content/70"
            }`}
          >
            <FaSyringe className="w-3.5 h-3.5 text-warning" />
            <span>Awaiting Injection</span>
            <span className="badge badge-sm badge-warning">
              {tabCounts.awaiting_injection}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("awaiting_nurse");
              setPage(1);
            }}
            className={`btn btn-sm rounded-xl gap-2 ${
              activeTab === "awaiting_nurse"
                ? "btn-primary"
                : "btn-ghost text-base-content/70"
            }`}
          >
            <FaUserNurse className="w-3.5 h-3.5 text-info" />
            <span>Awaiting Nurse</span>
            <span className="badge badge-sm badge-info">
              {tabCounts.awaiting_nurse}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("awaiting_sampling");
              setPage(1);
            }}
            className={`btn btn-sm rounded-xl gap-2 ${
              activeTab === "awaiting_sampling"
                ? "btn-primary"
                : "btn-ghost text-base-content/70"
            }`}
          >
            <span>Awaiting Sampling</span>
            <span className="badge badge-sm badge-ghost">
              {tabCounts.awaiting_sampling}
            </span>
          </button>
        </div>

        {/* Search & Patient Type Filter */}
        <div className="p-4 rounded-2xl border border-base-200 bg-base-100 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search patient by name, Hospital ID or phone number..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="input input-sm input-bordered w-full pl-10 h-10 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2">
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

        {/* Queue Cards */}
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <KolakLoader />
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-12 rounded-2xl border border-base-200 bg-base-100 text-center">
            <EmptyState
              title="Nurse Queue is Clear"
              message={
                searchQuery
                  ? "No patients match the search criteria."
                  : "There are currently no patients waiting at the nursing station."
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
                      <div className="w-10 h-10 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0 font-bold text-sm">
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
                      Arrival: {formatNigeriaDateTimeShort(item.queuedAt)}
                    </span>
                    <span className="font-semibold text-pink-600 dark:text-pink-400 capitalize">
                      {String(item.status).replace(/_/g, " ")}
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

export default NurseQueue;
