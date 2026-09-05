import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Header } from '@/components/common'
import MedicalDirectorSidebar from '@/components/medical-director/dashboard/Sidebar'
import { getAdmissionByPatientId } from '@/services/api/admissionApi'
import { getVitalsByPatient, normalizeVitalsResponse } from '@/services/api/vitalsAPI'
import { getPatientById } from '@/services/api/patientsAPI'
import { getDependantById } from '@/services/api/dependantAPI'
import OrderInvestigationModal from '@/pages/doctor/incoming/modals/OrderInvestigationModal'
import PatientDetailsCard from '@/components/common/PatientDetailsCard'
import PatientHeaderActions from '@/components/doctor/patient/PatientHeaderActions'
import VitalsTab from '@/components/admitted/VitalsTab'
import WardRoundTab from '@/components/admitted/WardRoundTab'
import BloodTransfusionTab from '@/components/admitted/BloodTransfusionTab'
import IvFluidTab from '@/components/admitted/IvFluidTab'
import EbtTab from '@/components/admitted/EbtTab'
import NeonatalCareTab from '@/components/admitted/NeonatalCareTab'
import CreateBillModal from '@/components/modals/CreateBillModal'
import SendToHmoModal from '@/components/modals/SendToHmoModal'
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils'
import toast from 'react-hot-toast'
import {
  FaHeartbeat,
  FaNotesMedical,
  FaTint,
  FaExchangeAlt,
  FaBaby,
  FaBed,
  FaArrowLeft,
  FaCashRegister,
  FaPaperPlane,
} from 'react-icons/fa'

const MDAdmittedPatient = () => {
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
  const [isInvestigationModalOpen, setIsInvestigationModalOpen] = useState(false)
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false)
  const [isSendToHmoOpen, setIsSendToHmoOpen] = useState(false)

  const consultation = admission?.consultationId || admission?.consultation || null
  const consultationId = typeof consultation === 'object'
    ? consultation?.id || consultation?._id || null
    : consultation

  useEffect(() => {
    const id = requestAnimationFrame(() => setSidebarMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Load primary patient details
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

  // Load dependant details if applicable
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
      cardType: patient?.cardType,
      familyName: patient?.familyName,
      companyName: patient?.companyName,
    }
  }, [dependantSnapshot, isViewingDependant, patient, subject])

  // Load admission record
  const loadAdmission = async () => {
    try {
      setLoading(true)
      const res = await getAdmissionByPatientId(patientId, {
        ...(dependantId ? { dependantId } : {}),
      })
      const rawAdmissions = res?.data?.data ?? res?.data ?? res
      const admissions = Array.isArray(rawAdmissions)
        ? rawAdmissions
        : rawAdmissions
          ? [rawAdmissions]
          : []
      const matchingAdmission = admissions.find((item) =>
        dependantId
          ? String(item?.dependantId) === String(dependantId)
          : !item?.dependantId
      ) || admissions[0]
      if (matchingAdmission) setAdmission(matchingAdmission)
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

  const subjectData = useMemo(() => {
    if (isViewingDependant) {
      return subject || dependantSnapshot || null
    }
    return patient
  }, [isViewingDependant, subject, dependantSnapshot, patient])

  const effectiveAdmissionId = admission?._id || admission?.id || null

  const tabs = [
    {
      id: 'vitals',
      label: 'Vitals Charting',
      icon: FaHeartbeat,
      count: vitals.length,
    },
    {
      id: 'ward',
      label: 'Ward Rounds',
      icon: FaNotesMedical,
    },
    {
      id: 'blood',
      label: 'Blood Transfusion',
      icon: FaTint,
    },
    {
      id: 'ivfluid',
      label: 'IV Fluid Intake / Output',
      icon: FaExchangeAlt,
    },
    {
      id: 'ebt',
      label: 'EBT Monitoring',
      icon: FaExchangeAlt,
    },
    {
      id: 'neonatal',
      label: 'Neonatal Care',
      icon: FaBaby,
    },
  ]

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
        <MedicalDirectorSidebar onCloseSidebar={() => setIsSidebarOpen(false)} />
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
                  onClick={() => navigate('/dashboard/medical-director/admitted')}
                  className="btn btn-sm btn-ghost btn-circle shrink-0"
                  title="Back to Admitted List"
                >
                  <FaArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold text-base-content flex items-center gap-2 truncate">
                    <FaBed className="text-primary shrink-0" />
                    <span>Inpatient Clinical Record</span>
                  </h1>
                  
                </div>
              </div>

              {/* Status Badge & Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
               

                {/* Create Inpatient Bill */}
                <button
                  type="button"
                  onClick={() => setIsCreateBillOpen(true)}
                  className="btn btn-outline btn-primary btn-sm rounded-xl gap-1.5 font-medium shadow-xs"
                >
                  <FaCashRegister className="w-3.5 h-3.5" />
                  <span>Create Bill</span>
                </button>

                {/* Send to HMO Modal Trigger */}
                <button
                  type="button"
                  onClick={() => setIsSendToHmoOpen(true)}
                  className="btn btn-outline btn-warning btn-sm rounded-xl gap-1.5 font-medium shadow-xs"
                >
                  <FaPaperPlane className="w-3.5 h-3.5" />
                  <span>Send to HMO</span>
                </button>

                {/* Patient Header Quick Actions (Prescribe, Lab, etc.)
                <PatientHeaderActions
                  patientId={patientId}
                  dependantId={dependantId}
                  dependantSnapshot={subjectData}
                  isAdmittedPatient={true}
                  admissionId={effectiveAdmissionId}
                  consultationId={consultationId}
                  patient={patient}
                  onOpenInvestigationModal={() => setIsInvestigationModalOpen(true)}
                /> */}
              </div>
            </div>

            {/* Inpatient Identity & Bed Summary */}
            <PatientDetailsCard
              patient={patient}
              summarySubject={summarySubject}
              isViewingDependant={isViewingDependant}
              activeAdmission={admission}
            />

            {/* Admission Context Banner */}
            {admission && (
              <div className="p-4 bg-base-100 rounded-2xl shadow-xs border border-base-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <span className="text-base-content/60 font-medium">Assigned Ward:</span>{' '}
                    <span className="font-bold text-base-content">{admission.ward || admission.wardId || 'General Ward'}</span>
                  </div>
                  {admission.bedNumber && (
                    <div className="border-l border-base-200 pl-3">
                      <span className="text-base-content/60 font-medium">Bed:</span>{' '}
                      <span className="font-bold text-primary">#{admission.bedNumber}</span>
                    </div>
                  )}
                  {admission.doctorName && (
                    <div className="border-l border-base-200 pl-3">
                      <span className="text-base-content/60 font-medium">Admitting Doctor:</span>{' '}
                      <span className="font-bold text-base-content">{admission.doctorName}</span>
                    </div>
                  )}
                </div>

                <div className="text-base-content/60">
                  Admitted At:{' '}
                  <span className="font-medium text-base-content">
                    {admission.confirmedAt
                      ? formatNigeriaDateTime(admission.confirmedAt)
                      : admission.admittedAt
                      ? formatNigeriaDateTime(admission.admittedAt)
                      : '—'}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Tabs Header */}
            <div className="bg-base-100 p-2 rounded-2xl shadow-xs border border-base-200 overflow-x-auto">
              <div className="flex items-center gap-1.5 min-w-max">
                {tabs.map((t) => {
                  const Icon = t.icon
                  const isActive = activeTab === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-primary text-primary-content shadow-xs font-semibold'
                          : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{t.label}</span>
                      {typeof t.count === 'number' && (
                        <span
                          className={`badge badge-xs font-bold ${
                            isActive
                              ? 'bg-primary-content/20 text-primary-content'
                              : 'bg-base-300 text-base-content/70'
                          }`}
                        >
                          {t.count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Active Tab View Panel */}
            {activeTab === 'vitals' && (
              <VitalsTab
                vitals={vitals}
                loading={vitalsLoading}
                patientId={patientId}
                dependantId={dependantId}
                consultationId={consultationId}
                admissionId={effectiveAdmissionId}
                onRefresh={loadVitals}
                isDoctor={true}
                isNurse={false}
              />
            )}

            {activeTab === 'ward' && (
              <WardRoundTab
                patientId={patientId}
                dependantId={dependantId}
                admission={admission}
                consultationId={consultationId}
                isDoctor={true}
                isNurse={false}
                onRoundSaved={loadAdmission}
              />
            )}

            {activeTab === 'blood' && (
              <BloodTransfusionTab
                patientId={patientId}
                dependantId={dependantId}
                consultationId={consultationId}
                isDoctor={true}
                isNurse={false}
              />
            )}

            {activeTab === 'ivfluid' && (
              <IvFluidTab
                patientId={patientId}
                dependantId={dependantId}
                consultationId={consultationId}
                isDoctor={true}
                isNurse={false}
              />
            )}

            {activeTab === 'ebt' && (
              <EbtTab
                patientId={patientId}
                dependantId={dependantId}
                consultationId={consultationId}
                isDoctor={true}
                isNurse={false}
              />
            )}

            {activeTab === 'neonatal' && (
              <NeonatalCareTab
                patientId={patientId}
                dependantId={dependantId}
                consultationId={consultationId}
                isDoctor={true}
                isNurse={false}
              />
            )}
          </section>
        </div>
      </div>

      {/* Investigation Order Modal */}
      {isInvestigationModalOpen && (
        <OrderInvestigationModal
          isOpen={isInvestigationModalOpen}
          onClose={() => setIsInvestigationModalOpen(false)}
          patientId={patientId}
          dependantId={dependantId}
          consultationId={consultationId}
          admissionId={effectiveAdmissionId}
        />
      )}

      {/* Create Inpatient Bill Modal */}
      {isCreateBillOpen && (
        <CreateBillModal
          isOpen={isCreateBillOpen}
          onClose={() => setIsCreateBillOpen(false)}
          patientId={patientId}
          dependantId={dependantId}
          admissionId={effectiveAdmissionId}
          consultationId={consultationId}
          onSuccess={() => {
            setIsCreateBillOpen(false)
            loadAdmission()
            toast.success('Inpatient bill generated successfully')
          }}
        />
      )}

      {/* Send to HMO Modal */}
      {isSendToHmoOpen && (
        <SendToHmoModal
          isOpen={isSendToHmoOpen}
          onClose={() => setIsSendToHmoOpen(false)}
          patientId={patientId}
          dependantId={dependantId}
          patient={patient}
          dependant={isViewingDependant ? subjectData : null}
          consultationId={consultationId}
          onSuccess={() => {
            setIsSendToHmoOpen(false)
            toast.success('Patient request successfully routed to HMO Desk')
          }}
        />
      )}
    </div>
  )
}

export default MDAdmittedPatient
