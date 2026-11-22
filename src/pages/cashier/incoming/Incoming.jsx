import React, { useState, useEffect, useMemo, useCallback } from "react";
import { CashierLayout } from "@/layouts/cashier";
import { useNavigate } from "react-router-dom";
import { getPatients, getPatientById, updatePatientStatus } from "@/services/api/patientsAPI";
import { getDependants, updateDependantStatus } from "@/services/api/dependantAPI";
import { formatNigeriaDateTime, formatNigeriaDate, formatNigeriaTime } from "@/utils/formatDateTimeUtils";
import KolakLoader from "@/components/common/KolakLoader";
import { PATIENT_STATUS } from "@/constants/patientStatus";
import { normalizeStatus } from "@/utils/statusUtils";
import { useNotifications } from "@/contexts/NotificationContext";
import ClearItemButton from "@/components/common/ClearIncomingButton";
import ClearAllButton from "@/components/common/ClearAllButton";
import { PatientStatusBadge, EmptyState } from "@/components/common";
import {
  FaSearch,
  FaTimes,
  FaArrowRight,
  FaClock,
  FaHandHoldingUsd,
  FaFileInvoiceDollar
} from "react-icons/fa";
import { RiRefreshLine, RiHandCoinLine } from "react-icons/ri";

const Incoming = () => {
  const navigate = useNavigate();
  const { refreshQueueCount } = useNotifications();

  const [incomingPatients, setIncomingPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search Query
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination (10 per page as requested)
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 10;

  const fetchIncoming = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [patientsRes, dependantsRes] = await Promise.allSettled([
        getPatients({ status: "awaiting_cashier", limit: 200 }),
        getDependants({ status: "awaiting_cashier", limit: 200 }),
      ]);

      const patients = patientsRes.status === "fulfilled"
        ? (Array.isArray(patientsRes.value?.data) ? patientsRes.value.data : patientsRes.value?.data?.data ?? [])
        : [];

      const dependants = dependantsRes.status === "fulfilled"
        ? (() => {
            const raw = dependantsRes.value?.data?.data ?? dependantsRes.value?.data ?? [];
            return Array.isArray(raw) ? raw : (raw?.dependants ?? []);
          })()
        : [];

      const matchesStatus = (p) => normalizeStatus(p?.status) === PATIENT_STATUS.AWAITING_CASHIER;
      const patientMap = new Map(patients.map((p) => [p?.id || p?._id, p]));

      const mappedPatients = patients
        .filter(matchesStatus)
        .map((p) => ({
          type: "patient",
          id: p?.id || p?._id,
          patientId: p?.id || p?._id,
          dependantId: null,
          snapshot: p,
          name: `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || "Unknown",
          displayId: p?.hospitalId || p?.id || "—",
          gender: p?.gender || "—",
          phone: p?.phone || p?.phoneNumber || "—",
          insurance: Array.isArray(p?.hmos) && p.hmos.length > 0
            ? p.hmos.map((h) => h.provider).filter(Boolean).join(", ")
            : "Self-pay",
          updatedAt: p?.updatedAt || p?.createdAt,
          status: p?.status,
          statusUser: p?.statusUser,
          statusSenderName: p?.statusSenderName,
        }));

      // Fetch missing parents for dependants
      const missingParentIds = Array.from(
        new Set(
          dependants
            .map((d) => d?.patientId || d?.patient?.id)
            .filter((id) => id && !patientMap.has(id))
        )
      );

      if (missingParentIds.length > 0) {
        const fetchedParents = await Promise.allSettled(
          missingParentIds.map((id) => getPatientById(id))
        );
        fetchedParents.forEach((res) => {
          if (res.status === "fulfilled") {
            const p = res.value?.data?.data ?? res.value?.data;
            if (p && (p.id || p._id)) {
              patientMap.set(p.id || p._id, p);
            }
          }
        });
      }

      const mappedDependants = dependants
        .filter(matchesStatus)
        .map((d) => {
          const parentPatient = d?.patient || patientMap.get(d?.patientId);
          const parentHospitalId = parentPatient?.hospitalId || d?.patient?.hospitalId;
          return {
            type: "dependant",
            id: d?.id || d?._id,
            patientId: d?.patientId,
            dependantId: d?.id || d?._id,
            snapshot: d,
            name: `${d?.firstName || ""} ${d?.lastName || ""}`.trim() || "Unknown",
            badge: d?.relationshipType || "Dependant",
            displayId: parentHospitalId || "—",
            gender: d?.gender || "—",
            phone: parentPatient?.phone || parentPatient?.phoneNumber || "—",
            insurance: Array.isArray(parentPatient?.hmos) && parentPatient.hmos.length > 0
              ? parentPatient.hmos.map((h) => h.provider).filter(Boolean).join(", ")
              : "Self-pay",
            updatedAt: d?.updatedAt || d?.createdAt,
            status: d?.status,
            statusUser: d?.statusUser,
            statusSenderName: d?.statusSenderName,
          };
        });

      setIncomingPatients([...mappedPatients, ...mappedDependants]);
    } catch (err) {
      console.error("Cashier Incoming: fetch error", err);
      setIncomingPatients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIncoming();
  }, [fetchIncoming]);

  // Filter & sort
  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return incomingPatients
      .filter((p) => {
        if (!q) return true;
        return [p.name, p.displayId, p.phone, p.insurance]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }, [incomingPatients, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / patientsPerPage));
  const startIndex = (currentPage - 1) * patientsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, startIndex + patientsPerPage);

  const handleViewDetails = (patient) => {
    const id = patient?.patientId || patient?.id;
    if (!id) return;
    navigate(`/cashier/patient-details/${id}`, {
      state: {
        from: "incoming",
        patientSnapshot: patient.type === "dependant" ? null : patient?.snapshot,
        dependantId: patient.dependantId,
        dependantSnapshot: patient.type === "dependant" ? patient?.snapshot : null,
      },
    });
  };

  const handleClear = async (patient) => {
    if (patient.type === "dependant") {
      await updateDependantStatus(patient.dependantId, { status: PATIENT_STATUS.COMPLETED });
    } else {
      await updatePatientStatus(patient.patientId, { status: PATIENT_STATUS.COMPLETED });
    }
    localStorage.setItem("refreshIncoming", Date.now().toString());
    refreshQueueCount();
    fetchIncoming(true);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
  };

  const isFiltered = !!searchQuery.trim();

  return (
    <CashierLayout>
      {loading && <KolakLoader fullscreen />}
      <div className="flex flex-col flex-1 bg-base-100 min-w-0">
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">

          {/* PAGE HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-[#00943C]/10 text-[#00943C] shadow-xs">
                <RiHandCoinLine size={26} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-base-content">Incoming Cashier Queue</h1>
                <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
                  Patients awaiting bill settlement, receipt generation, and payment clearance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => fetchIncoming(true)}
                disabled={refreshing}
                className="btn btn-outline border-base-300 hover:border-primary hover:bg-primary/5 hover:text-primary btn-sm gap-2"
              >
                <RiRefreshLine className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                <span className="text-xs font-semibold">{refreshing ? "Refreshing..." : "Refresh"}</span>
              </button>

              <ClearAllButton
                items={incomingPatients}
                updateStatusFn={handleClear}
                onCleared={() => fetchIncoming(true)}
              />
            </div>
          </div>

          {/* MAIN CARD CONTAINER */}
          <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
            
            {/* TOOLBAR */}
            <div className="p-4 sm:p-5 bg-base-100 border-b border-base-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search by patient name, KOLAK ID, phone, or insurance..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-sm input-bordered w-full pl-9 pr-8 text-xs rounded-xl"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                {isFiltered && (
                  <button
                    onClick={handleClearFilters}
                    className="btn btn-ghost btn-sm text-xs text-error font-medium"
                  >
                    Reset Search
                  </button>
                )}
                <div className="badge badge-lg bg-primary/10 border-none text-primary font-bold text-xs px-3 py-3 gap-1">
                  <span>Queue:</span>
                  <span className="text-sm font-extrabold">{filteredPatients.length}</span>
                  <span className="font-normal text-primary/80">patients</span>
                </div>
              </div>
            </div>

            {/* LIST ITEMS TABLE HEADER (DESKTOP) */}
            {!loading && filteredPatients.length > 0 && (
              <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 bg-base-200/60 border-b border-base-200 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                <div className="col-span-1">S/N</div>
                <div className="col-span-3">Patient Profile</div>
                <div className="col-span-2">Hospital ID</div>
                <div className="col-span-1">Type</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Time & Date</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
            )}

            {/* LIST ITEMS */}
            <div className="divide-y divide-base-200">
              {loading ? (
                <div className="py-20 flex justify-center">
                  <KolakLoader />
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="py-16">
                  <EmptyState
                    title="No incoming patients"
                    description={
                      isFiltered
                        ? "No patients matched your search query in the cashier queue."
                        : "There are currently no patients awaiting payment settlement."
                    }
                    actionLabel={isFiltered ? "Clear Search" : "Refresh"}
                    onAction={isFiltered ? handleClearFilters : () => fetchIncoming(true)}
                  />
                </div>
              ) : (
                currentPatients.map((patient, idx) => {
                  const serialNumber = startIndex + idx + 1;
                  const initial = (patient.name || "P")[0].toUpperCase();

                  return (
                    <div
                      key={`${patient.type}-${patient.id}`}
                      className="p-4 md:px-5 md:py-3.5 hover:bg-base-200/40 transition-colors"
                    >
                      {/* Mobile Row */}
                      <div className="block md:hidden space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-base-200 text-base-content/60 text-xs font-bold flex items-center justify-center">
                              {serialNumber}
                            </span>
                            <div>
                              <p className="font-bold text-sm text-base-content">{patient.name}</p>
                              <p className="text-xs font-mono font-bold text-primary">{patient.displayId}</p>
                            </div>
                          </div>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            patient.type === "dependant" ? "bg-secondary/10 text-secondary" : "bg-base-200 text-base-content/70"
                          }`}>
                            {patient.type === "dependant" ? patient.badge : "Patient"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-base-200">
                          <span className="text-base-content/60 font-medium">
                            {patient.updatedAt ? formatNigeriaDateTime(patient.updatedAt) : "—"}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <ClearItemButton item={patient} onClear={handleClear} onCleared={() => fetchIncoming(true)} />
                            <button
                              onClick={() => handleViewDetails(patient)}
                              className="btn btn-xs btn-primary gap-1 font-semibold"
                            >
                              <span>Process</span>
                              <FaArrowRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Grid Row */}
                      <div className="hidden md:grid grid-cols-12 gap-2 items-center text-xs">
                        {/* S/N */}
                        <div className="col-span-1 font-bold text-base-content/50">
                          #{serialNumber}
                        </div>

                        {/* Patient Profile */}
                        <div className="col-span-3 min-w-0 pr-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center flex-shrink-0 text-xs">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-base-content truncate text-sm">{patient.name}</p>
                              <div className="flex items-center gap-2 text-[11px] text-base-content/50 mt-0.5">
                                {patient.gender && <span className="capitalize">{patient.gender}</span>}
                                {patient.phone && <span>• {patient.phone}</span>}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hospital ID */}
                        <div className="col-span-2">
                          <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-base-200 text-base-content/80">
                            {patient.displayId}
                          </span>
                        </div>

                        {/* Type */}
                        <div className="col-span-1">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            patient.type === "dependant" ? "bg-secondary/10 text-secondary" : "bg-base-200 text-base-content/70"
                          }`}>
                            {patient.type === "dependant" ? patient.badge : "Patient"}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                          <PatientStatusBadge
                            status="awaiting_cashier"
                            statusSenderName={patient.statusSenderName}
                            statusUser={patient.statusUser}
                            updatedAt={patient.updatedAt}
                            tooltipAlign="left"
                          />
                        </div>

                        {/* Time & Date */}
                        <div className="col-span-1">
                          {patient.updatedAt ? (
                            <div className="text-[11px] leading-tight">
                              <div className="font-semibold text-primary">{formatNigeriaTime(patient.updatedAt)}</div>
                              <div className="text-[10px] text-base-content/50">{formatNigeriaDate(patient.updatedAt)}</div>
                            </div>
                          ) : (
                            <span className="text-base-content/40">—</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 flex items-center justify-end gap-1.5">
                          <ClearItemButton
                            item={patient}
                            onClear={handleClear}
                            onCleared={() => fetchIncoming(true)}
                          />
                          <button
                            onClick={() => handleViewDetails(patient)}
                            className="btn btn-xs btn-primary gap-1 font-bold shadow-2xs"
                          >
                            <span>Process</span>
                            <FaArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* PAGINATION (10 PER PAGE) */}
            {!loading && totalPages > 1 && (
              <div className="p-4 border-t border-base-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-base-100">
                <span className="text-xs text-base-content/60">
                  Showing <strong className="text-base-content">{startIndex + 1}</strong> to{" "}
                  <strong className="text-base-content">{Math.min(startIndex + patientsPerPage, filteredPatients.length)}</strong> of{" "}
                  <strong className="text-base-content">{filteredPatients.length}</strong> patients
                </span>
                <div className="join">
                  <button
                    className="join-item btn btn-sm btn-outline border-base-300"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    «
                  </button>
                  <button className="join-item btn btn-sm bg-base-200 border-base-300 font-bold pointer-events-none">
                    Page {currentPage} of {totalPages}
                  </button>
                  <button
                    className="join-item btn btn-sm btn-outline border-base-300"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CashierLayout>
  );
};

export default Incoming;
