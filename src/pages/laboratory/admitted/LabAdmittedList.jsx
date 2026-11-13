import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LaboratoryLayout from '@/layouts/laboratory'
import KolakLoader from '@/components/common/KolakLoader'
import { getPatients, getPatientById } from '@/services/api/patientsAPI'
import { getDependants } from '@/services/api/dependantAPI'
import { getAdmissions } from '@/services/api/admissionApi'
import { getAllWards } from '@/services/api/wardAPI'
import { getVitals } from '@/services/api/vitalsAPI'
import { getAllBillings, getAllReceipts } from '@/services/api/billingAPI'
import { formatNigeriaDateTimeShort } from '@/utils/formatDateTimeUtils'
import ConfirmAdmissionModal from '@/pages/nurse/admitted/modal/ConfirmAdmissionModal'
import toast from 'react-hot-toast'
import { FaBed, FaSearch, FaNotesMedical, FaHeartbeat, FaCheckCircle, FaExclamationTriangle, FaCoins, FaClock } from 'react-icons/fa'

const AdmittedList = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('admitted') // 'admitted' | 'pending'
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const [pending, setPending] = useState([])
  const [admitted, setAdmitted] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [admissionsRes, vitalsRes, billingsRes, receiptsRes, wardsRes] = await Promise.allSettled([
        getAdmissions({ limit: 100 }),
        getVitals({ limit: 100 }),
        getAllBillings({ limit: 100, skipErrorToast: true }),
        getAllReceipts({ limit: 100, skipErrorToast: true }),
        getAllWards(),
      ])

      const rawWards = wardsRes.status === 'fulfilled' ? (wardsRes.value?.data ?? wardsRes.value ?? []) : []
      const wardList = Array.isArray(rawWards) ? rawWards : (rawWards?.wards ?? [])
      const wardMap = new Map(wardList.map(w => [String(w._id || w.id), w.name]))

      const allAdmissions = admissionsRes.status === 'fulfilled'
        ? (() => {
            const raw = admissionsRes.value?.data ?? admissionsRes.value ?? []
            return Array.isArray(raw) ? raw : []
          })()
        : []

      const allVitals = vitalsRes.status === 'fulfilled'
        ? (() => {
            const raw = vitalsRes.value?.data ?? vitalsRes.value ?? []
            return Array.isArray(raw) ? raw : []
          })()
        : []

      const allBillings = billingsRes.status === 'fulfilled'
        ? (() => {
            const raw = billingsRes.value?.data?.data ?? billingsRes.value?.data ?? []
            return Array.isArray(raw) ? raw : (raw?.billings ?? [])
          })()
        : []

      const allReceipts = receiptsRes.status === 'fulfilled'
        ? (() => {
            const raw = receiptsRes.value?.data?.data ?? receiptsRes.value?.data ?? []
            return Array.isArray(raw) ? raw : (raw?.receipts ?? [])
          })()
        : []

      if (admissionsRes.status === 'rejected') console.error('AdmittedList: getAdmissions failed', admissionsRes.reason)
      const activeAdmissions = allAdmissions.filter(a => a.status !== 'discharged')

      // Resolve missing parent patients for dependants so their Patient ID is always available
      const missingPatientIds = Array.from(new Set(
        activeAdmissions
          .filter(a => a.dependantId && (!a.patient?.hospitalId && !a.dependant?.patient?.hospitalId))
          .map(a => a.patientId)
          .filter(Boolean)
      ))
      const patientMap = new Map()
      if (missingPatientIds.length > 0) {
        const fetched = await Promise.allSettled(missingPatientIds.map(id => getPatientById(id)))
        fetched.forEach(res => {
          if (res.status === 'fulfilled') {
            const p = res.value?.data?.data ?? res.value?.data
            if (p && (p.id || p._id)) patientMap.set(String(p.id || p._id), p)
          }
        })
      }

      // Map latest vitals per patient/dependant ID
      const vitalsMap = new Map()
      allVitals.forEach(v => {
        const key = v.dependantId || v.patientId
        if (!key) return
        const vTime = new Date(v.createdAt || 0).getTime()
        const existing = vitalsMap.get(key)
        if (!existing || vTime > existing.time) {
          vitalsMap.set(key, { time: vTime, createdAt: v.createdAt })
        }
      })

      const buildItem = (admission) => {
        const isDependant = !!admission.dependantId
        const source = isDependant ? admission.dependant : admission.patient
        const parentPatient = isDependant ? (admission.patient || admission.dependant?.patient || patientMap.get(String(admission.patientId))) : null
        const parentHospitalId = isDependant
          ? (parentPatient?.hospitalId || admission.patient?.hospitalId || admission.dependant?.patient?.hospitalId || patientMap.get(String(admission.patientId))?.hospitalId)
          : (source?.hospitalId || admission.patient?.hospitalId || patientMap.get(String(admission.patientId))?.hospitalId)
        const displayId = parentHospitalId || '—'

        const targetId = admission.dependantId || admission.patientId
        const latestVitalInfo = vitalsMap.get(targetId)

        // Resolve ward name (translates raw UUID to proper human-readable ward name)
        const rawWardKey = String(admission.wardId || admission.ward || '')
        const resolvedWard = wardMap.get(rawWardKey) || admission.wardName || (rawWardKey && !rawWardKey.includes('-') ? rawWardKey : null) || 'General Ward'

        // Normalize bed number: avoid "Bed Bed X"
        const cleanBed = String(admission.bedNumber || '').trim().replace(/^bed\s*/i, '')

        // Resolve linked billing & payment info for admission
        const admissionIdStr = String(admission._id || admission.id || '')
        const patientIdStr = String(admission.patientId || '')
        const dependantIdStr = admission.dependantId ? String(admission.dependantId) : null

        let matchedBills = []
        if (admission.billId) {
          const bDirect = allBillings.find(b => String(b.id || b._id) === String(admission.billId))
          if (bDirect) matchedBills.push(bDirect)
        }
        if (matchedBills.length === 0) {
          const itemMatched = allBillings.filter(b =>
            Array.isArray(b.itemDetails) && b.itemDetails.some(it => String(it.admissionId || '') === admissionIdStr)
          )
          if (itemMatched.length > 0) matchedBills.push(...itemMatched)
        }
        if (matchedBills.length === 0 && admission.consultationId) {
          const consultBills = allBillings.filter(b => {
            const bConsultId = String(b.consultationId || b.consultation || '')
            return bConsultId && bConsultId === String(admission.consultationId)
          })
          if (consultBills.length > 0) matchedBills.push(...consultBills)
        }
        if (matchedBills.length === 0) {
          const admissionTime = new Date(admission.createdAt || admission.admissionDate || 0).getTime()
          const patientBills = allBillings.filter(b => {
            const bPat = String(b.patientId || b.patient?._id || b.patient?.id || b.patient || '')
            const bDep = b.dependantId ? String(b.dependantId) : null
            if (dependantIdStr) {
              if (bDep !== dependantIdStr) return false
            } else {
              if (bPat !== patientIdStr) return false
            }
            const bTime = new Date(b.createdAt || 0).getTime()
            return Math.abs(bTime - admissionTime) < 48 * 60 * 60 * 1000
          })
          if (patientBills.length > 0) matchedBills.push(...patientBills)
        }

        let paymentStatus = 'unbilled'
        let totalAmount = 0
        let paidAmount = 0
        let outstanding = 0

        if (matchedBills.length > 0) {
          totalAmount = matchedBills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0)
          paidAmount = matchedBills.reduce((acc, b) => {
            if (b.paymentStatus === 'paid') return acc + (Number(b.totalAmount) || 0)
            if (b.paymentStatus === 'partial') return acc + (Number(b.paidAmount) || 0)
            return acc
          }, 0)

          const matchedBillIds = new Set(matchedBills.map(b => String(b.id || b._id)))
          const relatedReceipts = allReceipts.filter(r => {
            const rBillId = String(r.billId || r.bill?._id || r.bill?.id || '')
            return matchedBillIds.has(rBillId)
          })
          const receiptTotal = relatedReceipts.reduce((acc, r) => acc + (Number(r.amountPaid || r.amount) || 0), 0)
          paidAmount = Math.max(paidAmount, receiptTotal)
          outstanding = Math.max(0, totalAmount - paidAmount)

          const allPaid = matchedBills.every(b => b.paymentStatus === 'paid') || (totalAmount > 0 && paidAmount >= totalAmount)
          const anyPartial = matchedBills.some(b => b.paymentStatus === 'partial') || (paidAmount > 0 && paidAmount < totalAmount)

          if (allPaid) {
            paymentStatus = 'paid'
          } else if (anyPartial) {
            paymentStatus = 'partial'
          } else {
            paymentStatus = 'unpaid'
          }
        }

        const rawStatus = admission.status || 'admitted'
        const isAwaitingAdmission = rawStatus === 'pending' || rawStatus === 'requested' || rawStatus === 'awaiting_admission'

        return {
          key: admission._id || admission.id,
          id: admission._id || admission.id,
          admissionId: admission._id || admission.id,
          patientId: admission.patientId,
          dependantId: admission.dependantId,
          name: source
            ? `${source.firstName || ''} ${source.lastName || ''}`.trim()
            : 'Unknown Patient',
          type: isDependant ? 'dependant' : 'patient',
          relationshipType: admission.dependant?.relationship || null,
          parentPatient: isDependant ? parentPatient : null,
          displayId,
          ward: resolvedWard,
          bedNumber: cleanBed,
          admittedAt: admission.admissionDate || admission.admittedAt || admission.createdAt,
          lastVitalsTime: latestVitalInfo?.createdAt || null,
          paymentInfo: {
            status: paymentStatus,
            totalAmount,
            paidAmount,
            outstanding,
            billsCount: matchedBills.length,
          },
          status: isAwaitingAdmission ? 'pending' : rawStatus,
          raw: admission,
        }
      }

      const pendingItems = []
      const admittedItems = []

      activeAdmissions.forEach(a => {
        const item = buildItem(a)
        if (item.status === 'pending') {
          pendingItems.push(item)
        } else {
          admittedItems.push(item)
        }
      })

      setPending(pendingItems)
      setAdmitted(admittedItems)
    } catch (err) {
      console.error('AdmittedList: failed to load admitted patients', err)
      setError('Unable to load admitted patients list. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const currentList = activeTab === 'admitted' ? admitted : pending

  const filtered = useMemo(() => {
    if (!search.trim()) return currentList
    const q = search.toLowerCase()
    return currentList.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.displayId.toLowerCase().includes(q) ||
      item.ward.toLowerCase().includes(q) ||
      (item.bedNumber && item.bedNumber.toLowerCase().includes(q))
    )
  }, [currentList, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage, itemsPerPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, search])

  const openAdmission = (item) => {
    const targetPatientId = item.parentPatient ? (item.parentPatient.id || item.parentPatient._id) : (item.patientId || item.raw?.patientId)
    navigate(`/dashboard/laboratory/admitted/${targetPatientId}`, {
      state: {
        admissionId: item.admissionId,
        admission: item.raw,
        dependantId: item.dependantId,
        dependantSnapshot: item.type === 'dependant' ? item.raw : null,
        patientSnapshot: item.parentPatient || (item.type === 'patient' ? item.raw : null),
        from: 'admitted',
      }
    })
  }

  const handleConfirmAdmit = (item) => {
    setConfirmTarget(item)
  }

  if (loading && admitted.length === 0 && pending.length === 0) {
    return (
      <LaboratoryLayout>
        <KolakLoader fullscreen text="Loading admitted patients..." />
      </LaboratoryLayout>
    )
  }

  if (error) {
    return (
      <LaboratoryLayout>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center bg-base-100 p-8 rounded-2xl shadow-sm border border-base-300 max-w-md">
            <p className="text-sm font-semibold text-error mb-4">{error}</p>
            <button
              onClick={loadData}
              className="btn btn-primary btn-sm rounded-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      </LaboratoryLayout>
    )
  }

  return (
    <LaboratoryLayout>
      <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                <FaBed className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-base-content">Admitted Patients</h1>
                <p className="text-xs sm:text-sm text-base-content/60">
                  Inpatient admission verification, bed assignment, and continuous laboratory
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Segmented Filter Pills & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-base-100 p-2.5 sm:p-3 rounded-2xl border border-base-200 shadow-sm">
          <div className="inline-flex p-1 bg-base-200 rounded-xl gap-1 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('admitted')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none whitespace-nowrap ${
                activeTab === 'admitted'
                  ? 'bg-primary text-primary-content shadow-sm'
                  : 'text-base-content/70 hover:text-base-content'
              }`}
            >
              <FaBed className="w-3.5 h-3.5" />
              Currently Admitted ({admitted.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'bg-primary text-primary-content shadow-sm'
                  : 'text-base-content/70 hover:text-base-content'
              }`}
            >
              Pending Admission ({pending.length})
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 text-sm" />
            <input
              type="text"
              placeholder="Search by patient, ward, bed..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-sm sm:input-md input-bordered w-full pl-9 rounded-xl text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Mobile Card List (< lg) */}
        <div className="flex flex-col gap-3 lg:hidden">
          {paginated.map((item) => (
            activeTab === 'pending' ? (
              <PendingCard
                key={item.key}
                item={item}
                onConfirm={() => handleConfirmAdmit(item)}
              />
            ) : (
              <AdmittedCard key={item.key} item={item} onOpen={() => openAdmission(item)} />
            )
          ))}
        </div>

        {/* Desktop DataTable (>= lg) */}
        <div className="hidden lg:block bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[60vh] sm:max-h-[65vh] 2xl:max-h-[70vh]">
            <table className="table w-full">
              <thead className="sticky top-0 bg-base-200/90 backdrop-blur-xs z-10 text-xs uppercase tracking-wider text-base-content/70">
                <tr>
                  <th className="py-3.5 px-4">Patient Profile</th>
                  <th className="py-3.5 px-4">Record Type</th>
                  <th className="py-3.5 px-4">Ward & Bed Number</th>
                  {activeTab === 'pending' ? (
                    <th className="py-3.5 px-4">Billing / Payment</th>
                  ) : (
                    <>
                      <th className="py-3.5 px-4">Admitted Timestamp</th>
                    </>
                  )}
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200 text-sm">
                {paginated.map((item) => (
                  <tr key={item.key} className="hover:bg-base-200/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-base-content">{item.name}</div>
                          {item.displayId && item.displayId !== '—' && (
                            <div className="text-xs text-base-content/60 font-mono">
                              ID: {item.displayId}
                            </div>
                          )}
                          {item.parentPatient && (
                            <div className="text-xs text-base-content/50">
                              Beneficiary of {item.parentPatient.firstName} {item.parentPatient.lastName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.type === 'dependant' ? (
                        <span className="badge badge-info badge-sm gap-1 capitalize font-medium">
                          Dependant ({item.relationshipType || 'Family'})
                        </span>
                      ) : (
                        <span className="badge badge-ghost badge-sm font-medium">Patient</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-base-content">{item.ward}</span>
                        {item.bedNumber ? (
                          <span className="badge badge-outline badge-sm text-xs">
                            Bed {item.bedNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-base-content/40 italic">Unassigned Bed</span>
                        )}
                      </div>
                    </td>
                    {activeTab === 'pending' ? (
                      <td className="py-3.5 px-4">
                        {item.paymentInfo?.status === 'paid' && (
                          <div className="flex flex-col gap-0.5">
                            <span className="badge badge-success badge-sm font-semibold gap-1">
                              <FaCheckCircle className="w-3 h-3" /> Fully Paid
                            </span>
                            {item.paymentInfo.totalAmount > 0 && (
                              <span className="text-[11px] font-medium text-success/90">
                                ₦{item.paymentInfo.totalAmount.toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                        {item.paymentInfo?.status === 'partial' && (
                          <div className="flex flex-col gap-0.5">
                            <span className="badge badge-warning badge-sm font-semibold gap-1">
                              <FaCoins className="w-3 h-3" /> Partial Payment
                            </span>
                            <span className="text-[11px] font-medium text-warning-content/90">
                              ₦{item.paymentInfo.paidAmount.toLocaleString()} / ₦{item.paymentInfo.totalAmount.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {item.paymentInfo?.status === 'unpaid' && (
                          <div className="flex flex-col gap-0.5">
                            <span className="badge badge-error badge-sm font-semibold gap-1">
                              <FaExclamationTriangle className="w-3 h-3" /> Unpaid Bill
                            </span>
                            {item.paymentInfo.totalAmount > 0 && (
                              <span className="text-[11px] font-medium text-error/90">
                                ₦{item.paymentInfo.totalAmount.toLocaleString()} due
                              </span>
                            )}
                          </div>
                        )}
                        {item.paymentInfo?.status === 'unbilled' && (
                          <div className="flex flex-col gap-0.5">
                            <span className="badge badge-ghost badge-sm font-semibold text-base-content/60 gap-1">
                              <FaClock className="w-3 h-3" /> Not Yet Billed
                            </span>
                          </div>
                        )}
                      </td>
                    ) : (
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-base-content/70">
                          {formatNigeriaDateTimeShort(item.admittedAt)}
                        </div>
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-right">
                      {activeTab === 'pending' ? (
                        <button
                          onClick={() => handleConfirmAdmit(item)}
                          className="btn btn-primary btn-xs sm:btn-sm rounded-xl gap-1.5 font-medium shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          <FaBed className="w-3.5 h-3.5" />
                          Assign Bed & Admit
                        </button>
                      ) : (
                        <button
                          onClick={() => openAdmission(item)}
                          className="btn btn-outline btn-primary btn-xs sm:btn-sm rounded-xl gap-1.5 font-medium hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          <FaNotesMedical className="w-3.5 h-3.5" />
                          Open Admission Record
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-base-100 px-4 py-3 rounded-2xl border border-base-200 shadow-sm text-xs sm:text-sm">
            <span className="text-base-content/60">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
            </span>
            <div className="join">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="join-item btn btn-sm"
              >
                Prev
              </button>
              {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                page === '...' ? (
                  <button key={`ellipsis-${idx}`} className="join-item btn btn-sm btn-disabled">...</button>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`join-item btn btn-sm ${page === currentPage ? 'btn-primary' : ''}`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="join-item btn btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {paginated.length === 0 && (
          <div className="bg-base-100 rounded-2xl border border-base-200 p-12 text-center shadow-sm">
            <FaBed className="w-12 h-12 mx-auto text-base-content/20 mb-3" />
            <h3 className="text-base font-bold text-base-content">No Admitted Patients Found</h3>
            <p className="text-xs text-base-content/60 mt-1 max-w-sm mx-auto">
              {search
                ? `No admitted records match "${search}". Try searching by another patient name or ward.`
                : activeTab === 'pending'
                ? 'There are currently no patients pending admission.'
                : 'There are currently no patients admitted to any hospital ward.'}
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmAdmissionModal
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        item={confirmTarget}
        onConfirmed={loadData}
      />
    </LaboratoryLayout>
  )
}

const getPageNumbers = (current, total) => {
  const delta = 1
  const pages = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      pages.push(i)
    }
  }
  const withEllipsis = []
  let prev = null
  for (const p of pages) {
    if (prev !== null && p - prev > 1) withEllipsis.push('...')
    withEllipsis.push(p)
    prev = p
  }
  return withEllipsis
}

const PendingCard = ({ item, onConfirm }) => {
  const { paymentInfo } = item
  return (
    <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-sm text-base-content truncate">{item.name}</p>
          {item.displayId && item.displayId !== '—' && (
            <p className="text-[11px] text-base-content/60 font-mono">ID: {item.displayId}</p>
          )}
          {item.type === 'dependant' && (
            <span className="badge badge-info badge-xs mt-1 capitalize">
              {item.relationshipType || 'Dependant'}
            </span>
          )}
        </div>
        {paymentInfo?.status === 'paid' && (
          <div className="text-right shrink-0">
            <span className="badge badge-success badge-xs sm:badge-sm font-semibold gap-1">
              <FaCheckCircle className="w-2.5 h-2.5" /> Fully Paid
            </span>
            {paymentInfo.totalAmount > 0 && (
              <p className="text-[10px] text-success font-medium mt-0.5">₦{paymentInfo.totalAmount.toLocaleString()}</p>
            )}
          </div>
        )}
        {paymentInfo?.status === 'partial' && (
          <div className="text-right shrink-0">
            <span className="badge badge-warning badge-xs sm:badge-sm font-semibold gap-1">
              <FaCoins className="w-2.5 h-2.5" /> Partial
            </span>
            <p className="text-[10px] text-warning font-medium mt-0.5">
              ₦{paymentInfo.paidAmount.toLocaleString()} / ₦{paymentInfo.totalAmount.toLocaleString()}
            </p>
          </div>
        )}
        {paymentInfo?.status === 'unpaid' && (
          <div className="text-right shrink-0">
            <span className="badge badge-error badge-xs sm:badge-sm font-semibold gap-1">
              <FaExclamationTriangle className="w-2.5 h-2.5" /> Unpaid
            </span>
            {paymentInfo.totalAmount > 0 && (
              <p className="text-[10px] text-error font-medium mt-0.5">₦{paymentInfo.totalAmount.toLocaleString()}</p>
            )}
          </div>
        )}
        {paymentInfo?.status === 'unbilled' && (
          <span className="badge badge-ghost badge-xs sm:badge-sm font-semibold text-base-content/60 gap-1 shrink-0">
            <FaClock className="w-2.5 h-2.5" /> Unbilled
          </span>
        )}
      </div>
      <div className="text-xs text-base-content/70 space-y-1">
        <p><span className="font-semibold text-base-content">Ward:</span> {item.ward}</p>
        {item.bedNumber && <p><span className="font-semibold text-base-content">Bed:</span> {item.bedNumber}</p>}
      </div>
      <button
        onClick={onConfirm}
        className="btn btn-primary btn-sm w-full rounded-xl gap-2 font-medium shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all"
      >
        <FaBed className="w-3.5 h-3.5" />
        Assign Bed & Admit
      </button>
    </div>
  )
}

const AdmittedCard = ({ item, onOpen }) => (
  <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-4 space-y-3">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="font-bold text-sm text-base-content truncate">{item.name}</p>
        {item.displayId && item.displayId !== '—' && (
          <p className="text-[11px] text-base-content/60 font-mono">ID: {item.displayId}</p>
        )}
        <div className="flex items-center gap-1 mt-1">
          <span className="badge badge-primary badge-xs">{item.ward}</span>
          {item.bedNumber && <span className="badge badge-outline badge-xs">Bed {item.bedNumber}</span>}
        </div>
      </div>
      <span className="badge badge-success badge-xs gap-1">Admitted</span>
    </div>

    <div className="text-xs text-base-content/70 space-y-1 bg-base-200/50 p-2.5 rounded-xl">
      <div className="flex justify-between">
        <span className="text-base-content/60">Admitted:</span>
        <span className="font-medium text-base-content">{formatNigeriaDateTimeShort(item.admittedAt)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-base-content/60">Last Vitals:</span>
        <span className="font-medium text-base-content">
          {item.lastVitalsTime ? formatNigeriaDateTimeShort(item.lastVitalsTime) : 'None logged'}
        </span>
      </div>
    </div>

    <button
      onClick={onOpen}
      className="btn btn-primary btn-sm w-full rounded-xl gap-2 font-medium"
    >
      <FaNotesMedical className="w-3.5 h-3.5" />
      Open Admission Record
    </button>
  </div>
)

export default AdmittedList
