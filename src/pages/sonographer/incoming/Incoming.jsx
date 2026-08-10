import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/sonographer/dashboard/Sidebar";
import { getPatients } from "@/services/api/patientsAPI";
import { getInvestigations } from "@/services/api/investigationRequestAPI";
import { getAllDependantsForPatient, getDependantById } from "@/services/api/dependantAPI";
import { getOpdPatientById, getAllOpdPatients } from "@/services/api/opdPatientAPI";
import toast from "react-hot-toast";
import { FaSearch } from "react-icons/fa";
import { GiUltrasound } from "react-icons/gi";

const SonographerIncoming = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState(null);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchIncomingPatients = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getPatients();
        const allPatients = Array.isArray(res?.data) ? res.data : [];

        const opdRes = await getAllOpdPatients();
        const allOpdPatients = Array.isArray(opdRes?.data) ? opdRes.data : (Array.isArray(opdRes) ? opdRes : []);

        const investigationsRes = await getInvestigations();
        const allInvestigations = Array.isArray(investigationsRes) ? investigationsRes : (investigationsRes?.data || []);

        const isAwaitingSonographer = (status) => {
          const statusList = Array.isArray(status) ? status : [status];
          return statusList.some((s) => String(s || "").toLowerCase() === "awaiting_sonographer");
        };

        // Regular (guardian-own) patients awaiting sonographer
        const incomingPatients = allPatients.filter((patient) => isAwaitingSonographer(patient?.status));

        // OPD patients awaiting sonographer
        const incomingOpdPatients = allOpdPatients.filter((patient) => isAwaitingSonographer(patient?.status));

        // Enrich regular/guardian-own patients (unchanged)
        const enrichedPatients = await Promise.all(
          incomingPatients.map(async (patient) => {
            const patientId = patient?.id || patient?._id;
            const investigation = allInvestigations.find(
              (inv) => String(inv.patientId || inv.patient?._id || inv.patient?.id) === String(patientId) && !inv.dependantId
            );
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
        );

        // ✅ NEW: Find dependants whose OWN status is awaiting_sonographer,
        // by scanning investigations that carry a dependantId
        const dependantCache = {};
        const dependantInvestigations = allInvestigations.filter((inv) => inv.dependantId);

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

        // De-dupe dependants (multiple investigations could point to same dependant)
        const uniqueDependants = Array.from(
          new Map(enrichedDependants.map(d => [d.dependantId, d])).values()
        );

        // Enrich OPD patients (unchanged)
        const enrichedOpdPatients = incomingOpdPatients.map((patient) => {
          const patientId = patient?.id;
          const investigation = allInvestigations.find(
            (inv) => String(inv.opdPatientId) === String(patientId)
          );
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
        });

        const allIncomingPatients = [...enrichedPatients, ...uniqueDependants, ...enrichedOpdPatients];

        if (mounted) setPatients(allIncomingPatients);
      } catch (err) {
        console.error("SonographerIncoming: fetch error", err);
        if (mounted) {
          setError(err);
          toast.error("Failed to load incoming patients.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchIncomingPatients();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredPatients = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return patients.filter((patient) => {
      if (!query) return true;
      
      // Get display name based on patient type
      let patientName = "";
      if (patient.patientType === "dependant" && patient.dependantInfo) {
        patientName = patient.dependantInfo.name.toLowerCase();
      } else if (patient.patientType === "opd" && patient.opdPatientInfo) {
        patientName = patient.opdPatientInfo.name.toLowerCase();
      } else {
        patientName = `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim().toLowerCase();
      }
      
      // Get display ID
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

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          <div className="mb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <GiUltrasound className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-base-content">Incoming Scans</h1>
                  <p className="text-base-content/70">Patients awaiting sonography scan uploads.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h2 className="card-title">Awaiting Scan</h2>
                  <p className="text-sm text-base-content/70">Select a patient to open the upload details page.</p>
                </div>
                <div className="w-full md:w-auto">
                  <div className="flex items-center gap-2 w-full">
                    <span className="bg-base-200 px-3 py-2 rounded-l-lg">
                      <FaSearch className="w-4 h-4 text-base-content/60" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search by name or ID"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      className="input input-bordered w-full rounded-r-lg"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="grid gap-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-28 rounded-3xl bg-base-200 animate-pulse" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-error">Unable to load patients. Please refresh the page.</div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-10 text-base-content/70">
                  <p>No sonography appointments are waiting right now.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPatients.map((patient) => {
                    const patientIdValue = patient?.id || patient?._id;
                    let displayName = "Unknown Patient";
                    let displayId = patientIdValue;

                    if (patient.patientType === "dependant" && patient.dependantInfo) {
                      displayName = patient.dependantInfo.name;
                      // For dependants, use parent patient's hospitalId
                      displayId = patient?.hospitalId || patient?.patientId || patientIdValue;
                    } else if (patient.patientType === "opd" && patient.opdPatientInfo) {
                      displayName = patient.opdPatientInfo.name;
                      displayId = patient.opdPatientInfo.id || patientIdValue;
                    } else {
                      displayName = `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || patient?.fullName || "Unknown Patient";
                      displayId = patient?.hospitalId || patient?.patientId || patientIdValue;
                    }

                    const statusText = Array.isArray(patient?.status) ? patient.status.join(", ") : patient?.status || "—";

                    return (
                      <button
                        key={patientIdValue}
                        type="button"
                       onClick={() => {
                          if (patient.patientType === "opd") {
                            navigate(`/dashboard/sonographer/incoming/${patient.opdPatientInfo?.id || patientIdValue}`);
                          } else if (patient.patientType === "dependant") {
                            navigate(`/dashboard/sonographer/incoming/${patient.patientId}`, {
                              state: { dependantId: patient.dependantId, dependantSnapshot: patient }
                            });
                          } else {
                            navigate(`/dashboard/sonographer/incoming/${patientIdValue}`);
                          }
                        }}
                        className="w-full rounded-3xl border border-base-200 bg-base-100 p-5 text-left transition hover:border-primary hover:bg-base-200"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-base-content truncate">{displayName}</p>
                              {patient.patientType === "dependant" && (
                                <span className="badge badge-secondary badge-xs">Dependant</span>
                              )}
                              {patient.patientType === "opd" && (
                                <span className="badge badge-info badge-xs">OPD</span>
                              )}
                            </div>
                            <p className="text-sm text-base-content/70">{displayId}</p>
                          </div>
                          <span className="badge badge-outline badge-sm">Upload</span>
                        </div>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2 text-sm text-base-content/70">
                          <p>Status: {statusText}</p>
                          <p>Updated: {patient?.updatedAt ? new Date(patient.updatedAt).toLocaleString() : "—"}</p>
                        </div>
                        {patient.investigationId && patient.investigation && (
                          <div className="mt-4 p-3 bg-base-200 rounded-lg">
                            <p className="text-xs uppercase text-base-content/50 mb-2">Ordered Lab Tests</p>
                            {patient.investigation?.tests && patient.investigation.tests.length > 0 ? (
                              <div className="space-y-1">
                                {patient.investigation.tests.map((test, idx) => (
                                  <p key={idx} className="font-medium text-base-content">
                                    • {test.name || test}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <p className="font-medium text-base-content">
                                {patient.investigation?.testName || patient.investigation?.investigationType || 'Sonography'}
                              </p>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SonographerIncoming;
