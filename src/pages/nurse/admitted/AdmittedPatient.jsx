import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Header } from '@/components/common'
import PatientDetailsCard from '@/components/common/PatientDetailsCard'
import PatientHeaderActions from '@/components/doctor/patient/PatientHeaderActions'
import DoctorSidebar from '@/components/doctor/dashboard/Sidebar'
import NurseSidebar from '@/components/nurse/dashboard/Sidebar'
import { getAdmissionByPatientId } from '@/services/api/admissionApi'
import { getVitalsByPatient, createVital, updateVital, normalizeVitalsResponse, getLatestVital, sortVitalsByTime } from '@/services/api/vitalsAPI'
import { getPatientById } from '@/services/api/patientsAPI'
import CurrentVitalsCard from '@/components/doctor/patient/CurrentVitalsCard'
import VitalsHistoryTable from '@/components/doctor/patient/VitalsHistoryTable'
import WardRoundForm from '@/components/admitted/WardRoundForm'
import OrderInvestigationModal from '@/pages/doctor/incoming/modals/OrderInvestigationModal'
import { getPrescriptionsForConsultation, deletePrescription } from '@/services/api/prescriptionsAPI'
import { getInvestigationByConsultationId, deleteInvestigation } from '@/services/api/investigationAPI'
import { getAllDependantsForPatient, getDependantById } from '@/services/api/dependantAPI'
import wardRoundApi from '@/services/api/wardRoundApi'
import { useAppSelector } from '@/store/hooks'
import toast from 'react-hot-toast'
import { FaEdit, FaFlask, FaPrescriptionBottleAlt, FaTrash } from 'react-icons/fa'
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils'

const AdmittedPatient = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromIncoming = location?.state?.from === 'incoming';
  const dependantId = location?.state?.dependantId || null;
  const dependantSnapshot = location?.state?.dependantSnapshot || null;
  const isViewingDependant = !!dependantId;
  const { user } = useAppSelector(s => s.auth)
  const role = String(user?.role || '').toLowerCase()
  const [loading, setLoading] = useState(true)
  const [patient, setPatient] = useState(null);
  const [subject, setSubject] = useState(dependantSnapshot);
  const [labRequests, setLabRequests] = useState([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [sidebarMounted, setSidebarMounted] = useState(false)
  const [admission, setAdmission] = useState(null)
  const [vitals, setVitals] = useState([])
  const [wardRounds, setWardRounds] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [doctorNamesById, setDoctorNamesById] = useState({});
  const [editingLab, setEditingLab] = useState(null);
  const [isInvestigationModalOpen, setIsInvestigationModalOpen] = useState(false);

  // Record Vitals modal state
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [editingVitalId, setEditingVitalId] = useState(null);
  const [recordForm, setRecordForm] = useState({ bp: "", pulse: "", temperature: "", weight: "", spo2: "", height: "", respiratoryRate: "", notes: "" });
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState("");

  // The real consultation ID lives on the admission record, not the URL —
  // this route only has :patientId, so useParams().consultationId is always undefined.
  const consultationId = admission?.consultationId || admission?.consultation || null;

  useEffect(() => { const id = requestAnimationFrame(() => setSidebarMounted(true)); return () => cancelAnimationFrame(id) }, [])

  const summarySubject = useMemo(() => {
    const guardian = patient || {};
    if (!isViewingDependant) {
      return {
        ...guardian,
        fullName: guardian.fullName || `${guardian.firstName || ''} ${guardian.lastName || ''}`.trim() || 'Unknown',
      };
    }
    const dep = subject || dependantSnapshot || {};
    return {
      ...dep,
      fullName: dep.fullName || `${dep.firstName || ''} ${dep.lastName || ''}`.trim() || 'Dependant',
      hospitalId: guardian.hospitalId,
    };
  }, [isViewingDependant, subject, dependantSnapshot, patient]);

  const patientName = useMemo(
    () => patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim(),
    [patient],
  );

  const loadData = async () => {
    try {
      setLoading(true)
      const aRes = await getAdmissionByPatientId(patientId)
      const aList = aRes?.data ?? aRes ?? []
      const list = Array.isArray(aList) ? aList : [aList].filter(Boolean)
      const scoped = list.filter(a =>
        dependantId ? a.dependantId === dependantId : !a.dependantId
      )
      const nonDischarged = scoped.filter(a => a.status !== 'discharged')
      const confirmed = nonDischarged.filter(a => !!a.confirmedAt)
      const active = (confirmed.length > 0 ? confirmed : nonDischarged)
        .sort((a, b) => new Date(b.confirmedAt || b.createdAt || 0) - new Date(a.confirmedAt || a.createdAt || 0))[0]
        || list[0]
      setAdmission(active)

      // vitals — scoped to this patient/dependant
      const vRes = await getVitalsByPatient(patientId)
      const vList = normalizeVitalsResponse(vRes)
      const scopedVitals = isViewingDependant
        ? vList.filter(v => v.dependantId === dependantId)
        : vList.filter(v => !v.dependantId)
      setVitals(scopedVitals)

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

      // patient details, needed for Prescribe navigation state
      try {
        const pRes = await getPatientById(patientId);
        setPatient(pRes?.data ?? pRes);
      } catch (e) {
        console.warn('Failed to load patient', e)
      }

      // dependant details, if none was passed in via snapshot
      if (isViewingDependant && !dependantSnapshot) {
        try {
          const dRes = await getDependantById(dependantId);
          const dep = dRes?.data?.data?.dependant ?? dRes?.data?.dependant ?? dRes?.data ?? dRes;
          setSubject(dep);
        } catch (e) {
          console.warn('Failed to load dependant', e)
        }
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
      console.error('AdmittedPatient: load error', err)
      toast.error('Failed to load admission or vitals')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (patientId) loadData() }, [patientId, dependantId])

  const Sidebar = role === 'nurse' ? NurseSidebar : DoctorSidebar

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

  const latest = useMemo(() => getLatestVital(vitals), [vitals]);
  const sortedVitals = useMemo(() => sortVitalsByTime(vitals), [vitals]);

  const enrichedVitals = useMemo(() =>
    Array.isArray(sortedVitals)
      ? sortedVitals.map(vital => ({
          ...vital,
          isForDependant: !!vital.dependantId,
          forName: summarySubject?.fullName || 'Patient',
        }))
      : [],
    [sortedVitals, summarySubject]
  );

  const enrichedLatest = useMemo(() => enrichedVitals[0] || latest, [enrichedVitals, latest]);

  const openRecordVitals = () => {
    setEditingVitalId(null);
    setRecordForm({ bp: "", pulse: "", temperature: "", weight: "", spo2: "", height: "", respiratoryRate: "", notes: "" });
    setIsRecordOpen(true);
  };

  const openEditVitals = () => {
    if (!latest) return;
    setEditingVitalId(latest?.id || latest?._id || null);
    setRecordForm({
      bp: latest?.bp || latest?.bloodPressure || "",
      pulse: latest?.pulse || latest?.heartRate || "",
      temperature: latest?.temperature || "",
      weight: latest?.weight || "",
      spo2: latest?.spo2 || latest?.oxygenSaturation || latest?.oxygen || "",
      height: latest?.height || "",
      respiratoryRate: latest?.respiratoryRate || "",
      notes: latest?.notes || "",
    });
    setIsRecordOpen(true);
  };

  const handleSaveVitals = async () => {
    try {
      setRecordLoading(true);
      setRecordError("");
      const payload = {
        patientId,
        dependantId: dependantId || undefined,
        nurseId: user?.id,
        bp: recordForm.bp,
        temperature: recordForm.temperature ? Number(recordForm.temperature) : undefined,
        weight: recordForm.weight ? Number(recordForm.weight) : undefined,
        pulse: recordForm.pulse ? Number(recordForm.pulse) : undefined,
        spo2: recordForm.spo2 ? Number(recordForm.spo2) : undefined,
        height: recordForm.height ? Number(recordForm.height) : undefined,
        respiratoryRate: recordForm.respiratoryRate ? Number(recordForm.respiratoryRate) : undefined,
        notes: recordForm.notes || undefined,
      };

      if (editingVitalId) {
        await updateVital(editingVitalId, payload);
      } else {
        await createVital(payload);
      }

      setIsRecordOpen(false);
      setEditingVitalId(null);
      setRecordForm({ bp: "", pulse: "", temperature: "", weight: "", spo2: "", height: "", respiratoryRate: "", notes: "" });
      await loadData();
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to record vitals';
      setRecordError(msg);
    } finally {
      setRecordLoading(false);
    }
  };

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
        <Sidebar onCloseSidebar={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onToggleSidebar={() => setIsSidebarOpen(true)} />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {loading ? <div>Loading...</div> : (
            <div className="space-y-6">
              {/* Tabs (doctor-only) */}
              {role === 'doctor' && (
                <div className="bg-white rounded shadow-sm p-3">
                  <div className="flex gap-2">
                    <button className={`px-3 py-2 rounded ${activeTab==='overview' ? 'bg-primary text-primary-content' : 'hover:bg-base-200'}`} onClick={()=>setActiveTab('overview')}>Overview</button>
                    <button className={`px-3 py-2 rounded ${activeTab==='ward' ? 'bg-primary text-primary-content' : 'hover:bg-base-200'}`} onClick={()=>setActiveTab('ward')}>Ward Round</button>
                  </div>
                </div>
              )}
               <PatientHeaderActions
                          title="Patient Details"
                          subtitle="Vitals overview and history"
                          fromIncoming={fromIncoming}
                          onBack={() => navigate(fromIncoming ? "/dashboard/doctor/incoming" : "/dashboard/doctor/patientVitals")}
                        />
              
                         {/* Patient Info */}
                          <PatientDetailsCard
                            patientId={patientId}
                            patient={patient}
                            summarySubject={summarySubject}
                            isViewingDependant={isViewingDependant}
                          />
              
                        {isViewingDependant && summarySubject?.fullName && (
                          <div className="mb-4 text-sm text-base-content/70">
                            Viewing records for <strong>{summarySubject.fullName}</strong>
                            {summarySubject.relationshipType ? ` (${summarySubject.relationshipType})` : ""}
                            {patientName ? <> — Dependant of <strong>{patientName}</strong></> : null}
                          </div>
                        )}

              {/* Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Vitals</h3>
                    <div className="flex gap-2">
                      <button className="btn btn-sm btn-primary" onClick={openRecordVitals}>
                        + Record Vitals
                      </button>
                      {latest && (
                        <button className="btn btn-sm btn-outline" onClick={openEditVitals}>
                          Edit Vitals
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="">
                    <CurrentVitalsCard
                      patient={summarySubject}
                      latest={enrichedLatest}
                      loading={loading}
                      onRecordOpen={openRecordVitals}
                      buttonHidden={true}
                    />
                  </div>
                    <VitalsHistoryTable
                      sortedVitals={enrichedVitals}
                      loading={loading}
                      patientName={summarySubject?.fullName || 'Patient'}
                      scopedToSingleSubject={true}
                    />
                </div>
              )}

              {/* Ward Round Tab */}
              {activeTab === 'ward' && role === 'doctor' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Ward Round</h3>
                  <WardRoundForm patientId={patientId} dependantId={dependantId} consultationId={consultationId} onSubmitted={handleWardRoundSubmitted} />

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

                  <h4 className="text-lg font-medium">Ward Round History</h4>
                  <div className="bg-white p-4 rounded shadow-sm">
                    {wardRounds.length === 0 ? <div className="text-sm text-muted">No ward rounds recorded yet.</div> : (
                      <ul className="space-y-2 text-sm">
                        {wardRounds.map(w => (
                          <li key={w._id || w.id} className="border-b py-2">
                            <div className="text-sm text-gray-700">{formatNigeriaDate(w.createdAt || Date.now())}</div>
                            <div className="text-sm">{w.note}</div>
                            {w.isDischargeRound && <div className="text-xs text-red-600">Discharge round</div>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Record Vitals Modal */}
      {isRecordOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              {editingVitalId ? 'Edit Vitals' : 'Record New Vitals'} - {summarySubject?.fullName || 'Patient'}
            </h3>
            <p className="py-1 text-sm">Enter the latest vital signs for this patient.</p>

            <div className="mb-4 text-sm text-base-content/70">
              Recording vitals for <span className="font-medium text-base-content">{summarySubject?.fullName || 'Patient'}</span>
              {isViewingDependant && summarySubject?.relationshipType ? ` (${summarySubject.relationshipType})` : ''}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div>
                <label className="block mb-1 text-sm text-base-content/70">Blood Pressure</label>
                <input type="text" placeholder="120/80" className="input input-bordered w-full"
                  value={recordForm.bp}
                  onChange={(e) => setRecordForm((f) => ({ ...f, bp: e.target.value }))}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-base-content/70">Pulse</label>
                <input type="number" placeholder="78" className="input input-bordered w-full"
                  value={recordForm.pulse}
                  onChange={(e) => setRecordForm((f) => ({ ...f, pulse: e.target.value }))}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-base-content/70">Weight</label>
                <input type="number" placeholder="62" className="input input-bordered w-full"
                  value={recordForm.weight}
                  onChange={(e) => setRecordForm((f) => ({ ...f, weight: e.target.value }))}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-base-content/70">Temperature (°C)</label>
                <input type="number" placeholder="98.6" className="input input-bordered w-full"
                  value={recordForm.temperature}
                  onChange={(e) => setRecordForm((f) => ({ ...f, temperature: e.target.value }))}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-base-content/70">SpO2</label>
                <input type="number" placeholder="98" className="input input-bordered w-full"
                  value={recordForm.spo2}
                  onChange={(e) => setRecordForm((f) => ({ ...f, spo2: e.target.value }))}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-base-content/70">Height (cm)</label>
                <input type="number" placeholder="170" className="input input-bordered w-full"
                  value={recordForm.height}
                  onChange={(e) => setRecordForm((f) => ({ ...f, height: e.target.value }))}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-base-content/70">Respiratory Rate (bpm)</label>
                <input type="number" placeholder="16" className="input input-bordered w-full"
                  value={recordForm.respiratoryRate}
                  onChange={(e) => setRecordForm((f) => ({ ...f, respiratoryRate: e.target.value }))}
                />
              </div>
            </div>

            {recordError && <p className="mt-2 text-sm text-error">{recordError}</p>}

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => { setIsRecordOpen(false); setRecordError(""); setEditingVitalId(null); }}
              >
                Cancel
              </button>
              <button
                className={`btn btn-primary ${recordLoading ? 'loading' : ''}`}
                onClick={handleSaveVitals}
              >
                {editingVitalId ? 'Save Changes' : 'Record Vitals'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdmittedPatient