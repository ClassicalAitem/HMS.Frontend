import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Header } from '@/components/common';
import Sidebar from '@/components/nurse/dashboard/Sidebar';
import { getPatientById } from '@/services/api/patientsAPI';
import { getAdmissionByPatientId } from '@/services/api/admissionApi';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';
import { getAllDependantsForPatient } from '@/services/api/dependantAPI';
import { formatNigeriaDate, formatNigeriaTime } from '@/utils/formatDateTimeUtils';
import toast from 'react-hot-toast';
import { FaBed } from 'react-icons/fa';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
          fullName: dep.fullName || `${dep.firstName || ''} ${dep.lastName || ''}`.trim(),
        }));
        if (mounted) setDependants(normalized);
      } catch {
        if (mounted) toast.error('Failed to load dependants');
      }
    };
    if (patientId) loadDependants();
    return () => { mounted = false; };
  }, [patientId]);

  // Fetch admissions
  useEffect(() => {
    let mounted = true;
    const loadAdmissions = async () => {
      try {
        setLoading(true);
        const [admRes, chargesRes] = await Promise.allSettled([
          getAdmissionByPatientId(patientId),
          getServiceCharges(),
        ]);

        // Build serviceChargeId -> admissionCovered[] lookup
        let coveredById = {};
        if (chargesRes.status === 'fulfilled') {
          const rawCharges = chargesRes.value?.data ?? chargesRes.value ?? [];
          const chargesList = Array.isArray(rawCharges) ? rawCharges : (rawCharges?.data ?? []);
          chargesList.forEach((c) => {
            const id = c?._id || c?.id;
            if (id) coveredById[id] = Array.isArray(c?.admissionCovered) ? c.admissionCovered : [];
          });
        }

        if (admRes.status !== 'fulfilled') throw admRes.reason;
        const rawData = admRes.value?.data ?? admRes.value;
        let list = [];
        if (Array.isArray(rawData)) {
          list = rawData;
        } else if (rawData && typeof rawData === 'object' && Object.keys(rawData).length > 0) {
          list = [rawData];
        }
        // Sort by admission date descending (newest first)
        const sorted = list.sort((a, b) =>
          new Date(b?.admittedAt || b?.createdAt || 0).getTime() - new Date(a?.admittedAt || a?.createdAt || 0).getTime()
        );
        // Attach admissionCovered onto each admission item via its serviceChargeId
        const withCovered = sorted.map((a) => ({
          ...a,
          admissions: (a?.admissions || []).map((item) => ({
            ...item,
            admissionCovered: coveredById[item?.serviceChargeId] || [],
          })),
        }));
        const scoped = isViewingDependant
          ? withCovered.filter(a => a?.dependantId === dependantId)
          : withCovered.filter(a => !a?.dependantId);
        if (mounted) setAdmissions(scoped);
      } catch (err) {
        console.error('Failed to load admissions:', err);
        if (mounted) setAdmissions([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (patientId) loadAdmissions();
    return () => { mounted = false; };
  }, [patientId, isViewingDependant, dependantId]);

  // Format admission rows
  const admissionRows = useMemo(() => (
    Array.isArray(admissions)
      ? admissions.map((a) => {
          const items = Array.isArray(a.admissions) ? a.admissions : [];
          const totalPrice = items.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
          return {
            _id: a._id || a.id,
            forName: subjectName,
            ward: a.ward || '—',
            status: a.status || 'active',
            isBilled: !!a.isBilled,
            itemsCount: items.length,
            items,
            totalPrice,
            date: formatNigeriaDate(a.admittedAt || a.createdAt),
            time: formatNigeriaTime(a.admittedAt || a.createdAt),
          };
        })
      : []
  ), [admissions, subjectName]);

  // Pagination
  const paginationData = useMemo(() => {
    const totalItems = admissionRows.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedItems = admissionRows.slice(startIdx, startIdx + itemsPerPage);
    return { paginatedItems, totalPages, totalItems };
  }, [admissionRows, currentPage]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex min-h-screen w-full">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeSidebar} />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[280px] transform transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-5 lg:p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-secondary/10 p-3 rounded-full text-secondary">
                    <FaBed className="w-6 h-6" />
                  </div>
                  <h1 className="text-2xl font-bold text-base-content">Admission History</h1>
                </div>
                <p className="text-base-content/70">
                  {isViewingDependant ? 'Dependant' : 'Patient'}: {subjectName}
                  {isViewingDependant && (
                    <span className="text-sm ml-1">
                      (of {patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim()})
                    </span>
                  )}
                </p>
              </div>
              <button
                className="btn btn-outline"
                onClick={() => navigate(`/dashboard/nurse/patient/${patientId}`, {
                  state: { dependantId, dependantSnapshot, from: fromIncoming ? 'incoming' : undefined }
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
              <div className="card-body p-6">
                <div className="overflow-x-auto">
                  <table className="table w-full text-center">
                    <thead>
                      <tr>
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
                                <span className="text-base-content/70">{row.time}</span>
                              </div>
                            </td>
                            <td>
                              <span className={statusBadgeClass(row.status)}>{row.status}</span>
                            </td>
                            <td className="text-sm text-left">
                              {row.itemsCount === 0 ? (
                                '—'
                              ) : (
                                <div className="space-y-2">
                                  {row.items.map((item, i) => (
                                    <div key={item._id || i}>
                                      <span className="font-medium">{item.name}</span>
                                      {Array.isArray(item.admissionCovered) && item.admissionCovered.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
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
                          <td colSpan={6} className="py-6 text-base-content/70">
                            No admissions found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {paginationData.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-base-200">
                    <span className="text-sm text-base-content/70">
                      Page {currentPage} of {paginationData.totalPages} (
                      {paginationData.totalItems} total)
                    </span>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-sm btn-outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      >
                        Previous
                      </button>
                      {Array.from({
                        length: Math.min(paginationData.totalPages, 5),
                      }).map((_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            className={`btn btn-sm ${
                              currentPage === page ? 'btn-active' : 'btn-outline'
                            }`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        className="btn btn-sm btn-outline"
                        disabled={currentPage === paginationData.totalPages}
                        onClick={() =>
                          setCurrentPage(p =>
                            Math.min(paginationData.totalPages, p + 1)
                          )
                        }
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
      </div>
    </div>
  );
};

export default ViewAllPatientAdmissions;