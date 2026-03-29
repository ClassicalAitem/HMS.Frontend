import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import { getConsultations } from "@/services/api/consultationAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { getAllDependantsForPatient } from "@/services/api/dependantAPI";
import { formatNigeriaDate, formatNigeriaTime } from "@/utils/formatDateTimeUtils";

const ViewConsultationRecords = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mainPatient, setMainPatient] = useState(null);
  const [patients, setPatients] = useState([]); // main + dependants
  const [selectedPatientId, setSelectedPatientId] = useState(patientId);
  const [consultations, setConsultations] = useState([]);
  const [consultationsLoading, setConsultationsLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());

// In ViewConsultationRecords, replace the patient load useEffect:
useEffect(() => {
  let mounted = true;
  const load = async () => {
    setLoading(true);
    try {
      const [patientRes, dependantsRes] = await Promise.allSettled([
        getPatientById(patientId),
        // ✅ Use your dependant API directly
        getAllDependantsForPatient(patientId),
      ]);

      if (!mounted) return;

      const data = patientRes.status === 'fulfilled'
        ? (patientRes.value?.data ?? patientRes.value)
        : null;

      if (data) setMainPatient(data);

      // Get dependants from dedicated API (more reliable than data.dependants)
      let dependantsList = [];
      if (dependantsRes.status === 'fulfilled') {
        const raw = dependantsRes.value?.data?.data?.dependants
          ?? dependantsRes.value?.data?.dependants
          ?? dependantsRes.value?.data
          ?? [];
        dependantsList = Array.isArray(raw) ? raw : [];
      }

      const allPatients = [
        {
          id: data?.id || data?._id,
          name: data?.fullName || `${data?.firstName || ""} ${data?.lastName || ""}`.trim(),
          relation: "Main Patient",
          isMain: true,
        },
        ...dependantsList.map(d => ({
          id: d.id || d._id,
          name: d.fullName || `${d.firstName || ""} ${d.lastName || ""}`.trim(),
          relation: d.relationshipType || d.relationship || "Dependant",
          isMain: false,
        }))
      ];

      setPatients(allPatients);
      setSelectedPatientId(allPatients[0]?.id);
    } catch (err) {
      console.error("Failed to load patient", err);
    } finally {
      if (mounted) setLoading(false);
    }
  };
  load();
  return () => { mounted = false; };
}, [patientId]);
// Load consultations when selected patient changes
useEffect(() => {
  if (!selectedPatientId) return;
  let mounted = true;

  const load = async () => {
    setConsultationsLoading(true);
    try {
      const selectedInfo = patients.find(p => p.id === selectedPatientId);

      let res;
      if (selectedInfo?.isMain) {
        // ✅ Main patient — fetch by patientId only (no dependantId)
        res = await getConsultations({ patientId: selectedPatientId });
      } else {
        // ✅ Dependant — fetch by dependantId
        res = await getConsultations({ dependantId: selectedPatientId });
      }
      
      const raw = res?.data ?? res ?? [];
      const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
       // ✅ Filter based on who is selected
      const filtered = list.filter(c => {
        if (selectedInfo?.isMain) {
          // ✅ Main patient — only show consultations with NO dependantId
          return !c.dependantId;
        } else {
          // ✅ Dependant — only show consultations matching this dependantId
          return c.dependantId === selectedPatientId;
        }
      });
       const sorted = [...filtered].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      if (mounted) {
        setConsultations(sorted);
        setExpandedIds(new Set());
      }
    } catch {
      if (mounted) setConsultations([]);
    } finally {
      if (mounted) setConsultationsLoading(false);
    }
  };
  load();
  return () => { mounted = false; };
}, [selectedPatientId, patients]);
  const selectedPatientInfo = useMemo(() =>
    patients.find(p => p.id === selectedPatientId),
    [patients, selectedPatientId]
  );

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-base-200/50">
        <div className="flex-1 flex items-center justify-center">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex overflow-y-auto flex-col p-4 sm:p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-base-content">Consultation Records</h1>
              <p className="text-base-content/60 text-sm mt-1">
                {mainPatient?.fullName || `${mainPatient?.firstName || ""} ${mainPatient?.lastName || ""}`.trim()}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              {/* Patient / Dependant switcher */}
              {patients.length > 1 && (
                <select
                  className="select select-bordered select-sm"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.relation})
                    </option>
                  ))}
                </select>
              )}
              <button
                className="btn btn-outline btn-sm"
                onClick={() => navigate(`/dashboard/doctor/medical-history/${patientId}`)}
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Viewing label */}
          {selectedPatientInfo && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-base-content/60">Viewing consultations for:</span>
              <span className={`badge ${selectedPatientInfo.isMain ? 'badge-primary' : 'badge-primary badge-outline'} badge-sm`}>
                {selectedPatientInfo.name}
              </span>
              <span className="badge badge-outline badge-sm">{selectedPatientInfo.relation}</span>
            </div>
          )}

          {/* Consultations */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="card-title text-lg font-semibold text-base-content">
                  Consultations
                  <span className="badge badge-neutral ml-2">{consultations.length}</span>
                </h3>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => navigate(`/dashboard/doctor/medical-history/${patientId}/add`)}
                >
                  + New Consultation
                </button>
              </div>

              {consultationsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="loading loading-spinner loading-md"></div>
                </div>
              ) : consultations.length === 0 ? (
                <div className="text-center py-10 text-base-content/60">
                  <p className="text-lg">No consultations found</p>
                  <p className="text-sm mt-1">No consultations recorded for {selectedPatientInfo?.name}.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {consultations.map((c, idx) => {
                    const cId = c._id || c.id || idx;
                    const isExpanded = expandedIds.has(cId);
                    const doctorName = c.doctor
                      ? `Dr. ${c.doctor.firstName || ""} ${c.doctor.lastName || ""}`.trim()
                      : "Unknown Doctor";
                    const date = c.createdAt
                      ? formatNigeriaDate(c.createdAt)
                      : "N/A";
                    const time = c.createdAt
                      ? formatNigeriaTime(c.createdAt)
                      : "";

                    return (
                      <div
                        key={cId}
                        className="border border-base-300 rounded-lg overflow-hidden"
                      >
                        {/* Row Header */}
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-base-200/50 transition-colors"
                          onClick={() => toggleExpand(cId)}
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                        >
                          <div className="flex items-center gap-4">
                            {/* Expand indicator */}
                            <span className={`text-base-content/40 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                              {isExpanded ? '▼' : '▶'}
                            </span>
                            <div>
                  
<div className="flex items-center gap-2">
  <span className="font-medium text-base-content">
    Consultation #{consultations.length - idx}
  </span>
  {/* ✅ Show who this consultation is actually for */}
  {c.dependantId && c.dependant ? (
    <span className="badge badge-primary badge-sm">
      {c.dependant.firstName} {c.dependant.lastName}
      {/* <span className="ml-1 opacity-70">({c.dependant.relation}) </span> */}
    </span>
  ) : (
    <span className="badge badge-primary badge-sm">
      {selectedPatientInfo?.name} · Main Patient
    </span>
  )}
</div>


<div>
  <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">Patient</p>
  <div className="flex items-center gap-2">
    {c.dependantId && c.dependant ? (
      <>
        <span className="font-medium">
          {c.dependant.firstName} {c.dependant.lastName}
        </span>
        <span className="badge badge-secondary badge-xs">
          {c.dependant.relationshipType}
        </span>
        <span className="text-xs text-base-content/50">
          of {mainPatient?.fullName || `${mainPatient?.firstName} ${mainPatient?.lastName}`}
        </span>
      </>
    ) : (
      <>
        <span className="font-medium">{selectedPatientInfo?.name}</span>
        <span className="badge badge-primary badge-xs">Main Patient</span>
      </>
    )}
  </div>
</div>
                              <div className="text-sm text-base-content/60 mt-0.5">
                                {date} at {time} · {doctorName}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                              <div className="text-sm font-medium text-base-content">
                                {c.diagnosis || "Pending diagnosis"}
                              </div>
                              <div className="text-xs text-base-content/50">Diagnosis</div>
                            </div>
                            <button
                              className="btn btn-outline btn-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/doctor/medical-history/${patientId}/consultation/${cId}`);
                              }}
                            >
                              Full View
                            </button>
                          </div>
                        </div>

                        {/* Collapsed Detail Panel */}
                        {isExpanded && (
                          <div className="border-t border-base-300 bg-base-200/30 p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Left column */}
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">Patient</p>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{selectedPatientInfo?.name}</span>
                                    <span className={`badge badge-xs ${selectedPatientInfo?.isMain ? 'badge-primary' : 'badge-secondary'}`}>
                                      {selectedPatientInfo?.relation}
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">Visit Reason</p>
                                  <p className="text-sm text-base-content">{c.visitReason || "Not specified"}</p>
                                </div>

                                <div>
                                  <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">Diagnosis</p>
                                  <p className="text-sm font-medium text-base-content">{c.diagnosis || "Pending"}</p>
                                </div>

                                {c.complaint && c.complaint.length > 0 && (
                                  <div>
                                    <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">Complaints</p>
                                    <div className="flex flex-wrap gap-1">
                                      {c.complaint.map((comp, i) => {
                                        if (typeof comp === 'object' && comp !== null) {
                                          // Render object complaint as formatted string
                                          const symptom = comp.symptom || '';
                                          const duration = comp.durationInDays ? ` (${comp.durationInDays} days)` : '';
                                          return <span key={i} className="badge badge-outline badge-sm">{symptom}{duration}</span>;
                                        }
                                        // Render string complaint
                                        return <span key={i} className="badge badge-outline badge-sm">{comp}</span>;
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Right column */}
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">Doctor</p>
                                  <p className="text-sm text-base-content">{doctorName}</p>
                                </div>

                                {c.notes && (
                                  <div>
                                    <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">Notes</p>
                                    <p className="text-sm text-base-content bg-base-100 p-2 rounded">{c.notes}</p>
                                  </div>
                                )}

                                {c.medicalHistory && c.medicalHistory.length > 0 && (
                                  <div>
                                    <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">Medical History</p>
                                    <div className="flex flex-wrap gap-1">
                                      {c.medicalHistory.map((h, i) => (
                                        <span key={i} className="badge badge-warning badge-outline badge-sm">{h}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {c.allergicHistory && c.allergicHistory.length > 0 && (
                                  <div>
                                    <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">Allergies</p>
                                    <div className="flex flex-wrap gap-1">
                                      {c.allergicHistory.map((a, i) => {
                                        if (typeof a === 'object' && a !== null) {
                                          // Render object allergy as formatted string
                                          return <span key={i} className="badge badge-error badge-outline badge-sm">{a.allergen || JSON.stringify(a)}</span>;
                                        }
                                        return <span key={i} className="badge badge-error badge-outline badge-sm">{a}</span>;
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Footer actions */}
                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-base-300">
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => navigate(`/dashboard/doctor/medical-history/${patientId}/consultation/${cId}`)}
                              >
                                View Full Details
                              </button>
                              {/* Only allow edit within 24h */}
                              {(() => {
                                const within24h = Date.now() - new Date(c.createdAt).getTime() < 24 * 60 * 60 * 1000;
                                return within24h ? (
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => navigate(`/dashboard/doctor/medical-history/${patientId}/consultation/${cId}/edit`)}
                                  >
                                    Edit
                                  </button>
                                ) : (
                                  <span className="text-xs text-base-content/40 self-center">Edit window expired</span>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
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

export default ViewConsultationRecords;