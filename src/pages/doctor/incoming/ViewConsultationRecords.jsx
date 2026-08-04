import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import { getConsultations } from "@/services/api/consultationAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { formatNigeriaDate, formatNigeriaTime } from "@/utils/formatDateTimeUtils";
import KolakLoader from "@/components/common/KolakLoader";

const ViewConsultationRecords = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const incomingDependantId = location?.state?.dependantId || location?.state?.selectedDependantId || null;
  const incomingDependantSnapshot = location?.state?.dependantSnapshot || location?.state?.selectedDependantSnapshot || null;
  const targetPatientId = location?.state?.patientId || patientId;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mainPatient, setMainPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [consultationsLoading, setConsultationsLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const mainPatientName = useMemo(() => (
    mainPatient?.fullName || `${mainPatient?.firstName || ""} ${mainPatient?.lastName || ""}`.trim() || "Patient"
  ), [mainPatient]);

  const scopeLabel = useMemo(() => {
    if (incomingDependantId) {
      return (
        incomingDependantSnapshot?.fullName ||
        `${incomingDependantSnapshot?.firstName || ""} ${incomingDependantSnapshot?.lastName || ""}`.trim() ||
        "Dependant"
      );
    }
    return mainPatientName;
  }, [incomingDependantId, incomingDependantSnapshot, mainPatientName]);

  const scopeSubtitle = useMemo(() => {
    if (incomingDependantId) {
      return incomingDependantSnapshot?.relationshipType || "Dependant";
    }
    return "Main Patient";
  }, [incomingDependantId, incomingDependantSnapshot]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const patientRes = await getPatientById(targetPatientId);
        if (!mounted) return;
        const data = patientRes?.data ?? patientRes;
        if (data) setMainPatient(data);
      } catch (err) {
        console.error("Failed to load patient", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [targetPatientId]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setConsultationsLoading(true);
      try {
        const res = await getConsultations(
          incomingDependantId
            ? { patientId: targetPatientId, dependantId: incomingDependantId }
            : { patientId: targetPatientId }
        );

        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
        const filtered = list.filter((c) => {
          if (incomingDependantId) {
            return c.dependantId === incomingDependantId;
          }
          return !c.dependantId;
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
  }, [incomingDependantId, targetPatientId]);

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

  const handleNewConsultation = () => {
    navigate(`/dashboard/doctor/medical-history/${targetPatientId}/add`, {
      state: {
        ...(location?.state || {}),
        patientId: targetPatientId,
        dependantId: incomingDependantId,
        dependantSnapshot: incomingDependantSnapshot,
        patientSnapshot: mainPatient,
        from: location?.state?.from || "incoming",
      },
    });
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history?.length > 1) {
      navigate(-1);
      return;
    }

    navigate(`/dashboard/doctor/medical-history/${targetPatientId}`, {
      state: {
        ...(location?.state || {}),
        patientId: targetPatientId,
        dependantId: incomingDependantId,
        dependantSnapshot: incomingDependantSnapshot,
        patientSnapshot: mainPatient,
      },
    });
  };

  const toDisplayText = (value) => {
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value.map(toDisplayText).filter(Boolean).join(", ");
    }
    if (typeof value === "object") {
      if (typeof value.title === "string" && value.title) return value.title;
      if (typeof value.name === "string" && value.name) return value.name;
      if (typeof value.value === "string" && value.value) return value.value;
      if (typeof value.symptom === "string" && value.symptom) return value.symptom;
      if (typeof value.allergen === "string" && value.allergen) return value.allergen;
      if (typeof value.reaction === "string" && value.reaction) return value.reaction;
      if (typeof value.condition === "string" && value.condition) return value.condition;
      if (typeof value.label === "string" && value.label) return value.label;
      return JSON.stringify(value);
    }
    return "";
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
       {loading && <KolakLoader fullscreen />}
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
                {scopeLabel}
                {incomingDependantId && mainPatientName ? (
                  <span className="text-base-content/40"> — dependant of {mainPatientName}</span>
                ) : null}
              </p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleBack}
            >
              ← Back
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-base-content/60">Viewing consultations for:</span>
            <span className={`badge badge-sm ${incomingDependantId ? "badge-secondary" : "badge-primary"}`}>
              {scopeLabel}
            </span>
            <span className="badge badge-outline badge-sm">{scopeSubtitle}</span>
          </div>

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
                  onClick={handleNewConsultation}
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
                  <p className="text-sm mt-1">No consultations recorded for {scopeLabel}.</p>
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
  <span className={`badge badge-sm ${incomingDependantId ? "badge-secondary" : "badge-primary"}`}>
    {scopeSubtitle}
  </span>
</div>


<div>
  <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">
    {incomingDependantId ? "Dependant" : "Patient"}
  </p>
  <div className="flex items-center gap-2">
    <span className="font-medium">{scopeLabel}</span>
    <span className={`badge badge-xs ${incomingDependantId ? "badge-secondary" : "badge-primary"}`}>
      {scopeSubtitle}
    </span>
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
                                navigate(`/dashboard/doctor/medical-history/${targetPatientId}/consultation/${cId}`, {
                                  state: {
                                    ...(location?.state || {}),
                                    patientId: targetPatientId,
                                    dependantId: incomingDependantId,
                                    dependantSnapshot: incomingDependantSnapshot,
                                    patientSnapshot: mainPatient,
                                  },
                                });
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
                                  <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">
                                    {incomingDependantId ? "Dependant" : "Patient"}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{scopeLabel}</span>
                                    <span className={`badge badge-xs ${incomingDependantId ? "badge-secondary" : "badge-primary"}`}>
                                      {scopeSubtitle}
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
                                        const text = toDisplayText(comp);
                                        return <span key={i} className="badge badge-outline badge-sm">{text}</span>;
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
                                        <span key={i} className="badge badge-warning badge-outline badge-sm">{toDisplayText(h)}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {c.allergicHistory && c.allergicHistory.length > 0 && (
                                  <div>
                                    <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">Allergies</p>
                                    <div className="flex flex-wrap gap-1">
                                      {c.allergicHistory.map((a, i) => (
                                        <span key={i} className="badge badge-error badge-outline badge-sm">{toDisplayText(a)}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Footer actions */}
                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-base-300">
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => navigate(`/dashboard/doctor/medical-history/${targetPatientId}/consultation/${cId}`, {
                                  state: {
                                    ...(location?.state || {}),
                                    patientId: targetPatientId,
                                    dependantId: incomingDependantId,
                                    dependantSnapshot: incomingDependantSnapshot,
                                    patientSnapshot: mainPatient,
                                  },
                                })}
                              >
                                View Full Details
                              </button>
                             
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