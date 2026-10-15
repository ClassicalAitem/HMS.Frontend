import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/sonographer/dashboard/Sidebar";
import { getPatients, updatePatientStatus } from "@/services/api/patientsAPI";
import { getDependants, updateDependantStatus } from "@/services/api/dependantAPI";
import { getAllOpdPatients, updateOpdPatient } from "@/services/api/opdPatientAPI";
import toast from "react-hot-toast";
import { FaSearch } from "react-icons/fa";
import { GiUltrasound } from "react-icons/gi";
import ClearItemButton from "@/components/common/ClearIncomingButton";
import ClearAllButton from "@/components/common/ClearAllButton";
import { PATIENT_STATUS } from "@/constants/patientStatus";
import { useNotifications } from "@/contexts/NotificationContext";
import { formatNigeriaDateTimeShort } from "@/utils/formatDateTimeUtils";

const SonographerIncoming = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const { refreshQueueCount, lastUpdate } = useNotifications();
  const hasLoadedRef = useRef(false);

  const fetchIncomingPatients = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) setLoading(true);
      setError(null);

      // Directly look for patients awaiting sonography for fast, lightweight loading
      const [patientsRes, dependantsRes, opdRes] = await Promise.allSettled([
        getPatients({ status: PATIENT_STATUS.AWAITING_SONOGRAPHER, limit: 100 }),
        getDependants({ status: PATIENT_STATUS.AWAITING_SONOGRAPHER, limit: 100 }),
        getAllOpdPatients({ status: PATIENT_STATUS.AWAITING_SONOGRAPHER, limit: 100 }).catch(() => []),
      ]);

      const rawPatients = patientsRes.status === "fulfilled"
        ? (Array.isArray(patientsRes.value?.data) ? patientsRes.value.data : [])
        : [];

      const rawDependants = dependantsRes.status === "fulfilled"
        ? (() => {
            const raw = dependantsRes.value?.data?.data ?? dependantsRes.value?.data ?? [];
            return Array.isArray(raw) ? raw : (raw?.dependants ?? []);
          })()
        : [];

      const rawOpd = opdRes.status === "fulfilled"
        ? (Array.isArray(opdRes.value?.data) ? opdRes.value.data : (Array.isArray(opdRes.value) ? opdRes.value : []))
        : [];

      const regularList = rawPatients.map((p) => {
        const idVal = p.id || p._id;
        const nameVal = `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.fullName || "Unknown Patient";
        return {
          ...p,
          id: idVal,
          patientType: "regular",
          displayName: nameVal,
          displayId: p.hospitalId || p.patientId || idVal,
          cardType: p.cardType || "personal",
        };
      });

      const dependantList = rawDependants.map((d) => {
        const idVal = d.id || d._id;
        const nameVal = `${d.firstName || ""} ${d.lastName || ""}`.trim() || d.fullName || "Unknown Dependant";
        const parent = d.patient || {};
        return {
          ...d,
          id: idVal,
          dependantId: idVal,
          patientId: d.patientId || parent.id || parent._id,
          patientType: "dependant",
          displayName: nameVal,
          displayId: d.hospitalId || parent.hospitalId || d.patientId || idVal,
          cardType: parent.cardType || d.cardType || "personal",
          dependantInfo: {
            id: idVal,
            name: nameVal,
          },
        };
      });

      const opdList = rawOpd
        .filter((o) => {
          const s = Array.isArray(o.status) ? o.status : [o.status];
          return s.some((val) => String(val || "").toLowerCase() === PATIENT_STATUS.AWAITING_SONOGRAPHER);
        })
        .map((o) => {
          const idVal = o.id || o._id;
          const nameVal = o.fullName || `${o.firstName || ""} ${o.lastName || ""}`.trim() || "OPD Patient";
          return {
            ...o,
            id: idVal,
            opdPatientId: idVal,
            patientType: "opd",
            displayName: nameVal,
            displayId: o.opdId || idVal,
            cardType: "opd",
            opdPatientInfo: {
              id: idVal,
              name: nameVal,
            },
          };
        });

      const allIncoming = [...regularList, ...dependantList, ...opdList].sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      });

      setPatients(allIncoming);
      hasLoadedRef.current = true;
    } catch (err) {
      console.error("SonographerIncoming: fetch error", err);
      setError(err);
      toast.error("Failed to load incoming patients.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncomingPatients();
  }, [fetchIncomingPatients, lastUpdate]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") fetchIncomingPatients();
    };

    const handleStorageChange = (e) => {
      if (e.key === "refreshIncoming") fetchIncomingPatients();
    };

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchIncomingPatients]);

  const filteredPatients = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return patients;
    return patients.filter((patient) => {
      const name = (patient.displayName || "").toLowerCase();
      const id = String(patient.displayId || "").toLowerCase();
      return name.includes(query) || id.includes(query);
    });
  }, [patients, searchValue]);

  const handleNavigate = (patient) => {
    if (!patient) return;

    const extractId = (val) => {
      if (!val) return "";
      if (typeof val === "string") return val;
      if (typeof val === "object") return val.id || val._id || "";
      return String(val);
    };

    const patientIdValue = extractId(patient.id) || extractId(patient._id);

    if (patient.patientType === "opd") {
      const opdId = extractId(patient.opdPatientInfo?.id) || extractId(patient.opdPatientId) || patientIdValue;
      navigate(`/dashboard/sonographer/incoming/${opdId}`, {
        state: { patientType: "opd" },
      });
    } else if (patient.patientType === "dependant") {
      const parentId = extractId(patient.patientId) || extractId(patient.patient) || patientIdValue;
      const depId = extractId(patient.dependantId) || extractId(patient.dependantInfo?.id);
      navigate(`/dashboard/sonographer/incoming/${parentId}`, {
        state: { dependantId: depId, dependantSnapshot: patient },
      });
    } else {
      navigate(`/dashboard/sonographer/incoming/${patientIdValue}`);
    }
  };

  const handleClear = async (patient) => {
    if (patient.patientType === "dependant") {
      await updateDependantStatus(patient.dependantId, { status: PATIENT_STATUS.COMPLETED });
    } else if (patient.patientType === "opd") {
      await updateOpdPatient(patient.opdPatientId, { status: PATIENT_STATUS.COMPLETED });
    } else {
      await updatePatientStatus(patient.patientId || patient.id, { status: PATIENT_STATUS.COMPLETED });
    }
    localStorage.setItem("refreshIncoming", Date.now().toString());
    refreshQueueCount();
  };

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  const typeBadgeConfig = {
    regular: { cls: "badge-ghost", text: "Regular" },
    dependant: { cls: "badge-secondary badge-outline", text: "Dependant" },
    opd: { cls: "badge-info badge-outline", text: "OPD" },
  };

  return (
    <div className="flex h-screen bg-base-200">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={closeSidebar} />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex overflow-hidden flex-col flex-1">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-4 sm:p-6 gap-4">
          {/* Page header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
                <GiUltrasound className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-base-content leading-tight">Incoming Scans</h1>
                <p className="text-xs sm:text-sm text-base-content/60">Patients awaiting sonography scan uploads</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Search by name or ID"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="input input-bordered input-sm w-full pl-9 rounded-lg bg-base-100"
                />
              </div>
              <ClearAllButton items={patients} updateStatusFn={handleClear} onCleared={fetchIncomingPatients} />
            </div>
          </div>

          {/* Quick Counter Strip */}
          {!loading && !error && patients.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="badge badge-sm badge-primary font-semibold">
                {filteredPatients.length} Waiting
              </div>
              {["regular", "dependant", "opd"].map((t) => {
                const count = patients.filter((p) => p.patientType === t).length;
                if (!count) return null;
                return (
                  <div key={t} className="badge badge-sm badge-ghost capitalize text-base-content/70">
                    {count} {t}
                  </div>
                );
              })}
            </div>
          )}

          {/* Patient Cards List */}
          {loading ? (
            <div className="grid gap-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-16 rounded-xl bg-base-100 border border-base-200 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-error/30 bg-error/5 p-5 text-center text-error text-sm">
              Unable to load patients. Please refresh the page.
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-base-300 py-14 text-center bg-base-100">
              <GiUltrasound className="w-8 h-8 text-base-content/20" />
              <p className="text-base-content/60 text-sm">
                {searchValue ? "No matches for your search." : "No patients awaiting sonography right now."}
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredPatients.map((patient) => {
                const patientIdValue = patient?.id || patient?._id;
                const initials = (patient.displayName || "Patient")
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((n) => n[0]?.toUpperCase())
                  .join("");
                const typeCfg = typeBadgeConfig[patient.patientType] || typeBadgeConfig.regular;

                return (
                  <div
                    key={patientIdValue}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNavigate(patient)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleNavigate(patient);
                    }}
                    className="group relative w-full rounded-xl border border-base-200 bg-base-100 px-4 py-2.5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md hover:bg-base-100/90 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Avatar + Patient details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary font-bold text-xs shrink-0">
                          {initials || "P"}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-base-content truncate group-hover:text-primary transition-colors">
                              {patient.displayName}
                            </span>
                            <span className={`badge badge-xs ${typeCfg.cls}`}>
                              {typeCfg.text}
                            </span>
                            <span className="badge badge-warning badge-xs font-medium">
                              Awaiting Scan
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-base-content/60 mt-0.5 font-mono">
                            <span>ID: {patient.displayId}</span>
                            {patient.updatedAt && (
                              <span className="font-sans text-[11px] text-base-content/40 hidden sm:inline">
                                • {formatNigeriaDateTimeShort(patient.updatedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleNavigate(patient)}
                          className="btn btn-primary btn-xs sm:btn-sm gap-1"
                        >
                          <GiUltrasound className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Upload Scan</span>
                          <span className="sm:hidden">Upload</span>
                        </button>
                        <ClearItemButton item={patient} onClear={handleClear} onCleared={fetchIncomingPatients} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SonographerIncoming;