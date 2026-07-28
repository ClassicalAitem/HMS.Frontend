import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Header } from '@/components/common';
import Sidebar from '@/components/medical-director/dashboard/Sidebar';
import { getPatientById } from '@/services/api/patientsAPI';
import { getAllDependantsForPatient } from '@/services/api/dependantAPI';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';
import toast from 'react-hot-toast';
import { FaHospital } from 'react-icons/fa';
import { getAdmissionByPatientId } from '@/services/api/admissionApi';

const ViewAllAdmissions = () => {
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
  const [subject, setSubject] = useState(dependantSnapshot);
  const [admissions, setAdmissions] = useState([]);
  const [dependants, setDependants] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const patientName = useMemo(() => (
    patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim()
  ), [patient]);

  const subjectName = useMemo(() => {
    if (!isViewingDependant) return patientName;
    return subject?.fullName || `${subject?.firstName || ""} ${subject?.lastName || ""}`.trim() || 'Dependant';
  }, [isViewingDependant, subject, patientName]);

  // Fetch patient data (always needed for the guardian record / header)
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

  // Fetch dependants (used to resolve names for OTHER dependants' rows
  // when we're looking at the patient's full list, and as a fallback
  // if no snapshot was passed in for the active dependant)
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
        if (mounted) {
          setDependants(normalized);
          if (isViewingDependant && !dependantSnapshot) {
            const match = normalized.find(d => d.id === dependantId);
            if (match) setSubject(match);
          }
        }
      } catch {
        if (mounted) toast.error('Failed to load dependants');
      }
    };
    if (patientId) loadDependants();
    return () => { mounted = false; };
  }, [patientId, isViewingDependant, dependantId, dependantSnapshot]);

  // Fetch admissions
  useEffect(() => {
    let mounted = true;
    const loadAdmissions = async () => {
      try {
        setLoading(true);
        const res = await getAdmissionByPatientId(patientId);
        const raw = res?.data ?? res ?? [];
        let list = Array.isArray(raw) ? raw : [];
        // Scope to the subject we actually navigated in for
        list = list.filter(a =>
          isViewingDependant ? a.dependantId === dependantId : !a.dependantId
        );
        if (mounted) setAdmissions(list);
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
          const isDependant = !!a.dependantId;
          const targetName = isDependant
            ? (isViewingDependant && a.dependantId === dependantId
                ? subjectName
                : dependants.find(d => d.id === a.dependantId)?.fullName || 'Unknown')
            : patientName;

          const itemsCount = a.admissions?.length || 0;
          const itemsSummary = a.admissions
            ? a.admissions.slice(0, 2).map(item => item.name || 'Item')
            : [];

          const totalPrice = a.admissions
            ? a.admissions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
            : 0;

          return {
            _id: a._id,
            forName: targetName,
            isForDependant: isDependant,
            status: a.status || 'active',
            ward: a.ward || '—',
            itemsCount,
            itemsSummary,
            date: formatNigeriaDate(a.createdAt),
            totalPrice,
            admissions: a.admissions || [],
            createdAt: a.createdAt,
          };
        })
      : []
  ), [admissions, dependants, patientName, isViewingDependant, dependantId, subjectName]);
  // ... rest (pagination, JSX) stays the same, just swap patientName -> subjectName in the header display

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

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'badge-success';
      case 'discharged':
        return 'badge-ghost';
      case 'cancelled':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  };

  return (
    <div className="flex h-screen">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-primary/10 p-3 rounded-full text-primary">
                    <FaHospital className="w-6 h-6" />
                  </div>
                  <h1 className="text-2xl font-bold text-base-content">Admission History</h1>
                </div>
                <p className="text-base-content/70">
                  Patient: {subjectName}
                </p>
              </div>
              <button
                className="btn btn-outline"
                onClick={() => navigate(`/dashboard/medical-director/medical-history/${patientId}`)}
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
                  <table className="table w-full text-center text-sm">
                    <thead>
                      <tr>
                        <th className="font-bold text-base">Patient Type</th>
                        <th className="font-bold text-base">Ward</th>
                        <th className="font-bold text-base">Status</th>
                        <th className="font-bold text-base">Items Count</th>
                        <th className="font-bold text-base">Created At</th>
                        <th className="font-bold text-base">Items</th>
                        <th className="font-bold text-base">Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginationData.paginatedItems.length > 0 ? (
                        paginationData.paginatedItems.map((row, idx) => (
                          <tr key={idx} className="hover">
                            <td className="py-3">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-bold text-sm text-base-content">
                                  {row.forName}
                                </span>
                                <span
                                  className={`badge badge-sm ${
                                    row.isForDependant ? 'badge-secondary' : 'badge-primary'
                                  }`}
                                >
                                  {row.isForDependant ? 'Dependant' : 'Patient'}
                                </span>
                              </div>
                            </td>
                            <td className="font-semibold text-sm">{row.ward}</td>
                            <td>
                              <span className={`badge font-semibold ${getStatusBadge(row.status)}`}>
                                {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                              </span>
                            </td>
                            <td className="font-bold text-sm">{row.itemsCount}</td>
                            <td className="font-semibold text-sm">{row.date}</td>
                            <td className="text-left">
                              <ul className="list-disc list-inside text-sm font-medium">
                                {row.itemsSummary.map((item, i) => (
                                  <li key={i} className="text-base-content">{item}</li>
                                ))}
                                {row.itemsCount > 2 && <li className="text-base-content/60">...</li>}
                              </ul>
                            </td>
                            <td className="font-medium text-primary text-sm">
                              {row.totalPrice ? `₦${Number(row.totalPrice).toLocaleString()}` : '—'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-6 text-base-content/70">
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

export default ViewAllAdmissions;