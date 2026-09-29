import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import { getInvestigations } from "@/services/api/investigationRequestAPI";
import { hasStatus } from "@/utils/statusUtils";
import { formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";
import toast from "react-hot-toast";
import { useNotifications } from "@/contexts/NotificationContext";
import { FiSearch, FiAlertCircle, FiRefreshCw, FiUser } from "react-icons/fi";
import { FaFlask, FaEye } from "react-icons/fa";
import { PATIENT_STATUS } from "@/constants/patientStatus";

const IncomingLaboratory = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { lastUpdate } = useNotifications();

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const closeSidebar = () => setIsSidebarOpen(false);

  const fetchIncomingPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getInvestigations();
      const allInvestigations = Array.isArray(response) ? response : (response?.data || []);
      const subjectsById = new Map();

      allInvestigations.forEach((investigation) => {
        const type = String(investigation.type || '').toLowerCase();
        if (type !== 'lab' && type !== 'laboratory') return;

        const rawStatus = investigation.status;
        const requestStatus = String(Array.isArray(rawStatus) ? rawStatus[rawStatus.length - 1] : rawStatus || '').toLowerCase();
        if (!['requested', 'in_progress', 'pending', 'awaiting_lab'].includes(requestStatus)) return;

        const dependant = investigation.dependant;
        const patient = investigation.patient;
        const isDependant = Boolean(dependant || investigation.dependantId);
        const subject = dependant || patient;
        if (!subject || !hasStatus(subject.status, PATIENT_STATUS.AWAITING_LAB)) return;

        const dependantId = investigation.dependantId || dependant?.id || dependant?._id;
        const patientId = investigation.patientId || patient?.id || patient?._id || dependant?.patientId;
        const subjectId = isDependant ? dependantId : patientId;
        if (!subjectId) return;

        const key = `${isDependant ? 'dependant' : 'patient'}:${subjectId}`;
        const existing = subjectsById.get(key);
        const requestedAt = investigation.createdAt || subject.updatedAt;

        if (existing) {
          existing.requestCount += 1;
          if (new Date(requestedAt || 0) > new Date(existing.latestRequestAt || 0)) {
            existing.latestRequestAt = requestedAt;
          }
          return;
        }

        subjectsById.set(key, {
          key,
          patientId,
          dependantId: isDependant ? dependantId : null,
          patientType: isDependant ? 'dependant' : 'patient',
          name: `${subject.firstName || ''} ${subject.lastName || ''}`.trim() || subject.fullName || subject.name || 'Unknown Patient',
          hospitalId: patient?.hospitalId || subject.hospitalId || '—',
          status: subject.status,
          requestCount: 1,
          latestRequestAt: requestedAt,
          updatedAt: subject.updatedAt || requestedAt,
        });
      });

      const incomingSubjects = Array.from(subjectsById.values())
        .sort((first, second) => new Date(second.updatedAt || second.latestRequestAt || 0) - new Date(first.updatedAt || first.latestRequestAt || 0));
      setPatients(incomingSubjects);
    } catch (err) {
      console.error("Error fetching incoming lab patients:", err);
      setError("Failed to load incoming patients. Please try refreshing.");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomingPatients();
  }, [lastUpdate]);

  const filteredPatients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return patients;
    return patients.filter((patient) => (
      patient.name.toLowerCase().includes(query) || String(patient.hospitalId).toLowerCase().includes(query)
    ));
  }, [patients, searchTerm]);

  const viewPatientDetails = (patient) => {
    if (!patient.patientId) {
      toast.error('Patient ID is missing.');
      return;
    }
    navigate(`/dashboard/laboratory/patients/${patient.patientId}`, {
      state: patient.dependantId ? { dependantId: patient.dependantId } : {},
    });
  };

  const sidebarWrapper = (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <LaboratorySidebar onCloseSidebar={closeSidebar} />
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-base-200">
      {sidebarWrapper}

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onToggleSidebar={toggleSidebar} />
        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <FaFlask className="h-6 w-6 text-primary" aria-hidden="true" />
              <div>
                <h1 className="text-2xl font-bold text-base-content">Incoming Lab Patients</h1>
                <p className="text-sm text-base-content/60">Patients and dependants awaiting laboratory tests</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchIncomingPatients}
                className="btn btn-sm btn-ghost gap-2 border border-base-300"
                title="Refresh incoming patients"
              >
                <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-error shadow-sm">
              <FiAlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <section className="overflow-hidden rounded-lg border border-base-300 bg-base-100">
            <div className="flex flex-col gap-3 border-b border-base-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">Awaiting Laboratory</h2>
                <span className="badge badge-ghost badge-sm">{filteredPatients.length}</span>
              </div>
              <label className="input input-sm input-bordered flex w-full items-center gap-2 sm:max-w-xs">
                <FiSearch className="h-4 w-4 text-base-content/40" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search patient or hospital ID"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>
            </div>

            {loading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3, 4].map((item) => <div key={item} className="h-16 animate-pulse rounded-md bg-base-200" />)}
              </div>
            ) : filteredPatients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead><tr><th>Patient / Dependant</th><th>Hospital ID</th><th>Type</th><th>Status</th><th>Lab Requests</th><th>Updated</th><th>Action</th></tr></thead>
                  <tbody>
                    {filteredPatients.map((patient) => (
                      <tr key={patient.key}>
                        <td className="font-medium">
                          <span className="inline-flex items-center gap-2"><FiUser aria-hidden="true" />{patient.name}</span>
                        </td>
                        <td>{patient.hospitalId}</td>
                        <td><span className={`badge badge-sm ${patient.dependantId ? 'badge-secondary' : 'badge-primary'}`}>{patient.dependantId ? 'Dependant' : 'Patient'}</span></td>
                        <td><span className="badge badge-warning badge-sm">Awaiting lab</span></td>
                        <td>{patient.requestCount}</td>
                        <td>{patient.updatedAt ? formatNigeriaDateTime(patient.updatedAt) : '—'}</td>
                        <td>
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => viewPatientDetails(patient)}>
                            <FaEye aria-hidden="true" /> View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-4 py-12 text-center text-sm text-base-content/60">
                {searchTerm ? 'No patients match your search.' : 'No patients or dependants are awaiting laboratory.'}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default IncomingLaboratory;