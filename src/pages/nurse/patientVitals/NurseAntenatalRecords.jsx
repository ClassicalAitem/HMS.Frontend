import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import NurseLayout from "@/layouts/nurse/NurseLayout";
import { getPatientById } from "@/services/api/patientsAPI";
import { getAnteNatalRecordByPatientId } from "@/services/api/anteNatalAPI";
import { getAllDependantsForPatient } from "@/services/api/dependantAPI";
import { getPrescriptionsByAntenatalId } from "@/services/api/prescriptionsAPI";
import { getInvestigationsByAntenatalId } from "@/services/api/investigationRequestAPI";
import { getLabResults } from "@/services/api/labResultsAPI";
import { LabResultDetailsModal } from "@/components/modals";
import { usersAPI } from "@/services/api/usersAPI";
import { formatNigeriaDate, formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";
import { FaFlask, FaEye, FaUserMd, FaUserNurse, FaHistory, FaClock, FaEdit, FaCheckCircle } from "react-icons/fa";

// Helper: resolve subject ID
const summarySubjectId = (patient, isViewingDependant, dependantSnapshot) => {
  if (isViewingDependant && dependantSnapshot) {
    return `Dependant ID: ${dependantSnapshot.hospitalId || dependantSnapshot.id || '—'}`;
  }
  return `Hospital ID: ${patient?.hospitalId || '—'}`;
};

const NurseAntenatalRecords = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dependantId = location?.state?.dependantId || null;
  const dependantSnapshot = location?.state?.dependantSnapshot || null;
  const isViewingDependant = !!dependantId;

  const [patient, setPatient] = useState(null);
  const [dependants, setDependants] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patientLoading, setPatientLoading] = useState(true);
  const [staffNameById, setStaffNameById] = useState({});

  // Treatment plan data (prescriptions & labs for selected antenatal record)
  const [prescriptions, setPrescriptions] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [loadingTreatmentData, setLoadingTreatmentData] = useState(false);
  const [labResults, setLabResults] = useState([]);
  const [selectedLabResultForModal, setSelectedLabResultForModal] = useState(null);
  const [isLabResultModalOpen, setIsLabResultModalOpen] = useState(false);
  const [showAllLabHistory, setShowAllLabHistory] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((value) => !value);
  const closeSidebar = () => setIsSidebarOpen(false);

  const normalizeUserResponse = (response) => {
    if (response?.data?.data) return response.data.data;
    if (response?.data) return response.data;
    return response;
  };

  const getStaffDisplayName = (staff) => {
    if (!staff) return '';
    if (typeof staff === 'string') return staff;
    if (staff.fullName) return staff.fullName;
    if (staff.firstName || staff.lastName) return `${staff.firstName || ''} ${staff.lastName || ''}`.trim();
    return '';
  };

  const getStaffId = (record) => {
    if (!record) return null;
    if (record.doctorId) return typeof record.doctorId === 'object' ? (record.doctorId.id || record.doctorId._id) : record.doctorId;
    if (record.nurseId) return typeof record.nurseId === 'object' ? (record.nurseId.id || record.nurseId._id) : record.nurseId;
    if (record.doctor?.id) return record.doctor.id;
    if (record.doctor?._id) return record.doctor._id;
    if (record.createdBy) return typeof record.createdBy === 'object' ? (record.createdBy.id || record.createdBy._id) : record.createdBy;
    return null;
  };

  const formatRoleTitle = (role, name = '') => {
    const r = String(role || '').toLowerCase();
    const cleanName = name ? name.replace(/^(Dr\.|Dr|Nurse)\s+/i, '') : '';
    if (r === 'nurse') {
      return cleanName ? `Nurse ${cleanName}` : 'Nurse';
    }
    if (r === 'medical-director' || r === 'medical_director') {
      return cleanName ? `Dr. ${cleanName} (MD)` : 'Medical Director';
    }
    if (r === 'doctor') {
      return cleanName ? `Dr. ${cleanName}` : 'Doctor';
    }
    return cleanName || name || 'Medical Staff';
  };

  const getRoleBadge = (role) => {
    const r = String(role || '').toLowerCase();
    if (r === 'nurse') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <FaUserNurse className="text-[10px]" /> Nurse
        </span>
      );
    }
    if (r === 'medical-director' || r === 'medical_director') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
          <FaUserMd className="text-[10px]" /> Medical Director
        </span>
      );
    }
    if (r === 'doctor') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
          <FaUserMd className="text-[10px]" /> Doctor
        </span>
      );
    }
    if (r) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-base-200 text-base-content/80 border border-base-300 capitalize">
          {r.replace('-', ' ')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-base-200 text-base-content/70">
        Staff
      </span>
    );
  };

  const getCreatorDetails = (record) => {
    if (!record) return { name: 'Medical Staff', role: 'doctor', display: 'Medical Staff' };
    const role = record.createdByRole || record.creator?.accountType || (record.nurseName ? 'nurse' : 'doctor');
    let name = record.createdByName || (record.creator ? getStaffDisplayName(record.creator) : null);
    if (!name) {
      const sid = getStaffId(record);
      if (sid && staffNameById[sid]) name = staffNameById[sid];
    }
    if (!name) name = record.doctorName || record.nurseName || 'Medical Staff';
    return {
      name,
      role,
      display: formatRoleTitle(role, name),
      date: record.createdAt,
    };
  };

  const getUpdaterDetails = (record) => {
    if (!record || !record.updatedByName) return null;
    const role = record.updatedByRole || record.updater?.accountType || record.createdByRole || 'doctor';
    const name = record.updatedByName || (record.updater ? getStaffDisplayName(record.updater) : null) || 'Staff';
    return {
      name,
      role,
      display: formatRoleTitle(role, name),
      date: record.updatedAt,
    };
  };

  const getRecordStaffName = (record) => {
    if (!record) return 'Unknown Provider';
    if (record.createdByName && record.createdByRole) {
      return formatRoleTitle(record.createdByRole, record.createdByName);
    }
    if (record.doctorName) return `Dr. ${record.doctorName}`;
    if (record.nurseName) return `Nurse ${record.nurseName}`;
    if (record.doctor && typeof record.doctor === 'object') {
      const name = getStaffDisplayName(record.doctor);
      if (name) return name;
    }
    const sid = getStaffId(record);
    if (sid && staffNameById[sid]) return staffNameById[sid];
    return 'Medical Staff';
  };

  const getAntenatalRecordId = (record) =>
    record?._id || record?.id || record?.antenatalId || record?.recordId || record?.__wrapperId || null;

  const getRecordsArray = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) {
      const hasDirectRecords = payload.some(r => r?.presentPregnancy || r?.presentPregnancyHistories || r?.medicalHistories);
      if (hasDirectRecords) {
        return payload.map((r, i) => ({ ...r, __originalIndex: r.__originalIndex ?? i }));
      }
      return payload.flatMap((wrapper) =>
        (wrapper.anteNatalRecords || []).map((r, i) => ({
          ...r,
          __wrapperId: wrapper._id,
          __originalIndex: i,
        }))
      );
    }
    if (Array.isArray(payload.anteNatalRecords)) {
      return payload.anteNatalRecords.map((r, i) => ({ ...r, __originalIndex: i }));
    }
    if (Array.isArray(payload.data)) return payload.data;
    return [];
  };

  useEffect(() => {
    let mounted = true;
    const fetchPatient = async () => {
      try {
        setPatientLoading(true);
        const res = await getPatientById(patientId);
        if (mounted) setPatient(res?.data ?? res);
      } catch (err) {
        console.error("Failed to load patient", err);
      } finally {
        if (mounted) setPatientLoading(false);
      }
    };
    if (patientId) fetchPatient();
    return () => { mounted = false; };
  }, [patientId]);

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
      } catch (err) {
        console.error("Failed to fetch dependants", err);
      }
    };
    if (patientId) fetchDependants();
    return () => { mounted = false; };
  }, [patientId]);

  useEffect(() => {
    let mounted = true;
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const res = await getAnteNatalRecordByPatientId(patientId);
        const list = getRecordsArray(res);
        const sorted = [...list].sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        const scoped = isViewingDependant
          ? sorted.filter(r => r?.dependantId === dependantId)
          : sorted.filter(r => !r?.dependantId);

        if (mounted) {
          setRecords(scoped);
          if (scoped.length > 0 && !selectedRecord) {
            setSelectedRecord(scoped[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch antenatal records", err);
        if (mounted) setRecords([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (patientId) fetchRecords();
    return () => { mounted = false; };
  }, [patientId, isViewingDependant, dependantId]);

  // Load treatment plan data for selected antenatal record
  // Load treatment plan data for selected antenatal record
  useEffect(() => {
    let mounted = true;
    const loadTreatmentData = async () => {
      const antenatalRecordId = getAntenatalRecordId(selectedRecord);
      if (!antenatalRecordId) {
        setPrescriptions([]);
        setLabRequests([]);
        return;
      }
      try {
        setLoadingTreatmentData(true);
        try {
          const presRes = await getPrescriptionsByAntenatalId(antenatalRecordId);
          const presList = presRes?.data ?? presRes ?? [];
          if (mounted) setPrescriptions(Array.isArray(presList) ? presList : []);
        } catch {
          if (mounted) setPrescriptions([]);
        }

        try {
          const invRes = await getInvestigationsByAntenatalId(antenatalRecordId);
          const invList = invRes?.data ?? invRes ?? [];
          if (mounted) setLabRequests(Array.isArray(invList) ? invList : []);
        } catch {
          if (mounted) setLabRequests([]);
        }

        // Fetch patient lab results
        try {
          const labRes = await getLabResults({ patientId });
          const rawList = labRes?.data ?? labRes ?? [];
          const list = Array.isArray(rawList) ? rawList : (rawList?.data ?? []);
          const scopedLabs = isViewingDependant && dependantId
            ? list.filter(r => r.dependantId === dependantId)
            : list.filter(r => !r.dependantId);
          if (mounted) setLabResults(scopedLabs);
        } catch {
          if (mounted) setLabResults([]);
        }
      } finally {
        if (mounted) setLoadingTreatmentData(false);
      }
    };

    loadTreatmentData();
    return () => { mounted = false; };
  }, [selectedRecord, patientId, isViewingDependant, dependantId]);

  const getLabResultForRequest = (lab) => {
    if (!lab) return null;
    const invId = String(lab._id || lab.id || '');
    return labResults.find(r => 
      String(r.investigationRequestId || '') === invId ||
      String(r.investigationId || '') === invId
    );
  };

  const loadStaffNames = useCallback(async (staffIds = []) => {
    const idsToFetch = [...new Set(staffIds.filter(Boolean).filter((id) => !staffNameById[id]))];
    if (!idsToFetch.length) return;

    try {
      const results = await Promise.allSettled(idsToFetch.map((id) => usersAPI.getUserById(id)));
      const nameMap = {};
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const user = normalizeUserResponse(result.value);
          const displayName = getStaffDisplayName(user);
          if (displayName) nameMap[idsToFetch[index]] = displayName;
        }
      });
      if (Object.keys(nameMap).length) {
        setStaffNameById((prev) => ({ ...prev, ...nameMap }));
      }
    } catch (err) {
      console.warn("Failed to load staff names:", err);
    }
  }, [staffNameById]);

  useEffect(() => {
    const ids = [];
    records.forEach((r) => {
      const id = getStaffId(r);
      if (id && !staffNameById[id]) ids.push(id);
    });
    if (ids.length) loadStaffNames(ids);
  }, [records, staffNameById, loadStaffNames]);

  const heading = useMemo(() => {
    if (isViewingDependant) {
      return dependantSnapshot?.fullName
        || `${dependantSnapshot?.firstName || ''} ${dependantSnapshot?.lastName || ''}`.trim()
        || 'Dependant';
    }
    if (patient) return patient.fullName || `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
    return "Antenatal Records";
  }, [patient, isViewingDependant, dependantSnapshot]);

  const getDependantName = (depId) => {
    if (!depId) return null;
    const dep = dependants.find(d => (d.id || d._id) === depId);
    return dep ? `${dep.fullName} (${dep.relationshipType || 'Dependant'})` : null;
  };

  const getPresentPregnancy = (record) =>
    record?.presentPregnancy || record?.presentPregnancyHistories?.[0] || {};
  const getExams = (record) =>
    record?.antenatalExaminations || record?.anteNatalExamination || [];
  const getRoutineTestField = (record, field) => {
    if (!record) return '—';
    const routine = Array.isArray(record.routineTest) ? record.routineTest[0] : record.routineTest;
    if (!routine) return '—';
    return routine[field] || routine[field.toLowerCase?.()] || routine[field.toUpperCase?.()] || '—';
  };

  const handleEditRecord = (record, idx) => {
    const recordIdx = record.__originalIndex ?? idx;
    navigate(`/dashboard/nurse/patient/${patientId}/antenatal-records/edit/${recordIdx}`, {
      state: {
        dependantId: record.dependantId || dependantId || null,
        dependantSnapshot: record.dependantId === dependantId ? dependantSnapshot : null,
        patientSnapshot: patient,
      }
    });
  };

  const handleCreateNewRecord = () => {
    navigate(`/dashboard/nurse/patient/${patientId}/antenatal-records/new`, {
      state: {
        dependantId: dependantId || null,
        dependantSnapshot: dependantSnapshot || null,
        patientSnapshot: patient,
      }
    });
  };

  return (
    <NurseLayout>
      <div className="space-y-4">
        {/* Page Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-base-content">{heading}</h1>
                <span className="badge badge-primary badge-outline text-xs">
                  {summarySubjectId(patient, isViewingDependant, dependantSnapshot)}
                </span>
              </div>
              <p className="text-sm text-base-content/70">
                {isViewingDependant
                  ? `Dependant of ${patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim()} — Antenatal History & Records`
                  : 'Antenatal History & Care Records'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => navigate(`/dashboard/nurse/patient/${patientId}`, {
                  state: { dependantId, dependantSnapshot }
                })}
              >
                Back to Patient
              </button>
              <button
                className="btn btn-primary btn-sm gap-1"
                onClick={handleCreateNewRecord}
              >
                <span>+</span> Add New Record
              </button>
            </div>
          </div>

          {loading || patientLoading ? (
            <div className="flex justify-center py-12"><div className="loading loading-spinner loading-lg text-primary" /></div>
          ) : records.length === 0 ? (
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-8 text-center space-y-4">
                <div className="text-base-content/70">
                  <h3 className="text-lg font-bold text-base-content mb-1">No antenatal records found</h3>
                  <p className="text-sm">There are no antenatal care records entered for this patient yet.</p>
                </div>
                <div>
                  <button
                    className="btn btn-primary btn-md gap-2"
                    onClick={handleCreateNewRecord}
                  >
                    <span>+</span> Create Antenatal Record
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card bg-base-100 shadow-sm border border-base-200">
                  <div className="card-body p-4">
                    <h3 className="card-title text-base font-semibold text-base-content">Summary</h3>
                    <div className="text-sm mt-1 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Total Pregnancies Recorded:</span>
                        <span className="font-semibold">{records.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Total Examinations:</span>
                        <span className="font-semibold">
                          {records.reduce((sum, r) => sum + (getExams(r).length || 0), 0)}
                        </span>
                      </div>
                      <div className="pt-1">
                        <span className="text-xs text-base-content/70">Latest Examination Remark:</span>
                        <div className="mt-1 text-xs text-base-content/80 bg-base-200/60 p-2.5 rounded-lg max-h-20 overflow-y-auto">
                          {(() => {
                            const latest = [...records].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
                            const latestExam = (latest ? getExams(latest) : []).sort((a, b) => new Date(b.Date || 0) - new Date(a.Date || 0))[0];
                            return latestExam?.remark || "No remarks entered";
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-100 shadow-sm border border-base-200">
                  <div className="card-body p-4">
                    <h3 className="card-title text-base font-semibold text-base-content">Latest Pregnancy Overview</h3>
                    {(() => {
                      const latest = [...records].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
                      const present = latest ? getPresentPregnancy(latest) : {};
                      return latest ? (
                        <div className="mt-1 text-sm space-y-2">
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Expected Delivery (EDD):</span>
                            <span className="font-semibold text-primary">
                              {(present.EDD || present.edd) ? formatNigeriaDate(present.EDD || present.edd) : '—'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Last Menstrual Period (LMP):</span>
                            <span className="font-medium">
                              {(present.LMP || present.lmp) ? formatNigeriaDate(present.LMP || present.lmp) : '—'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Gestational Age:</span>
                            <span className="font-medium">
                              {(present.durationOfPregnancyInWeek || present.durationInWeeks)
                                ? `${present.durationOfPregnancyInWeek || present.durationInWeeks} weeks`
                                : '—'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-base-content/70">Booking Date:</span>
                            <span className="font-medium">
                              {present.dateOfBooking ? formatNigeriaDate(present.dateOfBooking) : '—'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-base-content/70">No pregnancy summary available</p>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Records List / Accordion */}
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-4 sm:p-5">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-base sm:text-lg text-base-content">
                      All Recorded Pregnancies ({records.length})
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {records.map((record, index) => {
                      const isSelected = getAntenatalRecordId(selectedRecord) === getAntenatalRecordId(record);
                      const presentPregnancy = getPresentPregnancy(record);
                      const depName = getDependantName(record.dependantId);
                      const exams = getExams(record);

                      return (
                        <div
                          key={record._id || record.id || index}
                          className={`border rounded-xl p-4 transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-base-200 hover:border-base-300 bg-base-100'
                          }`}
                        >
                          {/* Row Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-base text-base-content">
                                  Pregnancy #{records.length - index}
                                </h4>
                                {(presentPregnancy.EDD || presentPregnancy.edd) && (
                                  <span className="badge badge-sm badge-primary">
                                    EDD: {formatNigeriaDate(presentPregnancy.EDD || presentPregnancy.edd)}
                                  </span>
                                )}
                                {depName ? (
                                  <span className="badge badge-sm badge-secondary">{depName}</span>
                                ) : (
                                  <span className="badge badge-sm badge-outline">Patient</span>
                                )}
                              </div>
                              {(() => {
                                const creator = getCreatorDetails(record);
                                const updater = getUpdaterDetails(record);
                                const hasEdits = (record.editHistory && record.editHistory.length > 1) || (updater && updater.name !== creator.name);

                                return (
                                  <div className="flex items-center gap-3 text-xs text-base-content/70 mt-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="text-base-content/50">Created by:</span>
                                      {getRoleBadge(creator.role)}
                                      <span className="font-semibold text-base-content">{creator.name}</span>
                                      <span className="text-base-content/50">
                                        ({record.createdAt ? formatNigeriaDate(record.createdAt) : '—'})
                                      </span>
                                    </span>

                                    {hasEdits && updater && (
                                      <>
                                        <span>•</span>
                                        <span className="inline-flex items-center gap-1.5 bg-base-200/50 px-2 py-0.5 rounded-md">
                                          <span className="text-base-content/50">Last edited by:</span>
                                          {getRoleBadge(updater.role)}
                                          <span className="font-semibold text-base-content">{updater.name}</span>
                                          {record.updatedAt && (
                                            <span className="text-base-content/50">
                                              ({formatNigeriaDate(record.updatedAt)})
                                            </span>
                                          )}
                                        </span>
                                      </>
                                    )}

                                    <span>•</span>
                                    <span>Examinations: {exams.length}</span>

                                    {record.editHistory && record.editHistory.length > 0 && (
                                      <span className="badge badge-ghost badge-sm text-xs gap-1">
                                        <FaHistory className="text-[10px]" />
                                        {record.editHistory.length} {record.editHistory.length === 1 ? 'version' : 'edits tracked'}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                className={`btn btn-sm ${isSelected ? 'btn-neutral' : 'btn-outline'}`}
                                onClick={() => setSelectedRecord(isSelected ? null : record)}
                              >
                                {isSelected ? 'Hide Details' : 'View Details'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={() => handleEditRecord(record, index)}
                              >
                                ✏️ Edit
                              </button>
                            </div>
                          </div>

                          {/* Full Expanded Record Details */}
                          {isSelected && (
                            <div className="mt-5 pt-4 border-t border-base-200 space-y-5">
                              {/* Audit Trail & Staff Follow-up Banner */}
                              {(() => {
                                const creator = getCreatorDetails(record);
                                const updater = getUpdaterDetails(record);
                                const history = Array.isArray(record.editHistory) ? record.editHistory : [];

                                return (
                                  <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
                                    <div className="bg-base-200/40 px-4 py-3 border-b border-base-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <FaHistory className="text-primary text-sm" />
                                        <h5 className="font-bold text-sm text-base-content">
                                          Staff Audit Trail & Change Tracking
                                        </h5>
                                      </div>
                                      <span className="text-xs text-base-content/60">
                                        Follow up on who created and modified this pregnancy record
                                      </span>
                                    </div>

                                    <div className="p-4 space-y-4">
                                      {/* Creator vs Editor Comparison Cards */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                                        {/* Creator Box */}
                                        <div className="p-3.5 rounded-lg border border-base-200 bg-base-200/20 flex flex-col justify-between">
                                          <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                              <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                                                Original Creator
                                              </span>
                                              {getRoleBadge(creator.role)}
                                            </div>
                                            <p className="font-bold text-base text-base-content">{creator.name}</p>
                                            <p className="text-xs text-base-content/70 mt-0.5">
                                              Role: <span className="font-medium capitalize">{String(creator.role || 'Staff').replace('-', ' ')}</span>
                                            </p>
                                          </div>
                                          <div className="mt-3 pt-2 border-t border-base-200/60 text-xs text-base-content/60 flex items-center gap-1">
                                            <FaClock className="text-[10px]" />
                                            Created: {record.createdAt ? formatNigeriaDateTime(record.createdAt) : '—'}
                                          </div>
                                        </div>

                                        {/* Last Editor Box */}
                                        <div className="p-3.5 rounded-lg border border-base-200 bg-base-200/20 flex flex-col justify-between">
                                          <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                              <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                                                Last Modified By
                                              </span>
                                              {updater ? getRoleBadge(updater.role) : getRoleBadge(creator.role)}
                                            </div>
                                            <p className="font-bold text-base text-base-content">
                                              {updater ? updater.name : creator.name}
                                            </p>
                                            <p className="text-xs text-base-content/70 mt-0.5">
                                              Role: <span className="font-medium capitalize">{String((updater?.role || creator.role) || 'Staff').replace('-', ' ')}</span>
                                            </p>
                                          </div>
                                          <div className="mt-3 pt-2 border-t border-base-200/60 text-xs text-base-content/60 flex items-center gap-1">
                                            <FaClock className="text-[10px]" />
                                            Last Modified: {record.updatedAt ? formatNigeriaDateTime(record.updatedAt) : (record.createdAt ? formatNigeriaDateTime(record.createdAt) : '—')}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Change History Timeline */}
                                      {history.length > 0 && (
                                        <div className="pt-2">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-base-content/80 flex items-center gap-1.5">
                                              <FaEdit className="text-primary text-xs" /> Chronological Change Log ({history.length})
                                            </span>
                                          </div>

                                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                            {history.map((item, hIdx) => (
                                              <div
                                                key={hIdx}
                                                className="p-2.5 rounded-lg bg-base-200/30 border border-base-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                                              >
                                                <div className="flex items-start sm:items-center gap-2">
                                                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 font-bold text-[10px]">
                                                    {history.length - hIdx}
                                                  </span>
                                                  <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                      <span className="font-bold text-base-content">
                                                        {item.editedByName || 'Medical Staff'}
                                                      </span>
                                                      {getRoleBadge(item.editedByRole)}
                                                      <span className="text-base-content/50 text-[11px]">
                                                        — {item.action || 'Edited Record'}
                                                      </span>
                                                    </div>
                                                    {item.changesSummary && (
                                                      <p className="text-xs text-base-content/80 mt-0.5 font-medium">
                                                        <span className="text-base-content/50">Changes: </span>
                                                        {item.changesSummary}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                                <span className="text-[11px] text-base-content/60 shrink-0 self-end sm:self-center">
                                                  {item.editedAt ? formatNigeriaDateTime(item.editedAt) : '—'}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Present Pregnancy Section */}
                              <div className="card bg-base-100 border border-base-200">
                                <div className="card-body p-4">
                                  <div className="flex justify-between items-center mb-3">
                                    <h5 className="font-bold text-sm sm:text-base text-base-content">History of Present Pregnancy</h5>
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-outline btn-primary"
                                      onClick={() => handleEditRecord(record, index)}
                                    >
                                      Edit Pregnancy
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                                    <div className="p-3 bg-base-200/50 rounded-lg">
                                      <span className="text-xs text-base-content/60 block">Date of Booking</span>
                                      <span className="font-semibold text-base-content">
                                        {presentPregnancy.dateOfBooking ? formatNigeriaDate(presentPregnancy.dateOfBooking) : '—'}
                                      </span>
                                    </div>
                                    <div className="p-3 bg-base-200/50 rounded-lg">
                                      <span className="text-xs text-base-content/60 block">LMP</span>
                                      <span className="font-semibold text-base-content">
                                        {(presentPregnancy.LMP || presentPregnancy.lmp) ? formatNigeriaDate(presentPregnancy.LMP || presentPregnancy.lmp) : '—'}
                                      </span>
                                    </div>
                                    <div className="p-3 bg-base-200/50 rounded-lg">
                                      <span className="text-xs text-base-content/60 block">EDD</span>
                                      <span className="font-semibold text-primary">
                                        {(presentPregnancy.EDD || presentPregnancy.edd) ? formatNigeriaDate(presentPregnancy.EDD || presentPregnancy.edd) : '—'}
                                      </span>
                                    </div>
                                    <div className="p-3 bg-base-200/50 rounded-lg">
                                      <span className="text-xs text-base-content/60 block">Gestational Age (EGA)</span>
                                      <span className="font-semibold text-base-content">
                                        {(presentPregnancy.durationOfPregnancyInWeek || presentPregnancy.durationInWeeks)
                                          ? `${presentPregnancy.durationOfPregnancyInWeek || presentPregnancy.durationInWeeks} w`
                                          : '—'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    <div className="flex justify-between p-2 bg-base-200/30 rounded">
                                      <span className="text-base-content/70">Bleeding:</span>
                                      <span className="font-medium">{presentPregnancy.bleeding || 'No'}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-base-200/30 rounded">
                                      <span className="text-base-content/70">FMF:</span>
                                      <span className="font-medium">{presentPregnancy.FMF || '—'}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-base-200/30 rounded">
                                      <span className="text-base-content/70">Headache:</span>
                                      <span className="font-medium">{presentPregnancy.headache || 'No'}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-base-200/30 rounded">
                                      <span className="text-base-content/70">Vomiting:</span>
                                      <span className="font-medium">{presentPregnancy.vomiting || 'No'}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-base-200/30 rounded">
                                      <span className="text-base-content/70">Oedema:</span>
                                      <span className="font-medium">{presentPregnancy.oedema || 'No'}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-base-200/30 rounded">
                                      <span className="text-base-content/70">Constipation:</span>
                                      <span className="font-medium">{presentPregnancy.constipation || 'No'}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-base-200/30 rounded">
                                      <span className="text-base-content/70">Urinary Symptoms:</span>
                                      <span className="font-medium">{presentPregnancy.urinarySymptoms || 'No'}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-base-200/30 rounded">
                                      <span className="text-base-content/70">Jaundice:</span>
                                      <span className="font-medium">{presentPregnancy.jaundice || 'No'}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-base-200/30 rounded col-span-2">
                                      <span className="text-base-content/70">Vaginal Discharge:</span>
                                      <span className="font-medium">{presentPregnancy.vaginalDischarge || 'None'}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-base-200/30 rounded col-span-2">
                                      <span className="text-base-content/70">Taken By:</span>
                                      <span className="font-medium">{presentPregnancy.takenBy || getRecordStaffName(record)}</span>
                                    </div>
                                  </div>

                                  {presentPregnancy.otherSymptoms && (
                                    <div className="mt-3 text-xs bg-base-200/40 p-2.5 rounded-lg">
                                      <span className="font-semibold block mb-0.5">Other Symptoms:</span>
                                      <p className="text-base-content/80">{presentPregnancy.otherSymptoms}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Routine Tests Section */}
                              <div className="card bg-base-100 border border-base-200">
                                <div className="card-body p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-bold text-sm sm:text-base text-base-content flex items-center gap-2">
                                      <span>🧪</span> Routine Tests & Screening Results
                                    </h5>
                                    <span className="text-xs text-base-content/60">Booking Screening</span>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center">
                                    {/* RVS */}
                                    {(() => {
                                      const val = getRoutineTestField(record, 'RVS');
                                      const isNeg = String(val).toLowerCase().includes('neg') || String(val).toLowerCase().includes('non');
                                      const isPos = String(val).toLowerCase().includes('pos') || String(val).toLowerCase().includes('react');
                                      return (
                                        <div className="p-3 bg-base-200/50 rounded-lg">
                                          <span className="text-xs text-base-content/60 block mb-1 font-semibold">RVS (HIV)</span>
                                          {val !== '—' && val !== '-' ? (
                                            <span className={`badge badge-sm font-semibold ${isNeg ? 'badge-success' : isPos ? 'badge-error' : 'badge-neutral'}`}>
                                              {val}
                                            </span>
                                          ) : (
                                            <span className="text-xs text-base-content/40">Not tested</span>
                                          )}
                                        </div>
                                      );
                                    })()}

                                    {/* VDRL */}
                                    {(() => {
                                      const val = getRoutineTestField(record, 'VDRL');
                                      const isNeg = String(val).toLowerCase().includes('neg') || String(val).toLowerCase().includes('non');
                                      const isPos = String(val).toLowerCase().includes('pos') || String(val).toLowerCase().includes('react');
                                      return (
                                        <div className="p-3 bg-base-200/50 rounded-lg">
                                          <span className="text-xs text-base-content/60 block mb-1 font-semibold">VDRL (Syphilis)</span>
                                          {val !== '—' && val !== '-' ? (
                                            <span className={`badge badge-sm font-semibold ${isNeg ? 'badge-success' : isPos ? 'badge-error' : 'badge-neutral'}`}>
                                              {val}
                                            </span>
                                          ) : (
                                            <span className="text-xs text-base-content/40">Not tested</span>
                                          )}
                                        </div>
                                      );
                                    })()}

                                    {/* PCV */}
                                    {(() => {
                                      const val = getRoutineTestField(record, 'PCV');
                                      return (
                                        <div className="p-3 bg-base-200/50 rounded-lg">
                                          <span className="text-xs text-base-content/60 block mb-1 font-semibold">PCV</span>
                                          {val !== '—' && val !== '-' ? (
                                            <span className="badge badge-info badge-sm font-bold">{val}</span>
                                          ) : (
                                            <span className="text-xs text-base-content/40">Not tested</span>
                                          )}
                                        </div>
                                      );
                                    })()}

                                    {/* HBV */}
                                    {(() => {
                                      const val = getRoutineTestField(record, 'HBV');
                                      const isNeg = String(val).toLowerCase().includes('neg') || String(val).toLowerCase().includes('non');
                                      const isPos = String(val).toLowerCase().includes('pos') || String(val).toLowerCase().includes('react');
                                      return (
                                        <div className="p-3 bg-base-200/50 rounded-lg">
                                          <span className="text-xs text-base-content/60 block mb-1 font-semibold">HBV (Hepatitis)</span>
                                          {val !== '—' && val !== '-' ? (
                                            <span className={`badge badge-sm font-semibold ${isNeg ? 'badge-success' : isPos ? 'badge-error' : 'badge-neutral'}`}>
                                              {val}
                                            </span>
                                          ) : (
                                            <span className="text-xs text-base-content/40">Not tested</span>
                                          )}
                                        </div>
                                      );
                                    })()}

                                    {/* ABO */}
                                    {(() => {
                                      const val = getRoutineTestField(record, 'ABO');
                                      return (
                                        <div className="p-3 bg-base-200/50 rounded-lg">
                                          <span className="text-xs text-base-content/60 block mb-1 font-semibold">Blood Group</span>
                                          {val !== '—' && val !== '-' ? (
                                            <span className="badge badge-primary badge-sm font-bold">{val}</span>
                                          ) : (
                                            <span className="text-xs text-base-content/40">Not tested</span>
                                          )}
                                        </div>
                                      );
                                    })()}

                                    {/* GENOTYPE */}
                                    {(() => {
                                      const val = getRoutineTestField(record, 'GENOTYPE');
                                      return (
                                        <div className="p-3 bg-base-200/50 rounded-lg">
                                          <span className="text-xs text-base-content/60 block mb-1 font-semibold">Genotype</span>
                                          {val !== '—' && val !== '-' ? (
                                            <span className="badge badge-secondary badge-sm font-bold">{val}</span>
                                          ) : (
                                            <span className="text-xs text-base-content/40">Not tested</span>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>

                              {/* Medical & Family History Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {record.medicalHistories && record.medicalHistories.length > 0 && (
                                  <div className="card bg-base-100 border border-base-200">
                                    <div className="card-body p-4">
                                      <h5 className="font-bold text-sm text-base-content mb-2">Previous Medical History</h5>
                                      <div className="space-y-1.5 text-xs">
                                        {Object.entries(record.medicalHistories[0]).map(([k, v]) => (
                                          <div key={k} className="flex justify-between bg-base-200/40 p-2 rounded">
                                            <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                                            <span className="font-medium">{v || '—'}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {record.familyHistories && record.familyHistories.length > 0 && (
                                  <div className="card bg-base-100 border border-base-200">
                                    <div className="card-body p-4">
                                      <h5 className="font-bold text-sm text-base-content mb-2">Family History</h5>
                                      <div className="space-y-1.5 text-xs">
                                        {Object.entries(record.familyHistories[0]).map(([k, v]) => (
                                          <div key={k} className="flex justify-between bg-base-200/40 p-2 rounded">
                                            <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                                            <span className="font-medium">{v || '—'}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Obstetric History */}
                              {record.obstetricHistories && record.obstetricHistories.length > 0 && (
                                <div className="card bg-base-100 border border-base-200">
                                  <div className="card-body p-4">
                                    <h5 className="font-bold text-sm sm:text-base text-base-content mb-3">Previous Obstetric History</h5>
                                    <div className="overflow-x-auto">
                                      <table className="table table-zebra table-sm w-full text-xs">
                                        <thead>
                                          <tr className="bg-base-200/60">
                                            <th>Date</th>
                                            <th>Duration</th>
                                            <th>Birth Weight</th>
                                            <th>Complication</th>
                                            <th>Status</th>
                                            <th>Age / Cause of Death</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {record.obstetricHistories.map((obs, oIdx) => (
                                            <tr key={oIdx}>
                                              <td>{obs.Date ? formatNigeriaDate(obs.Date) : '—'}</td>
                                              <td>{obs.durationOfPregnancy || '—'}</td>
                                              <td>{obs.birthWeight || '—'}</td>
                                              <td>{obs.complicationInPregnancy || obs.complication || '—'}</td>
                                              <td>
                                                <span className={`badge badge-xs ${obs.aliveOrDead === 'Alive' ? 'badge-success' : 'badge-error'}`}>
                                                  {obs.aliveOrDead || '—'}
                                                </span>
                                              </td>
                                              <td>
                                                {obs.ageAtDeath || obs.causeOfDeath
                                                  ? `${obs.ageAtDeath || ''} ${obs.causeOfDeath ? `(${obs.causeOfDeath})` : ''}`
                                                  : '—'}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Antenatal Examinations Section */}
                              <div className="card bg-base-100 border border-base-200">
                                <div className="card-body p-4">
                                  <div className="flex justify-between items-center mb-3">
                                    <h5 className="font-bold text-sm sm:text-base text-base-content">
                                      Antenatal Examinations ({exams.length})
                                    </h5>
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-outline btn-primary"
                                      onClick={() => handleEditRecord(record, index)}
                                    >
                                      + Add / Edit Exam
                                    </button>
                                  </div>

                                  {exams.length > 0 ? (
                                    <div className="space-y-3">
                                      {exams.map((exam, exIdx) => (
                                        <div key={exIdx} className="border border-base-200 rounded-lg p-3 bg-base-100">
                                          <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-base-200">
                                            <div className="flex items-center gap-2">
                                              <span className="font-bold text-xs text-base-content">
                                                Examination #{exIdx + 1}
                                              </span>
                                              {exam.recordedByRole && getRoleBadge(exam.recordedByRole)}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-base-content/60">
                                              {exam.recordedByName && (
                                                <span>
                                                  By: <span className="font-semibold text-base-content">{exam.recordedByName}</span>
                                                </span>
                                              )}
                                              <span>•</span>
                                              <span>{exam.Date ? formatNigeriaDate(exam.Date) : 'No date'}</span>
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                                            <div><span className="text-base-content/60 block">Fundus:</span><span className="font-medium">{exam.heightOfFundus || '—'}</span></div>
                                            <div><span className="text-base-content/60 block">EGA:</span><span className="font-medium">{exam.EGA || '—'}</span></div>
                                            <div><span className="text-base-content/60 block">Presentation:</span><span className="font-medium">{exam.presentationAndLife || '—'}</span></div>
                                            <div><span className="text-base-content/60 block">PP to Brim:</span><span className="font-medium">{exam.relationOfPPToBrim || '—'}</span></div>
                                            <div><span className="text-base-content/60 block">Foetal Heart:</span><span className="font-medium">{exam.foetalHeart || '—'}</span></div>
                                            <div><span className="text-base-content/60 block">Urine:</span><span className="font-medium">{exam.urine || '—'}</span></div>
                                            <div><span className="text-base-content/60 block">Weight:</span><span className="font-medium">{exam.weight ? `${exam.weight} kg` : '—'}</span></div>
                                            <div><span className="text-base-content/60 block">BP:</span><span className="font-medium">{exam.bloodPressure || '—'}</span></div>
                                            <div><span className="text-base-content/60 block">Next Visit:</span><span className="font-medium">{exam.nextVisit ? `${exam.nextVisit} wk` : '—'}</span></div>
                                            <div><span className="text-base-content/60 block">Signature:</span><span className="font-medium">{exam.signature || exam.recordedByName || '—'}</span></div>
                                          </div>
                                          {exam.remark && (
                                            <div className="mt-2 text-xs bg-base-200/40 p-2 rounded">
                                              <span className="font-semibold text-base-content/70">Remark: </span>
                                              <span className="text-base-content/90">{exam.remark}</span>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-base-content/60">No examination entries for this record.</p>
                                  )}
                                </div>
                              </div>

                              {/* Treatment Plan Section (Prescriptions & Lab Investigations) */}
                              <div className="card bg-base-100 border border-base-200">
                                <div className="card-body p-4">
                                  <h5 className="font-bold text-sm sm:text-base text-base-content mb-3">
                                    Treatment Plan & Orders (Antenatal)
                                  </h5>

                                  {loadingTreatmentData ? (
                                    <div className="flex justify-center py-4"><div className="loading loading-spinner loading-sm" /></div>
                                  ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                                      {/* Lab Investigations */}
                                      <div className="border border-base-200 rounded-lg p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                          <h6 className="font-semibold text-base-content flex items-center gap-1.5">
                                            <span>📋 Lab Investigations ({labRequests.length})</span>
                                          </h6>
                                          {labResults.length > 0 && (
                                            <button
                                              type="button"
                                              className="btn btn-xs btn-ghost text-primary"
                                              onClick={() => setShowAllLabHistory(!showAllLabHistory)}
                                            >
                                              {showAllLabHistory ? 'Hide All Labs' : `All Patient Labs (${labResults.length})`}
                                            </button>
                                          )}
                                        </div>

                                        {labRequests.length > 0 ? (
                                          <div className="space-y-2.5 max-h-72 overflow-y-auto">
                                            {labRequests.map((lab) => {
                                              const matchedResult = getLabResultForRequest(lab);
                                              const isCompleted = lab.status === 'completed' || !!matchedResult;

                                              return (
                                                <div key={lab._id || lab.id} className="bg-base-200/40 p-2.5 rounded-lg border border-base-200 space-y-1.5">
                                                  <div className="flex justify-between items-start gap-1">
                                                    <div>
                                                      <span className="font-bold text-base-content block">
                                                        {(lab.tests || []).map(t => t.name || t).join(', ') || 'Investigation'}
                                                      </span>
                                                      <span className="text-base-content/50 text-[10px]">
                                                        Ordered: {lab.createdAt ? formatNigeriaDate(lab.createdAt) : 'N/A'}
                                                      </span>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                                      <span className={`badge badge-xs ${isCompleted ? 'badge-success' : 'badge-info'}`}>
                                                        {isCompleted ? 'completed' : (lab.status || 'ordered')}
                                                      </span>
                                                      {matchedResult && (
                                                        <span className="badge badge-xs badge-outline badge-success">
                                                          ✓ Result Ready
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>

                                                  {/* Result Preview if available */}
                                                  {matchedResult && (
                                                    <div className="p-2 bg-base-100 rounded border border-base-200 space-y-1 text-[11px]">
                                                      <div className="flex justify-between items-center text-primary font-semibold">
                                                        <span className="flex items-center gap-1"><FaFlask className="text-[10px]" /> Result Preview</span>
                                                        <span className="text-[10px] text-base-content/50">
                                                          {matchedResult.labTechnicianName || 'Laboratory'}
                                                        </span>
                                                      </div>
                                                      {Array.isArray(matchedResult.result) && matchedResult.result.length > 0 && (
                                                        <div className="grid grid-cols-2 gap-1 py-0.5">
                                                          {matchedResult.result.slice(0, 4).map((r, rIdx) => (
                                                            <div key={rIdx} className="bg-base-200/50 px-1.5 py-0.5 rounded text-[10px] flex justify-between">
                                                              <span className="text-base-content/70">{r.code || r.name}:</span>
                                                              <span className="font-bold text-base-content">{r.value}</span>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      )}
                                                      {(matchedResult.remarks || matchedResult.form?.remarks) && (
                                                        <p className="text-[10px] text-base-content/70 italic">
                                                          &ldquo;{matchedResult.remarks || matchedResult.form.remarks}&rdquo;
                                                        </p>
                                                      )}
                                                      <div className="pt-1 flex items-center gap-2">
                                                        <button
                                                          type="button"
                                                          className="btn btn-xs btn-primary gap-1"
                                                          onClick={() => {
                                                            setSelectedLabResultForModal(matchedResult);
                                                            setIsLabResultModalOpen(true);
                                                          }}
                                                        >
                                                          <FaEye className="text-[10px]" /> View Full Result
                                                        </button>
                                                        {Array.isArray(matchedResult.attachments) && matchedResult.attachments.length > 0 && (
                                                          <span className="text-[10px] text-base-content/60">
                                                            📎 {matchedResult.attachments.length} file{matchedResult.attachments.length > 1 ? 's' : ''}
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <p className="text-base-content/50 py-2">No investigations ordered for this antenatal record.</p>
                                        )}

                                        {/* All Patient Labs History Drawer for Nurses */}
                                        {showAllLabHistory && labResults.length > 0 && (
                                          <div className="mt-3 p-3 bg-base-200/50 rounded-lg border border-base-200 space-y-2">
                                            <div className="flex items-center justify-between">
                                              <span className="font-bold text-xs uppercase tracking-wider text-base-content/70 flex items-center gap-1">
                                                <FaFlask className="text-xs text-primary" /> All Patient Lab Results ({labResults.length})
                                              </span>
                                              <button
                                                type="button"
                                                className="btn btn-ghost btn-xs text-base-content/60"
                                                onClick={() => setShowAllLabHistory(false)}
                                              >
                                                ✕
                                              </button>
                                            </div>
                                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                                              {labResults.map((result, idx) => (
                                                <div
                                                  key={result._id || idx}
                                                  className="p-2 bg-base-100 rounded border border-base-200 flex items-center justify-between gap-2 text-xs"
                                                >
                                                  <div className="min-w-0">
                                                    <p className="font-semibold text-base-content truncate">
                                                      {result.investigationName || result.testName || result.name || 'Lab Result'}
                                                    </p>
                                                    <p className="text-[10px] text-base-content/60">
                                                      {result.createdAt ? formatNigeriaDate(result.createdAt) : ''}
                                                    </p>
                                                  </div>
                                                  <button
                                                    type="button"
                                                    className="btn btn-xs btn-outline btn-primary shrink-0 gap-1"
                                                    onClick={() => {
                                                      setSelectedLabResultForModal(result);
                                                      setIsLabResultModalOpen(true);
                                                    }}
                                                  >
                                                    <FaEye className="text-[10px]" /> View
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* Prescriptions */}
                                      <div className="border border-base-200 rounded-lg p-3 space-y-2">
                                        <h6 className="font-semibold text-base-content flex items-center justify-between">
                                          <span>💊 Prescriptions ({prescriptions.length})</span>
                                        </h6>
                                        {prescriptions.length > 0 ? (
                                          <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {prescriptions.map((p) => (
                                              <div key={p._id || p.id} className="bg-base-200/40 p-2 rounded">
                                                <div className="flex justify-between items-center">
                                                  <span className="font-medium">
                                                    {(p.medications || []).map(m => m.drugName).join(', ') || 'Medication'}
                                                  </span>
                                                  <span className="badge badge-xs badge-success">{p.status || 'active'}</span>
                                                </div>
                                                <span className="text-base-content/50 text-[10px]">
                                                  {p.createdAt ? formatNigeriaDate(p.createdAt) : ''}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-base-content/50 py-2">No prescriptions ordered for this antenatal record.</p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Footer Edit Record Button */}
                              <div className="flex justify-end pt-2">
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm gap-2"
                                  onClick={() => handleEditRecord(record, index)}
                                >
                                  ✏️ Edit Full Ante-Natal Record
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
      </div>

      <LabResultDetailsModal
        isOpen={isLabResultModalOpen}
        onClose={() => {
          setIsLabResultModalOpen(false);
          setSelectedLabResultForModal(null);
        }}
        labResult={selectedLabResultForModal}
      />
    </NurseLayout>
  );
};

export default NurseAntenatalRecords;
