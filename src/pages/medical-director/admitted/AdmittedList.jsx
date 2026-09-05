import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/common'
import MedicalDirectorSidebar from '@/components/medical-director/dashboard/Sidebar'
import { getPatients } from '@/services/api/patientsAPI'
import { getDependants } from '@/services/api/dependantAPI'
import { getAdmissions } from '@/services/api/admissionApi'
import { getVitals } from '@/services/api/vitalsAPI'
import { getAllBillings, getAllReceipts } from '@/services/api/billingAPI'
import { formatNigeriaDateTimeShort } from '@/utils/formatDateTimeUtils'
import toast from 'react-hot-toast'
import { FaBed, FaSearch, FaUserInjured, FaNotesMedical, FaHeartbeat, FaCheckCircle, FaExclamationTriangle, FaCoins, FaClock } from 'react-icons/fa'

const MDAdmittedList = () => {
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

      if (patientsRes.status === 'rejected') console.error('MDAdmittedList: getPatients failed', patientsRes.reason)
      if (dependantsRes.status === 'rejected') console.error('MDAdmittedList: getDependants failed', dependantsRes.reason)
      if (admissionsRes.status === 'rejected') console.error('MDAdmittedList: getAdmissions failed', admissionsRes.reason)

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

  const list = activeTab === 'pending admissions' ? pending : admitted

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
    navigate(`/dashboard/medical-director/admitted/${item.patientId}`, {
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
        <MedicalDirectorSidebar onCloseSidebar={() => setIsSidebarOpen(false)} />
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
          <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">

            {/* Top Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-base-100 p-4 sm:p-5 rounded-2xl shadow-sm border border-base-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                  <FaBed className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-base-content">
                    Inpatient Admissions
                  </h1>
                  <p className="text-xs sm:text-sm text-base-content/60">
                    Medical Director oversight for active inpatient records, vitals, rounds, and orders
                  </p>
                </div>
              </div>

            </div>

            {/* Controls Bar: Tabs + Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Tab Switcher */}
              <div className="tabs tabs-boxed bg-base-100 p-1 rounded-xl shadow-xs border border-base-200 self-start">
                <button
                  onClick={() => setActiveTab('admitted')}
                  className={`tab tab-sm sm:tab-md rounded-lg font-medium transition-all ${
                    activeTab === 'admitted'
                      ? 'tab-active !bg-primary !text-white shadow-xs'
                      : 'text-base-content/70 hover:text-base-content'
                  }`}
                >
                  <FaBed className="w-3.5 h-3.5 mr-1.5" />
                  Admitted ({admitted.length})
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`tab tab-sm sm:tab-md rounded-lg font-medium transition-all ${
                    activeTab === 'pending'
                      ? 'tab-active !bg-primary !text-white shadow-xs'
                      : 'text-base-content/70 hover:text-base-content'
                  }`}
                >
                  <FaClock className="w-3.5 h-3.5 mr-1.5" />
                  Pending ({pending.length})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative flex-1 sm:max-w-xs">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 text-xs" />
                <input
                  type="text"
                  placeholder="Search by name, ward, bed..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input input-sm sm:input-md input-bordered w-full pl-9 rounded-xl bg-base-100 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Content Table / Cards */}
            {filtered.length === 0 ? (
              <div className="bg-base-100 rounded-2xl p-12 text-center shadow-sm border border-base-200 space-y-3">
                <FaBed className="w-12 h-12 text-base-content/20 mx-auto" />
                <h3 className="font-semibold text-base-content text-base">
                  {search ? 'No patients match your search' : activeTab === 'pending' ? 'No pending admissions' : 'No patients currently admitted'}
                </h3>
                <p className="text-xs text-base-content/50 max-w-sm mx-auto">
                  {search ? 'Try adjusting your search terms' : 'Admitted inpatient records will appear here once assigned to a ward.'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden">
                  <table className="table table-sm lg:table-md w-full">
                    <thead>
                      <tr className="bg-base-200/50 text-base-content/60 text-xs uppercase tracking-wider">
                        <th>Patient</th>
                        <th>Ward & Bed</th>
                        <th>Admitted Date</th>
                        <th>Billing & Payment</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-200 text-xs sm:text-sm">
                      {paginated.map((item) => (
                        <tr key={item.key} className="hover:bg-base-200/30 transition-colors">
                          <td>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {item.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-base-content truncate">{item.name}</p>
                                {item.relationshipType ? (
                                  <span className="badge badge-outline badge-xs text-base-content/60">
                                    {item.relationshipType} of {item.parentPatient?.firstName || 'Principal'}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-base-content/40">Principal Patient</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <span className="font-medium text-base-content">{item.ward}</span>
                              {item.bedNumber ? (
                                <span className="ml-1.5 badge badge-ghost badge-xs">Bed {item.bedNumber}</span>
                              ) : (
                                <span className="ml-1.5 text-[11px] text-warning italic">No Bed</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="text-base-content/70">
                              {formatNigeriaDateTimeShort(item.admittedAt)}
                            </span>
                          </td>
                          
                          <td>
                            <PaymentStatusBadge paymentInfo={item.paymentInfo} />
                          </td>
                          <td className="text-right">
                            {activeTab === 'pending' ? (
                              <span className="text-xs text-base-content/40 italic">Awaiting Bed</span>
                            ) : (
                              <button
                                onClick={() => openAdmission(item)}
                                className="btn btn-primary btn-xs sm:btn-sm rounded-lg font-medium gap-1.5 shadow-2xs"
                              >
                                <FaNotesMedical className="w-3 h-3" />
                                Review Patient
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {paginated.map((item) =>
                    activeTab === 'pending' ? (
                      <PendingCard key={item.key} item={item} />
                    ) : (
                      <AdmittedCard key={item.key} item={item} onOpen={() => openAdmission(item)} />
                    )
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-base-content/60">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
                    </p>
                    <div className="join">
                      <button
                        className="join-item btn btn-xs sm:btn-sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                      >
                        «
                      </button>
                      <button className="join-item btn btn-xs sm:btn-sm btn-active">
                        Page {currentPage} of {totalPages}
                      </button>
                      <button
                        className="join-item btn btn-xs sm:btn-sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                      >
                        »
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

const PaymentStatusBadge = ({ paymentInfo }) => {
  if (!paymentInfo) return <span className="badge badge-ghost badge-xs font-semibold text-base-content/60">Unbilled</span>
  const { status, totalAmount = 0, paidAmount = 0 } = paymentInfo

  if (status === 'paid') {
    return (
      <div className="inline-flex items-center gap-1.5">
        <span className="badge badge-success badge-xs text-white font-semibold gap-1">
          <FaCheckCircle className="w-2.5 h-2.5" /> Paid
        </span>
        {totalAmount > 0 && (
          <span className="text-[11px] text-base-content/60 font-medium">₦{totalAmount.toLocaleString()}</span>
        )}
      </div>
    )
  }

  if (status === 'partial') {
    return (
      <div className="inline-flex flex-col items-start gap-0.5">
        <span className="badge badge-warning badge-xs font-semibold gap-1">
          <FaCoins className="w-2.5 h-2.5" /> Partial
        </span>
        <span className="text-[10px] text-warning font-semibold">
          ₦{paidAmount.toLocaleString()} / ₦{totalAmount.toLocaleString()}
        </span>
      </div>
    )
  }

  if (status === 'unpaid') {
    return (
      <div className="inline-flex items-center gap-1.5">
        <span className="badge badge-error badge-xs font-semibold gap-1">
          <FaExclamationTriangle className="w-2.5 h-2.5" /> Unpaid
        </span>
        {totalAmount > 0 && (
          <span className="text-[11px] text-error font-medium">₦{totalAmount.toLocaleString()}</span>
        )}
      </div>
    )
  }

  return (
    <span className="badge badge-ghost badge-xs font-semibold text-base-content/60 gap-1">
      <FaClock className="w-2.5 h-2.5" /> Unbilled
    </span>
  )
}

const PendingCard = ({ item }) => {
  const paymentInfo = item.paymentInfo
  return (
    <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-sm text-base-content truncate">{item.name}</p>
          <p className="text-xs text-base-content/50">
            {item.relationshipType ? `${item.relationshipType} of ${item.parentPatient?.firstName || 'Principal'}` : 'Principal Patient'}
          </p>
        </div>
        {paymentInfo?.status === 'paid' && (
          <span className="badge badge-success badge-xs text-white font-semibold gap-1 shrink-0">
            <FaCheckCircle className="w-2.5 h-2.5" /> Paid
          </span>
        )}
        {paymentInfo?.status === 'partial' && (
          <span className="badge badge-warning badge-xs font-semibold gap-1 shrink-0">
            <FaCoins className="w-2.5 h-2.5" /> Partial
          </span>
        )}
        {paymentInfo?.status === 'unpaid' && (
          <span className="badge badge-error badge-xs font-semibold gap-1 shrink-0">
            <FaExclamationTriangle className="w-2.5 h-2.5" /> Unpaid
          </span>
        )}
        {paymentInfo?.status === 'unbilled' && (
          <span className="badge badge-ghost badge-xs font-semibold text-base-content/60 gap-1 shrink-0">
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

export default MDAdmittedList
