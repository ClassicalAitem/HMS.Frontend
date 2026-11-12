import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { NurseLayout } from '@/layouts/nurse';
import { getPatientById } from '@/services/api/patientsAPI';
import { getVitalsByPatient } from '@/services/api/vitalsAPI';
import { getAllDependantsForPatient } from '@/services/api/dependantAPI';
import { formatNigeriaDate, formatNigeriaTime } from '@/utils/formatDateTimeUtils';
import toast from 'react-hot-toast';
import { FaHeartbeat } from 'react-icons/fa';
import KolakLoader from '@/components/common/KolakLoader';

const ViewAllPatientVitals = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dependantId = location?.state?.dependantId || null;
  const dependantSnapshot = location?.state?.dependantSnapshot || null;
  const isViewingDependant = !!dependantId;

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [dependants, setDependants] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const subjectName = useMemo(() => {
    if (isViewingDependant) {
      return dependantSnapshot?.fullName
        || `${dependantSnapshot?.firstName || ''} ${dependantSnapshot?.lastName || ''}`.trim()
        || 'Dependant';
    }
    return patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim();
  }, [patient, isViewingDependant, dependantSnapshot]);

  // Load all required data in parallel
  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      try {
        setLoading(true);
        const [patientRes, dependantsRes, vitalsRes] = await Promise.allSettled([
          getPatientById(patientId),
          getAllDependantsForPatient(patientId),
          getVitalsByPatient(patientId)
        ]);

        if (mounted) {
          if (patientRes.status === 'fulfilled') {
            setPatient(patientRes.value?.data ?? patientRes.value);
          }
          if (dependantsRes.status === 'fulfilled') {
            const raw = dependantsRes.value?.data?.data?.dependants ?? dependantsRes.value?.data?.dependants ?? dependantsRes.value?.data ?? [];
            const normalized = (Array.isArray(raw) ? raw : []).map(dep => ({
              ...dep,
              id: dep.id || dep._id,
              fullName: dep.fullName || `${dep.firstName || ""} ${dep.lastName || ""}`.trim(),
            }));
            setDependants(normalized);
          }
          if (vitalsRes.status === 'fulfilled') {
            const rawData = vitalsRes.value?.data ?? vitalsRes.value ?? [];
            const vitalsList = Array.isArray(rawData) ? rawData : [];
            const sorted = vitalsList.sort((a, b) => 
              new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
            );
            const scoped = isViewingDependant
              ? sorted.filter(v => String(v.dependantId) === String(dependantId))
              : sorted.filter(v => !v.dependantId);
            setVitals(scoped);
          } else {
            setVitals([]);
          }
        }
      } catch (err) {
        console.error('Failed to load vitals history:', err);
        if (mounted) toast.error('Failed to load vitals');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (patientId) loadAll();
    return () => { mounted = false; };
  }, [patientId, isViewingDependant, dependantId]);

  // Format vital rows
  const vitalRows = useMemo(() => (
    Array.isArray(vitals)
      ? vitals.map((vital) => {
          let resolvedNurseName = 'Unknown Nurse';
          if (vital.nurseName) resolvedNurseName = vital.nurseName;
          else if (vital.nurse && vital.nurse.firstName) resolvedNurseName = `${vital.nurse.firstName} ${vital.nurse.lastName || ''}`.trim();
          else if (vital.nurse && vital.nurse.fullName) resolvedNurseName = vital.nurse.fullName;

          return {
            _id: vital._id || vital.id,
            forName: subjectName,
            nurseName: resolvedNurseName,
            bp: vital.bp || '—',
            pulse: vital.pulse || '—',
            temperature: vital.temperature || '—',
            weight: vital.weight || '—',
            height: vital.height || '—',
            spo2: vital.spo2 || vital.oxygen || '—',
            respiratoryRate: vital.respiratoryRate || '—',
            date: formatNigeriaDate(vital.createdAt),
            time: formatNigeriaTime(vital.createdAt),
            createdAt: vital.createdAt,
          };
        })
      : []
  ), [vitals, subjectName]);

  const paginationData = useMemo(() => {
    const totalItems = vitalRows.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedItems = vitalRows.slice(startIdx, startIdx + itemsPerPage);
    return { paginatedItems, totalPages, totalItems };
  }, [vitalRows, currentPage]);

  return (
    <NurseLayout>
      {loading && <KolakLoader fullscreen />}

      <div className="flex flex-col gap-4 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-success/10 p-2.5 rounded-xl text-success">
                <FaHeartbeat className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-base-content">Vitals History</h1>
            </div>
            <p className="text-xs sm:text-sm text-base-content/70">
              {isViewingDependant ? 'Dependant' : 'Patient'}: <span className="font-semibold text-base-content">{subjectName}</span>
              {isViewingDependant && (
                <span className="text-xs ml-1 text-base-content/60">
                  (of {patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim()})
                </span>
              )}
            </p>
          </div>
          <button
            className="btn btn-outline btn-sm rounded-xl font-medium"
            onClick={() => navigate(`/dashboard/nurse/patient/${patientId}`, {
              state: { dependantId, dependantSnapshot }
            })}
          >
            Back
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <KolakLoader />
          </div>
        ) : (
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-4 sm:p-6 min-w-0">
              <div className="overflow-x-auto w-full min-w-0">
                <table className="table w-full text-center">
                  <thead>
                    <tr className="bg-base-200/50">
                      <th>Type</th>
                      <th>Recorded by</th>
                      <th>Date &amp; Time</th>
                      <th>B.P</th>
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
                          <td className="py-3 font-medium text-base-content">{row.forName}</td>
                          <td className="text-sm">{row.nurseName}</td>
                          <td className="text-sm">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">{row.date}</span>
                              <span className="text-base-content/70 text-xs">{row.time}</span>
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
                        <td colSpan={9} className="py-8 text-base-content/60">
                          No vitals found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {paginationData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-base-200">
                  <span className="text-xs sm:text-sm text-base-content/70">
                    Page {currentPage} of {paginationData.totalPages} ({paginationData.totalItems} total)
                  </span>
                  <div className="join">
                    <button
                      className="join-item btn btn-sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(paginationData.totalPages, 5) }).map((_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          className={`join-item btn btn-sm ${currentPage === page ? 'btn-primary' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      className="join-item btn btn-sm"
                      disabled={currentPage === paginationData.totalPages}
                      onClick={() => setCurrentPage(p => Math.min(paginationData.totalPages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </NurseLayout>
  );
};

export default ViewAllPatientVitals;
