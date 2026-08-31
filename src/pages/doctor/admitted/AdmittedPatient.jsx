import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Header } from '@/components/common'
import DoctorSidebar from '@/components/doctor/dashboard/Sidebar'
import { getAdmissionByPatientId } from '@/services/api/admissionApi'
import {
  getVitalsByPatient,
  normalizeVitalsResponse,
  getLatestVital,
} from '@/services/api/vitalsAPI'
import { getPatientById } from '@/services/api/patientsAPI'
import { getDependantById } from '@/services/api/dependantAPI'
import WardRoundForm from '@/components/admitted/WardRoundForm'
import OrderInvestigationModal from '@/pages/doctor/incoming/modals/OrderInvestigationModal'
import { getPrescriptionsForConsultation, deletePrescription } from '@/services/api/prescriptionsAPI'
import { getInvestigationByConsultationId, deleteInvestigation } from '@/services/api/investigationAPI'
import wardRoundApi from '@/services/api/wardRoundApi'
import toast from 'react-hot-toast'
import { FaEdit, FaFlask, FaPrescriptionBottleAlt, FaTrash, FaNotesMedical } from 'react-icons/fa'
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils'
import CurrentVitalsCard from '@/components/doctor/patient/CurrentVitalsCard'
import PatientDetailsCard from '@/components/common/PatientDetailsCard'
import PatientHeaderActions from '@/components/doctor/patient/PatientHeaderActions'

const DRAdmittedPatient = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dependantId = location?.state?.dependantId || null;
  const dependantSnapshot = location?.state?.dependantSnapshot || null;
  const fromIncoming = location?.state?.from === 'incoming';
  const isViewingDependant = !!dependantId;

  const [loading, setLoading] = useState(true)
  const [patient, setPatient] = useState(null);
  const [subject, setSubject] = useState(dependantSnapshot);
  const [labRequests, setLabRequests] = useState([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [sidebarMounted, setSidebarMounted] = useState(false)
  const [admission, setAdmission] = useState(null)
  const [vitals, setVitals] = useState([])
  const [vitalsLoading, setVitalsLoading] = useState(true)
  const [wardRounds, setWardRounds] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [doctorNamesById, setDoctorNamesById] = useState({});
  const [editingLab, setEditingLab] = useState(null);
  const [isInvestigationModalOpen, setIsInvestigationModalOpen] = useState(false);

  // The real consultation ID lives on the admission record, not the URL —
  // this route only has :patientId, so useParams().consultationId is always undefined.
  const consultationId = admission?.consultationId || admission?.consultation || null;

  useEffect(() => { const id = requestAnimationFrame(() => setSidebarMounted(true)); return () => cancelAnimationFrame(id) }, [])

  useEffect(() => {
    if (!isViewingDependant || !dependantId || dependantSnapshot) return undefined;

    let mounted = true;
    const loadDependant = async () => {
      try {
        const response = await getDependantById(dependantId);
        const dependant = response?.data?.data?.dependant ?? response?.data?.dependant ?? response?.data ?? response;
        if (mounted) setSubject(dependant);
      } catch (error) {
        console.warn('Failed to load dependant', error);
      }
    };
    loadDependant();
    return () => { mounted = false; };
  }, [dependantId, dependantSnapshot, isViewingDependant]);

  const summarySubject = useMemo(() => {
    if (!isViewingDependant) {
      return {
        ...(patient || {}),
        fullName: patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Unknown',
      };
    }

    const dependant = subject || dependantSnapshot || {};
    return {
      ...dependant,
      fullName: dependant.fullName || `${dependant.firstName || ''} ${dependant.lastName || ''}`.trim() || 'Dependant',
      hospitalId: patient?.hospitalId,
    };
  }, [dependantSnapshot, isViewingDependant, patient, subject]);

  const loadVitals = async () => {
    try {
      setVitalsLoading(true)
      const vRes = await getVitalsByPatient(patientId)
      setVitals(normalizeVitalsResponse(vRes))
    } catch (e) {
      console.warn('Failed to load vitals', e)
    } finally {
      setVitalsLoading(false)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const aRes = await getAdmissionByPatientId(patientId)
      const aList = aRes?.data ?? aRes ?? []
      const active = Array.isArray(aList) ? aList.find(x => x.isAdmitted) || aList[0] : aList
      setAdmission(active)

      await loadVitals()

      // load ward rounds for active consultation
      try {
        const wr = await wardRoundApi.getAllWardRounds()
        const all = wr?.data ?? wr ?? []
        const consultId = active?.consultationId || active?.consultation
        const filtered = Array.isArray(all) && consultId ? all.filter(w => w.consultationId === consultId) : []
        setWardRounds(filtered)
      } catch (e) {
        console.warn('Failed to load ward rounds', e)
      }

      // patient details, needed for Prescribe navigation state + vitals card
      try {
        const pRes = await getPatientById(patientId);
        setPatient(pRes?.data ?? pRes);
      } catch (e) {
        console.warn('Failed to load patient', e)
      }

      // lab investigations + prescriptions for this consultation
      const consultId = active?.consultationId || active?.consultation
      if (consultId) {
        const [invRes, presRes] = await Promise.allSettled([
          getInvestigationByConsultationId(consultId),
          getPrescriptionsForConsultation(consultId),
        ]);
        if (invRes.status === 'fulfilled') {
          const raw = invRes.value?.data ?? invRes.value ?? [];
          setLabRequests(Array.isArray(raw) ? raw : []);
        }
        if (presRes.status === 'fulfilled') {
          const raw = presRes.value?.data ?? presRes.value ?? [];
          setRecentPrescriptions(Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? [raw] : []));
        }
      } else {
        setLabRequests([]);
        setRecentPrescriptions([]);
      }
    } catch (err) {
      console.error('DRAdmittedPatient: load error', err)
      toast.error('Failed to load admission or vitals')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (patientId) loadData() }, [patientId])

  const handleWardRoundSubmitted = () => loadData()

  const getDoctorName = (id) =>
    id ? doctorNamesById[id] || 'Unknown Doctor' : null;

  const handleDeleteLab = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lab investigation?')) return;
    try {
      await deleteInvestigation(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting investigation', error);
    }
  };

  const handleDeletePrescription = async (id) => {
    if (!window.confirm('Delete this prescription?')) return;
    try {
      await deletePrescription(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting prescription', error);
    }
  };

  const patientName = patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient'
  const latestVital = getLatestVital(vitals)

  const sortedWardRounds = useMemo(
    () =>
      [...wardRounds].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      ),
    [wardRounds]
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-base-200">
      <OrderInvestigationModal
        isOpen={isInvestigationModalOpen}
        onClose={() => {
          setIsInvestigationModalOpen(false);
          setEditingLab(null);
        }}
        patientId={patientId}
        consultationId={consultationId}
        dependantId={dependantId}
        investigation={editingLab}
        onOrderCreated={loadData}
      />

      {isSidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-50 transform lg:static lg:translate-x-0 ${sidebarMounted ? 'transition-transform duration-300 ease-in-out' : ''} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <DoctorSidebar onCloseSidebar={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onToggleSidebar={() => setIsSidebarOpen(true)} />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {loading ? <div>Loading...</div> : (
            <div className="space-y-6">
              <PatientHeaderActions
                title="Admitted Patient"
                subtitle="Ward round, vitals, and treatment plan"
                fromIncoming={fromIncoming}
                onBack={() => navigate(fromIncoming ? '/dashboard/doctor/incoming' : '/dashboard/doctor/patientVitals')}
              />
              <PatientDetailsCard
                patient={patient}
                summarySubject={summarySubject}
                isViewingDependant={isViewingDependant}
              />
              {isViewingDependant && summarySubject?.fullName && (
                <div className="mb-4 text-sm text-base-content/70">
                  Viewing records for <strong>{summarySubject.fullName}</strong>
                  {summarySubject.relationshipType ? ` (${summarySubject.relationshipType})` : ''}
                  {patientName ? <> - Dependant of <strong>{patientName}</strong></> : null}
                </div>
              )}

              {/* Tabs */}
              <div className="bg-white rounded-lg shadow-sm p-2 inline-flex gap-1">
                <button
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'overview' ? 'bg-primary text-primary-content' : 'text-base-content/70 hover:bg-base-200'
                  }`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'ward' ? 'bg-primary text-primary-content' : 'text-base-content/70 hover:bg-base-200'
                  }`}
                  onClick={() => setActiveTab('ward')}
                >
                  Ward Round
                </button>
              </div>

              {/* Overview — vitals */}
              {activeTab === 'overview' && (
                <CurrentVitalsCard
                  patient={summarySubject}
                  latest={latestVital}
                  loading={vitalsLoading}
                  buttonHidden
                />
              )}

              {/* Ward Round Tab */}
              {activeTab === 'ward' && (
                <div className="space-y-6">
                  <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body p-3 sm:p-5">
                      <h3 className="text-lg font-bold text-base-content mb-3 flex items-center gap-2">
                        <FaNotesMedical className="text-primary" /> New Ward Round
                      </h3>
                      <WardRoundForm
                        patientId={patientId}
                        dependantId={dependantId}
                        consultationId={consultationId}
                        onSubmitted={handleWardRoundSubmitted}
                      />
                    </div>
                  </div>

                  {/* Treatment Plan Section */}
                  <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body p-0">
                      <div className="p-3 sm:p-4 border-b border-base-200 bg-base-50/50 flex flex-col gap-3 sm:gap-0 sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <FaPrescriptionBottleAlt className="text-success w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
                          <h3 className="font-bold text-base sm:text-lg text-base-content">
                            Treatment Plan & Orders
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                          <button
                            className="btn btn-sm btn-ghost text-primary hover:bg-primary/10 gap-2 flex-1 sm:flex-none min-w-[120px]"
                            disabled={!consultationId}
                            onClick={() => setIsInvestigationModalOpen(true)}
                          >
                            <FaFlask className="hidden sm:inline" /> Order Labs
                          </button>
                          <button
                            className="btn btn-sm btn-primary gap-2 flex-1 sm:flex-none min-w-[120px]"
                            disabled={!consultationId}
                            onClick={() =>
                              navigate(
                                `/dashboard/doctor/medical-history/${patientId}/consultation/${consultationId}/prescription`,
                                {
                                  state: {
                                    dependantId,
                                    patientSnapshot: patient,
                                  },
                                },
                              )
                            }
                          >
                            <FaPrescriptionBottleAlt className="hidden sm:inline" /> Prescribe
                          </button>
                        </div>
                      </div>

                      <div className="p-3 sm:p-6 space-y-6 sm:space-y-8">
                        {/* Lab Requests */}
                        <div>
                          <h4 className="text-sm font-bold text-base-content mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-info"></span>
                            Lab Investigations
                          </h4>
                          {labRequests.length > 0 ? (
                            <div className="grid gap-2 sm:gap-3">
                              {labRequests.map((lab, idx) => (
                                <div
                                  key={idx}
                                  className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2"
                                >
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`badge ${lab.status === 'in_progress' ? 'badge-info' : lab.status === 'completed' ? 'badge-success' : 'badge-ghost'} badge-sm`}
                                      >
                                        {lab.status?.replace('_', ' ')}
                                      </span>
                                      <span className="text-xs text-base-content/50">
                                        Requested {formatNigeriaDate(lab.createdAt)}
                                      </span>
                                      {lab.doctorId && (
                                        <span className="text-xs text-base-content/50">
                                          • by Dr. {getDoctorName(lab.doctorId)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-base-content/70">
                                      {lab.tests?.map((test) => test.name).join(', ')}
                                    </div>
                                  </div>

                                  {!lab.isBilled && (
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        className="btn btn-xs btn-ghost text-warning"
                                        onClick={() => {
                                          setEditingLab(lab);
                                          setIsInvestigationModalOpen(true);
                                        }}
                                      >
                                        <FaEdit />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-xs btn-ghost text-error"
                                        onClick={() => handleDeleteLab(lab._id)}
                                      >
                                        <FaTrash />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-base-200/20 rounded-lg border border-dashed border-base-300">
                              <p className="text-sm text-base-content/50">
                                No lab investigations ordered yet
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="divider my-0"></div>

                        {/* Prescriptions */}
                        <div>
                          <h4 className="text-sm font-bold text-base-content mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-success"></span>
                            Active Prescriptions
                          </h4>
                          {recentPrescriptions.length > 0 ? (
                            <div className="grid gap-3">
                              {recentPrescriptions.map((pres, idx) => (
                                <div
                                  key={idx}
                                  className="border border-base-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`badge ${pres.status === 'pending' ? 'badge-warning' : 'badge-success'} badge-sm`}
                                      >
                                        {pres.status}
                                      </span>
                                      <span className="text-xs text-base-content/50">
                                        Ordered {formatNigeriaDate(pres.createdAt)}
                                      </span>
                                      {pres.doctorId && (
                                        <span className="text-xs text-base-content/50">
                                          • by Dr. {getDoctorName(pres.doctorId)}
                                        </span>
                                      )}
                                    </div>
                                    {!pres.isBilled && (
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          className="btn btn-xs btn-ghost text-warning"
                                          onClick={() =>
                                            navigate(
                                              `/dashboard/doctor/medical-history/${patientId}/consultation/${consultationId}/prescription`,
                                              { state: { prescription: pres } },
                                            )
                                          }
                                        >
                                          <FaEdit />
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-xs btn-ghost text-error"
                                          onClick={() => handleDeletePrescription(pres._id)}
                                        >
                                          <FaTrash />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    {pres.medications?.map((med, mIdx) => (
                                      <div key={mIdx} className="flex items-center gap-2 text-sm">
                                        <span className="font-medium text-base-content">{med.drugName}</span>
                                        <span className="text-base-content/40">•</span>
                                        <span className="text-base-content/70">{med.dosage}</span>
                                        <span className="text-base-content/40">•</span>
                                        <span className="text-base-content/70">{med.frequency}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-base-200/20 rounded-lg border border-dashed border-base-300">
                              <p className="text-sm text-base-content/50">
                                No prescriptions ordered yet
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ward Round History */}
                  <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body p-0">
                      <div className="p-3 sm:p-4 border-b border-base-200 bg-base-50/50 flex items-center gap-2">
                        <FaNotesMedical className="text-primary w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
                        <h3 className="font-bold text-base sm:text-lg text-base-content">
                          Ward Round History
                          {sortedWardRounds.length > 0 && ` (${sortedWardRounds.length})`}
                        </h3>
                      </div>

                      <div className="p-3 sm:p-5 space-y-3">
                        {sortedWardRounds.length === 0 ? (
                          <div className="text-center py-8 text-sm text-base-content/50">
                            No ward rounds recorded yet.
                          </div>
                        ) : (
                          sortedWardRounds.map((w) => {
                            const isDischarge = Boolean(w.isDischargeRound);
                            const roundDoctorName = w.doctor
                              ? `${w.doctor.firstName || ''} ${w.doctor.lastName || ''}`.trim()
                              : getDoctorName(w.doctorId);

                            return (
                              <div
                                key={w.id || w._id}
                                className={`rounded-lg border p-4 min-w-0 overflow-hidden ${
                                  isDischarge ? 'border-error/30 bg-error/5' : 'border-base-200 bg-base-100'
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {isDischarge && (
                                      <span className="badge badge-error badge-sm font-medium">
                                        Discharge Round
                                      </span>
                                    )}
                                    <span className="text-xs text-base-content/50">
                                      Dr. {roundDoctorName || 'Unknown'}
                                    </span>
                                  </div>
                                  <span className="text-xs text-base-content/40 shrink-0">
                                    {w.createdAt
                                      ? new Date(w.createdAt).toLocaleString('en-NG', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                      : '—'}
                                  </span>
                                </div>

                                {w.note && (
                                  <p className="text-sm text-base-content/80 whitespace-pre-wrap break-words leading-relaxed min-w-0 overflow-hidden">
                                    {w.note}
                                  </p>
                                )}

                                {w.dischargeNote && (
                                  <div className="mt-3 pt-3 border-t border-base-200 min-w-0">
                                    <span className="text-xs font-bold uppercase tracking-wider text-base-content/50">
                                      Discharge Note
                                    </span>
                                    <p className="text-sm text-base-content/80 whitespace-pre-wrap break-words leading-relaxed mt-1 min-w-0 overflow-hidden">
                                      {w.dischargeNote}
                                    </p>
                                  </div>
                                )}

                                {!w.note && !w.dischargeNote && (
                                  <p className="text-sm text-base-content/40 italic">No note recorded</p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DRAdmittedPatient