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
import BloodTransfusionTab from '@/components/admitted/BloodTransfusionTab'
import IvFluidTab from '@/components/admitted/IvFluidTab'
import EbtTab from '@/components/admitted/EbtTab'
import CreateBillModal from '@/components/modals/CreateBillModal'
import SendToHmoModal from '@/components/modals/SendToHmoModal'
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
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false)
  const [isSendToHmoOpen, setIsSendToHmoOpen] = useState(false)

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
      if (adm) setAdmission(adm)
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
                  <span className="badge badge-neutral badge-md sm:badge-lg py-2.5 sm:py-3 px-3 sm:px-4 font-semibold">
                    Discharged Inpatient
                  </span>
                ) : (
                  <span className="badge badge-success badge-md sm:badge-lg py-2.5 sm:py-3 px-3 sm:px-4 text-white font-semibold gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    Currently Admitted
                  </span>
                )}

                {/* Send to Cashier */}
                <button
                  type="button"
                  onClick={() => setIsCreateBillOpen(true)}
                  className="btn btn-sm btn-primary rounded-xl gap-1.5 font-semibold shadow-sm"
                  title="Generate bill and send to Cashier"
                >
                  <FaCashRegister className="w-3.5 h-3.5" />
                  <span>Send to Cashier</span>
                </button>

                {/* Send to HMO */}
                <button
                  type="button"
                  onClick={() => setIsSendToHmoOpen(true)}
                  className="btn btn-sm btn-outline btn-primary rounded-xl gap-1.5 font-semibold shadow-sm"
                  title="Generate bill and send to HMO"
                >
                  <FaPaperPlane className="w-3.5 h-3.5" />
                  <span>Send to HMO</span>
                </button>
              </div>
            </div>

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

            {activeTab === 'blood' && (
              <BloodTransfusionTab
                patientId={patientId}
                dependantId={dependantId}
                consultationId={consultationId}
                isDoctor={false}
                isNurse={true}
              />
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

      {/* Create Bill / Send to Cashier Modal */}
      <CreateBillModal
        isOpen={isCreateBillOpen}
        onClose={() => setIsCreateBillOpen(false)}
        patientId={patientId}
        dependantId={isViewingDependant ? dependantId : null}
        admissionId={admission?._id || admission?.id || null}
        consultationId={consultationId}
        onSuccess={() => {
          setIsCreateBillOpen(false)
          toast.success('Bill submitted to Cashier successfully')
          loadAdmission()
        }}
      />

      {/* Send to HMO Modal */}
      <SendToHmoModal
        isOpen={isSendToHmoOpen}
        onClose={() => setIsSendToHmoOpen(false)}
        patientId={patientId}
        patientName={
          summarySubject?.fullName ||
          `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim()
        }
        dependantId={isViewingDependant ? dependantId : null}
        admissionId={admission?._id || admission?.id || null}
        consultationId={consultationId}
        doctorName={
          admission?.doctorName ||
          (admission?.doctor
            ? `${admission?.doctor?.firstName || ''} ${admission?.doctor?.lastName || ''}`.trim()
            : 'Attending Physician')
        }
        consultationDate={admission?.admittedAt || admission?.createdAt || new Date().toISOString()}
        visitReason={admission?.reasonForAdmission || admission?.diagnosis || 'Inpatient Nursing Care & Admission'}
        diagnosis={admission?.diagnosis || 'Inpatient Admission'}
        onSentSuccessfully={() => {
          setIsSendToHmoOpen(false)
          toast.success('Bill sent to HMO successfully')
          loadAdmission()
        }}
      />
    </div>
  )
}

export default AdmittedPatient