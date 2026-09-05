import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SuperAdminLayout } from '@/layouts/superadmin'
import { getPatients } from '@/services/api/patientsAPI'
import { getDependants } from '@/services/api/dependantAPI'
import { getAdmissions } from '@/services/api/admissionApi'
import { getVitals } from '@/services/api/vitalsAPI'
import { getAllBillings, getAllReceipts } from '@/services/api/billingAPI'
import usersAPI from '@/services/api/usersAPI'
import { formatNigeriaDateTimeShort, formatNigeriaDate } from '@/utils/formatDateTimeUtils'
import toast from 'react-hot-toast'
import {
  FaBed,
  FaSearch,
  FaUserInjured,
  FaNotesMedical,
  FaHeartbeat,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaHistory,
  FaUserMd,
  FaHospital,
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

const SuperAdminAdmittedList = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('admitted') // 'admitted' | 'pending' | 'discharged'
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const [pending, setPending] = useState([])
  const [admitted, setAdmitted] = useState([])
  const [discharged, setDischarged] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [patientsRes, dependantsRes, admissionsRes, vitalsRes, billingsRes, receiptsRes] =
        await Promise.allSettled([
          getPatients(),
          getDependants(),
          getAdmissions(),
          getVitals(),
          getAllBillings({ skipErrorToast: true }),
          getAllReceipts({ skipErrorToast: true }),
        ])

      const patients =
        patientsRes.status === 'fulfilled'
          ? Array.isArray(patientsRes.value?.data)
            ? patientsRes.value.data
            : []
          : []

      const dependants =
        dependantsRes.status === 'fulfilled'
          ? (() => {
              const raw = dependantsRes.value?.data?.data ?? dependantsRes.value?.data ?? []
              return Array.isArray(raw) ? raw : raw?.dependants ?? []
            })()
          : []

      const allAdmissions =
        admissionsRes.status === 'fulfilled'
          ? (() => {
              const raw = admissionsRes.value?.data ?? admissionsRes.value ?? []
              return Array.isArray(raw) ? raw : []
            })()
          : []

      const allVitals =
        vitalsRes.status === 'fulfilled'
          ? (() => {
              const raw = vitalsRes.value?.data ?? vitalsRes.value ?? []
              return Array.isArray(raw) ? raw : []
            })()
          : []

      const allBillings =
        billingsRes.status === 'fulfilled'
          ? (() => {
              const raw = billingsRes.value?.data?.data ?? billingsRes.value?.data ?? []
              return Array.isArray(raw) ? raw : []
            })()
          : []

      const allReceipts =
        receiptsRes.status === 'fulfilled'
          ? (() => {
              const raw = receiptsRes.value?.data?.data ?? receiptsRes.value?.data ?? []
              return Array.isArray(raw) ? raw : []
            })()
          : []

      // Map billings and receipts
      const billingByAdmission = {}
      allBillings.forEach((b) => {
        const aId = b.admissionId || b.admission?.id
        if (aId) {
          if (!billingByAdmission[aId]) billingByAdmission[aId] = []
          billingByAdmission[aId].push(b)
        }
      })

      const receiptsByBilling = {}
      allReceipts.forEach((r) => {
        const bId = r.billingId || r.billing?.id
        if (bId) {
          if (!receiptsByBilling[bId]) receiptsByBilling[bId] = []
          receiptsByBilling[bId].push(r)
        }
      })

      // Latest vitals per patient / dependant
      const vitalsByPatient = {}
      allVitals.forEach((v) => {
        const pId = v.dependantId || v.patientId
        if (!pId) return
        const existing = vitalsByPatient[pId]
        if (!existing || new Date(v.createdAt) > new Date(existing.createdAt)) {
          vitalsByPatient[pId] = v
        }
      })

      // Sort admissions by date descending
      const sortedAdmissions = [...allAdmissions].sort(
        (a, b) =>
          new Date(b.admittedAt || b.admissionDate || b.createdAt || 0) -
          new Date(a.admittedAt || a.admissionDate || a.createdAt || 0)
      )

      const doctorIds = [...new Set(sortedAdmissions.map(getDoctorId).filter(Boolean))]
      const doctorResults = await Promise.allSettled(
        doctorIds.map((doctorId) => usersAPI.getUserById(doctorId)),
      )
      const doctorNames = {}
      doctorResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const name = getDoctorName(result.value)
          if (name) doctorNames[doctorIds[index]] = name
        }
      })

      const pendingList = []
      const admittedList = []
      const dischargedList = []

      sortedAdmissions.forEach((adm) => {
        const doctorId = getDoctorId(adm)
        const admission = {
          ...adm,
          doctorName: adm.doctorName || doctorNames[doctorId] || null,
        }
        const isDep = !!adm.dependantId
        let person = null
        let primaryPatient = null

        if (isDep) {
          person = dependants.find((d) => d.id === admission.dependantId)
          primaryPatient = patients.find(
            (p) => p.id === admission.patientId || p.id === person?.patientId
          )
        } else {
          person = patients.find((p) => p.id === admission.patientId)
        }

        if (!person) return

        const idKey = isDep ? admission.dependantId : admission.patientId
        const vitals = vitalsByPatient[idKey] || null

        // Calculate billing status
        const admBills = billingByAdmission[admission.id] || []
        const totalBilled = admBills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0)
        let totalPaid = 0
        admBills.forEach((b) => {
          const rList = receiptsByBilling[b.id] || []
          totalPaid += rList.reduce((acc, r) => acc + (Number(r.amountPaid) || 0), 0)
        })

        const item = {
          admission,
          patient: isDep
            ? {
                ...person,
                dependantId: person.id,
                primaryPatientId: primaryPatient?.id || adm.patientId,
                primaryPatientName: primaryPatient
                  ? `${primaryPatient.firstName || ''} ${primaryPatient.lastName || ''}`.trim()
                  : 'Principal',
                hospitalId: person.hospitalId || primaryPatient?.hospitalId || '—',
                relationshipType: person.relationshipType || person.relationship,
                isFamilyCard: primaryPatient?.isFamilyCard,
                cardType: primaryPatient?.cardType,
              }
            : person,
          vitals,
          totalBilled,
          totalPaid,
          isFullyPaid: totalBilled > 0 && totalPaid >= totalBilled,
          hasBalance: totalBilled > totalPaid,
        }

        if (adm.status === 'discharged') {
          dischargedList.push(item)
        } else if (!adm.confirmedAt || adm.status === 'pending') {
          pendingList.push(item)
        } else {
          admittedList.push(item)
        }
      })

      setPending(pendingList)
      setAdmitted(admittedList)
      setDischarged(dischargedList)
    } catch (err) {
      console.error('SuperAdminAdmittedList error:', err)
      setError('Failed to load admissions data. Please try again.')
      toast.error('Failed to load admissions data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const currentList = useMemo(() => {
    if (activeTab === 'admitted') return admitted
    if (activeTab === 'pending') return pending
    return discharged
  }, [activeTab, admitted, pending, discharged])

  const filteredList = useMemo(() => {
    if (!search.trim()) return currentList
    const q = search.toLowerCase()
    return currentList.filter((item) => {
      const p = item.patient
      const adm = item.admission
      const name = `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.toLowerCase()
      const hospId = (p.hospitalId || '').toLowerCase()
      const ward = (adm.ward?.name || adm.wardName || '').toLowerCase()
      const bed = (adm.bedNumber || adm.bed?.bedNumber || '').toLowerCase()
      const doctor = (
        adm.admittedByDoctor?.name ||
        adm.doctorName ||
        adm.doctor?.firstName ||
        ''
      ).toLowerCase()
      const diag = (adm.diagnosis || adm.reason || '').toLowerCase()

      return (
        name.includes(q) ||
        hospId.includes(q) ||
        ward.includes(q) ||
        bed.includes(q) ||
        doctor.includes(q) ||
        diag.includes(q)
      )
    })
  }, [currentList, search])

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredList.slice(start, start + itemsPerPage)
  }, [filteredList, currentPage])

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  const handleViewPatient = (patient, admission) => {
    const isDependant = !!patient.dependantId
    const primaryPatientId = isDependant ? patient.primaryPatientId : patient.id

    if (isDependant) {
      navigate(
        `/superadmin/admitted/patient/${primaryPatientId}/dependant/${patient.id}`,
        {
          state: {
            patientSnapshot: patient,
            dependantSnapshot: patient,
            dependantId: patient.id,
            admission,
          },
        }
      )
    } else {
      navigate(`/superadmin/admitted/patient/${patient.id}`, {
        state: {
          patientSnapshot: patient,
          admission,
        },
      })
    }
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-base-content sm:text-2xl flex items-center gap-2">
                <FaBed className="text-primary" /> Inpatient Admissions & Records
              </h1>
              <span className="badge badge-primary badge-sm font-semibold">Super Admin Oversight</span>
            </div>
            <p className="text-xs text-base-content/70 sm:text-sm mt-0.5">
              Comprehensive record keeping for active inpatients, pending ward allocations, and discharged histories.
            </p>
          </div>
          <button
            onClick={loadData}
            className="btn btn-sm btn-outline border-base-300 hover:border-primary gap-1.5 self-start sm:self-auto"
            title="Refresh list"
          >
            <FaHistory className="w-3.5 h-3.5" /> Refresh Records
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="card bg-base-100 border border-base-300 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-base-content/60">Active Inpatients</p>
                <p className="text-2xl font-bold text-primary mt-1">{admitted.length}</p>
                <p className="text-[11px] text-base-content/50 mt-0.5">Occupying Ward Beds</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FaBed className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 border border-base-300 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-base-content/60">Pending Allocation</p>
                <p className="text-2xl font-bold text-warning mt-1">{pending.length}</p>
                <p className="text-[11px] text-base-content/50 mt-0.5">Awaiting Bed Assignment</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
                <FaClock className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 border border-base-300 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-base-content/60">Discharged Records</p>
                <p className="text-2xl font-bold text-success mt-1">{discharged.length}</p>
                <p className="text-[11px] text-base-content/50 mt-0.5">Completed Stays</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
                <FaCheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 border border-base-300 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-base-content/60">Total Hospital Admissions</p>
                <p className="text-2xl font-bold text-base-content mt-1">
                  {admitted.length + pending.length + discharged.length}
                </p>
                <p className="text-[11px] text-base-content/50 mt-0.5">Lifetime Clinical Records</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-base-200 flex items-center justify-center text-base-content/70">
                <FaHospital className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-base-100 border border-base-300 rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTabChange('admitted')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'admitted'
                  ? 'bg-primary text-primary-content shadow-sm'
                  : 'text-base-content/70 hover:bg-base-200'
              }`}
            >
              <FaBed className="w-4 h-4" />
              Currently Admitted
              <span className={`badge badge-sm ml-1 ${activeTab === 'admitted' ? 'badge-neutral text-white' : 'badge-primary'}`}>
                {admitted.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('pending')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'bg-primary text-primary-content shadow-sm'
                  : 'text-base-content/70 hover:bg-base-200'
              }`}
            >
              <FaClock className="w-4 h-4" />
              Pending Allocation
              {pending.length > 0 && (
                <span className="badge badge-sm badge-warning ml-1">
                  {pending.length}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('discharged')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'discharged'
                  ? 'bg-primary text-primary-content shadow-sm'
                  : 'text-base-content/70 hover:bg-base-200'
              }`}
            >
              <FaHistory className="w-4 h-4" />
              Discharged Archive
              <span className={`badge badge-sm ml-1 ${activeTab === 'discharged' ? 'badge-neutral text-white' : 'badge-ghost'}`}>
                {discharged.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search patient, hospital ID, ward, doctor..."
              className="input input-sm input-bordered w-full pl-9 pr-3 text-xs bg-base-100"
            />
          </div>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="card bg-base-100 border border-base-300 p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="skeleton h-5 w-36 rounded" />
                  <div className="skeleton h-5 w-20 rounded" />
                </div>
                <div className="skeleton h-4 w-48 rounded" />
                <div className="skeleton h-12 w-full rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="alert alert-error shadow-sm">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="card bg-base-100 border border-base-300 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-3 text-base-content/40">
              <FaBed className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-base-content">No Inpatient Records Found</h3>
            <p className="text-xs text-base-content/60 mt-1 max-w-md mx-auto">
              {search
                ? `No results match "${search}". Try adjusting your search query.`
                : activeTab === 'admitted'
                ? 'There are currently no patients admitted to hospital wards.'
                : activeTab === 'pending'
                ? 'There are no pending ward allocation requests awaiting nurse processing.'
                : 'No discharged inpatient records found in history.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedList.map((item) => {
              const { patient, admission: adm, vitals } = item
              const isDep = !!patient.dependantId
              const fullName = `${patient.firstName || ''} ${patient.middleName || ''} ${patient.lastName || ''}`.trim()
              const doctorName =
                adm.admittedByDoctor?.name ||
                adm.doctorName ||
                (adm.doctor ? `Dr. ${adm.doctor.firstName || ''} ${adm.doctor.lastName || ''}`.trim() : 'Attending Doctor')
              const wardName = adm.ward?.name || adm.wardName || 'Ward Unassigned'
              const bedNum = adm.bedNumber || adm.bed?.bedNumber || 'Pending Bed'
              const isDischarged = adm.status === 'discharged'

              return (
                <div
                  key={adm.id}
                  className="card bg-base-100 border border-base-300 hover:border-primary/50 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div className="p-5 space-y-4">
                    {/* Header: Patient Info & Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                          {patient.firstName?.charAt(0) || 'P'}
                          {patient.lastName?.charAt(0) || ''}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm text-base-content truncate">
                              {fullName}
                            </h3>
                            {isDep && (
                              <span className="badge badge-xs badge-secondary font-medium">
                                Dependant ({patient.relationshipType || 'Family'})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-base-content/60 font-mono mt-0.5">
                            ID: {patient.hospitalId || '—'}
                          </p>
                          {isDep && patient.primaryPatientName && (
                            <p className="text-[11px] text-base-content/50 truncate">
                              Principal: {patient.primaryPatientName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span
                          className={`badge badge-sm font-semibold ${
                            isDischarged
                              ? 'badge-success'
                              : adm.confirmedAt
                              ? 'badge-primary'
                              : 'badge-warning'
                          }`}
                        >
                          {isDischarged
                            ? 'Discharged'
                            : adm.confirmedAt
                            ? 'Admitted'
                            : 'Awaiting Ward'}
                        </span>
                        <p className="text-[10px] text-base-content/50 mt-1">
                          {adm.admittedAt || adm.createdAt
                            ? formatNigeriaDateTimeShort(adm.admittedAt || adm.createdAt)
                            : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Ward & Bed + Clinician Details */}
                    <div className="grid grid-cols-2 gap-2 bg-base-200/50 p-3 rounded-lg text-xs">
                      <div>
                        <span className="text-[11px] text-base-content/50 font-medium block">Ward & Bed</span>
                        <span className="font-semibold text-base-content mt-0.5 flex items-center gap-1.5">
                          <FaBed className="text-primary w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{wardName} (Bed {bedNum})</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-base-content/50 font-medium block">Attending Doctor</span>
                        <span className="font-semibold text-base-content mt-0.5 flex items-center gap-1.5">
                          <FaUserMd className="text-primary w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{doctorName}</span>
                        </span>
                      </div>
                
                    </div>

              
                  </div>

                  {/* Card Footer: Action Button */}
                  <div className="p-4 border-t border-base-200 bg-base-200/20 flex items-center justify-between gap-3">
                    <div className="text-[11px] text-base-content/60">
                      {isDischarged && adm.dischargedAt && (
                        <span>Discharged: {formatNigeriaDate(adm.dischargedAt)}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleViewPatient(patient, adm)}
                      className="btn btn-sm btn-primary gap-2"
                    >
                      <FaNotesMedical className="w-3.5 h-3.5" /> View Inpatient Record
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-xs btn-outline"
            >
              Previous
            </button>
            <span className="text-xs text-base-content/70 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-xs btn-outline"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  )
}

export default SuperAdminAdmittedList
