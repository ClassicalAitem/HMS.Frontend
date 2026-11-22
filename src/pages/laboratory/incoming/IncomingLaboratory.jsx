import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import LaboratoryLayout from "@/layouts/laboratory";
import KolakLoader from "@/components/common/KolakLoader";
import { getInvestigations } from "@/services/api/investigationRequestAPI";
import { getPatients, getPatientById, updatePatientStatus } from "@/services/api/patientsAPI";
import { getDependants, updateDependantStatus } from "@/services/api/dependantAPI";
import { normalizeStatus } from "@/utils/statusUtils";
import { PATIENT_STATUS } from "@/constants/patientStatus";
import { formatNigeriaDateTime, formatNigeriaDate } from "@/utils/formatDateTimeUtils";
import toast from "react-hot-toast";
import { useNotifications } from "@/contexts/NotificationContext";
import ClearItemButton from "@/components/common/ClearIncomingButton";
import ClearAllButton from "@/components/common/ClearAllButton";
import {
  FaFlask,
  FaEye,
  FaSearch,
  FaTimes,
  FaUserMd,
  FaCalendarAlt,
  FaClock,
} from "react-icons/fa";
import { RiRefreshLine } from "react-icons/ri";

const IncomingLaboratory = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 10;

  const { refreshQueueCount, lastUpdate } = useNotifications();

  const fetchIncomingPatients = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const [patientsRes, dependantsRes, investigationsRes] = await Promise.allSettled([
        getPatients({ status: "awaiting_lab", limit: 100 }),
        getDependants({ status: "awaiting_lab", limit: 100 }),
        getInvestigations({ type: "lab", limit: 200 }),
      ]);

      const patientList =
        patientsRes.status === "fulfilled"
          ? Array.isArray(patientsRes.value?.data)
            ? patientsRes.value.data
            : patientsRes.value?.data?.data ?? []
          : [];

      const rawDependants =
        dependantsRes.status === "fulfilled"
          ? dependantsRes.value?.data?.data ?? dependantsRes.value?.data ?? []
          : [];
      const dependantList = Array.isArray(rawDependants)
        ? rawDependants
        : rawDependants?.dependants ?? [];

      const rawInvestigations =
        investigationsRes.status === "fulfilled"
          ? Array.isArray(investigationsRes.value)
            ? investigationsRes.value
            : investigationsRes.value?.data ?? []
          : [];
      const allInvestigations = Array.isArray(rawInvestigations) ? rawInvestigations : [];

      // Build map of latest lab investigation for each patient / dependant
      const latestInvBySubject = new Map();
      allInvestigations.forEach((inv) => {
        const type = String(inv.type || "").toLowerCase();
        if (type && type !== "lab" && type !== "laboratory") return;

        const depId = inv.dependantId || inv.dependant?.id || inv.dependant?._id;
        const patId = inv.patientId || inv.patient?.id || inv.patient?._id;
        const key = depId ? `dependant:${depId}` : patId ? `patient:${patId}` : null;
        if (!key) return;

        const existing = latestInvBySubject.get(key);
        if (!existing || new Date(inv.createdAt || 0) > new Date(existing.createdAt || 0)) {
          latestInvBySubject.set(key, inv);
        }
      });

      // Filter patients strictly where status is awaiting_lab
      const isAwaitingLab = (p) => normalizeStatus(p?.status) === PATIENT_STATUS.AWAITING_LAB;

      const mappedPatients = patientList
        .filter(isAwaitingLab)
        .map((p) => {
          const patId = p?.id || p?._id;
          const inv = latestInvBySubject.get(`patient:${patId}`);

          const doctorName =
            inv?.doctorName ||
            (inv?.doctor ? `${inv.doctor.firstName || ""} ${inv.doctor.lastName || ""}`.trim() : null) ||
            p?.statusSenderName ||
            p?.statusUser?.name ||
            "Attending Physician";

          return {
            type: "patient",
            key: `patient:${patId}`,
            id: patId,
            patientId: patId,
            dependantId: null,
            name: `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || p?.fullName || "Unknown Patient",
            gender: p?.gender || "Not specified",
            dob: p?.dob || p?.dateOfBirth,
            displayId: p?.hospitalId || p?.id || "—",
            hospitalId: p?.hospitalId || "—",
            status: p?.status || "awaiting_lab",
            updatedAt: inv?.createdAt || p?.updatedAt || p?.createdAt,
            doctorName,
            tests: inv?.tests || [],
            snapshot: p,
          };
        });

      // Parent patient map for dependants
      const patientMap = new Map(patientList.map((p) => [p?.id || p?._id, p]));

      // Resolve missing parent patients for dependants
      const missingParentIds = Array.from(
        new Set(
          dependantList
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

      const mappedDependants = dependantList
        .filter(isAwaitingLab)
        .map((d) => {
          const depId = d?.id || d?._id;
          const patId = d?.patientId || d?.patient?.id || d?.patient?._id;
          const parent = patientMap.get(patId) || d?.patient || {};
          const inv = latestInvBySubject.get(`dependant:${depId}`) || latestInvBySubject.get(`patient:${patId}`);

          const doctorName =
            inv?.doctorName ||
            (inv?.doctor ? `${inv.doctor.firstName || ""} ${inv.doctor.lastName || ""}`.trim() : null) ||
            d?.statusSenderName ||
            parent?.statusSenderName ||
            d?.statusUser?.name ||
            "Attending Physician";

          return {
            type: "dependant",
            key: `dependant:${depId}`,
            id: depId,
            patientId: patId,
            dependantId: depId,
            name: `${d?.firstName || ""} ${d?.lastName || ""}`.trim() || d?.fullName || "Dependant",
            guardianName: `${parent?.firstName || ""} ${parent?.lastName || ""}`.trim() || null,
            gender: d?.gender || "Not specified",
            dob: d?.dob || d?.dateOfBirth,
            displayId: parent?.hospitalId || d?.hospitalId || "—",
            hospitalId: parent?.hospitalId || d?.hospitalId || "—",
            status: d?.status || "awaiting_lab",
            updatedAt: inv?.createdAt || d?.updatedAt || d?.createdAt,
            doctorName,
            tests: inv?.tests || [],
            snapshot: d,
          };
        });

      const combined = [...mappedPatients, ...mappedDependants].sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      );

      setPatients(combined);
    } catch (err) {
      console.error("Error fetching incoming lab patients:", err);
      toast.error("Failed to load incoming lab queue");
      setPatients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIncomingPatients();
  }, [fetchIncomingPatients, lastUpdate]);

  const handleClearPatient = async (patient) => {
    try {
      if (patient.type === "dependant") {
        await updateDependantStatus(patient.dependantId, { status: PATIENT_STATUS.COMPLETED });
      } else {
        await updatePatientStatus(patient.patientId, { status: PATIENT_STATUS.COMPLETED });
      }
      localStorage.setItem("refreshIncoming", Date.now().toString());
      refreshQueueCount();
      fetchIncomingPatients(true);
      toast.success("Patient cleared from queue");
    } catch (err) {
      console.error("Failed to clear patient:", err);
      toast.error("Failed to clear patient");
    }
  };

  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((patient) => {
      return (
        patient.name.toLowerCase().includes(q) ||
        String(patient.displayId).toLowerCase().includes(q) ||
        String(patient.doctorName || "").toLowerCase().includes(q) ||
        String(patient.guardianName || "").toLowerCase().includes(q)
      );
    });
  }, [patients, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / patientsPerPage));
  const startIndex = (currentPage - 1) * patientsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, startIndex + patientsPerPage);

  const viewPatientDetails = (patient) => {
    if (!patient.patientId) {
      toast.error("Patient ID is missing.");
      return;
    }
    navigate(`/dashboard/laboratory/patients/${patient.patientId}`, {
      state: patient.dependantId ? { dependantId: patient.dependantId } : {},
    });
  };

  return (
    <LaboratoryLayout>
      {loading && <KolakLoader fullscreen text="Loading incoming lab queue..." />}

      <div className="flex flex-col flex-1 bg-base-100 min-w-0">
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
          {/* PAGE HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-[#00943C]/10 text-[#00943C] shadow-xs">
                <FaFlask size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-base-content">
                  Incoming Lab Patients
                </h1>
                <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
                  Patients and dependants awaiting specimen collection and laboratory investigations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => fetchIncomingPatients(true)}
                disabled={refreshing}
                className="btn btn-outline border-base-300 hover:border-primary hover:bg-primary/5 hover:text-primary btn-sm gap-2"
                title="Refresh incoming queue"
              >
                <RiRefreshLine className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                <span className="text-xs font-semibold">{refreshing ? "Refreshing..." : "Refresh"}</span>
              </button>

              <ClearAllButton
                items={patients}
                updateStatusFn={handleClearPatient}
                onCleared={() => fetchIncomingPatients(true)}
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
                  placeholder="Search patient or hospital ID..."
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
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="btn btn-ghost btn-sm text-xs text-error font-medium"
                  >
                    Clear Search
                  </button>
                )}
                <div className="badge badge-lg bg-primary/10 border-none text-primary font-bold text-xs px-3 py-3 gap-1">
                  <span>Awaiting Lab:</span>
                  <span className="text-sm font-extrabold">{filteredPatients.length}</span>
                  <span className="font-normal text-primary/80">patients</span>
                </div>
              </div>
            </div>

            {/* LIST ITEMS TABLE HEADER (DESKTOP) */}
            {!loading && filteredPatients.length > 0 && (
              <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 bg-base-200/60 border-b border-base-200 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Patient Profile</div>
                <div className="col-span-2">Hospital ID</div>
                <div className="col-span-1">Type</div>
                <div className="col-span-1">Status</div>
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
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center text-base-content/40 mx-auto mb-3">
                    <FaFlask className="w-8 h-8 text-primary/40" />
                  </div>
                  <h3 className="font-bold text-base-content text-base">No patients awaiting laboratory</h3>
                  <p className="text-xs text-base-content/60 max-w-sm mx-auto mt-1">
                    {searchQuery
                      ? "No patients matched your search query in the laboratory queue."
                      : "There are currently no patients awaiting lab investigations."}
                  </p>
                </div>
              ) : (
                currentPatients.map((patient, idx) => {
                  const serialNumber = startIndex + idx + 1;
                  const initial = (patient.name || "P")[0].toUpperCase();

                  return (
                    <div
                      key={patient.key}
                      className="p-4 md:px-5 md:py-3.5 hover:bg-base-200/40 transition-colors"
                    >
                      {/* Mobile View */}
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
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              patient.type === "dependant"
                                ? "bg-secondary/10 text-secondary"
                                : "bg-base-200 text-base-content/70"
                            }`}
                          >
                            {patient.type === "dependant" ? "Dependant" : "Patient"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-base-content/60">
                          <span className="text-[11px] text-base-content/50">
                            {formatNigeriaDateTime(patient.updatedAt)}
                          </span>
                          <span className="badge badge-warning badge-xs font-bold">
                            Awaiting lab
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <ClearItemButton
                            item={patient}
                            updateStatusFn={handleClearPatient}
                            onCleared={() => fetchIncomingPatients(true)}
                            className="btn btn-ghost btn-xs text-error font-medium"
                          />
                          <button
                            onClick={() => viewPatientDetails(patient)}
                            className="btn btn-primary btn-xs gap-1 font-bold shadow-xs"
                          >
                            <span>View Details</span>
                            <FaEye className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Desktop Grid Row */}
                      <div className="hidden md:grid grid-cols-12 gap-2 items-center text-xs">
                        <div className="col-span-1 font-bold text-base-content/50">
                          {serialNumber}
                        </div>

                        <div className="col-span-5 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-extrabold text-sm flex items-center justify-center shrink-0 border border-primary/20">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-base-content truncate">
                              {patient.name}
                            </p>
                            <p className="text-[11px] text-base-content/50 capitalize truncate">
                              {patient.gender} {patient.dob ? `· ${formatNigeriaDate(patient.dob)}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded-md bg-primary/5">
                            {patient.displayId}
                          </span>
                        </div>

                        <div className="col-span-1">
                          <span
                            className={`badge badge-sm font-semibold text-xs ${
                              patient.type === "dependant"
                                ? "badge-secondary badge-outline"
                                : "badge-ghost"
                            }`}
                          >
                            {patient.type === "dependant" ? "Dependant" : "Patient"}
                          </span>
                        </div>

                        <div className="col-span-1">
                          <span className="badge badge-warning badge-sm font-bold shadow-2xs whitespace-nowrap">
                            Awaiting lab
                          </span>
                        </div>

                        <div className="col-span-2 flex flex-col items-end justify-center gap-1.5">
                          <button
                            onClick={() => viewPatientDetails(patient)}
                            className="btn btn-primary btn-xs gap-1 font-bold shadow-xs px-2.5"
                          >
                            <span>View Details</span>
                            <FaEye className="w-3 h-3" />
                          </button>
                          <ClearItemButton
                            item={patient}
                            updateStatusFn={handleClearPatient}
                            onCleared={() => fetchIncomingPatients(true)}
                            className="btn btn-ghost btn-xs text-error font-medium hover:bg-error/10 h-6 min-h-6 text-[11px] px-2"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* PAGINATION FOOTER */}
            {!loading && filteredPatients.length > 0 && (
              <div className="p-4 bg-base-100 border-t border-base-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-base-content/60">
                  Showing <strong>{startIndex + 1}</strong> to{" "}
                  <strong>{Math.min(startIndex + patientsPerPage, filteredPatients.length)}</strong> of{" "}
                  <strong>{filteredPatients.length}</strong> patients
                </span>

                <div className="join">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="join-item btn btn-xs btn-outline"
                  >
                    «
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`join-item btn btn-xs ${
                        currentPage === i + 1 ? "btn-primary font-bold" : "btn-ghost"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="join-item btn btn-xs btn-outline"
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </LaboratoryLayout>
  );
};

export default IncomingLaboratory;
