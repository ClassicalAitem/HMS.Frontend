import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Header } from '@/components/common'
import NurseSidebar from '@/components/nurse/dashboard/Sidebar'
import { getAdmissionByPatientId } from '@/services/api/admissionApi'
import { getVitalsByPatient, normalizeVitalsResponse } from '@/services/api/vitalsAPI'
import { getPatientById } from '@/services/api/patientsAPI'
import { getDependantById } from '@/services/api/dependantAPI'
import PatientDetailsCard from '@/components/common/PatientDetailsCard'
import VitalsTab from '@/components/admitted/VitalsTab'
import WardRoundTab from '@/components/admitted/WardRoundTab'
import TreatmentPlanTab from '@/components/admitted/TreatmentPlanTab'
import BloodTransfusionTab from '@/components/admitted/BloodTransfusionTab'
import BloodAvailabilityTab from '@/components/admitted/BloodAvailabilityTab'
import IvFluidTab from '@/components/admitted/IvFluidTab'
import EbtTab from '@/components/admitted/EbtTab'
import NeonatalCareTab from '@/components/admitted/NeonatalCareTab'
import AdmissionBillManagerModal from '@/components/modals/AdmissionBillManagerModal'
import NurseReportModal from '@/components/modals/NurseReportModal'
import DischargePatientModal from '@/components/modals/DischargePatientModal'
import toast from 'react-hot-toast'
import { formatNigeriaDateTimeShort } from '@/utils/formatDateTimeUtils'
import {
  FaHeartbeat,
  FaNotesMedical,
  FaTint,
  FaExchangeAlt,
  FaBaby,
  FaBed,
  FaArrowLeft,
  FaFileInvoice,
  FaPills,
  FaPaperPlane,
  FaClipboardList,
  FaSignOutAlt,
  FaCheckCircle,
  FaExclamationTriangle,
} from 'react-icons/fa'

const AdmittedPatient = () => {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const dependantId = location?.state?.dependantId || null
  const dependantSnapshot = location?.state?.dependantSnapshot || null
  const isViewingDependant = !!dependantId

  const [loading, setLoading] = useState(true)
  const [patient, setPatient] = useState(null)
  const [subject, setSubject] = useState(dependantSnapshot)
  const [admission, setAdmission] = useState(location?.state?.admission || null)
  const [vitals, setVitals] = useState([])
  const [vitalsLoading, setVitalsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('vitals')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [sidebarMounted, setSidebarMounted] = useState(false)
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false)

  const consultationId = admission?.consultationId || admission?.consultation || null

  useEffect(() => {
    const id = requestAnimationFrame(() => setSidebarMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Load primary patient profile
  useEffect(() => {
    let mounted = true
    const fetchPatient = async () => {
      try {
        const res = await getPatientById(patientId)
        const pData = res?.data?.data ?? res?.data ?? res
        if (mounted) setPatient(pData)
      } catch (err) {
        console.warn('Failed to load patient profile', err)
      }
    }
    if (patientId) fetchPatient()
    return () => {
      mounted = false
    }
  }, [patientId])

  // Load dependant profile if applicable
  useEffect(() => {
    if (!isViewingDependant || !dependantId || dependantSnapshot) return undefined
    let mounted = true
    const loadDependant = async () => {
      try {
        const response = await getDependantById(dependantId)
        const dependant =
          response?.data?.data?.dependant ??
          response?.data?.dependant ??
          response?.data ??
          response
        if (mounted) setSubject(dependant)
      } catch (error) {
        console.warn('Failed to load dependant', error)
      }
    }
    loadDependant()
    return () => {
      mounted = false
    }
  }, [dependantId, dependantSnapshot, isViewingDependant])

  // Load admission record
  const loadAdmission = async () => {
    try {
      setLoading(true)
      const res = await getAdmissionByPatientId(patientId, {
        ...(dependantId ? { dependantId } : {}),
      })
      const adm = res?.data ?? res
      if (Array.isArray(adm)) {
        const active = adm.find(a => a.status !== 'discharged') || adm[0];
        if (active) setAdmission(active);
      } else if (adm) {
        setAdmission(adm);
      }
    } catch (err) {
      console.warn('Failed to load admission record', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdmission()
  }, [patientId, dependantId])

  // Load vitals
  const loadVitals = async () => {
    try {
      setVitalsLoading(true)
      const res = await getVitalsByPatient(patientId)
      const list = normalizeVitalsResponse(res)
      setVitals(list)
    } catch (err) {
      console.warn('Failed to load vitals', err)
    } finally {
      setVitalsLoading(false)
    }
  }

  useEffect(() => {
    loadVitals()
  }, [patientId])

  const summarySubject = useMemo(() => {
    if (!isViewingDependant) {
      return {
        ...(patient || {}),
        fullName:
          patient?.fullName ||
          `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() ||
          'Unknown Patient',
      }
    }
    const dep = subject || dependantSnapshot || {}
    return {
      ...dep,
      fullName:
        dep.fullName ||
        `${dep.firstName || ''} ${dep.lastName || ''}`.trim() ||
        'Dependant',
      hospitalId: patient?.hospitalId,
    }
  }, [dependantSnapshot, isViewingDependant, patient, subject])

  // Age calculation for Neonatal Care Tab (Option A: age <= 28 days from DOB)
  const isNeonatal = useMemo(() => {
    const dob = summarySubject?.dateOfBirth || summarySubject?.dob
    if (!dob) return false
    const birthDate = new Date(dob)
    if (isNaN(birthDate.getTime())) return false
    const ageInDays = (Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24)
    return ageInDays >= 0 && ageInDays <= 28
  }, [summarySubject])

  const SidebarDrawer = () => (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform lg:static lg:translate-x-0 lg:z-auto ${
          sidebarMounted ? 'transition-transform duration-300 ease-in-out' : ''
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <NurseSidebar onCloseSidebar={() => setIsSidebarOpen(false)} />
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-base-200">
      <SidebarDrawer />
      <div className="flex overflow-hidden flex-col flex-1">
        <Header onToggleSidebar={() => setIsSidebarOpen(true)} />
        <div className="overflow-y-auto flex-1">
          <section className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
            {/* Top Navigation & Status Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/dashboard/nurse/admitted')}
                  className="btn btn-sm btn-ghost btn-circle shrink-0"
                  title="Back to Admitted List"
                >
                  <FaArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold text-base-content flex items-center gap-2 truncate">
                    <FaBed className="text-primary shrink-0" />
                    <span>Inpatient Nursing Care Record</span>
                  </h1>
                  <p className="text-xs text-base-content/60 truncate">
                    Ward: {admission?.ward || admission?.wardId || 'General Ward'}{' '}
                    {admission?.bedNumber ? `· Bed ${admission.bedNumber}` : ''}
                  </p>
                </div>
              </div>

              {/* Status Badge & Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {admission?.status === 'discharged' ? (
                  <>
                    <span className="badge badge-neutral badge-md sm:badge-lg py-2.5 sm:py-3 px-3 sm:px-4 font-semibold">
                      Discharged Inpatient
                    </span>
                    <button
                      className="btn btn-sm sm:btn-md btn-outline btn-primary gap-2"
                      onClick={() => setIsReportModalOpen(true)}
                      title="View Nursing Reports"
                    >
                      <FaClipboardList className="w-4 h-4" />
                      Report
                    </button>
                    <button 
                      className="btn btn-sm sm:btn-md btn-primary gap-2"
                      onClick={() => setIsBillingModalOpen(true)}
                    >
                      <FaFileInvoice className="w-4 h-4" />
                      Preview Bill
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-sm sm:btn-md btn-outline btn-primary gap-2 shadow-xs"
                      onClick={() => setIsReportModalOpen(true)}
                      title="Open Nurse Report & Clinical Summary"
                    >
                      <FaClipboardList className="w-4 h-4" />
                      Report
                    </button>

                    <button 
                      className="btn btn-sm sm:btn-md btn-primary gap-2 shadow-xs"
                      onClick={() => setIsBillingModalOpen(true)}
                      title="Preview Admission & Treatment Invoices"
                    >
                      <FaFileInvoice className="w-4 h-4" />
                      Preview Bill
                    </button>

                    <button 
                      className={`btn btn-sm sm:btn-md gap-2 shadow-xs transition-all ${
                        admission?.dischargeReady
                          ? 'btn-warning text-warning-content font-bold animate-pulse'
                          : 'btn-neutral'
                      }`}
                      onClick={() => setIsDischargeModalOpen(true)}
                      title={admission?.dischargeReady ? "Doctor authorized discharge - click to finalize discharge" : "Discharge patient"}
                    >
                      <FaSignOutAlt className="w-4 h-4" />
                      {admission?.dischargeReady ? 'Discharge Patient (Ready)' : 'Discharge Patient'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Doctor Discharge Clearance Alert Banner */}
            {admission?.status !== 'discharged' && (admission?.dischargeReady || admission?.dischargeOrderNote) && (
              <div className="bg-warning/10 border-2 border-warning/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2.5 bg-warning text-warning-content rounded-xl shrink-0">
                    <FaSignOutAlt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-base-content">
                        Doctor Authorized Discharge
                      </h4>
                      <span className="badge badge-warning badge-sm font-bold animate-pulse">
                        Cleared by Doctor
                      </span>
                    </div>
                    <p className="text-xs text-base-content/80 mt-0.5 font-mono">
                      "{admission.dischargeOrderNote || 'Patient is medically fit for discharge.'}"
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="btn btn-xs sm:btn-sm btn-ghost gap-1.5"
                  >
                    <FaClipboardList className="w-3.5 h-3.5" />
                    Write Report
                  </button>
                  <button
                    onClick={() => setIsDischargeModalOpen(true)}
                    className="btn btn-xs sm:btn-sm btn-warning text-warning-content font-bold gap-1.5 shadow-xs"
                  >
                    <FaSignOutAlt className="w-3.5 h-3.5" />
                    Execute Discharge
                  </button>
                </div>
              </div>
            )}

            {/* Discharged Inpatient Information Banner */}
            {admission?.status === 'discharged' && (
              <div className="bg-neutral/10 border border-neutral/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2.5 bg-neutral text-neutral-content rounded-xl shrink-0">
                    <FaSignOutAlt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-base-content">
                        Patient Discharged
                      </h4>
                      {admission.dischargedByNurseName && (
                        <span className="badge badge-neutral badge-sm font-semibold">
                          Discharged by Nurse: {admission.dischargedByNurseName}
                        </span>
                      )}
                      {admission.dischargedAt && (
                        <span className="text-xs text-base-content/60">
                          on {formatNigeriaDateTimeShort(admission.dischargedAt)}
                        </span>
                      )}
                    </div>
                    {admission.dischargeNotes && (
                      <p className="text-xs text-base-content/80 mt-1 font-mono">
                        "{admission.dischargeNotes}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="btn btn-xs sm:btn-sm btn-outline btn-primary gap-1.5"
                  >
                    <FaClipboardList className="w-3.5 h-3.5" />
                    View Reports
                  </button>
                </div>
              </div>
            )}

            {/* Patient Overview Card */}
            <PatientDetailsCard
                    patient={patient}
                    summarySubject={summarySubject}
                    isViewingDependant={isViewingDependant}
                  guardian={isViewingDependant ? patient : null}
                  />
            
          

            {/* Inpatient Tabs Navigation */}
            <div className="bg-base-100 p-2 rounded-2xl border border-base-200 shadow-sm overflow-x-auto">
              <div className="flex items-center gap-1.5 min-w-max">
                <button
                  onClick={() => setActiveTab('vitals')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'vitals'
                      ? 'bg-primary text-primary-content shadow-sm'
                      : 'text-base-content/70 hover:bg-base-200'
                  }`}
                >
                  <FaHeartbeat className="w-4 h-4" />
                  Vitals Chart
                </button>

                <button
                  onClick={() => setActiveTab('ward')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'ward'
                      ? 'bg-primary text-primary-content shadow-sm'
                      : 'text-base-content/70 hover:bg-base-200'
                  }`}
                >
                  <FaNotesMedical className="w-4 h-4" />
                  Ward Rounds
                </button>

                <button
                  onClick={() => setActiveTab('treatment')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'treatment'
                      ? 'bg-primary text-primary-content shadow-sm'
                      : 'text-base-content/70 hover:bg-base-200'
                  }`}
                >
                  <FaPills className="w-4 h-4" />
                  Treatment Plan
                </button>

                <button
                  onClick={() => setActiveTab('blood')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'blood'
                      ? 'bg-primary text-primary-content shadow-sm'
                      : 'text-base-content/70 hover:bg-base-200'
                  }`}
                >
                  <FaTint className="w-4 h-4" />
                  Blood Transfusion
                </button>

                <button
                  onClick={() => setActiveTab('ivfluid')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'ivfluid'
                      ? 'bg-primary text-primary-content shadow-sm'
                      : 'text-base-content/70 hover:bg-base-200'
                  }`}
                >
                  <FaTint className="w-4 h-4" />
                  IV Fluid Balance
                </button>

                <button
                  onClick={() => setActiveTab('ebt')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'ebt'
                      ? 'bg-primary text-primary-content shadow-sm'
                      : 'text-base-content/70 hover:bg-base-200'
                  }`}
                >
                  <FaExchangeAlt className="w-4 h-4" />
                  Exchange Transfusion (EBT)
                </button>

                {/* Neonatal Care Tab (Option A: age <= 28 days) */}
                {isNeonatal && (
                  <button
                    onClick={() => setActiveTab('neonatal')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                      activeTab === 'neonatal'
                        ? 'bg-primary text-primary-content shadow-sm'
                        : 'text-base-content/70 hover:bg-base-200'
                    }`}
                  >
                    <FaBaby className="w-4 h-4" />
                    Neonatal Care (SCBU)
                  </button>
                )}
              </div>
            </div>

            {/* Tab Panels */}
            {activeTab === 'vitals' && (
              <VitalsTab
                patientId={patientId}
                dependantId={dependantId}
                consultationId={consultationId}
                patient={patient}
                vitals={vitals}
                loading={vitalsLoading}
                onRefresh={loadVitals}
                isDoctor={false}
                isNurse={true}
              />
            )}

            {activeTab === 'ward' && (
              <WardRoundTab
                patientId={patientId}
                dependantId={dependantId}
                admission={admission}
                consultationId={consultationId}
                isDoctor={false}
                isNurse={true}
                onRoundSaved={loadAdmission}
              />
            )}

            {activeTab === 'treatment' && (
              <TreatmentPlanTab
                admissionId={admission?._id || admission?.id}
                isPharmacy={false}
                isNurse={true}
              />
            )}

            {activeTab === 'blood' && (
              <div className="space-y-4">
                <BloodAvailabilityTab
                  admissionId={admission?.id || admission?._id}
                  isNurse
                />
                <BloodTransfusionTab
                  patientId={patientId}
                  dependantId={dependantId}
                  consultationId={consultationId}
                  admissionId={admission?.id || admission?._id}
                  isDoctor={false}
                  isNurse={true}
                />
              </div>
            )}

            {activeTab === 'ivfluid' && (
              <IvFluidTab
                patientId={patientId}
                dependantId={dependantId}
                consultationId={consultationId}
                isDoctor={false}
                isNurse={true}
              />
            )}

            {activeTab === 'ebt' && (
              <EbtTab
                patientId={patientId}
                dependantId={dependantId}
                consultationId={consultationId}
                isDoctor={false}
              />
            )}

            {activeTab === 'neonatal' && isNeonatal && (
              <NeonatalCareTab
                patientId={patientId}
                dependantId={dependantId}
                consultationId={consultationId}
              />
            )}
          </section>
        </div>
      </div>

      <AdmissionBillManagerModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        admissionId={admission?._id || admission?.id || null}
        patientId={patientId}
        dependantId={isViewingDependant ? dependantId : null}
        patientName={summarySubject.fullName}
      />

      <NurseReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        admissionId={admission?._id || admission?.id}
        patientId={patientId}
        dependantId={isViewingDependant ? dependantId : null}
        patientName={summarySubject.fullName}
        wardName={admission?.ward || admission?.wardId || 'General Ward'}
        bedNumber={admission?.bedNumber}
        onReportSaved={loadAdmission}
      />

      <DischargePatientModal
        isOpen={isDischargeModalOpen}
        onClose={() => setIsDischargeModalOpen(false)}
        admission={admission}
        patientName={summarySubject.fullName}
        onDischarged={loadAdmission}
        onOpenBillingModal={() => setIsBillingModalOpen(true)}
      />
    </div>
  )
}

export default AdmittedPatient