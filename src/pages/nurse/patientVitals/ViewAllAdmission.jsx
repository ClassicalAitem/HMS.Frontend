import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { NurseLayout } from '@/layouts/nurse';
import { getPatientById } from '@/services/api/patientsAPI';
import { getAdmissionByPatientId } from '@/services/api/admissionApi';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';
import { getAllDependantsForPatient } from '@/services/api/dependantAPI';
import { formatNigeriaDate, formatNigeriaTime } from '@/utils/formatDateTimeUtils';
import toast from 'react-hot-toast';
import { FaBed } from 'react-icons/fa';
import KolakLoader from '@/components/common/KolakLoader';

const statusBadgeClass = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('active')) return 'badge badge-success';
  if (s.includes('discharge')) return 'badge badge-neutral';
  if (s.includes('pending') || s.includes('wait')) return 'badge badge-warning';
  return 'badge badge-ghost';
};

const ViewAllPatientAdmissions = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromIncoming = location?.state?.from === 'incoming';
  const dependantId = location?.state?.dependantId || null;
  const dependantSnapshot = location?.state?.dependantSnapshot || null;
  const isViewingDependant = !!dependantId;

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [admissions, setAdmissions] = useState([]);
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
        const [patientRes, dependantsRes, admRes, chargesRes] = await Promise.allSettled([
          getPatientById(patientId),
          getAllDependantsForPatient(patientId),
          getAdmissionByPatientId(patientId),
          getServiceCharges(),
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
              fullName: dep.fullName || `${dep.firstName || ''} ${dep.lastName || ''}`.trim(),
            }));
            setDependants(normalized);
          }

          let coveredById = {};
          if (chargesRes.status === 'fulfilled') {
            const rawCharges = chargesRes.value?.data ?? chargesRes.value ?? [];
            const chargesList = Array.isArray(rawCharges) ? rawCharges : (rawCharges?.data ?? []);
            chargesList.forEach((c) => {
              if (c._id && Array.isArray(c.admissionCovered) && c.admissionCovered.length > 0) {
                coveredById[String(c._id)] = c.admissionCovered;
              }
            });
          }

          if (admRes.status === 'fulfilled') {
            const rawData = admRes.value?.data ?? admRes.value ?? [];
            const admissionsList = Array.isArray(rawData) ? rawData : [];

            // Enrich items with admissionCovered
            const enriched = admissionsList.map((adm) => {
              const rawItems = Array.isArray(adm.admissions) ? adm.admissions : [];
              const items = rawItems.map((item) => {
                const scId = item.serviceChargeId ? String(item.serviceChargeId) : null;
                const covered = scId && coveredById[scId] ? coveredById[scId] : (item.admissionCovered || []);
                return { ...item, admissionCovered: covered };
              });
              return { ...adm, admissions: items };
            });

            // Sort by date descending
            const sorted = enriched.sort(
              (a, b) => new Date(b?.admittedAt || b?.createdAt || 0).getTime() - new Date(a?.admittedAt || a?.createdAt || 0).getTime()
            );

            const scoped = isViewingDependant
              ? sorted.filter((a) => String(a.dependantId) === String(dependantId))
              : sorted.filter((a) => !a.dependantId);

            setAdmissions(scoped);
          } else {
            setAdmissions([]);
          }
        }
      } catch (err) {
        console.error('Failed to load admission history:', err);
        if (mounted) toast.error('Failed to load admission history');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (patientId) loadAll();
    return () => { mounted = false; };
  }, [patientId, isViewingDependant, dependantId]);

  // Format admission rows
  const admissionRows = useMemo(() => {
    if (!Array.isArray(admissions)) return [];
    return admissions.map((adm) => {
      const items = Array.isArray(adm.admissions) ? adm.admissions : [];
      return {
        _id: adm._id || adm.id,
        forName: subjectName,
        ward: adm.wardName || adm.ward?.name || adm.ward || 'General Ward',
        date: formatNigeriaDate(adm.admittedAt || adm.createdAt),
        time: formatNigeriaTime(adm.admittedAt || adm.createdAt),
        status: adm.status || 'Active',
        items,
        itemsCount: items.length,
        isBilled: !!adm.isBilled,
      };
    });
  }, [admissions, subjectName]);

  const paginationData = useMemo(() => {
    const totalItems = admissionRows.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedItems = admissionRows.slice(startIdx, startIdx + itemsPerPage);
    return { paginatedItems, totalPages, totalItems };
  }, [admissionRows, currentPage]);

  return (
    <NurseLayout>
      {loading && <KolakLoader fullscreen />}

      <div className="flex flex-col gap-4 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-secondary/10 p-2.5 rounded-xl text-secondary">
                <FaBed className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-base-content">Admission History</h1>
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
              state: { dependantId, dependantSnapshot, from: fromIncoming ? 'incoming' : undefined }
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
                      <th>For</th>
                      <th>Ward</th>
                      <th>Date &amp; Time</th>
                      <th>Status</th>
                      <th>Items</th>
                      <th>Billed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginationData.paginatedItems.length > 0 ? (
                      paginationData.paginatedItems.map((row) => (
                        <tr key={row._id} className="hover">
                          <td className="py-3 font-medium text-base-content">{row.forName}</td>
                          <td className="text-sm">{row.ward}</td>
                          <td className="text-sm">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">{row.date}</span>
                              <span className="text-base-content/70 text-xs">{row.time}</span>
                            </div>
                          </td>
                          <td>
                            <span className={statusBadgeClass(row.status)}>{row.status}</span>
                          </td>
                          <td className="text-sm text-left">
                            {row.itemsCount === 0 ? (
                              '—'
                            ) : (
                              <div className="space-y-1.5">
                                {row.items.map((item, i) => (
                                  <div key={item._id || i}>
                                    <span className="font-medium text-xs">{item.name}</span>
                                    {Array.isArray(item.admissionCovered) && item.admissionCovered.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-0.5">
                                        {item.admissionCovered.map((cond, ci) => (
                                          <span key={ci} className="badge badge-outline badge-xs">
                                            {cond}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${row.isBilled ? 'badge-success' : 'badge-warning'}`}>
                              {row.isBilled ? 'Billed' : 'Unbilled'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-base-content/60">
                          No admissions found
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

export default ViewAllPatientAdmissions;
