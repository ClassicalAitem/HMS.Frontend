import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CashierLayout } from '@/layouts/cashier'
import { getAdmissions } from '@/services/api/admissionApi'
import { getAllBillings, getAllReceipts } from '@/services/api/billingAPI'
import { getAllWards } from '@/services/api/wardAPI'
import { getPatientById } from '@/services/api/patientsAPI'
import { formatNigeriaDateTimeShort } from '@/utils/formatDateTimeUtils'
import toast from 'react-hot-toast'
import { FaBed, FaSearch, FaCoins, FaCheckCircle, FaExclamationTriangle, FaClock, FaReceipt } from 'react-icons/fa'
import KolakLoader from '@/components/common/KolakLoader'

const CashierAdmissions = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const [admitted, setAdmitted] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [admissionsRes, billingsRes, receiptsRes, wardsRes] = await Promise.allSettled([
        getAdmissions(),
        getAllBillings({ skipErrorToast: true }),
        getAllReceipts({ skipErrorToast: true }),
        getAllWards(),
      ])

      const rawWards = wardsRes.status === 'fulfilled'
        ? (wardsRes.value?.data?.data ?? wardsRes.value?.data ?? wardsRes.value ?? [])
        : []
      const wardList = Array.isArray(rawWards) ? rawWards : (rawWards?.wards ?? rawWards?.rows ?? [])
      const wardMap = new Map()
      wardList.forEach(w => {
        if (!w) return
        const wId = String(w.id || w._id || '').trim()
        const wName = String(w.name || w.wardName || '').trim()
        if (wId) {
          wardMap.set(wId, wName || wId)
          wardMap.set(wId.toLowerCase(), wName || wId)
        }
        if (wName) {
          wardMap.set(wName.toLowerCase(), wName)
        }
      })

      const allAdmissions = admissionsRes.status === 'fulfilled'
        ? (() => {
            const raw = admissionsRes.value?.data ?? admissionsRes.value ?? []
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

      if (admissionsRes.status === 'rejected') console.error('CashierAdmissions: getAdmissions failed', admissionsRes.reason)
      
      // Active admissions (non-discharged patients)
      const activeAdmissions = allAdmissions.filter(a => {
        if (!a) return false
        const status = String(a.status || '').toLowerCase()
        return status !== 'discharged' && !a.dischargedAt
      })

      // Resolve missing parent patients for dependants
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

      const resolveWardName = (admission) => {
        if (!admission) return 'General Ward'
        
        // 1. Direct object on admission.ward
        if (admission.ward && typeof admission.ward === 'object') {
          const objName = admission.ward.name || admission.ward.wardName
          if (objName && typeof objName === 'string' && objName.trim()) {
            return objName.trim()
          }
          const objId = String(admission.ward.id || admission.ward._id || '').trim()
          if (objId && wardMap.has(objId)) return wardMap.get(objId)
          if (objId && wardMap.has(objId.toLowerCase())) return wardMap.get(objId.toLowerCase())
        }

        // 2. Direct string on admission.wardName
        if (typeof admission.wardName === 'string' && admission.wardName.trim()) {
          return admission.wardName.trim()
        }

        // 3. admission.wardId lookup
        if (admission.wardId) {
          const wId = String(admission.wardId).trim()
          if (wardMap.has(wId)) return wardMap.get(wId)
          if (wardMap.has(wId.toLowerCase())) return wardMap.get(wId.toLowerCase())
        }

        // 4. admission.ward lookup / fallback
        if (typeof admission.ward === 'string' && admission.ward.trim()) {
          const raw = admission.ward.trim()
          if (wardMap.has(raw)) return wardMap.get(raw)
          if (wardMap.has(raw.toLowerCase())) return wardMap.get(raw.toLowerCase())
          // If not a UUID string, it is already a human-readable ward name
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)
          if (!isUuid) return raw
        }

        return 'General Ward'
      }

      const resolveBedNumber = (admission) => {
        if (!admission) return ''
        let raw = ''
        if (admission.bedNumber !== undefined && admission.bedNumber !== null) {
          raw = String(admission.bedNumber)
        } else if (admission.bed && typeof admission.bed === 'object') {
          raw = String(admission.bed.number || admission.bed.bedNumber || admission.bed.name || '')
        } else if (typeof admission.bed === 'string') {
          raw = admission.bed
        }

        const trimmed = raw.trim()
        if (!trimmed || /^(unassigned|none|null|undefined|-)$/i.test(trimmed)) {
          return ''
        }

        // Remove redundant prefixes: e.g. "Bed 04" -> "04", "Bed-2" -> "2"
        return trimmed.replace(/^bed\s*[-#:]?\s*/i, '').trim()
      }

      const buildItem = (admission) => {
        const isDependant = !!admission.dependantId
        const source = isDependant ? admission.dependant : admission.patient
        const parentPatient = isDependant ? (admission.patient || admission.dependant?.patient || patientMap.get(String(admission.patientId))) : null
        const parentHospitalId = isDependant
          ? (parentPatient?.hospitalId || admission.patient?.hospitalId || admission.dependant?.patient?.hospitalId || patientMap.get(String(admission.patientId))?.hospitalId)
          : (source?.hospitalId || admission.patient?.hospitalId || patientMap.get(String(admission.patientId))?.hospitalId)
        const displayId = parentHospitalId || '—'

        const resolvedWard = resolveWardName(admission)
        const cleanBed = resolveBedNumber(admission)

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
            const bPatient = String(b.patientId || b.patient?.id || b.patient?._id || '')
            const bDep = b.dependantId ? String(b.dependantId) : null
            const sameSubject = dependantIdStr ? bDep === dependantIdStr : bPatient === patientIdStr
            return sameSubject && Array.isArray(b.itemDetails) && b.itemDetails.some(it =>
              it.code === 'admission' || it.code === 'bed' || String(it.admissionId || '') === admissionIdStr
            )
          })
          if (consultBills.length > 0) matchedBills.push(...consultBills)
        }

        let totalAmount = 0
        let totalPaid = 0
        let isCleared = false

        if (matchedBills.length > 0) {
          matchedBills.forEach(bill => {
            const billIdStr = String(bill.id || bill._id || '')
            totalAmount += Number(bill.totalAmount || 0)
            if (bill.isCleared) isCleared = true
            const receipts = allReceipts.filter(r => String(r.billingId || '') === billIdStr)
            totalPaid += receipts.reduce((sum, r) => sum + (Number(r.amountPaid) || 0), 0)
          })
        }

        // If no matched bills found by items/id, check if admission has estimated fee in admission.admissions
        if (totalAmount === 0 && Array.isArray(admission.admissions) && admission.admissions.length > 0) {
          const estimated = admission.admissions.reduce((sum, it) => sum + (Number(it.amount) || 0), 0)
          if (estimated > 0 && !admission.isBilled) totalAmount = estimated
        }

        let status = 'unbilled'
        if (isCleared || (totalAmount > 0 && totalPaid >= totalAmount) || !!admission.paidAt) {
          status = 'paid'
        } else if (totalPaid > 0) {
          status = 'partial'
        } else if (totalAmount > 0 || admission.isBilled || (admission.billId && matchedBills.length > 0)) {
          status = 'unpaid'
        } else {
          status = 'unbilled'
        }

        const outstandingAmount = Math.max(0, totalAmount - totalPaid)
        const paymentInfo = {
          status,
          totalAmount,
          paidAmount: totalPaid,
          outstandingAmount,
          isCleared: status === 'paid',
        }

        return {
          type: isDependant ? 'dependant' : 'patient',
          key: `admission-${admission._id || admission.id}`,
          patientId: admission.patientId,
          displayId,
          dependantId: admission.dependantId || null,
          name: `${source?.firstName || ''} ${source?.lastName || ''}`.trim() || 'Unknown',
          ward: resolvedWard,
          wardName: resolvedWard,
          bedNumber: cleanBed,
          admittedAt: admission.confirmedAt || admission.admittedAt || admission.createdAt,
          relationshipType: isDependant ? source?.relationshipType : null,
          parentPatient,
          admission,
          paymentInfo,
          raw: source,
        }
      }

      const admittedItems = activeAdmissions.map(buildItem)
      setAdmitted(admittedItems)
    } catch (err) {
      console.error('Failed to load admissions', err)
      setError('Failed to load admitted patients directory')
      toast.error('Failed to load admissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return admitted
    return admitted.filter(item =>
      item.name.toLowerCase().includes(q) ||
      String(item.ward || '').toLowerCase().includes(q) ||
      String(item.wardName || '').toLowerCase().includes(q) ||
      String(item.bedNumber || '').toLowerCase().includes(q) ||
      String(item.displayId || '').toLowerCase().includes(q)
    )
  }, [admitted, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage])

  useEffect(() => { setCurrentPage(1) }, [search])

  const openPatientDetails = (item) => {
    // Navigates directly to the Cashier's view for this patient where they can manage billing.
    const targetId = item?.admission?._id || item?.admission?.id || item?.admission || item?.id;
    if (targetId) {
      navigate(`/cashier/admissions/${targetId}`);
    } else {
      toast.error('Missing admission ID');
    }
  }

  if (loading) {
    return (
      <CashierLayout>
        <KolakLoader fullscreen />
      </CashierLayout>
    )
  }

  if (error) {
    return (
      <CashierLayout>
        <div className="flex items-center justify-center flex-1 px-4 py-20">
          <div className="text-center bg-base-100 p-8 rounded-2xl shadow-sm border border-base-300 max-w-md">
            <p className="text-sm font-semibold text-error mb-4">{error}</p>
            <button onClick={loadData} className="btn btn-primary btn-sm rounded-xl">
              Try Again
            </button>
          </div>
        </div>
      </CashierLayout>
    )
  }

  return (
    <CashierLayout>
      <section className="space-y-4 sm:space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                <FaBed className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-base-content">Admitted Patients</h1>
                <p className="text-xs sm:text-sm text-base-content/60">
                  Manage billing and track admission charges for patients currently in the ward
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-base-100 p-2.5 sm:p-3 rounded-2xl border border-base-200 shadow-sm min-w-0">
          <div className="inline-flex items-center p-2 rounded-xl text-sm font-semibold text-base-content">
            Total Admitted: {admitted.length}
          </div>

          <div className="relative w-full sm:w-80">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 text-sm" />
            <input
              type="text"
              placeholder="Search by patient ID, name, ward..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-sm sm:input-md input-bordered w-full pl-9 rounded-xl text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Mobile Card List (< lg) */}
        <div className="flex flex-col gap-3 lg:hidden min-w-0">
          {paginated.map((item) => (
            <AdmittedCard key={item.key} item={item} onOpen={() => openPatientDetails(item)} />
          ))}
        </div>

        {/* Desktop DataTable (>= lg) */}
        <div className="hidden lg:block bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden min-w-0">
          <div className="overflow-x-auto w-full min-w-0">
            <table className="table w-full">
              <thead className="bg-base-200/60 text-xs uppercase tracking-wider text-base-content/70">
                <tr>
                  <th className="py-3.5 px-4">Patient Profile</th>
                  <th className="py-3.5 px-4">Ward & Bed Number</th>
                  <th className="py-3.5 px-4">Billing Status</th>
                  <th className="py-3.5 px-4">Admitted Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200 text-sm">
                {paginated.map((item) => (
                  <tr key={item.key} className="hover:bg-base-200/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-base-content">{item.name}</div>
                          <div className="text-xs text-base-content/60 font-mono">{item.displayId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-base-content">{item.ward}</span>
                        {item.bedNumber ? (
                          <span className="badge badge-outline badge-sm text-xs font-semibold">
                            Bed {item.bedNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-base-content/40 italic">Unassigned Bed</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.paymentInfo?.status === 'paid' && (
                        <span className="badge badge-success badge-sm font-semibold gap-1">
                          <FaCheckCircle className="w-3 h-3" /> Paid & Cleared
                        </span>
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
                    <td className="py-3.5 px-4 text-xs font-medium text-base-content/80">
                      {formatNigeriaDateTimeShort(item.admittedAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openPatientDetails(item)}
                        className="btn btn-sm btn-primary rounded-xl gap-2 font-medium"
                      >
                        <FaReceipt className="w-3.5 h-3.5" />
                        Manage Billing
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="join bg-base-100 shadow-sm border border-base-200">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="join-item btn btn-sm"
              >
                Prev
              </button>
              {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                page === '...' ? (
                  <button key={`ellipsis-${idx}`} className="join-item btn btn-sm btn-disabled">…</button>
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
                : 'There are currently no active admitted patients.'}
            </p>
          </div>
        )}
      </section>
    </CashierLayout>
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

const AdmittedCard = ({ item, onOpen }) => {
  const { paymentInfo } = item
  return (
    <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-sm text-base-content truncate">{item.name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="badge badge-primary badge-xs">{item.ward}</span>
            {item.bedNumber ? (
              <span className="badge badge-outline badge-xs">Bed {item.bedNumber}</span>
            ) : (
              <span className="text-[10px] text-base-content/40 italic">Unassigned Bed</span>
            )}
          </div>
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

      <div className="text-xs text-base-content/70 space-y-1 bg-base-200/50 p-2.5 rounded-xl">
        <div className="flex justify-between">
          <span className="text-base-content/60">Admitted:</span>
          <span className="font-medium text-base-content">{formatNigeriaDateTimeShort(item.admittedAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-base-content/60">Patient ID:</span>
          <span className="font-medium font-mono text-base-content">{item.displayId || '—'}</span>
        </div>
      </div>

      <button
        onClick={onOpen}
        className="btn btn-primary btn-sm w-full rounded-xl gap-2 font-medium"
      >
        <FaReceipt className="w-3.5 h-3.5" />
        Manage Billing
      </button>
    </div>
  )
}

export default CashierAdmissions
