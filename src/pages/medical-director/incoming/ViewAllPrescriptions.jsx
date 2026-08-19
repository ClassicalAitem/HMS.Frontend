import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation }  from 'react-router-dom';
import { Header } from '@/components/common';
import Sidebar from '@/components/medical-director/dashboard/Sidebar';
import {getPatientById } from '@/services/api/patientsAPI';
import { getPrescriptionByPatientId } from '@/services/api/prescriptionsAPI';
import { getInventories } from '@/services/api/inventoryAPI';
import { getAllDependantsForPatient } from '@/services/api/dependantAPI';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';
import toast from 'react-hot-toast';

const ViewAllPrescriptions = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromIncoming = location?.state?.from === 'incoming';

  const dependantId = location?.state?.dependantId || null;
  const dependantSnapshot = location?.state?.dependantSnapshot || null;
  const isViewingDependant = !!dependantId;

  const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [dependants, setDependants] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const patientName = useMemo(() => (
    patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim()
  ), [patient]);

  const subjectName = useMemo(() => {
    if (isViewingDependant) {
      return dependantSnapshot?.fullName
        || `${dependantSnapshot?.firstName || ''} ${dependantSnapshot?.lastName || ''}`.trim()
        || 'Dependant';
    }
    return patientName || 'Loading...';
  }, [isViewingDependant, dependantSnapshot, patientName]);

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

  useEffect(() => {
    let mounted = true;
    const loadPrescriptions = async () => {
      try {
        setLoading(true);
        const res = await getPrescriptionByPatientId(patientId);
        const presc = res?.data ?? res ?? [];
        const list = Array.isArray(presc) ? presc : [];
        const scoped = isViewingDependant
          ? list.filter(p => p.dependantId === dependantId)
          : list.filter(p => !p.dependantId);
        if (mounted) setPrescriptions(scoped);
      } catch (err) {
        console.error('Failed to load prescriptions:', err);
        if (mounted) setPrescriptions([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (patientId) loadPrescriptions();
    return () => { mounted = false; };
  }, [patientId, isViewingDependant, dependantId]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await getInventories();
        setInventoryData(res?.data ?? res ?? []);
      } catch (err) {
        console.error('Failed to load inventory:', err);
      }
    };
    fetchInventory();
  }, []);

  const prescriptionRows = useMemo(() => {
    const getDrugPrice = (drugName) => {
      const drug = inventoryData.find(d => d.name?.toLowerCase() === drugName?.toLowerCase());
      return drug?.sellingPrice || 0;
    };

    return Array.isArray(prescriptions)
      ? prescriptions.map((p) => {
          const isDependant = !!p.dependantId;
          const targetName = isDependant
            ? dependants.find(d => d.id === p.dependantId)?.fullName
              || (p.dependantId === dependantId ? subjectName : 'Unknown')
            : patientName;

          const medicationsCount = p.medications?.length || 0;
          const medicationsSummary = p.medications
            ? p.medications.slice(0, 2).map(m => `${m.drugName || 'Medication'} - ${m.dosage || 'N/A'}`)
            : [];

          const totalPrice = p.medications
            ? p.medications.reduce((sum, med) => sum + (getDrugPrice(med.drugName) || 0), 0)
            : 0;

          return {
            _id: p._id,
            forName: targetName,
            isForDependant: isDependant,
            status: p.status === 'pending' ? 'Pending' : p.status === 'dispensed' ? 'Dispensed' : p.status,
            medicationsCount,
            medicationsSummary,
            date: formatNigeriaDate(p.createdAt),
            totalPrice,
            medications: p.medications || [],
            createdAt: p.createdAt,
          };
        })
      : [];
  }, [prescriptions, dependants, patientName, subjectName, dependantId, inventoryData]);

  const paginationData = useMemo(() => {
    const totalItems = prescriptionRows.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedItems = prescriptionRows.slice(startIdx, startIdx + itemsPerPage);
    return { paginatedItems, totalPages, totalItems };
  }, [prescriptionRows, currentPage]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);


  return (
     <div className="flex min-h-screen bg-base-300/20">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={closeSidebar} 
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
      </div>

      {/* Main Content Viewport */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">  <Header onToggleSidebar={toggleSidebar} />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-base-content">Prescription History</h1>
                <p className="text-sm text-base-content/70 mt-1">
                  {isViewingDependant ? 'Dependant' : 'Patient'}: <span className="font-semibold text-base-content">{subjectName}</span>
                </p>
              </div>
              <button
                className="btn btn-outline btn-sm sm:btn-md self-start sm:self-auto"
                onClick={() => navigate(`/dashboard/medical-director/medical-history/${patientId}`, {
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

                <div className="block md:hidden space-y-4">
                  {paginationData.paginatedItems.length > 0 ? (
                    paginationData.paginatedItems.map((row, idx) => (
                      <div key={idx} className="border border-base-200 rounded-lg p-4 space-y-3 bg-base-100 shadow-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-base text-base-content">{row.forName}</p>
                            <span className={`badge badge-sm mt-1 ${row.isForDependant ? 'badge-secondary' : 'badge-primary'}`}>
                              {row.isForDependant ? 'Dependant' : 'Patient'}
                            </span>
                          </div>
                          <span className={`badge font-semibold ${
                            row.status === 'Pending' ? 'badge-warning' : row.status === 'Dispensed' ? 'badge-success' : 'badge-ghost'
                          }`}>
                            {row.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-base-200/60">
                          <div>
                            <span className="text-base-content/60 block">Medications Count</span>
                            <span className="font-bold text-sm text-base-content">{row.medicationsCount}</span>
                          </div>
                          <div>
                            <span className="text-base-content/60 block">Created At</span>
                            <span className="font-semibold text-sm text-base-content">{row.date}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-base-content/70 mb-1">Medications Preview:</p>
                          <ul className="list-disc list-inside text-xs font-medium space-y-1">
                            {row.medicationsSummary.map((med, i) => (
                              <li key={i} className="text-base-content truncate">{med}</li>
                            ))}
                            {row.medicationsCount > 2 && <li className="text-base-content/60">...</li>}
                          </ul>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-base-content/70">
                      No prescriptions found
                    </div>
                  )}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="table w-full text-center text-sm">
                    <thead>
                      <tr>
                        <th className="font-bold text-base">Patient Type</th>
                        <th className="font-bold text-base">Status</th>
                        <th className="font-bold text-base">Medications Count</th>
                        <th className="font-bold text-base">Created At</th>
                        <th className="font-bold text-base text-left">Medications</th>
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
                            <td>
                              <span
                                className={`badge font-semibold ${
                                  row.status === 'Pending'
                                    ? 'badge-warning'
                                    : row.status === 'Dispensed'
                                    ? 'badge-success'
                                    : 'badge-ghost'
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td className="font-bold text-sm">{row.medicationsCount}</td>
                            <td className="font-semibold text-sm">{row.date}</td>
                            <td className="text-left">
                              <ul className="list-disc list-inside text-sm font-medium">
                                {row.medicationsSummary.map((med, i) => (
                                  <li key={i} className="text-base-content">{med}</li>
                                ))}
                                {row.medicationsCount > 2 && <li className="text-base-content/60">...</li>}
                              </ul>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-base-content/70">
                            No prescriptions found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

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
    </div>
  );
};

export default ViewAllPrescriptions;