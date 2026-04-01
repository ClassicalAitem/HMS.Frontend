import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Header } from '@/components/common';
import Sidebar from '@/components/doctor/dashboard/Sidebar';
import { getPatientById } from '@/services/api/patientsAPI';
import { getInvestigationByPatientId } from '@/services/api/investigationAPI';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';
import { getAllDependantsForPatient } from '@/services/api/dependantAPI';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';
import toast from 'react-hot-toast';
import { FaFlask } from 'react-icons/fa';

const ViewAllInvestigations = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromIncoming = location?.state?.from === 'incoming';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [investigations, setInvestigations] = useState([]);
  const [dependants, setDependants] = useState([]);
  const [serviceCharges, setServiceCharges] = useState([]);
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

  // Fetch investigations
  useEffect(() => {
    let mounted = true;
    const loadInvestigations = async () => {
      try {
        setLoading(true);
        const res = await getInvestigationByPatientId(patientId);
        const rawData = res?.data ?? res ?? [];
        if (mounted) setInvestigations(Array.isArray(rawData) ? rawData : []);
      } catch (err) {
        console.error('Failed to load investigations:', err);
        if (mounted) setInvestigations([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (patientId) loadInvestigations();
    return () => { mounted = false; };
  }, [patientId]);

  // Fetch service charges
  useEffect(() => {
    let mounted = true;
    const loadServiceCharges = async () => {
      try {
        const res = await getServiceCharges();
        const rawData = res?.data ?? res;
        const list = Array.isArray(rawData) ? rawData : (rawData?.data ?? []);
        if (mounted) setServiceCharges(list);
      } catch (err) {
        console.error('Failed to load service charges:', err);
      }
    };
    loadServiceCharges();
    return () => { mounted = false; };
  }, []);

  // Helper to get lab investigation price
  const getLabInvestigationPrice = (testName) => {
    if (!testName) return 0;
    
    const testNameLower = testName.toLowerCase().trim();
    
    const exactMatch = serviceCharges.find(charge => {
      const chargeService = (charge?.service || '').toLowerCase().trim();
      const chargeName = (charge?.name || '').toLowerCase().trim();
      
      return chargeService === testNameLower || 
             chargeName === testNameLower ||
             chargeService.includes(testNameLower) ||
             chargeName.includes(testNameLower);
    });
    
    if (exactMatch) {
      return Number(exactMatch?.amount || exactMatch?.price || 0);
    }
    
    return 0;
  };

  // Format investigation rows
  const investigationRows = useMemo(() => (
    Array.isArray(investigations)
      ? investigations.map((inv) => {
          const isDependant = !!inv.dependantId;
          const targetName = isDependant
            ? dependants.find(d => d.id === inv.dependantId)?.fullName || 'Unknown'
            : patientName;

          const testsCount = inv.tests?.length || 0;
          const testsSummary = inv.tests
            ? inv.tests.slice(0, 2).map(t => typeof t === 'string' ? t : (t.name || 'Test'))
            : [];

          const totalPrice = inv.tests
            ? inv.tests.reduce((sum, test) => {
                const testName = typeof test === 'string' ? test : (test.name || 'Test');
                return sum + (getLabInvestigationPrice(testName) || 0);
              }, 0)
            : 0;

          return {
            _id: inv._id,
            forName: targetName,
            isForDependant: isDependant,
            status: inv.status || 'pending',
            type: inv.type || 'Lab',
            testsCount,
            testsSummary,
            date: formatNigeriaDate(inv.createdAt),
            totalPrice,
            tests: inv.tests || [],
            createdAt: inv.createdAt,
            priority: inv.priority || 'normal',
          };
        })
      : []
  ), [investigations, dependants, patientName, serviceCharges]);

  // Pagination
  const paginationData = useMemo(() => {
    const totalItems = investigationRows.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedItems = investigationRows.slice(startIdx, startIdx + itemsPerPage);
    return { paginatedItems, totalPages, totalItems };
  }, [investigationRows, currentPage]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'badge-success';
      case 'in_progress':
      case 'processing':
        return 'badge-warning';
      case 'requested':
      case 'pending':
        return 'badge-info';
      default:
        return 'badge-ghost';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'badge-error';
      case 'high':
        return 'badge-warning';
      default:
        return 'badge-info';
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
                  <div className="bg-info/10 p-3 rounded-full text-info">
                    <FaFlask className="w-6 h-6" />
                  </div>
                  <h1 className="text-2xl font-bold text-base-content">Lab Investigations</h1>
                </div>
                <p className="text-base-content/70">
                  Patient: {patientName}
                </p>
              </div>
              <button
                className="btn btn-outline"
                onClick={() => navigate(`/dashboard/doctor/medical-history/${patientId}`)}
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
                        <th>Patient Type</th>
                        <th>Investigation Type</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Tests</th>
                        <th>Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginationData.paginatedItems.length > 0 ? (
                        paginationData.paginatedItems.map((row, idx) => (
                          <tr key={idx} className="hover">
                            <td className="py-3">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-medium text-base-content">
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
                            <td>
                              <span className="font-medium text-base-content">
                                {row.type}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadge(row.status)}`}>
                                {row.status?.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td>
                              {row.priority ? (
                                <span className={`badge badge-sm ${getPriorityBadge(row.priority)}`}>
                                  {row.priority}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="text-left">
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-base-content/70">
                                  {row.testsCount} test{row.testsCount !== 1 ? 's' : ''}
                                </span>
                                <ul className="list-disc list-inside text-xs">
                                  {row.testsSummary.map((test, i) => (
                                    <li key={i}>{test}</li>
                                  ))}
                                  {row.testsCount > 2 && <li>...</li>}
                                </ul>
                              </div>
                            </td>
                            <td>{row.date}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-6 text-base-content/70">
                            No investigations found
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

export default ViewAllInvestigations;
