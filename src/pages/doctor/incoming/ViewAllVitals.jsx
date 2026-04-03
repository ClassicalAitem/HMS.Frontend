import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Header } from '@/components/common';
import Sidebar from '@/components/doctor/dashboard/Sidebar';
import { getPatientById } from '@/services/api/patientsAPI';
import { getVitalsByPatient } from '@/services/api/vitalsAPI';
import { getAllDependantsForPatient } from '@/services/api/dependantAPI';
import { formatNigeriaDate, formatNigeriaTime } from '@/utils/formatDateTimeUtils';
import toast from 'react-hot-toast';
import { FaHeartbeat } from 'react-icons/fa';

const ViewAllVitals = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromIncoming = location?.state?.from === 'incoming';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [dependants, setDependants] = useState([]);
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

  // Fetch vitals
  useEffect(() => {
    let mounted = true;
    const loadVitals = async () => {
      try {
        setLoading(true);
        const res = await getVitalsByPatient(patientId);
        const rawData = res?.data ?? res ?? [];
        const vitalsList = Array.isArray(rawData) ? rawData : [];
        // Sort by date descending (newest first)
        const sorted = vitalsList.sort((a, b) => 
          new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
        );
        if (mounted) setVitals(sorted);
      } catch (err) {
        console.error('Failed to load vitals:', err);
        if (mounted) setVitals([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (patientId) loadVitals();
    return () => { mounted = false; };
  }, [patientId]);

  // Format vital rows
  const vitalRows = useMemo(() => (
    Array.isArray(vitals)
      ? vitals.map((vital) => {
          const isDependant = !!vital.dependantId;
          
          const dependant = isDependant
            ? dependants.find(d => d.id === vital.dependantId || d._id === vital.dependantId)
            : null;

          const forName = isDependant
            ? dependant
              ? dependant.fullName
              : 'Dependant'
            : patientName;

          return {
            _id: vital._id || vital.id,
            forName,
            isForDependant: isDependant,
            bp: vital.bp || '—',
            pulse: vital.pulse || '—',
            temperature: vital.temperature || '—',
            weight: vital.weight || '—',
            height: vital.height || '—',
            // spo2: vital.spo2 || vital.oxygen || '—',
            respiratoryRate: vital.respiratoryRate || '—',
            date: formatNigeriaDate(vital.createdAt),
            time: formatNigeriaTime(vital.createdAt),
            createdAt: vital.createdAt,
          };
        })
      : []
  ), [vitals, dependants, patientName]);

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
                  <div className="bg-success/10 p-3 rounded-full text-success">
                    <FaHeartbeat className="w-6 h-6" />
                  </div>
                  <h1 className="text-2xl font-bold text-base-content">Vitals History</h1>
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
                        <th>Date & Time</th>
                        <th>Blood Pressure</th>
                        <th>Heart Rate</th>
                        <th>Temperature</th>
                        <th>Weight</th>
                        <th>Height</th>
                        {/* <th>O2 Saturation</th> */}
                        <th>Respiratory Rate</th>
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
                            {/* <td>
                              {row.spo2} <span className="text-xs text-base-content/70">%</span>
                            </td> */}
                            <td>
                              {row.respiratoryRate} <span className="text-xs text-base-content/70">bpm</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-6 text-base-content/70">
                            No vitals found
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

export default ViewAllVitals;
