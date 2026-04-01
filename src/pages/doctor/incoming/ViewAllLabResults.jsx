import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Header } from '@/components/common';
import Sidebar from '@/components/doctor/dashboard/Sidebar';
import { getPatientById } from '@/services/api/patientsAPI';
import { getLabResults } from '@/services/api/labResultsAPI';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';
import toast from 'react-hot-toast';
import { FaFlask } from 'react-icons/fa';

const ViewAllLabResults = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromIncoming = location?.state?.from === 'incoming';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [labResults, setLabResults] = useState([]);
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

  // Fetch lab results
  useEffect(() => {
    let mounted = true;
    const loadLabResults = async () => {
      try {
        setLoading(true);
        const res = await getLabResults({ patientId });
        const rawData = res?.data ?? res ?? [];
        if (mounted) setLabResults(Array.isArray(rawData) ? rawData : []);
      } catch (err) {
        console.error('Failed to load lab results:', err);
        if (mounted) setLabResults([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (patientId) loadLabResults();
    return () => { mounted = false; };
  }, [patientId]);

  // Format lab result rows
  const resultRows = useMemo(() => (
    Array.isArray(labResults)
      ? labResults.map((result) => {
          const form = result?.form || {};
          
          // Collect non-empty test results from the form
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

          return {
            _id: result._id || result.id,
            labNo: form.labNo || '—',
            specimen: form.natureOfSpecimen || '—',
            date: result.createdAt ? formatNigeriaDate(result.createdAt) : '—',
            remarks: result.remarks || '—',
            completedTests,
            completedTestsCount: completedTests.length,
          };
        })
      : []
  ), [labResults]);

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
                  <h1 className="text-2xl font-bold text-base-content">Lab Results</h1>
                </div>
                <p className="text-base-content/70">
                  Patient: {patientName}
                </p>
              </div>
              <button
                className="btn btn-outline"
                onClick={() => navigate( `/dashboard/doctor/medical-history/${patientId}`)}
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
                        <th>Lab No</th>
                        <th>Specimen Type</th>
                        <th>Test Categories</th>
                        <th>Date</th>
                        <th>Remarks</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginationData.paginatedItems.length > 0 ? (
                        paginationData.paginatedItems.map((row, idx) => (
                          <tr key={idx} className="hover">
                            <td className="py-3 font-medium text-base-content">
                              {row.labNo}
                            </td>
                            <td className="capitalize">{row.specimen}</td>
                            <td className="text-left">
                              {row.completedTestsCount > 0 ? (
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs badge badge-sm">{row.completedTestsCount} test{row.completedTestsCount !== 1 ? 's' : ''}</span>
                                  <ul className="list-disc list-inside text-xs">
                                    {row.completedTests.slice(0, 2).map((test, i) => (
                                      <li key={i}>{test}</li>
                                    ))}
                                    {row.completedTestsCount > 2 && <li>...</li>}
                                  </ul>
                                </div>
                              ) : (
                                <span className="text-xs text-base-content/50">No tests completed</span>
                              )}
                            </td>
                            <td>{row.date}</td>
                            <td>
                              <div className="text-xs max-w-xs whitespace-normal">
                                {row.remarks}
                              </div>
                            </td>
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
                          <td colSpan={6} className="py-6 text-base-content/70">
                            No lab results found
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

export default ViewAllLabResults;
