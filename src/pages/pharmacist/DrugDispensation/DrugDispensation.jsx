import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { useNavigate } from 'react-router-dom'
import dispensesAPI from '@/services/api/dispensesAPI'
import { getPatients } from '@/services/api/patientsAPI'
import { formatNigeriaDate, formatNigeriaDateTime } from '@/utils/formatDateTimeUtils'
import toast from 'react-hot-toast'
import KolakLoader from '@/components/common/KolakLoader'
import { EmptyState } from '@/components/common'
import { GiMedicines } from 'react-icons/gi'
import { 
  FaSearch, 
  FaTimes, 
  FaFileDownload, 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaClock, 
  FaArrowRight, 
  FaPills,
  FaBoxes
} from 'react-icons/fa'
import { RiRefreshLine } from 'react-icons/ri'

// Helper: Check if date falls in specified period
const isDateInPeriod = (dateStr, period, customStart, customEnd) => {
  if (period === 'all') return true
  if (!dateStr) return false

  let targetDate
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    targetDate = new Date(dateStr)
  } else if (typeof dateStr === 'string') {
    const parts = dateStr.trim().split(/[-/]/)
    if (parts.length === 3 && parts[0].length === 4) {
      targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
    } else {
      targetDate = new Date(dateStr)
    }
  } else {
    targetDate = new Date(dateStr)
  }

  if (isNaN(targetDate.getTime())) return false

  const targetYear = targetDate.getFullYear()
  const targetMonth = targetDate.getMonth()
  const targetDay = targetDate.getDate()

  const now = new Date()
  const todayYear = now.getFullYear()
  const todayMonth = now.getMonth()
  const todayDay = now.getDate()

  if (period === 'today') {
    return targetYear === todayYear && targetMonth === todayMonth && targetDay === todayDay
  }

  const targetTime = new Date(targetYear, targetMonth, targetDay).getTime()

  if (period === 'week') {
    const dayOfWeek = (now.getDay() + 6) % 7
    const startOfWeek = new Date(todayYear, todayMonth, todayDay - dayOfWeek, 0, 0, 0, 0).getTime()
    const endOfWeek = new Date(todayYear, todayMonth, todayDay - dayOfWeek + 6, 23, 59, 59, 999).getTime()
    return targetTime >= startOfWeek && targetTime <= endOfWeek
  }

  if (period === 'month') {
    const startOfMonth = new Date(todayYear, todayMonth, 1, 0, 0, 0, 0).getTime()
    const endOfMonth = new Date(todayYear, todayMonth + 1, 0, 23, 59, 59, 999).getTime()
    return targetTime >= startOfMonth && targetTime <= endOfMonth
  }

  if (period === 'custom') {
    if (!customStart && !customEnd) return true
    const s = customStart ? new Date(`${customStart}T00:00:00`).getTime() : 0
    const e = customEnd ? new Date(`${customEnd}T23:59:59.999`).getTime() : Infinity
    return targetTime >= s && targetTime <= e
  }

  return true
}

const DrugDispensation = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const [dispenses, setDispenses] = useState([])
  const [patientsMap, setPatientsMap] = useState({})

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all') // 'all' | 'today' | 'week' | 'month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [entriesPerPage, setEntriesPerPage] = useState(10)

  const fetchDispensesData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const [dispensesRes, patientsRes] = await Promise.allSettled([
        dispensesAPI.getDispenses(),
        getPatients({ limit: 300 }),
      ])

      // Patients dictionary
      const pMap = {}
      if (patientsRes.status === 'fulfilled') {
        const rawP = patientsRes.value?.data ?? patientsRes.value ?? []
        const pList = Array.isArray(rawP) ? rawP : (rawP.data ?? [])
        pList.forEach(p => {
          const name = `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || p?.fullName || 'Patient'
          const idKeys = [p?.id, p?._id, p?.hospitalId].filter(Boolean)
          idKeys.forEach(k => {
            pMap[k] = { name, hospitalId: p?.hospitalId || '—' }
          })
        })
      }
      setPatientsMap(pMap)

      if (dispensesRes.status === 'fulfilled') {
        const res = dispensesRes.value
        if (res && res.success === false) {
          setError(res.message || 'Failed to fetch dispenses')
          toast.error(res.message || 'Failed to fetch dispenses')
          return
        }

        const data = res?.data ?? res
        const list = Array.isArray(data) ? data : []

        // Group together per patient encounter (DO NOT SPLIT ONE BY ONE)
        const groupedRows = list.map((d, idx) => {
          const patientId =
            d?.prescriptionId?.patientId ||
            d?.patientId ||
            d?.patient?.id ||
            d?.patient?._id ||
            null

          const dependantId =
            d?.prescriptionId?.dependantId ||
            d?.dependantId ||
            d?.dependant?.id ||
            d?.dependant?._id ||
            null

          const resolved = patientId ? pMap[patientId] : null

          let patientName = 'Unknown Patient'
          let hospitalId = d?.patient?.hospitalId || resolved?.hospitalId || '—'
          let isDependant = Boolean(dependantId || d?.dependant)

          if (d?.dependant) {
            patientName = `${d.dependant.firstName || ''} ${d.dependant.lastName || ''}`.trim() || d.dependant.fullName || 'Dependant'
            hospitalId = d.dependant.hospitalId || hospitalId
          } else if (d?.patient) {
            patientName = `${d.patient.firstName || ''} ${d.patient.lastName || ''}`.trim() || d.patient.fullName || 'Unknown Patient'
            hospitalId = d.patient.hospitalId || hospitalId
          } else if (d?.opdPatient) {
            patientName = `${d.opdPatient.firstName || ''} ${d.opdPatient.lastName || ''}`.trim() || d.opdPatient.fullName || 'Unknown Patient'
            hospitalId = d.opdPatient.hospitalId || hospitalId
          } else if (resolved) {
            patientName = resolved.name
          }

          const pharmacistName = d?.pharmacist
            ? `${d.pharmacist.firstName || ''} ${d.pharmacist.lastName || ''}`.trim()
            : 'Pharmacist'

          const items = Array.isArray(d?.items) ? d.items : []
          const totalUnits = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)

          return {
            id: d?._id || d?.id || `DSP-${idx + 1}`,
            rawId: d?._id || d?.id,
            patientId,
            dependantId,
            patientName,
            hospitalId,
            isDependant,
            pharmacistName,
            items,
            totalUnits,
            status: (d.status || 'dispensed').toLowerCase(),
            dispensedAt: d.dispensedAt || d.createdAt || null,
            createdAt: d.createdAt,
            raw: d
          }
        })

        // Sort descending by dispensedAt (newest first)
        groupedRows.sort((a, b) => new Date(b.dispensedAt || 0) - new Date(a.dispensedAt || 0))
        setDispenses(groupedRows)
      }
    } catch (err) {
      console.error('DrugDispensation: fetch error', err)
      setError('Failed to load dispensation records')
      toast.error('Failed to load dispensation records')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDispensesData()
  }, [fetchDispensesData])

  // Real Stats
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    const todayCount = dispenses.filter(d => {
      if (!d.dispensedAt) return false
      return new Date(d.dispensedAt).toISOString().split('T')[0] === todayStr
    }).length

    const completedCount = dispenses.filter(d => d.status === 'dispensed' || d.status === 'completed').length
    const pendingCount = dispenses.filter(d => d.status !== 'dispensed' && d.status !== 'completed').length
    const totalUnits = dispenses.reduce((acc, d) => acc + d.totalUnits, 0)

    return {
      today: todayCount,
      completed: completedCount,
      pending: pendingCount,
      total: dispenses.length,
      totalUnits
    }
  }, [dispenses])

  // Filtered Dispenses
  const filtered = useMemo(() => {
    return dispenses.filter(d => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = d.patientName.toLowerCase().includes(q)
        const matchId = d.hospitalId.toLowerCase().includes(q)
        const matchPharmacist = d.pharmacistName.toLowerCase().includes(q)
        const matchItems = d.items.some(it => 
          (it.drugName || '').toLowerCase().includes(q) || 
          (it.batchNumber || '').toLowerCase().includes(q) ||
          (it.form || '').toLowerCase().includes(q)
        )
        if (!matchName && !matchId && !matchPharmacist && !matchItems) return false
      }

      // 2. Date Filter
      return isDateInPeriod(d.dispensedAt, dateFilter, customStartDate, customEndDate)
    })
  }, [dispenses, searchQuery, dateFilter, customStartDate, customEndDate])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / entriesPerPage))
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage
    return filtered.slice(start, start + entriesPerPage)
  }, [filtered, currentPage, entriesPerPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, dateFilter, customStartDate, customEndDate, entriesPerPage])

  const handleNavigatePatient = (row) => {
    const pid = row.patientId || row.dependantId
    if (!pid) return
    navigate(`/dashboard/pharmacist/incoming/${row.patientId || row.dependantId}`, {
      state: row.isDependant ? { dependantId: row.dependantId } : {}
    })
  }

  // Export CSV function
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error('No dispensation records to export')
      return
    }

    const headers = ['S/N', 'Patient Name', 'Hospital ID', 'Type', 'Dispensed Medications', 'Total Units', 'Pharmacist', 'Dispensed At', 'Status']
    const rows = filtered.map((d, idx) => [
      idx + 1,
      `"${d.patientName}"`,
      `"${d.hospitalId}"`,
      `"${d.isDependant ? 'Dependant' : 'Patient'}"`,
      `"${d.items.map(it => `${it.drugName || 'Item'} (Qty: ${it.quantity ?? 1}${it.batchNumber ? `, Batch: ${it.batchNumber}` : ''})`).join('; ')}"`,
      d.totalUnits,
      `"${d.pharmacistName}"`,
      `"${d.dispensedAt ? formatNigeriaDateTime(d.dispensedAt) : '—'}"`,
      `"${d.status}"`
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Drug_Dispensation_Records_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Dispensation records exported to CSV')
  }

  return (
    <PharmacistLayout>
      {loading && <KolakLoader fullscreen />}

      <div className="flex flex-col gap-6 p-2 sm:p-4 lg:p-6 min-w-0">
        {/* HEADER SECTION */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <GiMedicines className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-base-content tracking-tight">
                  Drug Dispensation Records
                </h1>
                <p className="text-xs text-base-content/60 mt-0.5">
                  {formatNigeriaDate(new Date())} • Patient medication fulfillment log and prescription dispensing ledger
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => fetchDispensesData(true)}
              className="btn btn-ghost btn-sm gap-1.5 border border-base-300"
              disabled={refreshing}
            >
              <RiRefreshLine className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-xs font-semibold">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="btn btn-success btn-sm gap-1.5 font-bold text-white shadow-xs"
            >
              <FaFileDownload className="w-3.5 h-3.5" />
              <span className="text-xs">Export CSV</span>
            </button>
          </div>
        </div>

        {/* TOP METRIC CARDS (4 CARDS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-base-content/60">Today's Dispensations</span>
                <div className="text-3xl font-black text-primary mt-1">
                  {stats.today}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <FaClock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-base-200 text-xs text-base-content/60">
              Completed patient orders today
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-base-content/60">Total Dispensed</span>
                <div className="text-3xl font-black text-success mt-1">
                  {stats.completed}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-success/10 text-success">
                <FaCheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-base-200 text-xs text-success font-medium">
              ✓ Fully fulfilled prescriptions
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-base-content/60">Total Drug Units</span>
                <div className="text-3xl font-black text-info mt-1">
                  {stats.totalUnits.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-info/10 text-info">
                <FaPills className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-base-200 text-xs text-base-content/60">
              Units dispensed to patients
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-base-content/60">All Records</span>
                <div className="text-3xl font-black text-base-content mt-1">
                  {stats.total}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-base-200 text-base-content">
                <FaBoxes className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-base-200 text-xs text-base-content/60">
              Total dispensation history
            </div>
          </div>
        </div>

        {/* MAIN TABLE CONTAINER */}
        <div className="rounded-2xl bg-base-100 border border-base-300 shadow-sm overflow-hidden">
          {/* FILTER TOOLBAR */}
          <div className="p-4 bg-base-100 border-b border-base-200 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search patient, hospital ID, medication, batch, pharmacist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-sm input-bordered w-full pl-9 pr-8 text-xs rounded-xl"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="text-xs text-base-content/60 font-medium self-end md:self-auto">
                Showing <strong className="text-primary font-bold">{filtered.length}</strong> patient records
              </div>
            </div>

            {/* Date Filters Row */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-base-200">
              <span className="text-xs font-semibold text-base-content/60 mr-1">Date:</span>
              {[
                { id: 'all', label: 'All Dates' },
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'custom', label: 'Custom Range' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setDateFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    dateFilter === f.id
                      ? 'bg-primary text-primary-content shadow-xs'
                      : 'bg-base-200 text-base-content/70 hover:text-base-content'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Custom Day Range Picker */}
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-base-200 text-xs">
                <span className="text-base-content/70 font-semibold flex items-center gap-1">
                  <FaCalendarAlt className="text-primary w-3 h-3" /> Select Day Range:
                </span>
                <div className="flex items-center gap-1.5 bg-base-200/60 px-3 py-1.5 rounded-xl border border-base-300">
                  <span className="text-base-content/60 font-medium">From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-transparent text-xs font-semibold outline-none cursor-pointer text-base-content"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-base-200/60 px-3 py-1.5 rounded-xl border border-base-300">
                  <span className="text-base-content/60 font-medium">To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-transparent text-xs font-semibold outline-none cursor-pointer text-base-content"
                  />
                </div>
                {(customStartDate || customEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStartDate('')
                      setCustomEndDate('')
                    }}
                    className="btn btn-ghost btn-xs text-error"
                  >
                    Clear Range
                  </button>
                )}
              </div>
            )}
          </div>

          {/* TABLE CONTENT */}
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-xs">
              <thead>
                <tr className="bg-base-200/70 text-base-content font-bold">
                  <th className="w-12">S/N</th>
                  <th>Patient Profile</th>
                  <th>Hospital ID</th>
                  <th>Dispensed Medications</th>
                  <th>Dispensed By</th>
                  <th>Time & Date</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-base-content/60">
                      <EmptyState
                        title="No dispensation records found"
                        description={
                          searchQuery
                            ? 'No records match your search query.'
                            : 'No medication dispensations found for the selected date range.'
                        }
                        actionLabel="Clear Filters"
                        onAction={() => {
                          setSearchQuery('')
                          setDateFilter('all')
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((dsp, idx) => {
                    const serialNumber = (currentPage - 1) * entriesPerPage + idx + 1

                    return (
                      <tr 
                        key={dsp.id || idx} 
                        className="hover cursor-pointer"
                        onClick={() => handleNavigatePatient(dsp)}
                      >
                        {/* S/N */}
                        <td className="font-bold text-base-content/70">{serialNumber}</td>

                        {/* Patient Profile */}
                        <td>
                          <div className="flex flex-col">
                            <span className="font-bold text-base-content text-sm hover:text-primary transition-colors">
                              {dsp.patientName}
                            </span>
                            {dsp.isDependant && (
                              <span className="badge badge-secondary badge-xs w-fit mt-0.5">
                                Dependant
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Hospital ID */}
                        <td>
                          <span className="font-mono text-xs font-semibold text-base-content/80 bg-base-200 px-2 py-0.5 rounded-md">
                            {dsp.hospitalId}
                          </span>
                        </td>

                        {/* Dispensed Medications (COMBINED TOGETHER) */}
                        <td>
                          <div className="space-y-1.5 py-1 max-w-md">
                            {dsp.items.length === 0 ? (
                              <span className="text-base-content/50 italic">No drug details listed</span>
                            ) : (
                              dsp.items.map((it, iIdx) => (
                                <div key={iIdx} className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-base-content text-xs">
                                    {it.drugName || 'Medication'}
                                  </span>
                                  <span className="badge badge-sm badge-primary font-bold text-white text-[11px]">
                                    × {it.quantity ?? 1}
                                  </span>
                                  {it.form && (
                                    <span className="text-[11px] text-base-content/60">
                                      ({it.form})
                                    </span>
                                  )}
                                  {it.batchNumber && (
                                    <span className="text-[10px] font-mono text-base-content/50 bg-base-200/80 px-1 rounded">
                                      Batch: {it.batchNumber}
                                    </span>
                                  )}
                                </div>
                              ))
                            )}
                            <div className="text-[10px] text-primary font-semibold pt-0.5">
                              Total: {dsp.items.length} {dsp.items.length === 1 ? 'item' : 'items'} ({dsp.totalUnits} units)
                            </div>
                          </div>
                        </td>

                        {/* Dispensed By (Pharmacist) */}
                        <td>
                          <span className="font-medium text-base-content text-xs">
                            {dsp.pharmacistName}
                          </span>
                        </td>

                        {/* Time & Date (Compact) */}
                        <td>
                          <div className="flex flex-col text-[11px] leading-tight text-base-content/70">
                            <span className="font-semibold text-base-content whitespace-nowrap">
                              {dsp.dispensedAt ? new Date(dsp.dispensedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </span>
                            <span className="text-[10px] text-base-content/50 font-mono whitespace-nowrap">
                              {dsp.dispensedAt ? new Date(dsp.dispensedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <span className="badge badge-sm badge-success text-white font-semibold">
                            Dispensed
                          </span>
                        </td>

                        {/* Action */}
                        <td className="text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleNavigatePatient(dsp)}
                            className="btn btn-xs btn-primary font-bold text-white shadow-xs gap-1"
                          >
                            <span>View</span>
                            <FaArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER & PAGINATION */}
          <div className="p-4 border-t border-base-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-base-content/70">
            <div className="flex items-center gap-3">
              <span>
                Showing {filtered.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to{' '}
                {Math.min(currentPage * entriesPerPage, filtered.length)} of {filtered.length} entries
              </span>
              <div className="flex items-center gap-1">
                <span>Show:</span>
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="select select-bordered select-xs text-xs rounded-lg"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="join">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="join-item btn btn-xs btn-ghost border border-base-300"
                >
                  « Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum = i + 1
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 2 + i
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i)
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`join-item btn btn-xs ${
                        currentPage === pageNum ? 'btn-primary text-white font-bold' : 'btn-ghost border border-base-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="join-item btn btn-xs btn-ghost border border-base-300"
                >
                  Next »
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PharmacistLayout>
  )
}

export default DrugDispensation
