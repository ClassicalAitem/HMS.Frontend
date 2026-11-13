import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LaboratoryLayout from "@/layouts/laboratory";
import KolakLoader from "@/components/common/KolakLoader";
import { getInvestigations } from "@/services/api/investigationRequestAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { hasStatus } from "@/utils/statusUtils";
import { formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";
import toast from "react-hot-toast";
import { useNotifications } from "@/contexts/NotificationContext";
import { FiSearch, FiAlertCircle, FiRefreshCw, FiUser } from "react-icons/fi";
import { FaFlask, FaEye } from "react-icons/fa";
import { PATIENT_STATUS } from "@/constants/patientStatus";

const IncomingLaboratory = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const hasLoadedRef = useRef(false);

  const { lastUpdate } = useNotifications();

  const fetchIncomingPatients = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) setLoading(true);
      setError(null);
      const response = await getInvestigations({ type: 'lab', limit: 100 });
      const allInvestigations = Array.isArray(response) ? response : (response?.data || []);
      const subjectsById = new Map();

      allInvestigations.forEach((investigation) => {
        const type = String(investigation.type || '').toLowerCase();
        if (type && type !== 'lab' && type !== 'laboratory') return;

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

        const parentHospitalId = isDependant
          ? (dependant?.patient?.hospitalId || patient?.hospitalId || '—')
          : (patient?.hospitalId || subject.hospitalId || '—');

        subjectsById.set(key, {
          key,
          patientId,
          dependantId: isDependant ? dependantId : null,
          patientType: isDependant ? 'dependant' : 'patient',
          name: `${subject.firstName || ''} ${subject.lastName || ''}`.trim() || subject.fullName || subject.name || 'Unknown Patient',
          hospitalId: parentHospitalId,
          status: subject.status,
          requestCount: 1,
          latestRequestAt: requestedAt,
          updatedAt: subject.updatedAt || requestedAt,
        });
      });

      // Resolve missing parent hospital IDs for dependants if needed
      const missingParentIds = Array.from(subjectsById.values())
        .filter(s => s.patientType === 'dependant' && (!s.hospitalId || s.hospitalId === '—') && s.patientId)
        .map(s => s.patientId);

      if (missingParentIds.length > 0) {
        const fetched = await Promise.allSettled(
          Array.from(new Set(missingParentIds)).map(id => getPatientById(id))
        );
        const parentMap = new Map();
        fetched.forEach(res => {
          if (res.status === 'fulfilled') {
            const p = res.value?.data?.data ?? res.value?.data;
            if (p && (p.id || p._id) && p.hospitalId) {
              parentMap.set(p.id || p._id, p.hospitalId);
            }
          }
        });
        subjectsById.forEach(s => {
          if (s.patientType === 'dependant' && (!s.hospitalId || s.hospitalId === '—')) {
            const hid = parentMap.get(s.patientId);
            if (hid) s.hospitalId = hid;
          }
        });
      }

      const incomingSubjects = Array.from(subjectsById.values())
        .sort((first, second) => new Date(second.updatedAt || second.latestRequestAt || 0) - new Date(first.updatedAt || first.latestRequestAt || 0));
      setPatients(incomingSubjects);
      hasLoadedRef.current = true;
    } catch (err) {
      console.error("Error fetching incoming lab patients:", err);
      setError("Failed to load incoming patients. Please try refreshing.");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncomingPatients();
  }, [fetchIncomingPatients, lastUpdate]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') fetchIncomingPatients();
    };

    const handleStorageChange = (e) => {
      if (e.key === 'refreshIncoming') fetchIncomingPatients();
    };

    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchIncomingPatients]);

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

  if (loading && !patients.length) {
    return (
      <LaboratoryLayout>
        <KolakLoader fullscreen text="Loading incoming lab patients..." />
      </LaboratoryLayout>
    );
  }

  return (
    <LaboratoryLayout>
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
            <div className="py-12 flex justify-center">
              <KolakLoader text="Loading incoming patients..." />
            </div>
          ) : filteredPatients.length > 0 ? (
            <div className="overflow-x-auto max-h-[60vh] sm:max-h-[65vh] 2xl:max-h-[70vh]">
              <table className="table table-zebra w-full">
                <thead className="bg-base-200/90 backdrop-blur-xs sticky top-0 z-10">
                  <tr>
                    <th>Patient / Dependant</th>
                    <th>Hospital ID</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Lab Requests</th>
                    <th>Updated</th>
                    <th>Action</th>
                  </tr>
                </thead>
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
    </LaboratoryLayout>
  );
};

export default IncomingLaboratory;