import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/common'
import DoctorSidebar from '@/components/doctor/dashboard/Sidebar'
import { getPatients } from '@/services/api/patientsAPI'
import { getDependants } from '@/services/api/dependantAPI'
import { getAdmissions } from '@/services/api/admissionApi'
import { getVitals } from '@/services/api/vitalsAPI'
import { getAllBillings, getAllReceipts } from '@/services/api/billingAPI'
import { formatNigeriaDateTimeShort } from '@/utils/formatDateTimeUtils'
import toast from 'react-hot-toast'
import { FaBed, FaSearch, FaUserInjured, FaNotesMedical, FaHeartbeat, FaCheckCircle, FaExclamationTriangle, FaCoins, FaClock } from 'react-icons/fa'

const DRAdmittedList = () => {
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [sidebarMounted, setSidebarMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('admitted') // 'admitted' | 'pending'
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const [pending, setPending] = useState([])
  const [admitted, setAdmitted] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => setSidebarMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [patientsRes, dependantsRes, admissionsRes, vitalsRes, billingsRes, receiptsRes] = await Promise.allSettled([
        getPatients(),
        getDependants(),
        getAdmissions(),
        getVitals(),
        getAllBillings({ skipErrorToast: true }),
        getAllReceipts({ skipErrorToast: true }),
      ])

      const patients = patientsRes.status === 'fulfilled'
        ? (Array.isArray(patientsRes.value?.data) ? patientsRes.value.data : [])
        : []

      const dependants = dependantsRes.status === 'fulfilled'
        ? (() => {
            const raw = dependantsRes.value?.data?.data ?? dependantsRes.value?.data ?? []
            return Array.isArray(raw) ? raw : (raw?.dependants ?? [])
          })()
        : []

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

      if (patientsRes.status === 'rejected') console.error('DRAdmittedList: getPatients failed', patientsRes.reason)
      if (dependantsRes.status === 'rejected') console.error('DRAdmittedList: getDependants failed', dependantsRes.reason)
      if (admissionsRes.status === 'rejected') console.error('DRAdmittedList: getAdmissions failed', admissionsRes.reason)

      const patientMap = new Map(patients.map(p => [p.id, p]))
      const dependantMap = new Map(dependants.map(d => [d.id, d]))
      const activeAdmissions = allAdmissions.filter(a => a.status !== 'discharged')

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
        const source = isDependant
          ? dependantMap.get(admission.dependantId)
          : patientMap.get(admission.patientId)
        const parentPatient = isDependant ? patientMap.get(admission.patientId) : null
        const targetId = admission.dependantId || admission.patientId
        const latestVitalInfo = vitalsMap.get(targetId)

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
          dependantId: admission.dependantId || null,
          name: `${source?.firstName || ''} ${source?.lastName || ''}`.trim() || 'Unknown',
          ward: admission.ward || admission.wardId || 'General Ward',
          bedNumber: admission.bedNumber || '',
          admittedAt: admission.confirmedAt || admission.admittedAt || admission.createdAt,
          lastVitalsTime: latestVitalInfo?.createdAt || null,
          relationshipType: isDependant ? source?.relationshipType : null,
          parentPatient,
          admission,
          paymentInfo,
          raw: source,
        }
      }

      const pendingItems = activeAdmissions.filter(a => !a.confirmedAt).map(buildItem)
      const admittedItems = activeAdmissions.filter(a => !!a.confirmedAt).map(buildItem)

      setPending(pendingItems)
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

  const list = activeTab === 'pending' ? pending : admitted

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(item =>
      item.name.toLowerCase().includes(q) ||
      String(item.ward).toLowerCase().includes(q) ||
      String(item.bedNumber).toLowerCase().includes(q)
    )
  }, [list, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage])

  useEffect(() => { setCurrentPage(1) }, [activeTab, search])

  const openAdmission = (item) => {
    navigate(`/dashboard/doctor/admitted/${item.patientId}`, {
      state: {
        admission: item.admission,
        dependantId: item.dependantId,
        dependantSnapshot: item.type === 'dependant' ? item.raw : null,
        patientSnapshot: item.parentPatient || (item.type === 'patient' ? item.raw : null),
        from: 'admitted',
      }
    })
  }

  const SidebarDrawer = () => (
    <>
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs" onClick={() => setIsSidebarOpen(false)} />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform lg:static lg:translate-x-0 lg:z-auto ${
          sidebarMounted ? 'transition-transform duration-300 ease-in-out' : ''
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <DoctorSidebar onCloseSidebar={() => setIsSidebarOpen(false)} />
      </div>
    </>
  )

  if (loading) {
    return (
      <div className="flex h-screen bg-base-200">
        <SidebarDrawer />
        <div className="flex overflow-hidden flex-col flex-1">
          <Header onToggleSidebar={() => setIsSidebarOpen(true)} />
          <div className="flex items-center justify-center flex-1 px-4">
            <div className="text-center space-y-3">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-sm font-medium text-base-content/70">Loading admitted patients...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-base-200">
        <SidebarDrawer />
        <div className="flex overflow-hidden flex-col flex-1">
          <Header onToggleSidebar={() => setIsSidebarOpen(true)} />
          <div className="flex items-center justify-center flex-1 px-4">
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
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-base-200">
      <SidebarDrawer />
      <div className="flex overflow-hidden flex-col flex-1">
        <Header onToggleSidebar={() => setIsSidebarOpen(true)} />
        <div className="overflow-y-auto flex-1">
          <section className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
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
                      Inpatient ward management, continuous vitals tracking, and clinical rounds
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
                  <PendingCard key={item.key} item={item} />
                ) : (
                  <AdmittedCard key={item.key} item={item} onOpen={() => openAdmission(item)} />
                )
              ))}
            </div>

            {/* Desktop DataTable (>= lg) */}
            <div className="hidden lg:block bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-base-200/60 text-xs uppercase tracking-wider text-base-content/70">
                    <tr>
                      <th className="py-3.5 px-4">Patient Profile</th>
                      <th className="py-3.5 px-4">Record Type</th>
                      <th className="py-3.5 px-4">Ward & Bed Number</th>
                      {activeTab === 'pending' ? (
                        <th className="py-3.5 px-4">Billing / Payment</th>
                      ) : (
                        <>
                          <th className="py-3.5 px-4">Admitted Timestamp</th>
                          <th className="py-3.5 px-4">Last Vitals Recorded</th>
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
                            <span className="badge badge-ghost badge-sm font-medium">Primary Patient</span>
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
                          <>
                            <td className="py-3.5 px-4 text-xs font-medium text-base-content/80">
                              {formatNigeriaDateTimeShort(item.admittedAt)}
                            </td>
                            <td className="py-3.5 px-4 text-xs">
                              {item.lastVitalsTime ? (
                                <div className="flex items-center gap-1.5 text-success font-medium">
                                  <FaHeartbeat className="w-3.5 h-3.5 shrink-0" />
                                  <span>{formatNigeriaDateTimeShort(item.lastVitalsTime)}</span>
                                </div>
                              ) : (
                                <span className="text-base-content/40 italic text-xs">No vitals logged</span>
                              )}
                            </td>
                          </>
                        )}
                        <td className="py-3.5 px-4 text-right">
                          {activeTab === 'pending' ? (
                            <span className="text-xs text-base-content/50 italic">Awaiting nurse admission</span>
                          ) : (
                            <button
                              onClick={() => openAdmission(item)}
                              className="btn btn-sm btn-primary rounded-xl gap-2 font-medium"
                            >
                              <FaNotesMedical className="w-3.5 h-3.5" />
                              Open Record
                            </button>
                          )}
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
                    : activeTab === 'pending'
                    ? 'There are currently no patients pending admission.'
                    : 'There are currently no patients admitted to any hospital ward.'}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
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

const PendingCard = ({ item }) => {
  const { paymentInfo } = item
  return (
    <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-sm text-base-content truncate">{item.name}</p>
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
      <p className="text-xs text-base-content/40 italic text-center pt-1 border-t border-base-200">
        Awaiting nurse confirmation & bed assignment
      </p>
    </div>
  )
}

const AdmittedCard = ({ item, onOpen }) => (
  <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-4 space-y-3">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="font-bold text-sm text-base-content truncate">{item.name}</p>
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
          {item.lastVitalsTime ? formatNigeriaDateTimeShort(item.lastVitalsTime) : 'None'}
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

export default DRAdmittedList