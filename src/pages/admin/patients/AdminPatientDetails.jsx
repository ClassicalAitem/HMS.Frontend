import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import AdminLayout from "@/layouts/admin/AdminLayout";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPatientById } from "@/store/slices/patientsSlice";
import PatientDetailsCard from "@/components/common/PatientDetailsCard";
import HmoDependantsSection from "@/components/frontdesk/patients/HmoDependantsSection";
import PatientBillsHistory from "@/components/frontdesk/patients/PatientBillsHistory";
import CurrentVitalsCard from "@/components/doctor/patient/CurrentVitalsCard";
import KolakLoader from "@/components/common/KolakLoader";
import {
  ConsultationDetailModal,
  AntenatalDetailModal,
  AppointmentDetailsModal,
} from "@/components/modals";
import { getConsultations } from "@/services/api/consultationAPI";
import { getAnteNatalRecordByPatientId, unwrapAnteNatalRecords } from "@/services/api/anteNatalAPI";
import { getPrescriptionByPatientId } from "@/services/api/prescriptionsAPI";
import { getAllAppointments } from "@/services/api/appointmentsAPI";
import { getLabResults } from "@/services/api/labResultsAPI";
import { getVitalsByPatient, getLatestVital, normalizeVitalsResponse } from "@/services/api/vitalsAPI";
import { getDependantById } from "@/services/api/dependantAPI";
import { formatNigeriaDate, formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";
import { FaArrowLeft, FaStethoscope, FaCalendarAlt, FaVial, FaTimes } from "react-icons/fa";
import { MdPregnantWoman } from "react-icons/md";

const AdminPatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const { currentPatient, isLoading } = useAppSelector((state) => state.patients);
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const dependantId = location?.state?.dependantId || searchParams.get("dependantId") || null;
  const isViewingDependant = Boolean(dependantId);

  const [subject, setSubject] = useState(null);
  const [subjectLoading, setSubjectLoading] = useState(true);
  const [consultations, setConsultations] = useState([]);
  const [consultationsLoading, setConsultationsLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [prescriptionsByConsultation, setPrescriptionsByConsultation] = useState({});
  const [antenatalRecords, setAntenatalRecords] = useState([]);
  const [antenatalLoading, setAntenatalLoading] = useState(true);
  const [selectedAntenatal, setSelectedAntenatal] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [latestVital, setLatestVital] = useState(null);
  const [vitalsLoading, setVitalsLoading] = useState(true);
  const [labResults, setLabResults] = useState([]);
  const [labLoading, setLabLoading] = useState(true);
  const [selectedLabResult, setSelectedLabResult] = useState(null);

  const patient = currentPatient || location?.state?.patientSnapshot || null;

  useEffect(() => {
    if (patientId) {
      dispatch(fetchPatientById(patientId));
    }
  }, [dispatch, patientId]);

  useEffect(() => {
    let mounted = true;
    const loadSubject = async () => {
      setSubjectLoading(true);
      if (isViewingDependant && dependantId) {
        try {
          const res = await getDependantById(dependantId);
          const dep = res?.data?.data ?? res?.data ?? null;
          if (mounted) setSubject(dep);
        } catch {
          if (mounted) setSubject(null);
        }
      } else {
        if (mounted) setSubject(patient);
      }
      if (mounted) setSubjectLoading(false);
    };
    loadSubject();
    return () => {
      mounted = false;
    };
  }, [isViewingDependant, dependantId, patient]);

  useEffect(() => {
    let mounted = true;
    const loadClinicalData = async () => {
      if (!patientId) return;
      setConsultationsLoading(true);
      setAntenatalLoading(true);
      setAppointmentsLoading(true);
      setVitalsLoading(true);
      setLabLoading(true);

      const [consRes, apptRes, vitRes, ancRes, rxRes, labRes] = await Promise.allSettled([
        getConsultations({ patientId }),
        getAllAppointments({ patientId }),
        getVitalsByPatient(patientId),
        getAnteNatalRecordByPatientId(patientId),
        getPrescriptionByPatientId(patientId),
        getLabResults({ patientId }),
      ]);

      if (!mounted) return;

      const scopeFilter = (items) =>
        (Array.isArray(items) ? items : []).filter((item) =>
          isViewingDependant ? item?.dependantId === dependantId : !item?.dependantId
        );

      if (consRes.status === "fulfilled") {
        const raw = consRes.value?.data?.data ?? consRes.value?.data ?? consRes.value ?? [];
        const list = Array.isArray(raw) ? raw : raw?.consultations ?? [];
        setConsultations(
          scopeFilter(list).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        );
      } else {
        setConsultations([]);
      }
      setConsultationsLoading(false);

      if (rxRes.status === "fulfilled") {
        const raw = rxRes.value?.data?.data ?? rxRes.value?.data ?? rxRes.value ?? [];
        const list = Array.isArray(raw) ? raw : [];
        const grouped = {};
        list.forEach((rx) => {
          const cid = rx.consultationId;
          if (cid) {
            if (!grouped[cid]) grouped[cid] = [];
            grouped[cid].push(rx);
          }
        });
        setPrescriptionsByConsultation(grouped);
      }

      if (apptRes.status === "fulfilled") {
        const raw = apptRes.value?.data?.data ?? apptRes.value?.data ?? apptRes.value ?? [];
        const list = Array.isArray(raw) ? raw : raw?.appointments ?? [];
        setAppointments(
          scopeFilter(list).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        );
      } else {
        setAppointments([]);
      }
      setAppointmentsLoading(false);

      if (vitRes.status === "fulfilled") {
        const normalized = normalizeVitalsResponse(vitRes.value);
        const scoped = scopeFilter(normalized);
        setLatestVital(getLatestVital(scoped));
      } else {
        setLatestVital(null);
      }
      setVitalsLoading(false);

      if (ancRes.status === "fulfilled") {
        const list = unwrapAnteNatalRecords(ancRes.value);
        setAntenatalRecords(
          scopeFilter(list).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        );
      } else {
        setAntenatalRecords([]);
      }
      setAntenatalLoading(false);

      if (labRes.status === "fulfilled") {
        const raw = labRes.value?.data?.data ?? labRes.value?.data ?? labRes.value ?? [];
        const list = Array.isArray(raw) ? raw : [];
        setLabResults(
          scopeFilter(list).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        );
      } else {
        setLabResults([]);
      }
      setLabLoading(false);
    };

    loadClinicalData();
    return () => {
      mounted = false;
    };
  }, [patientId, isViewingDependant, dependantId]);

  const activeProfile = subject || patient;
  const fullName = activeProfile
    ? `${activeProfile.firstName || ""} ${activeProfile.lastName || ""}`.trim()
    : "Patient Details";

  return (
    <AdminLayout>
      {(isLoading || subjectLoading) && !activeProfile && (
        <KolakLoader fullscreen text="Loading patient details..." />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-base-100 p-5 rounded-2xl border border-base-200 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-sm btn-ghost bg-base-200/70 rounded-xl"
            >
              <FaArrowLeft className="w-3.5 h-3.5" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-base-content">{fullName}</h1>
                <span className="badge badge-primary badge-sm">
                  {isViewingDependant ? "Dependant" : "Principal Patient"}
                </span>
                {patient?.hospitalId && (
                  <span className="badge badge-ghost badge-sm font-mono">
                    {patient.hospitalId}
                  </span>
                )}
              </div>
              <p className="text-xs text-base-content/60 mt-0.5">
                Complete administrative overview: demographics, vitals, consultations, antenatal, appointments, and bills.
              </p>
            </div>
          </div>

          {isViewingDependant && patientId && (
            <Link
              to={`/dashboard/admin/patients/${patientId}`}
              className="btn btn-sm btn-outline rounded-xl"
            >
              View Principal Patient
            </Link>
          )}
        </div>

        {/* Patient Details Card (same clean layout as Frontdesk) */}
        {activeProfile && (
          <PatientDetailsCard
            patient={activeProfile}
            summarySubject={activeProfile}
            isViewingDependant={isViewingDependant}
          />
        )}

        {/* Current Vitals */}
        <CurrentVitalsCard
          patient={activeProfile}
          latest={latestVital}
          loading={vitalsLoading}
          buttonHidden
        />

        {/* HMO & Dependants */}
        {patient && !isViewingDependant && (
          <HmoDependantsSection patient={patient} readOnly />
        )}

        {/* Consultations */}
        <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-base-content flex items-center gap-2">
              <FaStethoscope className="text-primary" />
              Consultations ({consultations.length})
            </h2>
          </div>

          {consultationsLoading ? (
            <div className="py-6 text-center text-sm text-base-content/60">Loading consultations...</div>
          ) : consultations.length === 0 ? (
            <div className="py-6 text-center text-sm text-base-content/50">
              No consultations recorded for this patient.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead>
                  <tr className="text-xs uppercase text-base-content/60">
                    <th>Date</th>
                    <th>Doctor</th>
                    <th>Complaint / Diagnosis</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {consultations.map((c) => (
                    <tr key={c.id} className="hover">
                      <td className="text-xs">{formatNigeriaDateTime(c.createdAt)}</td>
                      <td className="text-xs font-semibold">
                        {c.doctor ? `Dr. ${c.doctor.firstName} ${c.doctor.lastName}` : "Doctor"}
                      </td>
                      <td className="text-xs max-w-xs truncate">
                        {c.diagnosis || c.presentingComplaint || c.chiefComplaint || "—"}
                      </td>
                      <td>
                        <span className="badge badge-outline badge-xs capitalize">
                          {c.status || "completed"}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedConsultation(c)}
                          className="btn btn-xs btn-ghost text-primary"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Antenatal Records */}
        <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-base-content flex items-center gap-2">
              <MdPregnantWoman className="text-primary w-5 h-5" />
              Antenatal Records ({antenatalRecords.length})
            </h2>
          </div>

          {antenatalLoading ? (
            <div className="py-6 text-center text-sm text-base-content/60">Loading antenatal records...</div>
          ) : antenatalRecords.length === 0 ? (
            <div className="py-6 text-center text-sm text-base-content/50">
              No antenatal records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead>
                  <tr className="text-xs uppercase text-base-content/60">
                    <th>Date</th>
                    <th>Gestational Age</th>
                    <th>EDD</th>
                    <th>Notes</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {antenatalRecords.map((anc) => (
                    <tr key={anc.id || anc._id} className="hover">
                      <td className="text-xs">{formatNigeriaDate(anc.createdAt)}</td>
                      <td className="text-xs">{anc.gestationalAge || "—"}</td>
                      <td className="text-xs">{anc.edd ? formatNigeriaDate(anc.edd) : "—"}</td>
                      <td className="text-xs max-w-xs truncate">{anc.notes || anc.remarks || "—"}</td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedAntenatal(anc)}
                          className="btn btn-xs btn-ghost text-primary"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Appointments */}
        <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-base-content flex items-center gap-2">
              <FaCalendarAlt className="text-primary" />
              Appointments ({appointments.length})
            </h2>
          </div>

          {appointmentsLoading ? (
            <div className="py-6 text-center text-sm text-base-content/60">Loading appointments...</div>
          ) : appointments.length === 0 ? (
            <div className="py-6 text-center text-sm text-base-content/50">
              No appointments recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead>
                  <tr className="text-xs uppercase text-base-content/60">
                    <th>Date & Time</th>
                    <th>Department / Type</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt) => (
                    <tr key={appt.id} className="hover">
                      <td className="text-xs">
                        {formatNigeriaDateTime(appt.appointmentDate || appt.createdAt)}
                      </td>
                      <td className="text-xs capitalize">{appt.department || appt.type || "General"}</td>
                      <td>
                        <span className="badge badge-outline badge-xs capitalize">
                          {appt.status || "scheduled"}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAppointmentId(appt.id);
                            setIsAppointmentModalOpen(true);
                          }}
                          className="btn btn-xs btn-ghost text-primary"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Diagnostics & Lab Results */}
        <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-base-content flex items-center gap-2">
              <FaVial className="text-primary" />
              Diagnostics & Lab Results ({labResults.length})
            </h2>
          </div>

          {labLoading ? (
            <div className="py-6 text-center text-sm text-base-content/60">Loading lab & scan results...</div>
          ) : labResults.length === 0 ? (
            <div className="py-6 text-center text-sm text-base-content/50">
              No diagnostic or lab results recorded for this patient.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead>
                  <tr className="text-xs uppercase text-base-content/60">
                    <th>Date</th>
                    <th>Test / Scan Name</th>
                    <th>Clinician</th>
                    <th>Flag</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {labResults.map((res) => {
                    const first = Array.isArray(res.result) ? res.result[0] : null;
                    const flag = first?.flag || res.flag || "Normal";
                    return (
                      <tr key={res.id || res._id} className="hover">
                        <td className="text-xs">{formatNigeriaDateTime(res.createdAt)}</td>
                        <td className="text-xs font-semibold">
                          {res.investigationName || res.testName || "Investigation"}
                        </td>
                        <td className="text-xs">
                          {res.scientistName || res.sonographerName || "Lab / Sonography"}
                        </td>
                        <td>
                          <span
                            className={`badge badge-xs font-bold ${
                              flag === "C" || flag === "H" ? "badge-error text-white" : "badge-success text-white"
                            }`}
                          >
                            {flag}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLabResult(res)}
                            className="btn btn-xs btn-ghost text-primary"
                          >
                            View Result
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Patient Bills History */}
        <PatientBillsHistory
          patientId={patientId}
          dependantId={isViewingDependant ? dependantId : null}
        />
      </div>

      {/* Modals */}
      {selectedLabResult && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-base-200">
              <div>
                <h3 className="text-lg font-bold">
                  {selectedLabResult.investigationName || selectedLabResult.testName || "Diagnostic Result"}
                </h3>
                <p className="text-xs text-base-content/60">
                  {formatNigeriaDateTime(selectedLabResult.createdAt)} •{" "}
                  {selectedLabResult.scientistName || selectedLabResult.sonographerName || "Clinician"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLabResult(null)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <FaTimes />
              </button>
            </div>

            {Array.isArray(selectedLabResult.result) && selectedLabResult.result.length > 0 && (
              <div className="overflow-x-auto mb-4">
                <table className="table table-xs sm:table-sm w-full">
                  <thead>
                    <tr className="text-xs uppercase text-base-content/60">
                      <th>Parameter</th>
                      <th>Result</th>
                      <th>Unit</th>
                      <th>Ref Range</th>
                      <th>Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLabResult.result.map((row, i) => (
                      <tr key={i}>
                        <td className="font-medium">{row.parameter || row.name || "—"}</td>
                        <td className="font-bold">{row.value ?? row.result ?? "—"}</td>
                        <td className="text-xs">{row.unit || "—"}</td>
                        <td className="text-xs">{row.referenceRange || row.refRange || "—"}</td>
                        <td>
                          <span className="badge badge-xs">{row.flag || "Normal"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedLabResult.remarks && (
              <div className="p-3 rounded-xl bg-base-200/60 text-sm mb-3">
                <p className="text-xs font-semibold text-base-content/60 mb-1">Remarks / Findings</p>
                <p className="whitespace-pre-wrap">{selectedLabResult.remarks}</p>
              </div>
            )}

            {Array.isArray(selectedLabResult.attachedFiles) && selectedLabResult.attachedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-base-content/60">Attached Files / Scans</p>
                <div className="flex flex-wrap gap-2">
                  {selectedLabResult.attachedFiles.map((f, i) => (
                    <span key={i} className="badge badge-outline badge-sm">
                      {f.name || `Attachment ${i + 1}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-action">
              <button
                type="button"
                onClick={() => setSelectedLabResult(null)}
                className="btn btn-primary btn-sm rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedConsultation && (
        <ConsultationDetailModal
          consultation={selectedConsultation}
          prescriptions={prescriptionsByConsultation[selectedConsultation.id] || []}
          onClose={() => setSelectedConsultation(null)}
        />
      )}

      {selectedAntenatal && (
        <AntenatalDetailModal
          record={selectedAntenatal}
          onClose={() => setSelectedAntenatal(null)}
        />
      )}

      {isAppointmentModalOpen && selectedAppointmentId && (
        <AppointmentDetailsModal
          isOpen={isAppointmentModalOpen}
          appointmentId={selectedAppointmentId}
          onClose={() => {
            setIsAppointmentModalOpen(false);
            setSelectedAppointmentId(null);
          }}
        />
      )}
    </AdminLayout>
  );
};

export default AdminPatientDetails;
