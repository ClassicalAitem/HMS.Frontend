import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/medical-director/dashboard/Sidebar";
import { getAnteNatalRecordByPatientId } from "@/services/api/anteNatalAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { usersAPI } from "@/services/api/usersAPI";
import { getAllDependantsForPatient, getDependantById } from "@/services/api/dependantAPI";
import { getPrescriptionsByAntenatalId } from "@/services/api/prescriptionsAPI";
import { getInvestigationsByAntenatalId } from "@/services/api/investigationRequestAPI";
import { deletePrescription, updatePrescription } from "@/services/api/prescriptionsAPI";
import { deleteInvestigation, updateInvestigation } from "@/services/api/investigationAPI";
import toast from "react-hot-toast";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";
import OrderInvestigationModalAntenatal from "./modals/OrderInvestigationModalAntenatal";

const AntenatalRecordDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const incomingDependantId = location?.state?.dependantId || null;
  const incomingDependantSnapshot = location?.state?.dependantSnapshot || null;
  const dependantId = location?.state?.dependantId || null;
  const dependantSnapshot = location?.state?.dependantSnapshot || null;
  const [subject, setSubject] = useState(null);
  const [subjectLoading, setSubjectLoading] = useState(true)
  const fromIncoming = location?.state?.from === "incoming";
  const isViewingDependant = !!dependantId;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [patient, setPatient] = useState(null);
  const [antenatalRecords, setAntenatalRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [doctorNameById, setDoctorNameById] = useState({});
  const [error, setError] = useState(null);
  const [dependants, setDependants] = useState([]);
  const [isInvestigationModalOpen, setIsInvestigationModalOpen] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [loadingTreatmentData, setLoadingTreatmentData] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [editingLab, setEditingLab] = useState(null);
  const [fullDependantRecord, setFullDependantRecord] = useState(null);
  const [selectedDependantId, setSelectedDependantId] = useState(incomingDependantId || "");

    const selectedDependant = useMemo(() => {
      if (!selectedDependantId) return null;
      return (
        dependants.find(d => (d.id || d._id) === selectedDependantId) ||
        fullDependantRecord ||
        incomingDependantSnapshot ||
        null
      );
    }, [selectedDependantId, dependants, fullDependantRecord, incomingDependantSnapshot]);

  useEffect(() => {
    console.log('AntenatalRecordDetails: Component mounted with patientId:', patientId);
  }, [patientId]);

  useEffect(() => {
    let mounted = true;
    const loadPatient = async () => {
      try {
        setLoadingPatient(true);
        setError(null);
        console.log('Loading patient data for ID:', patientId);
        const res = await getPatientById(patientId);
        const pData = res?.data ?? res;
        console.log('Patient data loaded:', pData);
        if (mounted) setPatient(pData);
      } catch (err) {
        console.error("Failed to load patient:", err);
        if (mounted) {
          if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
            setError('Request timed out. Please check your connection and try again.');
          } else {
            setError(`Failed to load patient: ${err.message}`);
          }
        }
      } finally {
        if (mounted) setLoadingPatient(false);
      }
    };

    if (patientId) {
      loadPatient();
    } else {
      console.error('No patientId provided');
      setError('No patient ID provided');
      setLoadingPatient(false);
    }

    return () => { mounted = false; };
  }, [patientId]);

    // Add after the existing fetchDependants useEffect
  useEffect(() => {
    let mounted = true;
    const fetchFullDependant = async () => {
      if (!incomingDependantId) return;
      try {
        const res = await getDependantById(incomingDependantId);
        const dep = res?.data?.data?.dependant || res?.data?.dependant || res?.data || null;
        if (mounted) setFullDependantRecord(dep);
      } catch {
        if (mounted && incomingDependantSnapshot) {
          setFullDependantRecord(incomingDependantSnapshot);
        }
      }
    };
    fetchFullDependant();
    return () => { mounted = false; };
  }, [incomingDependantId, incomingDependantSnapshot]);

  const normalizeAntenatalRecordFromState = (record) => {
    if (!record) return null;
    if (Array.isArray(record.anteNatalRecords)) {
      return record.anteNatalRecords[0] || null;
    }
    return record;
  };

    const getRecordsArray = (payload) => {
      if (!payload) return [];
      if (Array.isArray(payload)) {
        return payload.flatMap(wrapper =>
          (wrapper.anteNatalRecords || []).map((r, i) => ({
            ...r,
            __wrapperId: wrapper._id,
            __originalIndex: i,
          }))
        );
      }
      // Single wrapper object
      if (Array.isArray(payload.anteNatalRecords)) return payload.anteNatalRecords;
      if (Array.isArray(payload.data)) return payload.data;
      return [];
    };

  const getDoctorDisplayName = (doctor) => {
    if (!doctor) return null;
    if (typeof doctor === "string") return doctor;
    if (doctor.name) return doctor.name;
    const fullName = `${doctor.firstName || ""} ${doctor.lastName || ""}`.trim();
    return fullName || null;
  };

  const normalizeUserResponse = (response) => {
    if (!response) return null;
    if (response.data?.data) return response.data.data;
    if (response.data) return response.data;
    return response;
  };

  const getDoctorId = (record) => {
    if (!record) return null;
    if (typeof record.doctorId === "string") return record.doctorId;
    if (typeof record.doctorId === "object") return record.doctorId.id || record.doctorId._id || null;
    if (typeof record.doctor === "object") return record.doctor.id || record.doctor._id || null;
    if (typeof record.createdBy === "object") return record.createdBy.id || record.createdBy._id || null;
    return null;
  };

  const getRecordDoctorName = (record) => {
    if (!record) return "Unknown Doctor";
    if (record.doctorName) return record.doctorName;
    const resolvedName = getDoctorDisplayName(record.doctor || record.createdBy);
    if (resolvedName) return resolvedName;
    const doctorId = getDoctorId(record);
    if (doctorId) return doctorNameById[doctorId] || "Unknown Doctor";
    return "Unknown Doctor";
  };

  const loadDoctorNames = useCallback(async (doctorIds = []) => {
    const idsToFetch = [...new Set(doctorIds.filter(Boolean).filter((id) => !doctorNameById[id]))];
    if (!idsToFetch.length) return;

    try {
      const results = await Promise.allSettled(idsToFetch.map((id) => usersAPI.getUserById(id)));
      const nameMap = {};

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const user = normalizeUserResponse(result.value);
          const displayName = getDoctorDisplayName(user);
          if (displayName) {
            nameMap[idsToFetch[index]] = displayName;
          }
        }
      });

      if (Object.keys(nameMap).length) {
        setDoctorNameById((prev) => ({ ...prev, ...nameMap }));
      }
    } catch (err) {
      console.warn("Failed to load doctor names for antenatal records:", err);
    }
  }, [doctorNameById]);

  useEffect(() => {
    const doctorIds = [];
    antenatalRecords.forEach((record) => {
      const doctorId = getDoctorId(record);
      if (doctorId && !record?.doctorName && !record?.doctor && !doctorNameById[doctorId]) {
        doctorIds.push(doctorId);
      }
    });

    const selectedDoctorId = getDoctorId(selectedRecord);
    if (selectedDoctorId && !selectedRecord?.doctorName && !selectedRecord?.doctor && !doctorNameById[selectedDoctorId]) {
      doctorIds.push(selectedDoctorId);
    }

    if (doctorIds.length) {
      loadDoctorNames(doctorIds);
    }
  }, [antenatalRecords, selectedRecord, doctorNameById, loadDoctorNames]);

  useEffect(() => {
    let mounted = true;
    const loadAntenatalRecord = async () => {
      try {
        setLoadingData(true);
        setError(null);
        const res = await getAnteNatalRecordByPatientId(patientId);
        const records = getRecordsArray(res?.data ?? res);
        if (mounted) {
          const recordsWithOriginalIndex = records.map((record, originalIndex) => ({
            ...record,
            __originalIndex: originalIndex,
          }));

          const sortedRecords = [...recordsWithOriginalIndex].sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          const scoped = isViewingDependant && dependantId
            ? sortedRecords.filter(r => r.dependantId === dependantId)
            : sortedRecords.filter(r => !r.dependantId);

          setAntenatalRecords(scoped);(sortedRecords);

          const selectedFromState = normalizeAntenatalRecordFromState(location.state?.selectedRecord);
          if (selectedFromState) {
            setSelectedRecord(selectedFromState);
          } else if (sortedRecords.length > 0) {
            setSelectedRecord(sortedRecords[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load antenatal record:", err);
        if (mounted) {
          if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
            setError('Request timed out. Please check your connection and try again.');
          } else if (err.response?.status !== 404) {
            setError(`Failed to load antenatal record: ${err.message}`);
          }
        }
      } finally {
        if (mounted) setLoadingData(false);
      }
    };

    if (patientId) {
      loadAntenatalRecord();
    }

    return () => { mounted = false; };
  }, [patientId, location]);
  useEffect(() => {
  let mounted = true;
  const fetchDependants = async () => {
    try {
      const res = await getAllDependantsForPatient(patientId);
      const raw = res?.data?.data?.dependants ?? res?.data?.dependants ?? res?.data ?? [];
      const normalized = (Array.isArray(raw) ? raw : []).map(dep => ({
        ...dep,
        id: dep.id || dep._id,
        fullName: dep.fullName || `${dep.firstName || ""} ${dep.lastName || ""}`.trim(),
      }));
      if (mounted) setDependants(normalized);
    } catch {
      toast.error("Failed to load dependants for patient. Dependant-related features may not work properly.");
    }
  };
  if (patientId) fetchDependants();
  return () => { mounted = false; };
}, [patientId]);

// Load prescriptions and investigations for the selected antenatal record
useEffect(() => {
  let mounted = true;
  const loadTreatmentData = async () => {
    if (!selectedRecord?._id) {
      setPrescriptions([]);
      setLabRequests([]);
      return;
    }
    try {
      setLoadingTreatmentData(true);
      console.log('Loading prescriptions and investigations for antenatal:', selectedRecord._id);
      
      // Fetch prescriptions for antenatal
      try {
        const presRes = await getPrescriptionsByAntenatalId(selectedRecord._id);
        const presList = presRes?.data ?? presRes ?? [];
        if (mounted) setPrescriptions(Array.isArray(presList) ? presList : []);
      } catch (err) {
        console.warn("Failed to load prescriptions:", err);
        if (mounted) setPrescriptions([]);
      }
      
      // Fetch investigations for antenatal
      try {
        const invRes = await getInvestigationsByAntenatalId(selectedRecord._id);
        const invList = invRes?.data ?? invRes ?? [];
        if (mounted) setLabRequests(Array.isArray(invList) ? invList : []);
      } catch (err) {
        console.warn("Failed to load investigations:", err);
        if (mounted) setLabRequests([]);
      }
    } finally {
      if (mounted) setLoadingTreatmentData(false);
    }
  };
  
  loadTreatmentData();
  return () => { mounted = false; };
}, [selectedRecord?._id]);

const getDependantName = (dependantId) => {
  if (!dependantId) return null;
  const dep = dependants.find(d => d.id === dependantId);
  return dep ? `${dep.fullName} (${dep.relationshipType || 'Dependant'})` : null;
};

  const patientName = useMemo(() => (
    patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim()
  ), [patient]);


  const summarySubject = useMemo(() => {
  if (!incomingDependantId) return patient;
  const dep = selectedDependant || fullDependantRecord || incomingDependantSnapshot || {};
  const guardian = patient || {};
  const dependantHmos = Array.isArray(guardian.hmos)
    ? guardian.hmos.filter((h) => h.dependantId === dep.id)
    : [];

  return {
    phone: guardian.phone,
    phoneNumber: guardian.phoneNumber,
    hospitalId: guardian.hospitalId,
    cardType: guardian.cardType,
    familyName: guardian.familyName,
    companyName: guardian.companyName,
    id: dep.id || incomingDependantId,
    firstName: dep.firstName,
    middleName: dep.middleName,
    lastName: dep.lastName,
    fullName: dep.fullName || `${dep.firstName || ''} ${dep.lastName || ''}`.trim(),
    gender: dep.gender,
    dob: dep.dob,
    relationshipType: dep.relationshipType,
    hmos: dependantHmos,
  };
}, [incomingDependantId, selectedDependant, fullDependantRecord, incomingDependantSnapshot, patient]);

const summarySubjectName = summarySubject?.fullName
  || `${summarySubject?.firstName || ''} ${summarySubject?.lastName || ''}`.trim()
  || patientName;

const getRoutineTestField = (record, field) => {
  if (!record) return '-';
  const routine = Array.isArray(record.routineTest) ? record.routineTest[0] : record.routineTest;
  if (!routine) return '-';
  return routine[field] || routine[field.toUpperCase?.()] || routine[field.toLowerCase?.()] || '-';
};

const handleDeletePrescription = async (prescriptionId) => {
  if (!window.confirm("Are you sure you want to delete this prescription?")) return;
  try {
    setLoadingTreatmentData(true);
    await deletePrescription(prescriptionId);
    toast.success("Prescription deleted successfully");
    setPrescriptions(prev => prev.filter(p => p._id !== prescriptionId));
  } catch (err) {
    toast.error(`Failed to delete prescription: ${err.message}`);
  } finally {
    setLoadingTreatmentData(false);
  }
};

const handleDeleteLab = async (labId) => {
  if (!window.confirm("Are you sure you want to delete this investigation?")) return;
  try {
    setLoadingTreatmentData(true);
    await deleteInvestigation(labId);
    toast.success("Investigation deleted successfully");
    setLabRequests(prev => prev.filter(l => l._id !== labId));
  } catch (err) {
    toast.error(`Failed to delete investigation: ${err.message}`);
  } finally {
    setLoadingTreatmentData(false);
  }
};

const handleEditPrescription = (prescription) => {
  setEditingPrescription(prescription);
  navigate(`/dashboard/doctor/medical-history/${patientId}/antenatal/${selectedRecord._id}/prescription`, {
    state: { prescription, antenatalId: selectedRecord._id }
  });
};

const handleEditLab = (lab) => {
  setEditingLab(lab);
  setIsInvestigationModalOpen(true);
};

const handleOrderCreated = () => {
  // Reload treatment data after new investigation is created
  if (selectedRecord?._id) {
    (async () => {
      try {
        const invRes = await getInvestigationsByAntenatalId(selectedRecord._id);
        const invList = invRes?.data ?? invRes ?? [];
        setLabRequests(Array.isArray(invList) ? invList : []);
      } catch (err) {
        console.warn("Failed to reload investigations:", err);
      }
    })();
  }
};

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  if (loadingPatient || loadingData) {
    return (
      <div className="flex h-screen bg-base-200/50">
        <div className="flex-1 flex items-center justify-center">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-base-200/50">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="alert alert-error max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <Sidebar />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-3 py-2 h-full sm:p-6 sm:py-4">
          {/* ─── Page Header ─── */}
          <div className="flex flex-col gap-3 mb-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-base-content">Antenatal Record Details</h1>
                <div className="flex items-center gap-0.5 flex-col items-start sm:items-center">
                  <p className="text-sm text-base-content/70">{summarySubjectName || ""}</p>
                  <p className="text-sm text-base-content/70">{summarySubject?.hospitalId || patient?.hospitalId || patientId || "—"}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              <button
                className="btn btn-outline btn-sm sm:btn-md w-full sm:w-auto"
                onClick={() => navigate(`/dashboard/doctor/medical-history/${patientId}`, {
                  state: {
                    from: fromIncoming ? "incoming" : "patients",
                    patientSnapshot: patient,
                    dependantId: incomingDependantId,
                    dependantSnapshot: selectedDependant || fullDependantRecord || incomingDependantSnapshot,
                  },
                })}
              >
                Back to Patient
              </button>
              <button
                className="btn btn-secondary btn-sm sm:btn-md gap-2 w-full sm:w-auto"
                onClick={() => navigate(`/dashboard/doctor/antenatal-records/${patientId}`, {
                  state: {
                    dependantId: dependantId || null,
                    dependantSnapshot: dependantSnapshot || null,
                  }
                })}
              >
                <span>+</span> Add New Record
              </button>
            </div>
          </div>

          {antenatalRecords.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              {/* List of Records */}
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body p-4 sm:p-6">
                  <h3 className="card-title text-base sm:text-lg font-semibold text-base-content mb-4">Antenatal Records</h3>
                  <div className="space-y-4">
                    {antenatalRecords.map((record, index) => {
                    const dependantName = getDependantName(record.dependantId);
                    return (
                      <div
                          key={record._id || record.id || index}
                          className={`border rounded-lg p-3 sm:p-4 ${
                            isViewingDependant && record.dependantId === dependantId
                              ? 'border-secondary bg-secondary/5'
                              : 'border-base-300'
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-medium text-base-content text-sm sm:text-base">
                                Pregnancy #{antenatalRecords.length - index}
                                {record.presentPregnancyHistories?.[0]?.EDD && (
                                  <span className="text-xs sm:text-sm text-base-content/70 ml-2">
                                    (EDD: {formatNigeriaDate(record.presentPregnancyHistories[0].EDD)})
                                  </span>
                                )}
                              </h4>
                            </div>

                            {/* ✅ Show who this record is for */}
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs text-base-content/50">Record for:</span>
                              {dependantName ? (
                                <span className="badge badge-secondary badge-sm">{dependantName}</span>
                              ) : (
                                <span className="badge badge-primary badge-sm">
                                  {patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim()} (Patient)
                                </span>
                              )}
                            </div>

                            <p className="text-xs sm:text-sm text-base-content/70">
                              Created: {record.createdAt ? formatNigeriaDate(record.createdAt) : 'N/A'}
                            </p>
                            
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              className="btn btn-sm btn-outline flex-1 sm:flex-none"
                              onClick={() => setSelectedRecord(selectedRecord?._id === record._id ? null : record)}
                            >
                              {selectedRecord?._id === record._id ? 'Hide Details' : 'View Details'}
                            </button>
                           <button
                            className="btn btn-sm btn-primary flex-1 sm:flex-none"
                            onClick={() => navigate(
                              `/dashboard/medical-director/antenatal-records/${patientId}/edit/${record.__originalIndex ?? index}`,
                              {
                                state: {
                                  dependantId: record.dependantId || null,
                                  dependantSnapshot: record.dependantId === dependantId ? dependantSnapshot : null,
                                }
                              }
                            )}
                          >
                            Edit
                          </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              </div>

              {/* Selected Record Details */}
              {selectedRecord && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="px-2 sm:px-6">
                    <p className="text-sm text-base-content/70">Created by: Dr  {getRecordDoctorName(selectedRecord)}</p>
                  </div>
                  {/* Present Pregnancy */}
                  {selectedRecord.presentPregnancyHistories && selectedRecord.presentPregnancyHistories.length > 0 && (
                    <div className="card bg-base-100 shadow-sm">
                      <div className="card-body p-4 sm:p-6">
                        <h3 className="card-title text-base sm:text-lg font-semibold text-base-content mb-4">Present Pregnancy</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          <div className="stat bg-base-200/50 rounded-lg p-3 sm:p-4">
                            <div className="stat-title text-xs sm:text-sm">Expected Date of Delivery</div>
                            <div className="stat-value text-base sm:text-lg">
                              {selectedRecord.presentPregnancyHistories[0].EDD ? formatNigeriaDate(selectedRecord.presentPregnancyHistories[0].EDD) : '-'}
                            </div>
                          </div>
                          <div className="stat bg-base-200/50 rounded-lg p-3 sm:p-4">
                            <div className="stat-title text-xs sm:text-sm">Last Menstrual Period</div>
                            <div className="stat-value text-base sm:text-lg">
                              {selectedRecord.presentPregnancyHistories[0].LMP ? formatNigeriaDate(selectedRecord.presentPregnancyHistories[0].LMP) : '-'}
                            </div>
                          </div>
                          <div className="stat bg-base-200/50 rounded-lg p-3 sm:p-4">
                            <div className="stat-title text-xs sm:text-sm">Gestational Age</div>
                            <div className="stat-value text-base sm:text-lg">
                              {selectedRecord.presentPregnancyHistories[0].durationOfPregnancyInWeek || 0} weeks
                            </div>
                          </div>
                        </div>

                        <div className="divider"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          <div>
                            <h4 className="font-medium text-base-content mb-3 text-sm sm:text-base">Symptoms</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Bleeding:</span>
                                <span className={selectedRecord.presentPregnancyHistories[0].bleeding === 'yes' ? 'text-error font-medium' : 'text-base-content/70'}>
                                  {selectedRecord.presentPregnancyHistories[0].bleeding || 'No'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Headache:</span>
                                <span className={selectedRecord.presentPregnancyHistories[0].headache === 'yes' ? 'text-warning font-medium' : 'text-base-content/70'}>
                                  {selectedRecord.presentPregnancyHistories[0].headache || 'No'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Vomiting:</span>
                                <span className="text-base-content/70">{selectedRecord.presentPregnancyHistories[0].vomiting || 'No'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Oedema:</span>
                                <span className="text-base-content/70">{selectedRecord.presentPregnancyHistories[0].oedema || 'No'}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-base-content mb-3 text-sm sm:text-base">Other Conditions</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Constipation:</span>
                                <span className="text-base-content/70">{selectedRecord.presentPregnancyHistories[0].constipation || 'No'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Urinary Symptoms:</span>
                                <span className="text-base-content/70">{selectedRecord.presentPregnancyHistories[0].urinarySymptoms || 'No'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Jaundice:</span>
                                <span className="text-base-content/70">{selectedRecord.presentPregnancyHistories[0].jaundice || 'No'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Vaginal Discharge:</span>
                                <span className="text-base-content/70">{selectedRecord.presentPregnancyHistories[0].vaginalDischarge || 'No'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {selectedRecord.presentPregnancyHistories[0].otherSymptoms && (
                          <div className="mt-4">
                            <h4 className="font-medium text-base-content mb-2 text-sm sm:text-base">Other Symptoms</h4>
                            <p className="text-sm text-base-content/80 bg-base-200/50 p-3 rounded-lg">
                              {selectedRecord.presentPregnancyHistories[0].otherSymptoms}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Routine Tests */}
                  {selectedRecord.routineTest && (Array.isArray(selectedRecord.routineTest) ? selectedRecord.routineTest.length > 0 : true) && (
                    <div className="card bg-base-100 shadow-sm">
                      <div className="card-body p-4 sm:p-6">
                        <h3 className="card-title text-base sm:text-lg font-semibold text-base-content mb-4">Routine Tests</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                          <div className="stat bg-base-200/50 rounded-lg p-3 sm:p-4">
                            <div className="stat-title text-xs sm:text-sm">RVS</div>
                            <div className="stat-value text-base sm:text-lg">
                              {getRoutineTestField(selectedRecord, 'RVS')}
                            </div>
                          </div>
                          <div className="stat bg-base-200/50 rounded-lg p-3 sm:p-4">
                            <div className="stat-title text-xs sm:text-sm">VDRL</div>
                            <div className="stat-value text-base sm:text-lg">
                              {getRoutineTestField(selectedRecord, 'VDRL')}
                            </div>
                          </div>
                          <div className="stat bg-base-200/50 rounded-lg p-3 sm:p-4">
                            <div className="stat-title text-xs sm:text-sm">PCV</div>
                            <div className="stat-value text-base sm:text-lg">
                              {getRoutineTestField(selectedRecord, 'PCV')}
                            </div>
                          </div>
                          <div className="stat bg-base-200/50 rounded-lg p-3 sm:p-4">
                            <div className="stat-title text-xs sm:text-sm">HBV</div>
                            <div className="stat-value text-base sm:text-lg">
                              {getRoutineTestField(selectedRecord, 'HBV')}
                            </div>
                          </div>
                          <div className="stat bg-base-200/50 rounded-lg p-3 sm:p-4">
                            <div className="stat-title text-xs sm:text-sm">ABO</div>
                            <div className="stat-value text-base sm:text-lg">
                              {getRoutineTestField(selectedRecord, 'ABO')}
                            </div>
                          </div>
                          <div className="stat bg-base-200/50 rounded-lg p-3 sm:p-4">
                            <div className="stat-title text-xs sm:text-sm">GENOTYPE</div>
                            <div className="stat-value text-base sm:text-lg">
                              {getRoutineTestField(selectedRecord, 'GENOTYPE')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Previous Medical History */}
                  {selectedRecord.medicalHistories && selectedRecord.medicalHistories.length > 0 && (
                    <div className="card bg-base-100 shadow-sm">
                      <div className="card-body p-4 sm:p-6">
                        <h3 className="card-title text-base sm:text-lg font-semibold text-base-content mb-4">Previous Medical History</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          {selectedRecord.medicalHistories[0].heartDisease && (
                            <div className="flex justify-between p-3 bg-base-200/50 rounded-lg text-sm">
                              <span className="font-medium">Heart Disease:</span>
                              <span>{selectedRecord.medicalHistories[0].heartDisease}</span>
                            </div>
                          )}
                          {selectedRecord.medicalHistories[0].hypertension && (
                            <div className="flex justify-between p-3 bg-base-200/50 rounded-lg text-sm">
                              <span className="font-medium">Hypertension:</span>
                              <span className={selectedRecord.medicalHistories[0].hypertension === 'yes' ? 'text-error font-medium' : ''}>
                                {selectedRecord.medicalHistories[0].hypertension}
                              </span>
                            </div>
                          )}
                          {selectedRecord.medicalHistories[0].kidney && (
                            <div className="flex justify-between p-3 bg-base-200/50 rounded-lg text-sm">
                              <span className="font-medium">Kidney:</span>
                              <span>{selectedRecord.medicalHistories[0].kidney}</span>
                            </div>
                          )}
                          {selectedRecord.medicalHistories[0].yawnOrSyphilis && (
                            <div className="flex justify-between p-3 bg-base-200/50 rounded-lg text-sm">
                              <span className="font-medium">Yaws/Syphilis:</span>
                              <span>{selectedRecord.medicalHistories[0].yawnOrSyphilis}</span>
                            </div>
                          )}
                          {selectedRecord.medicalHistories[0].previousOperation && (
                            <div className="flex justify-between p-3 bg-base-200/50 rounded-lg text-sm">
                              <span className="font-medium">Previous Operation:</span>
                              <span>{selectedRecord.medicalHistories[0].previousOperation}</span>
                            </div>
                          )}
                          {selectedRecord.medicalHistories[0].other && (
                            <div className="flex justify-between p-3 bg-base-200/50 rounded-lg text-sm">
                              <span className="font-medium">Others:</span>
                              <span>{selectedRecord.medicalHistories[0].other}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Family History */}
                  {selectedRecord.familyHistories && selectedRecord.familyHistories.length > 0 && (
                    <div className="card bg-base-100 shadow-sm">
                      <div className="card-body p-4 sm:p-6">
                        <h3 className="card-title text-base sm:text-lg font-semibold text-base-content mb-4">Family History</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          {selectedRecord.familyHistories[0].twins && (
                            <div className="flex justify-between p-3 bg-base-200/50 rounded-lg text-sm">
                              <span className="font-medium">Twins:</span>
                              <span className={selectedRecord.familyHistories[0].twins === 'yes' ? 'text-info font-medium' : ''}>
                                {selectedRecord.familyHistories[0].twins}
                              </span>
                            </div>
                          )}
                          {selectedRecord.familyHistories[0].malformation && (
                            <div className="flex justify-between p-3 bg-base-200/50 rounded-lg text-sm">
                              <span className="font-medium">Malformation:</span>
                              <span>{selectedRecord.familyHistories[0].malformation}</span>
                            </div>
                          )}
                          {selectedRecord.familyHistories[0].tuberculosis && (
                            <div className="flex justify-between p-3 bg-base-200/50 rounded-lg text-sm">
                              <span className="font-medium">Tuberculosis:</span>
                              <span className={selectedRecord.familyHistories[0].tuberculosis === 'yes' ? 'text-warning font-medium' : ''}>
                                {selectedRecord.familyHistories[0].tuberculosis}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Previous Obstetric History */}
                  {selectedRecord.obstetricHistories && selectedRecord.obstetricHistories.length > 0 && (
                    <div className="card bg-base-100 shadow-sm">
                      <div className="card-body p-4 sm:p-6">
                        <h3 className="card-title text-base sm:text-lg font-semibold text-base-content mb-4">Previous Obstetric History</h3>

                        {/* Desktop table */}
                        <div className="hidden sm:block overflow-x-auto">
                          <table className="table table-zebra w-full">
                            <thead>
                              <tr className="bg-base-200">
                                <th className="font-semibold">Date</th>
                                <th className="font-semibold">Duration of Pregnancy</th>
                                <th className="font-semibold">Birth Weight</th>
                                <th className="font-semibold">Complication</th>
                                <th className="font-semibold">Alive/Dead</th>
                                <th className="font-semibold">Age of Death</th>
                                <th className="font-semibold">Cause of Death</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedRecord.obstetricHistories.map((item, idx) => (
                                <tr key={idx}>
                                  <td>{item.Date ? formatNigeriaDate(item.Date) : '-'}</td>
                                  <td>{item.durationOfPregnancy || '-'}</td>
                                  <td>{item.birthWeight || '-'}</td>
                                  <td>{item.complicationInPregnancy || '-'}</td>
                                  <td>
                                    <span className={`badge ${item.aliveOrDead === 'Alive' ? 'badge-success' : 'badge-error'}`}>
                                      {item.aliveOrDead || '-'}
                                    </span>
                                  </td>
                                  <td>{item.ageAtDeath || '-'}</td>
                                  <td>{item.causeOfDeath || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="sm:hidden space-y-3">
                          {selectedRecord.obstetricHistories.map((item, idx) => (
                            <div key={idx} className="border border-base-200 rounded-lg p-3 space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-sm">{item.Date ? formatNigeriaDate(item.Date) : '-'}</span>
                                <span className={`badge badge-sm ${item.aliveOrDead === 'Alive' ? 'badge-success' : 'badge-error'}`}>
                                  {item.aliveOrDead || '-'}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs text-base-content/60">
                                <span>Duration of Pregnancy</span><span className="text-base-content text-right">{item.durationOfPregnancy || '-'}</span>
                              </div>
                              <div className="flex justify-between text-xs text-base-content/60">
                                <span>Birth Weight</span><span className="text-base-content text-right">{item.birthWeight || '-'}</span>
                              </div>
                              <div className="flex justify-between text-xs text-base-content/60">
                                <span>Complication</span><span className="text-base-content text-right">{item.complicationInPregnancy || '-'}</span>
                              </div>
                              <div className="flex justify-between text-xs text-base-content/60">
                                <span>Age of Death</span><span className="text-base-content text-right">{item.ageAtDeath || '-'}</span>
                              </div>
                              <div className="flex justify-between text-xs text-base-content/60">
                                <span>Cause of Death</span><span className="text-base-content text-right">{item.causeOfDeath || '-'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Antenatal Examinations */}
                  {selectedRecord.anteNatalExamination && selectedRecord.anteNatalExamination.length > 0 && (
                    <div className="card bg-base-100 shadow-sm">
                      <div className="card-body p-4 sm:p-6">
                        <h3 className="card-title text-base sm:text-lg font-semibold text-base-content mb-4">Antenatal Examinations</h3>
                        <div className="space-y-4 sm:space-y-6">
                          {selectedRecord.anteNatalExamination.map((exam, idx) => (
                            <div key={idx} className="border border-base-200 rounded-lg overflow-hidden">
                              <div className="flex items-center justify-between px-4 py-2 bg-base-200/40 border-b border-base-200">
                                <span className="text-xs sm:text-sm font-semibold text-base-content/70">
                                  Examination #{idx + 1}
                                </span>
                                <span className="text-xs text-base-content/50">
                                  {exam.Date ? formatNigeriaDate(exam.Date) : 'No date'}
                                </span>
                              </div>

                              {/* Desktop table */}
                              <div className="hidden sm:block overflow-x-auto">
                                <table className="table table-zebra w-full">
                                  <thead>
                                    <tr className="bg-base-200">
                                      <th className="font-semibold">EGA</th>
                                      <th className="font-semibold">Fundal Height</th>
                                      <th className="font-semibold">Presentation & Lie</th>
                                      <th className="font-semibold">P.P to Brim</th>
                                      <th className="font-semibold">Foetal Heart</th>
                                      <th className="font-semibold">Urine</th>
                                      <th className="font-semibold">Weight (kg)</th>
                                      <th className="font-semibold">Blood Pressure</th>
                                      <th className="font-semibold">Next Visit</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td>{exam.EGA || '-'}</td>
                                      <td>{exam.heightOfFundus || '-'}</td>
                                      <td>{exam.presentationAndLife || '-'}</td>
                                      <td>{exam.relationOfPPToBrim || '-'}</td>
                                      <td>{exam.foetalHeart || '-'}</td>
                                      <td>{exam.urine || '-'}</td>
                                      <td>{exam.weight || '-'}</td>
                                      <td>{exam.bloodPressure || '-'}</td>
                                      <td>{exam.nextVisit || '-'}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              {/* Mobile card grid */}
                              <div className="sm:hidden grid grid-cols-2 gap-x-3 gap-y-2 p-3 text-xs">
                                <div><span className="text-base-content/50 block">EGA</span><span className="font-medium">{exam.EGA || '-'}</span></div>
                                <div><span className="text-base-content/50 block">Fundal Height</span><span className="font-medium">{exam.heightOfFundus || '-'}</span></div>
                                <div><span className="text-base-content/50 block">Presentation & Lie</span><span className="font-medium">{exam.presentationAndLife || '-'}</span></div>
                                <div><span className="text-base-content/50 block">P.P to Brim</span><span className="font-medium">{exam.relationOfPPToBrim || '-'}</span></div>
                                <div><span className="text-base-content/50 block">Foetal Heart</span><span className="font-medium">{exam.foetalHeart || '-'}</span></div>
                                <div><span className="text-base-content/50 block">Urine</span><span className="font-medium">{exam.urine || '-'}</span></div>
                                <div><span className="text-base-content/50 block">Weight (kg)</span><span className="font-medium">{exam.weight || '-'}</span></div>
                                <div><span className="text-base-content/50 block">Blood Pressure</span><span className="font-medium">{exam.bloodPressure || '-'}</span></div>
                                <div className="col-span-2"><span className="text-base-content/50 block">Next Visit</span><span className="font-medium">{exam.nextVisit || '-'}</span></div>
                              </div>

                              {/* Remark display - full width below the table */}
                              {(exam.remark) && (
                                <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-3 border-t border-base-200">
                                  <label className="label pb-1">
                                    <span className="label-text font-medium text-base-content/70 text-sm">Remark</span>
                                  </label>
                                  <div className="bg-base-200/30 p-3 rounded-lg">
                                    <p className="text-sm text-base-content/80 whitespace-pre-wrap">
                                      {exam.remark}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Treatment Plan Section */}
                  <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body p-0">
                      <div className="p-3 sm:p-4 border-b border-base-200 bg-base-50/50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-success flex items-center justify-center shrink-0">
                            <span className="text-white text-xs">✓</span>
                          </span>
                          <h3 className="font-bold text-base sm:text-lg text-base-content">Treatment Plan & Orders</h3>
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-sm btn-ghost text-primary hover:bg-primary/10 gap-2 flex-1 sm:flex-none"
                            disabled={!selectedRecord}
                            onClick={() => {
                              setIsInvestigationModalOpen(true);
                            }}
                          >
                            <span className="text-sm">📋</span> Order Labs
                          </button>
                          <button
                            className="btn btn-sm btn-primary gap-2 flex-1 sm:flex-none"
                            disabled={!selectedRecord}
                            onClick={() => navigate(`/dashboard/medical-director/medical-history/${patientId}/antenatal/${selectedRecord?._id || selectedRecord?.id}/prescription`, { state: { antenatalId: selectedRecord?._id || selectedRecord?.id } })}
                          >
                            <span className="text-sm">💊</span> Prescribe
                          </button>
                          
                        </div>
                      </div>

                      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                      
                        {/* Lab Requests */}
                        <div>
                          <h4 className="text-sm font-bold text-base-content mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-info"></span>
                            Lab Investigations
                          </h4>
                          {loadingTreatmentData ? (
                            <div className="flex justify-center py-6">
                              <div className="loading loading-spinner loading-sm"></div>
                            </div>
                          ) : labRequests.length > 0 ? (
                            <div className="space-y-3">
                              {labRequests.map((lab) => (
                                <div
                                  key={lab._id}
                                  className="border border-base-300 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className={`badge badge-sm sm:badge-md ${lab.status === 'completed'
                                          ? 'badge-success'
                                          : lab.status === 'pending' || lab.status === 'in_progress'
                                            ? 'badge-warning'
                                            : 'badge-info'
                                          }`}>
                                          {lab.status || 'pending'}
                                        </span>
                                      </div>
                                      <div className="space-y-1">
                                        {lab.tests?.map((test, idx) => (
                                          <p key={idx} className="font-medium text-base-content text-sm sm:text-base">
                                            {test.name || 'Lab Test'}
                                          </p>
                                        ))}
                                        {!lab.tests && (
                                          <p className="font-medium text-base-content text-sm sm:text-base">Lab Test</p>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm text-base-content/70 mt-1">
                                        Ordered: {lab.createdAt ? formatNigeriaDate(lab.createdAt) : 'N/A'}
                                      </p>
                                      {lab.priority && (
                                        <div className="mt-2">
                                          <span className={`badge badge-sm ${lab.priority === 'urgent'
                                            ? 'badge-error'
                                            : lab.priority === 'high'
                                              ? 'badge-warning'
                                              : 'badge-info'
                                            }`}>
                                            {lab.priority}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex gap-1 sm:gap-2 shrink-0">
                                      <button
                                        className="btn btn-xs btn-ghost text-info"
                                        onClick={() => handleEditLab(lab)}
                                        disabled={loadingTreatmentData}
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        className="btn btn-xs btn-ghost text-error"
                                        onClick={() => handleDeleteLab(lab._id)}
                                        disabled={loadingTreatmentData}
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-base-200/20 rounded-lg border border-dashed border-base-300">
                              <p className="text-sm text-base-content/50">No lab investigations ordered yet</p>
                            </div>
                          )}
                        </div>

                        <div className="divider my-0"></div>

                        {/* Prescriptions */}
                        <div>
                          <h4 className="text-sm font-bold text-base-content mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-success"></span>
                            Active Prescriptions
                          </h4>
                          {loadingTreatmentData ? (
                            <div className="flex justify-center py-6">
                              <div className="loading loading-spinner loading-sm"></div>
                            </div>
                          ) : prescriptions.length > 0 ? (
                            <div className="space-y-3">
                              {prescriptions.map((prescription) => (
                                <div
                                  key={prescription._id}
                                  className="border border-base-300 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className={`badge badge-sm sm:badge-md ${prescription.status === 'dispensed'
                                          ? 'badge-success'
                                          : prescription.status === 'pending'
                                            ? 'badge-warning'
                                            : 'badge-info'
                                          }`}>
                                          {prescription.status || 'pending'}
                                        </span>
                                      </div>
                                      <div className="space-y-1">
                                        {prescription.medications?.map((med, idx) => (
                                          <p key={idx} className="font-medium text-base-content text-sm sm:text-base">
                                            {med.drugName || med.medicationName || med.name || 'Medication'} - {med.dosage || 'N/A'}
                                          </p>
                                        ))}
                                        {!prescription.medications && (
                                          <p className="font-medium text-base-content text-sm sm:text-base">Medication</p>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm text-base-content/70 mt-2">
                                        Prescribed: {prescription.createdAt ? formatNigeriaDate(prescription.createdAt) : 'N/A'}
                                      </p>
                                    </div>
                                    <div className="flex gap-1 sm:gap-2 shrink-0">
                                      <button
                                        className="btn btn-xs btn-ghost text-info"
                                        onClick={() => handleEditPrescription(prescription)}
                                        disabled={loadingTreatmentData}
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        className="btn btn-xs btn-ghost text-error"
                                        onClick={() => handleDeletePrescription(prescription._id)}
                                        disabled={loadingTreatmentData}
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-base-200/20 rounded-lg border border-dashed border-base-300">
                              <p className="text-sm text-base-content/50">No prescriptions ordered yet</p>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-6 sm:p-8 text-center">
                <div className="text-base-content/70">
                  <p className="text-base sm:text-lg mb-2">No antenatal records found</p>
                  <p className="text-sm">This patient doesn't have any antenatal records yet.</p>
                </div>
                <div className="mt-4">
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate(`/dashboard/medical-director/antenatal-records/${patientId}`, 
                      { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient,  dependantId: dependantId || null,
                         dependantSnapshot: isViewingDependant ? (subject || dependantSnapshot) : null,  } }
                    )}
                
                  >
                    Create Antenatal Record
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <OrderInvestigationModalAntenatal
        isOpen={isInvestigationModalOpen}
        onClose={() => {
          setIsInvestigationModalOpen(false);
          setEditingLab(null);
        }}
        patientId={patientId}
        antenatalId={selectedRecord?._id || selectedRecord?.id}
        dependantId={selectedRecord?.dependantId || selectedRecord?.dependant?._id || selectedRecord?.dependant?.id}
        investigation={editingLab}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
};

export default AntenatalRecordDetails;