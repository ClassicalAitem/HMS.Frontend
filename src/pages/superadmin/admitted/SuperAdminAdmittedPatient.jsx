import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { SuperAdminLayout } from '@/layouts/superadmin'
import { getAdmissionByPatientId } from '@/services/api/admissionApi'
import { getVitalsByPatient, normalizeVitalsResponse } from '@/services/api/vitalsAPI'
import { getPatientById } from '@/services/api/patientsAPI'
import { getDependantById } from '@/services/api/dependantAPI'
import usersAPI from '@/services/api/usersAPI'
import PatientDetailsCard from '@/components/common/PatientDetailsCard'
import VitalsTab from '@/components/admitted/VitalsTab'
import WardRoundTab from '@/components/admitted/WardRoundTab'
import BloodTransfusionTab from '@/components/admitted/BloodTransfusionTab'
import IvFluidTab from '@/components/admitted/IvFluidTab'
import EbtTab from '@/components/admitted/EbtTab'
import NeonatalCareTab from '@/components/admitted/NeonatalCareTab'
import CreateBillModal from '@/components/modals/CreateBillModal'
import SendToHmoModal from '@/components/modals/SendToHmoModal'
import { formatNigeriaDateTime, formatNigeriaDate } from '@/utils/formatDateTimeUtils'
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
  FaCalendarAlt,
  FaUserMd,
} from 'react-icons/fa'

const getDoctorId = (admission) => {
  const doctorId = admission?.doctorId
  if (typeof doctorId === 'object') return doctorId?.id || doctorId?._id || null
  return doctorId || admission?.doctor?.id || admission?.doctor?._id || null
}

const getDoctorName = (response) => {
  const user = response?.data?.data ?? response?.data ?? response
  if (!user) return null
  if (user.name) return user.name
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim()
  return name || null
}

const SuperAdminAdmittedPatient = () => {
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
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false)
  const [isSendToHmoOpen, setIsSendToHmoOpen] = useState(false)

  const consultation = admission?.consultationId || admission?.consultation || null
  const consultationId =
    typeof consultation === 'object'
      ? consultation?.id || consultation?._id || null
      : consultation

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
      const matchingAdmission =
        admissions.find((item) =>
          dependantId
            ? String(item?.dependantId) === String(dependantId)
            : !item?.dependantId
        ) || admissions[0]
      if (matchingAdmission) {
        const doctorId = getDoctorId(matchingAdmission)
        let doctorName = matchingAdmission.doctorName || null

        if (!doctorName && doctorId) {
          try {
            doctorName = getDoctorName(await usersAPI.getUserById(doctorId))
          } catch (doctorError) {
            console.warn('Failed to load admission doctor', doctorError)
          }
        }

        setAdmission({ ...matchingAdmission, doctorName })
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
      label: 'Vitals Chart',
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

  const isDischarged = admission?.status === 'discharged'

  return (
    <SuperAdminLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* Top Navigation & Status Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/superadmin/admitted')}
              className="btn btn-sm btn-ghost btn-circle shrink-0"
              title="Back to Admitted List"
            >
              <FaArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-bold text-base-content flex items-center gap-2 truncate">
                  <FaBed className="text-primary shrink-0" />
                  <span>Inpatient Admission Record</span>
                </h1>
                <span className="badge badge-primary badge-sm font-semibold">Super Admin Audit</span>
              </div>
          
            </div>
          </div>

          {/* Status Badge & Actions */}
          {/* <div className="flex flex-wrap items-center gap-2"> */}
          {/*
            {isDischarged ? (
              <span className="badge badge-success badge-md sm:badge-lg py-2.5 sm:py-3 px-3 sm:px-4 text-white font-semibold">
                Discharged Inpatient
              </span>
            ) : admission?.confirmedAt ? (
              <span className="badge badge-primary badge-md sm:badge-lg py-2.5 sm:py-3 px-3 sm:px-4 text-white font-semibold gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                Currently Admitted
              </span>
            ) : (
              <span className="badge badge-warning badge-md sm:badge-lg py-2.5 sm:py-3 px-3 sm:px-4 font-semibold">
                Awaiting Ward Allocation
              </span>
            )} */}

            {/* Create Inpatient Bill */}
            {/* <button
              type="button"
              onClick={() => setIsCreateBillOpen(true)}
              className="btn btn-outline btn-primary btn-sm rounded-xl gap-1.5 font-medium shadow-xs"
            >
              <FaCashRegister className="w-3.5 h-3.5" />
              <span>Create Bill</span>
            </button> */}

            {/* Send to HMO Modal Trigger */}
            {/* <button
              type="button"
              onClick={() => setIsSendToHmoOpen(true)}
              className="btn btn-outline btn-warning btn-sm rounded-xl gap-1.5 font-medium shadow-xs"
            >
              <FaPaperPlane className="w-3.5 h-3.5" />
              <span>Send to HMO</span>
            </button> */}
          {/* </div> */}
        </div>

         {/* Patient Overview Card */}
                    <PatientDetailsCard
                            patient={patient}
                            summarySubject={summarySubject}
                            isViewingDependant={isViewingDependant}
                          guardian={isViewingDependant ? patient : null}
                          />
                    

        {/* Admission Context Banner */}
        {admission && (
          <div className="p-4 bg-base-100 rounded-2xl shadow-xs border border-base-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <span className="text-base-content/60 font-medium">Assigned Ward:</span>{' '}
                <span className="font-bold text-base-content">
                  {admission.ward?.name || admission.ward || admission.wardId || 'General Ward'}
                </span>
              </div>
              {admission.bedNumber && (
                <div className="border-l border-base-200 pl-3">
                  <span className="text-base-content/60 font-medium">Bed:</span>{' '}
                  <span className="font-bold text-primary">#{admission.bedNumber}</span>
                </div>
              )}
              {(admission.admittedByDoctor?.name || admission.doctorName || admission.doctor) && (
                <div className="border-l border-base-200 pl-3">
                  <span className="text-base-content/60 font-medium">Admitting Doctor:</span>{' '}
                  <span className="font-bold text-base-content">
                    {admission.admittedByDoctor?.name ||
                      admission.doctorName ||
                      `${admission.doctor?.firstName || ''} ${admission.doctor?.lastName || ''}`.trim()}
                  </span>
                </div>
              )}
              {admission.diagnosis && (
                <div className="border-l border-base-200 pl-3">
                  <span className="text-base-content/60 font-medium">Diagnosis:</span>{' '}
                  <span className="font-semibold text-primary">{admission.diagnosis}</span>
                </div>
              )}
            </div>

            <div className="text-base-content/60">
              Admitted At:{' '}
              <span className="font-medium text-base-content">
                {admission.admittedAt || admission.createdAt
                  ? formatNigeriaDateTime(admission.admittedAt || admission.createdAt)
                  : '—'}
              </span>
              {isDischarged && admission.dischargedAt && (
                <span className="ml-2 font-medium text-success">
                  · Discharged: {formatNigeriaDateTime(admission.dischargedAt)}
                </span>
              )}
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
            isDoctor={false}
            isNurse={false}
          />
        )}

        {activeTab === 'ward' && (
          <WardRoundTab
            patientId={patientId}
            dependantId={dependantId}
            admission={admission}
            consultationId={consultationId}
            isDoctor={false}
            isNurse={false}
            onRoundSaved={loadAdmission}
          />
        )}

        {activeTab === 'blood' && (
          <BloodTransfusionTab
            patientId={patientId}
            dependantId={dependantId}
            consultationId={consultationId}
            isDoctor={false}
            isNurse={false}
          />
        )}

        {activeTab === 'ivfluid' && (
          <IvFluidTab
            patientId={patientId}
            dependantId={dependantId}
            consultationId={consultationId}
            isDoctor={false}
            isNurse={false}
          />
        )}

        {activeTab === 'ebt' && (
          <EbtTab
            patientId={patientId}
            dependantId={dependantId}
            consultationId={consultationId}
            isDoctor={false}
            isNurse={false}
          />
        )}

        {activeTab === 'neonatal' && (
          <NeonatalCareTab
            patientId={patientId}
            dependantId={dependantId}
            consultationId={consultationId}
            isDoctor={false}
            isNurse={false}
          />
        )}

        {/* Modals for Billing & HMO */}
        {isCreateBillOpen && (
          <CreateBillModal
            isOpen={isCreateBillOpen}
            onClose={() => setIsCreateBillOpen(false)}
            patient={subjectData || patient}
            consultationId={consultationId}
            admissionId={effectiveAdmissionId}
          />
        )}

        {isSendToHmoOpen && (
          <SendToHmoModal
            isOpen={isSendToHmoOpen}
            onClose={() => setIsSendToHmoOpen(false)}
            patient={subjectData || patient}
            consultationId={consultationId}
            admissionId={effectiveAdmissionId}
          />
        )}
      </div>
    </SuperAdminLayout>
  )
}

export default SuperAdminAdmittedPatient
