import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Header } from '@/components/common';
import Sidebar from '@/components/doctor/dashboard/Sidebar';
import { getPatientById } from '@/services/api/patientsAPI';
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [dependants, setDependants] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
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

  // Fetch prescriptions
  useEffect(() => {
    let mounted = true;
    const loadPrescriptions = async () => {
      try {
        setLoading(true);
        const res = await getPrescriptionByPatientId(patientId);
        const presc = res?.data ?? res ?? [];
        if (mounted) setPrescriptions(Array.isArray(presc) ? presc : []);
      } catch (err) {
        console.error('Failed to load prescriptions:', err);
        if (mounted) setPrescriptions([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (patientId) loadPrescriptions();
    return () => { mounted = false; };
  }, [patientId]);

  // Fetch inventory data
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

  // Format prescription rows
  const prescriptionRows = useMemo(() => {
    const getDrugPrice = (drugName) => {
      const drug = inventoryData.find(d => d.name?.toLowerCase() === drugName?.toLowerCase());
      return drug?.sellingPrice || 0;
    };

    return Array.isArray(prescriptions)
      ? prescriptions.map((p) => {
          const isDependant = !!p.dependantId;
          const targetName = isDependant
            ? dependants.find(d => d.id === p.dependantId)?.fullName || 'Unknown'
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
  }, [prescriptions, dependants, patientName, inventoryData]);

  // Pagination
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
                <h1 className="text-2xl font-bold text-base-content">Prescription History</h1>
                <p className="text-base-content/70 mt-1">
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
                        <th>Status</th>
                        <th>Medications Count</th>
                        <th>Created At</th>
                        <th>Medications</th>
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
                              <span
                                className={`badge ${
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
                            <td>{row.medicationsCount}</td>
                            <td>{row.date}</td>
                            <td className="text-left">
                              <ul className="list-disc list-inside text-xs">
                                {row.medicationsSummary.map((med, i) => (
                                  <li key={i}>{med}</li>
                                ))}
                                {row.medicationsCount > 2 && <li>...</li>}
                              </ul>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-base-content/70">
                            No prescriptions found
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

export default ViewAllPrescriptions;
