import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Header } from '@/components/common';
import Sidebar from '@/components/doctor/dashboard/Sidebar';
import { getPatientById } from '@/services/api/patientsAPI';
import { usersAPI } from '@/services/api/usersAPI';
import { getVitalsByPatient } from '@/services/api/vitalsAPI';
import { getAllDependantsForPatient } from '@/services/api/dependantAPI';
import { formatNigeriaDate, formatNigeriaTime } from '@/utils/formatDateTimeUtils';
import toast from 'react-hot-toast';
import { FaHeartbeat, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { DoctorLayout } from '@/components/doctor/doctor';

const ViewAllVitals = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromIncoming = location?.state?.from === 'incoming';
  const dependantId = location?.state?.dependantId || null;
  const dependantSnapshot = location?.state?.dependantSnapshot || null;
  const isViewingDependant = !!dependantId;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [dependants, setDependants] = useState([]);
  const [nurseNameById, setNurseNameById] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const patientName = useMemo(() => (
    patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim()
  ), [patient]);

  // Fetch patient data
  useEffect(() => {
    let mounted = true;
    const loadPatient = async () => {
      try {
        const res = await getPatientById(patientId);
        const pData = res?.data ?? res;
        if (mounted) setPatient(pData);
      } catch (err) {
        console.error('Failed to load patient:', err);
        if (mounted) toast.error('Failed to load patient data');
      }
    };
    if (patientId) loadPatient();
    return () => { mounted = false; };
  }, [patientId]);

  // Fetch dependants
  useEffect(() => {
    let mounted = true;
    const loadDependants = async () => {
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
        if (mounted) toast.error('Failed to load dependants');
      }
    };
    if (patientId) loadDependants();
    return () => { mounted = false; };
  }, [patientId]);

  const subjectName = useMemo(() => {
    if (isViewingDependant) {
      return dependantSnapshot?.fullName
        || `${dependantSnapshot?.firstName || ''} ${dependantSnapshot?.lastName || ''}`.trim()
        || 'Dependant';
    }
    return patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim();
  }, [patient, isViewingDependant, dependantSnapshot]);

  // Fetch vitals
useEffect(() => {
  let mounted = true;
  const loadVitals = async () => {
    try {
      setLoading(true);
      const res = await getVitalsByPatient(patientId);
      const rawData = res?.data ?? res ?? [];
      const vitalsList = Array.isArray(rawData) ? rawData : [];
      const sorted = vitalsList.sort((a, b) =>
        new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
      );
      const scoped = isViewingDependant
        ? sorted.filter(v => v.dependantId === dependantId)
        : sorted.filter(v => !v.dependantId);
      if (mounted) setVitals(scoped);
    } catch (err) {
      console.error('Failed to load vitals:', err);
      if (mounted) setVitals([]);
    } finally {
      if (mounted) setLoading(false);
    }
  };

  if (patientId) loadVitals();
  return () => { mounted = false; };
}, [patientId, isViewingDependant, dependantId]);

  // Format vital rows
  const vitalRows = useMemo(() => (
    Array.isArray(vitals)
      ? vitals.map((vital) => {
          const nurseId = vital.nurseId || vital.nurse?.id || vital.nurse?._id || vital.createdBy;
          return {
            _id: vital._id || vital.id,
            forName: subjectName,
            isForDependant: isViewingDependant,
            nurseName: vital.nurseName || (nurseId ? (nurseNameById[nurseId] || 'Unknown Nurse') : 'Unknown Nurse'),
            bp: vital.bp || '—',
            pulse: vital.pulse || '—',
            temperature: vital.temperature || '—',
            weight: vital.weight || '—',
            height: vital.height || '—',
            respiratoryRate: vital.respiratoryRate || '—',
            date: formatNigeriaDate(vital.createdAt),
            time: formatNigeriaTime(vital.createdAt),
            createdAt: vital.createdAt,
          };
        })
      : []
  ), [vitals, subjectName, isViewingDependant, nurseNameById]);

  // Helper: normalize user API response
  const normalizeUserResponse = (response) => {
    if (response?.data?.data) return response.data.data;
    if (response?.data) return response.data;
    return response;
  };

  // Load nurse names for vitals
  useEffect(() => {
    const loadNurses = async () => {
      if (!Array.isArray(vitals) || vitals.length === 0) return;
      const ids = new Set();
      vitals.forEach((v) => {
        const id = v.nurseId || v.nurse?.id || v.nurse?._id || v.createdBy;
        if (id && !nurseNameById[id]) ids.add(id);
      });
      if (ids.size === 0) return;
      try {
        const responses = await Promise.allSettled(Array.from(ids).map(id => usersAPI.getUserById(id)));
        const newNames = {};
        Array.from(ids).forEach((id, idx) => {
          const res = responses[idx];
          if (res?.status === 'fulfilled') {
            const userData = normalizeUserResponse(res.value);
            newNames[id] = userData?.fullName || `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Unknown Nurse';
          } else {
            newNames[id] = 'Unknown Nurse';
          }
        });
        setNurseNameById(prev => ({ ...prev, ...newNames }));
      } catch (e) {
        console.error('Failed loading nurse names', e);
      }
    };
    loadNurses();
  }, [vitals]);

  // Pagination
  const paginationData = useMemo(() => {
    const totalItems = vitalRows.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedItems = vitalRows.slice(startIdx, startIdx + itemsPerPage);
    return { paginatedItems, totalPages, totalItems };
  }, [vitalRows, currentPage]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Compact page-number list so pagination doesn't overflow small screens
  const getVisiblePages = () => {
    const total = paginationData.totalPages;
    const maxVisible = 3;
    if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1);
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(total, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
   <DoctorLayout>


      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20 min-w-0">
       
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="bg-success/10 p-2 sm:p-3 rounded-full text-success shrink-0">
                    <FaHeartbeat className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-base-content">Vitals History</h1>
                </div>
                <p className="text-sm sm:text-base text-base-content/70">
                  {isViewingDependant ? 'Dependant' : 'Patient'}: {subjectName}
                  {isViewingDependant && (
                    <span className="text-xs sm:text-sm ml-1">
                      (of {patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim()})
                    </span>
                  )}
                </p>
              </div>
              <button
                className="btn btn-outline btn-sm sm:btn-md w-full sm:w-auto"
                onClick={() => navigate(`/dashboard/doctor/medical-history/${patientId}`, {
                  state: {
                    from: fromIncoming ? 'incoming' : 'patients',
                    patientSnapshot: patient,
                    dependantId,
                    dependantSnapshot,
                  }
                })}
              >
                Back
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          ) : (
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-3 sm:p-6">

                {/* ---------- Mobile: stacked cards (below sm) ---------- */}
                <div className="flex flex-col gap-3 sm:hidden">
                  {paginationData.paginatedItems.length > 0 ? (
                    paginationData.paginatedItems.map((row, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-base-200 p-3 bg-base-100"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-base-content truncate">
                              {row.forName}
                            </p>
                            <span
                              className={`badge badge-xs mt-1 ${
                                row.isForDependant ? 'badge-secondary' : 'badge-primary'
                              }`}
                            >
                              {row.isForDependant ? 'Dependant' : 'Patient'}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-medium">{row.date}</p>
                            <p className="text-xs text-base-content/70">{row.time}</p>
                          </div>
                        </div>

                        <p className="text-xs text-base-content/70 mb-2">
                          Recorded by <span className="font-medium text-base-content">{row.nurseName}</span>
                        </p>

                        <div className="grid grid-cols-3 gap-x-2 gap-y-2 text-xs">
                          <div>
                            <p className="text-base-content/60">BP</p>
                            <p className="font-semibold">{row.bp} <span className="text-base-content/50">mmHg</span></p>
                          </div>
                          <div>
                            <p className="text-base-content/60">Pulse</p>
                            <p className="font-semibold">{row.pulse} <span className="text-base-content/50">bpm</span></p>
                          </div>
                          <div>
                            <p className="text-base-content/60">Temp</p>
                            <p className="font-semibold">{row.temperature} <span className="text-base-content/50">°F</span></p>
                          </div>
                          <div>
                            <p className="text-base-content/60">Weight</p>
                            <p className="font-semibold">{row.weight} <span className="text-base-content/50">kg</span></p>
                          </div>
                          <div>
                            <p className="text-base-content/60">Height</p>
                            <p className="font-semibold">{row.height} <span className="text-base-content/50">cm</span></p>
                          </div>
                          <div>
                            <p className="text-base-content/60">Resp. Rate</p>
                            <p className="font-semibold">{row.respiratoryRate} <span className="text-base-content/50">bpm</span></p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-6 text-center text-base-content/70 text-sm">No vitals found</p>
                  )}
                </div>

                {/* ---------- Desktop/tablet: table (sm and up) ---------- */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="table w-full text-center">
                    <thead>
                      <tr>
                        <th>Patient Type</th>
                        <th>Recorded by</th>
                        <th>Date & Time</th>
                        <th>Blood Pressure</th>
                        <th>Heart Rate</th>
                        <th>Temperature</th>
                        <th>Weight</th>
                        <th>Height</th>
                        <th>Respiratory Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginationData.paginatedItems.length > 0 ? (
                        paginationData.paginatedItems.map((row, idx) => (
                          <tr key={idx} className="hover">
                            <td className="py-3">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-medium text-base-content">{row.forName}</span>
                                <span className={`badge badge-sm ${row.isForDependant ? 'badge-secondary' : 'badge-primary'}`}>
                                  {row.isForDependant ? 'Dependant' : 'Patient'}
                                </span>
                              </div>
                            </td>

                            <td className="text-sm">{row.nurseName || 'Unknown Nurse'}</td>

                            <td className="text-sm">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium">{row.date}</span>
                                <span className="text-base-content/70">{row.time}</span>
                              </div>
                            </td>

                            <td>
                              {row.bp} <span className="text-xs text-base-content/70">mmHg</span>
                            </td>
                            <td>
                              {row.pulse} <span className="text-xs text-base-content/70">bpm</span>
                            </td>
                            <td>
                              {row.temperature} <span className="text-xs text-base-content/70">°F</span>
                            </td>
                            <td>
                              {row.weight} <span className="text-xs text-base-content/70">kg</span>
                            </td>
                            <td>
                              {row.height} <span className="text-xs text-base-content/70">cm</span>
                            </td>
                            <td>
                              {row.respiratoryRate} <span className="text-xs text-base-content/70">bpm</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-6 text-base-content/70">No vitals found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ---------- Pagination ---------- */}
                {paginationData.totalPages > 1 && (
                  <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-base-200 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs sm:text-sm text-base-content/70 text-center sm:text-left">
                      Page {currentPage} of {paginationData.totalPages} (
                      {paginationData.totalItems} total)
                    </span>
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <button
                        className="btn btn-xs sm:btn-sm btn-outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        aria-label="Previous page"
                      >
                        <FaChevronLeft className="sm:hidden w-3 h-3" />
                        <span className="hidden sm:inline">Previous</span>
                      </button>
                      {getVisiblePages().map((page) => (
                        <button
                          key={page}
                          className={`btn btn-xs sm:btn-sm ${
                            currentPage === page ? 'btn-active' : 'btn-outline'
                          }`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        className="btn btn-xs sm:btn-sm btn-outline"
                        disabled={currentPage === paginationData.totalPages}
                        onClick={() =>
                          setCurrentPage(p =>
                            Math.min(paginationData.totalPages, p + 1)
                          )
                        }
                        aria-label="Next page"
                      >
                        <FaChevronRight className="sm:hidden w-3 h-3" />
                        <span className="hidden sm:inline">Next</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
       </DoctorLayout>

  );
};

export default ViewAllVitals;