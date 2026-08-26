import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/sonographer/dashboard/Sidebar";
import { getPatients, updatePatientStatus } from "@/services/api/patientsAPI";
import { getInvestigations } from "@/services/api/investigationRequestAPI";
import { getAllDependantsForPatient, getDependantById, updateDependantStatus } from "@/services/api/dependantAPI";
import { getOpdPatientById, getAllOpdPatients, updateOpdPatient } from "@/services/api/opdPatientAPI";
import toast from "react-hot-toast";
import { FaSearch } from "react-icons/fa";
import { GiUltrasound } from "react-icons/gi";
import ClearItemButton from "@/components/common/ClearIncomingButton";
import { PATIENT_STATUS } from "@/constants/patientStatus";
import { useNotifications } from "@/contexts/NotificationContext";

const SonographerIncoming = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const { refreshQueueCount } = useNotifications();

  const fetchIncomingPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPatients();
      const allPatients = Array.isArray(res?.data) ? res.data : [];

      const opdRes = await getAllOpdPatients();
      const allOpdPatients = Array.isArray(opdRes?.data) ? opdRes.data : (Array.isArray(opdRes) ? opdRes : []);

      const investigationsRes = await getInvestigations();
      const allInvestigations = Array.isArray(investigationsRes) ? investigationsRes : (investigationsRes?.data || []);

      // Only radiology investigations belong on the sonographer's queue
      const radiologyInvestigations = allInvestigations.filter(
        (inv) => String(inv.type || '').toLowerCase() === 'radiology'
      );

      const isAwaitingSonographer = (status) => {
        const statusList = Array.isArray(status) ? status : [status];
        return statusList.some((s) => String(s || "").toLowerCase() === "awaiting_sonographer");
      };

      const incomingPatients = allPatients.filter((patient) => isAwaitingSonographer(patient?.status));
      const incomingOpdPatients = allOpdPatients.filter((patient) => isAwaitingSonographer(patient?.status));

      const enrichedPatients = (
        await Promise.all(
          incomingPatients.map(async (patient) => {
            const patientId = patient?.id || patient?._id;
            const investigation = radiologyInvestigations.find(
              (inv) => String(inv.patientId || inv.patient?._id || inv.patient?.id) === String(patientId) && !inv.dependantId
            );
            // No matching radiology order — this patient shouldn't be on the sonographer's queue
            if (!investigation) return null;

            return {
              ...patient,
              patientType: "regular",
              dependantId: null,
              dependantInfo: null,
              opdPatientId: investigation?.opdPatientId,
              opdPatientInfo: null,
              investigationId: investigation?.id || investigation?._id,
              investigation,
              cardType: patient?.cardType || 'personal',
              familyName: patient?.familyName || '',
              companyName: patient?.companyName || '',
            };
          })
        )
      ).filter(Boolean);

      const dependantCache = {};
      // dependantInvestigations must also be radiology-only
      const dependantInvestigations = radiologyInvestigations.filter((inv) => inv.dependantId);

      const enrichedDependants = (
        await Promise.all(
          dependantInvestigations.map(async (inv) => {
            const depId = inv.dependantId;
            if (dependantCache[depId] === undefined) {
              try {
                const depRes = await getDependantById(depId);
                const dep = depRes?.data?.data?.dependant || depRes?.data?.dependant || depRes?.dependant || depRes?.data;
                dependantCache[depId] = dep || null;
              } catch {
                dependantCache[depId] = null;
              }
            }
            const dep = dependantCache[depId];
            if (!dep || !isAwaitingSonographer(dep.status)) return null;

            const parentPatient = allPatients.find(
              (p) => String(p.id || p._id) === String(dep.patientId || inv.patientId)
            );

            return {
              ...dep,
              status: dep.status,
              hospitalId: parentPatient?.hospitalId,
              patientId: dep.patientId || inv.patientId,
              patientType: "dependant",
              dependantId: depId,
              dependantInfo: {
                id: dep.id || dep._id,
                name: `${dep.firstName || ""} ${dep.lastName || ""}`.trim() || dep.fullName,
              },
              opdPatientId: null,
              opdPatientInfo: null,
              investigationId: inv.id || inv._id,
              investigation: inv,
              cardType: parentPatient?.cardType || 'personal',
              familyName: parentPatient?.familyName || '',
              companyName: parentPatient?.companyName || '',
            };
          })
        )
      ).filter(Boolean);

      const uniqueDependants = Array.from(
        new Map(enrichedDependants.map(d => [d.dependantId, d])).values()
      );

      const enrichedOpdPatients = incomingOpdPatients
        .map((patient) => {
          const patientId = patient?.id;
          const investigation = radiologyInvestigations.find(
            (inv) => String(inv.opdPatientId) === String(patientId)
          );
          // No matching radiology order — skip
          if (!investigation) return null;

          return {
            ...patient,
            patientType: "opd",
            dependantId: null,
            dependantInfo: null,
            opdPatientId: patientId,
            opdPatientInfo: {
              id: patient.id || patient._id,
              name: patient.fullName || `${patient.firstName || ""} ${patient.lastName || ""}`.trim(),
            },
            investigationId: investigation?.id || investigation?._id,
            investigation,
            cardType: patient?.cardType || 'personal',
            familyName: patient?.familyName || '',
            companyName: patient?.companyName || '',
          };
        })
        .filter(Boolean);

      const allIncomingPatients = [...enrichedPatients, ...uniqueDependants, ...enrichedOpdPatients]
        .sort((a, b) => {
          const aTime = new Date(a.updatedAt || 0).getTime();
          const bTime = new Date(b.updatedAt || 0).getTime();
          return bTime - aTime;
        });

      setPatients(allIncomingPatients);
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
  }, [fetchIncomingPatients]);

  const filteredPatients = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return patients.filter((patient) => {
      if (!query) return true;

      let patientName = "";
      if (patient.patientType === "dependant" && patient.dependantInfo) {
        patientName = patient.dependantInfo.name.toLowerCase();
      } else if (patient.patientType === "opd" && patient.opdPatientInfo) {
        patientName = patient.opdPatientInfo.name.toLowerCase();
      } else {
        patientName = `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim().toLowerCase();
      }

      let patientId = "";
      if (patient.patientType === "dependant") {
        patientId = String(patient?.hospitalId || patient?.patientId || patient?.id || patient?._id || "").toLowerCase();
      } else if (patient.patientType === "opd") {
        patientId = String(patient.opdPatientInfo?.id || patient?.id || patient?._id || "").toLowerCase();
      } else {
        patientId = String(patient?.hospitalId || patient?.patientId || patient?.id || patient?._id || "").toLowerCase();
      }

      return patientName.includes(query) || patientId.includes(query);
    });
  }, [patients, searchValue]);

  const handleNavigate = (patient) => {
    const patientIdValue = patient?.id || patient?._id;
    if (patient.patientType === "opd") {
      navigate(`/dashboard/sonographer/incoming/${patient.opdPatientInfo?.id || patientIdValue}`);
    } else if (patient.patientType === "dependant") {
      navigate(`/dashboard/sonographer/incoming/${patient.patientId}`, {
        state: { dependantId: patient.dependantId, dependantSnapshot: patient }
      });
    } else {
      navigate(`/dashboard/sonographer/incoming/${patientIdValue}`);
    }
  };

  const handleClear = async (patient) => {
    if (patient.patientType === "dependant") {
      await updateDependantStatus(patient.dependantId, { status: PATIENT_STATUS.CANCELLED });
    } else if (patient.patientType === "opd") {
      await updateOpdPatient(patient.opdPatientId, { status: PATIENT_STATUS.CANCELLED });
    } else {
      await updatePatientStatus(patient.patientId || patient.id, { status: PATIENT_STATUS.CANCELLED });
    }
    localStorage.setItem('refreshIncoming', Date.now().toString());
    refreshQueueCount();
  };

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

    const typeStyles = {
    regular: { border: "border-l-primary", badge: null },
    dependant: { border: "border-l-secondary", badge: { text: "Dependant", cls: "badge-secondary" } },
    opd: { border: "border-l-info", badge: { text: "OPD", cls: "badge-info" } },
  };

  return (
    <div className="flex h-screen">
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

      <div className="flex overflow-hidden flex-col flex-1 bg-base-200/40">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-3 sm:p-6 gap-5">
          {/* Page header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-primary/70 p-3 rounded-2xl text-primary-content shadow-sm">
                <GiUltrasound className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-base-content leading-tight">Incoming Scans</h1>
                <p className="text-sm text-base-content/60">Patients awaiting sonography scan uploads</p>
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-base-content/40" />
              <input
                type="text"
                placeholder="Search by name or ID"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="input input-bordered input-sm sm:input-md w-full pl-9 rounded-full bg-base-100"
              />
            </div>
          </div>

          {/* Stat strip */}
          {!loading && !error && patients.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <div className="badge badge-lg badge-ghost gap-1.5 py-3">
                <span className="font-semibold text-base-content">{filteredPatients.length}</span>
                <span className="text-base-content/60">waiting</span>
              </div>
              {["regular", "dependant", "opd"].map((t) => {
                const count = patients.filter((p) => p.patientType === t).length;
                if (!count) return null;
                return (
                  <div key={t} className="badge badge-lg badge-ghost gap-1.5 py-3 capitalize">
                    <span className="font-semibold text-base-content">{count}</span>
                    <span className="text-base-content/60">{t}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="grid gap-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-32 rounded-2xl bg-base-100 border border-base-200 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-error/30 bg-error/5 p-6 text-center text-error text-sm">
              Unable to load patients. Please refresh the page.
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-base-300 py-16 text-center">
              <GiUltrasound className="w-8 h-8 text-base-content/20" />
              <p className="text-base-content/60 text-sm">
                {searchValue ? "No matches for your search." : "No sonography appointments are waiting right now."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredPatients.map((patient) => {
                const patientIdValue = patient?.id || patient?._id;
                let displayName = "Unknown Patient";
                let displayId = patientIdValue;

                if (patient.patientType === "dependant" && patient.dependantInfo) {
                  displayName = patient.dependantInfo.name;
                  displayId = patient?.hospitalId || patient?.patientId || patientIdValue;
                } else if (patient.patientType === "opd" && patient.opdPatientInfo) {
                  displayName = patient.opdPatientInfo.name;
                  displayId = patient.opdPatientInfo.id || patientIdValue;
                } else {
                  displayName = `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || patient?.fullName || "Unknown Patient";
                  displayId = patient?.hospitalId || patient?.patientId || patientIdValue;
                }

                const statusText = Array.isArray(patient?.status) ? patient.status.join(", ") : patient?.status || "—";
                const initials = displayName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((n) => n[0]?.toUpperCase())
                  .join("");
                const style = typeStyles[patient.patientType] || typeStyles.regular;

                return (
                  <div
                    key={patientIdValue}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNavigate(patient)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleNavigate(patient);
                    }}
                    className={`group w-full rounded-2xl border border-base-200 border-l-4 ${style.border} bg-base-100 p-4 sm:p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-base-200 text-sm font-semibold text-base-content/70 shrink-0">
                          {initials || "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-base-content truncate">{displayName}</p>
                            {style.badge && (
                              <span className={`badge badge-xs ${style.badge.cls}`}>{style.badge.text}</span>
                            )}
                          </div>
                          <p className="text-xs text-base-content/50 font-mono mt-0.5">{displayId}</p>
                        </div>
                      </div>
                      <span className="badge badge-primary badge-outline badge-sm shrink-0 group-hover:badge-primary transition-colors">
                        Upload Scan
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-base-200 flex flex-wrap items-center justify-between gap-y-1 text-xs text-base-content/60">
                      <p>Status: <span className="font-medium text-base-content/80">{statusText}</span></p>
                      <p>Updated: {patient?.updatedAt ? new Date(patient.updatedAt).toLocaleString() : "—"}</p>
                    </div>

                    {patient.investigationId && patient.investigation && (
                      <div className="mt-3 p-3 bg-base-200/50 rounded-xl">
                        <p className="text-[10px] uppercase text-base-content/40 mb-1.5 font-semibold tracking-wider">Ordered Tests</p>
                        {patient.investigation?.tests && patient.investigation.tests.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {patient.investigation.tests.map((test, idx) => (
                              <span key={idx} className="badge badge-ghost badge-sm bg-base-100">
                                {test.name || test}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="badge badge-ghost badge-sm bg-base-100">
                            {patient.investigation?.testName || patient.investigation?.investigationType || "Sonography"}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-3 flex justify-end" onClick={(e) => e.stopPropagation()}>
                      <ClearItemButton item={patient} onClear={handleClear} onCleared={fetchIncomingPatients} />
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