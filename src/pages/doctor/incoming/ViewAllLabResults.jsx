import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Header } from '@/components/common';
import Sidebar from '@/components/doctor/dashboard/Sidebar';
import { getPatientById } from '@/services/api/patientsAPI';
import { getDependantById } from '@/services/api/dependantAPI';
import { getLabResults } from '@/services/api/labResultsAPI';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';
import toast from 'react-hot-toast';
import { FaFlask } from 'react-icons/fa';
import { DoctorLayout } from '@/components/doctor/doctor';

const ViewAllLabResults = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromIncoming = location?.state?.from === 'incoming';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [labResults, setLabResults] = useState([]);
  const [dependantCache, setDependantCache] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const dependantId = location?.state?.dependantId || null;
const dependantSnapshot = location?.state?.dependantSnapshot || null;
const isViewingDependant = !!dependantId;
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

  // Fetch lab results
useEffect(() => {
  let mounted = true;
  const loadLabResults = async () => {
    try {
      setLoading(true);
      const res = await getLabResults({ patientId });
      const rawData = res?.data ?? res ?? [];
      const list = Array.isArray(rawData) ? rawData : [];
      const scoped = isViewingDependant
        ? list.filter(r => r.dependantId === dependantId)
        : list.filter(r => !r.dependantId);
      if (mounted) setLabResults(scoped);
    } catch (err) {
      console.error('Failed to load lab results:', err);
      if (mounted) setLabResults([]);
    } finally {
      if (mounted) setLoading(false);
    }
  };

  if (patientId) loadLabResults();
  return () => { mounted = false; };
}, [patientId, isViewingDependant, dependantId]);
  // Fetch dependants on-demand as we encounter them in lab results
  useEffect(() => {
    if (!labResults.length) return;

    const dependantIdsNeeded = [
      ...new Set(
        labResults
          .map(r => r?.dependantId)
          .filter(Boolean)
      )
    ];

    if (!dependantIdsNeeded.length) return;

    const fetchDependants = async () => {
      try {
        const results = await Promise.all(
          dependantIdsNeeded.map(id => getDependantById(id))
        );

        const newCache = {};

        results.forEach((res, index) => {
          const id = dependantIdsNeeded[index];
          const data = res?.data?.dependant ?? res?.dependant ?? res;
          newCache[id] = data;
        });

        setDependantCache(prev => ({
          ...prev,
          ...newCache
        }));
      } catch (err) {
        console.error("Dependant fetch error:", err);
      }
    };

    fetchDependants();
  }, [labResults]);

  // Format lab result rows
const resultRows = useMemo(() => (
  Array.isArray(labResults)
    ? labResults.map((result) => {
        const form = result?.form || {};

        const testCategories = [
          { name: 'Haematology', data: form.haematology },
          { name: 'WBC Differential', data: form.wbcDifferential },
          { name: 'Serology', data: form.serology },
          { name: 'Urinalysis', data: form.urinalysis },
          { name: 'Kidney Function', data: form.kidneyFunctionTest },
          { name: 'Liver Function', data: form.liverFunctionTest },
          { name: 'Diabetes Screening', data: form.diabetesScreening },
          { name: 'Lipid Profile', data: form.lipidProfile },
          { name: 'Others', data: form.others },
        ];

        const completedTests = testCategories
          .filter(cat => cat.data && Object.values(cat.data).some(v => v !== ''))
          .map(cat => cat.name);

        const isDependant = !!result?.dependantId;
        const dependant = isDependant
          ? dependantCache[result.dependantId] || (result.dependantId === dependantId ? dependantSnapshot : null)
          : null;

        const forName = isDependant
          ? dependant
            ? `${dependant.firstName || ''} ${dependant.lastName || ''}`.trim() || dependant.fullName || 'Loading...'
            : 'Loading...'
          : patientName;

        const forType = isDependant ? 'Dependant' : 'Patient';

        return {
          _id: result._id || result.id,
          labNo: form.labNo || '—',
          specimen: form.natureOfSpecimen || '—',
          date: result.createdAt ? formatNigeriaDate(result.createdAt) : '—',
          remarks: result.remarks || '—',
          completedTests,
          completedTestsCount: completedTests.length,
          isForDependant: isDependant,
          forName,
          forType,
        };
      })
    : []
), [labResults, dependantCache, patientName, dependantId, dependantSnapshot]);
  // Pagination
  const paginationData = useMemo(() => {
    const totalItems = resultRows.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedItems = resultRows.slice(startIdx, startIdx + itemsPerPage);
    return { paginatedItems, totalPages, totalItems };
  }, [resultRows, currentPage]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
<DoctorLayout>

      {/* Content Body */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
         <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-1">
                  <div className="bg-info/10 p-2 sm:p-3 rounded-full text-info shrink-0">
                    <FaFlask className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-base-content">Lab Results</h1>
                </div>
              <p className="text-sm text-base-content/70">
  {isViewingDependant ? 'Dependant' : 'Patient'}: <span className="font-semibold text-base-content">{isViewingDependant ? (dependantSnapshot?.fullName || `${dependantSnapshot?.firstName || ''} ${dependantSnapshot?.lastName || ''}`.trim() || 'Dependant') : (patientName || 'Loading...')}</span>
</p>
              </div>
                          <button
                className="btn btn-outline btn-sm sm:btn-md self-start sm:self-auto"
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
              <div className="card-body p-4 sm:p-6">
                
                {/* Mobile View: Cards */}
                <div className="block md:hidden space-y-3">
                  {paginationData.paginatedItems.length > 0 ? (
                    paginationData.paginatedItems.map((row, idx) => (
                      <div key={idx} className="border border-base-200 rounded-lg p-4 space-y-3 bg-base-100 shadow-xs">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="badge badge-sm badge-outline mb-1">
                              {row.forType}
                            </span>
                            <p className="font-semibold text-base text-base-content">{row.forName}</p>
                          </div>
                          <span className="text-xs text-base-content/60 font-medium">{row.date}</span>
                        </div>

                        <div className="pt-2 border-t border-base-200/60 flex justify-end">
                          <button
                            className="btn btn-sm btn-ghost text-primary w-full sm:w-auto"
                            onClick={() => navigate(`/dashboard/doctor/labResults/${row._id}`)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-base-content/70">
                      No lab results found
                    </div>
                  )}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="table w-full text-center">
                    <thead>
                      <tr>
                        <th>For</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginationData.paginatedItems.length > 0 ? (
                        paginationData.paginatedItems.map((row, idx) => (
                          <tr key={idx} className="hover">
                            <td>
                              <div className="flex items-center justify-center gap-2 flex-wrap">
                                <span className="badge badge-sm badge-outline">
                                  {row.forType}
                                </span>
                                <span className="text-sm font-semibold text-base-content">{row.forName}</span>
                              </div>
                            </td>
                            <td>{row.date}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-ghost"
                                onClick={() => navigate(`/dashboard/doctor/labResults/${row._id}`)}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="py-6 text-base-content/70">
                            No lab results found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {paginationData.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-base-200">
                    <span className="text-xs sm:text-sm text-base-content/70 text-center sm:text-left">
                      Page {currentPage} of {paginationData.totalPages} ({paginationData.totalItems} total)
                    </span>
                    <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                      <button
                        className="btn btn-xs sm:btn-sm btn-outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      >
                        Prev
                      </button>
                      {Array.from({
                        length: Math.min(paginationData.totalPages, 5),
                      }).map((_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            className={`btn btn-xs sm:btn-sm ${
                              currentPage === page ? 'btn-active' : 'btn-outline'
                            }`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        className="btn btn-xs sm:btn-sm btn-outline"
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
          </DoctorLayout>

  );
};

export default ViewAllLabResults;