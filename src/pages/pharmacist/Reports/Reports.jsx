import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import metricsAPI from '@/services/api/metricsAPI'
import dispensesAPI from '@/services/api/dispensesAPI'
import inventoryAPI from '@/services/api/inventoryAPI'
import { getPrescriptions } from '@/services/api/prescriptionsAPI'
import { getPatients } from '@/services/api/patientsAPI'
import { formatNigeriaDate, formatNigeriaDateTime } from '@/utils/formatDateTimeUtils'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import KolakLoader from '@/components/common/KolakLoader'
import { EmptyState } from '@/components/common'
import { 
  TbReportAnalytics, 
  TbPill, 
  TbCurrencyNaira 
} from 'react-icons/tb'
import { 
  FaPills, 
  FaBoxes, 
  FaCalendarAlt, 
  FaSearch, 
  FaTimes, 
  FaFileDownload, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaArrowRight 
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

const Reports = () => {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Raw data from APIs
  const [dispenses, setDispenses] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [inventories, setInventories] = useState([])
  const [patientsMap, setPatientsMap] = useState({})

  // View state & filters
  const [activeTab, setActiveTab] = useState('dispenses') // 'dispenses' | 'inventory'
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('all') // 'all' | 'today' | 'week' | 'month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [stockStatusFilter, setStockStatusFilter] = useState('all') // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [entriesPerPage, setEntriesPerPage] = useState(10)

  // Fetch report data
  const fetchReportData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    else setLoading(true)

    try {
      const [mRes, dRes, pRes, invRes, patientsRes] = await Promise.allSettled([
        metricsAPI.getMetrics(),
        dispensesAPI.getDispenses(),
        getPrescriptions(),
        inventoryAPI.getInventories(),
        getPatients({ limit: 300 }),
      ])

      // Patients Map
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

      // Prescriptions
      if (pRes.status === 'fulfilled') {
        const rawList = pRes.value?.data ?? pRes.value ?? []
        setPrescriptions(Array.isArray(rawList) ? rawList : [])
      }

      // Dispenses
      if (dRes.status === 'fulfilled') {
        const rawDispenses = dRes.value?.data ?? dRes.value ?? []
        const dList = Array.isArray(rawDispenses) ? rawDispenses : []
        const mappedDispenses = dList.map((d, idx) => {
          const pId = d?.prescriptionId?.patientId || d?.patientId || d?.patient?.id
          const resolved = pId ? pMap[pId] : null

          let patientName = null
          let hospitalId = d?.patient?.hospitalId || resolved?.hospitalId || '—'
          let isDependant = Boolean(d?.dependantId || d?.prescriptionId?.dependantId || d?.dependant)

          if (d?.dependant) {
            patientName = `${d.dependant.firstName || ''} ${d.dependant.lastName || ''}`.trim()
            hospitalId = d.dependant.hospitalId || hospitalId
          } else if (d?.patient) {
            patientName = `${d.patient.firstName || ''} ${d.patient.lastName || ''}`.trim() || d.patient.fullName
            hospitalId = d.patient.hospitalId || hospitalId
          } else if (resolved) {
            patientName = resolved.name
          }

          const pharmacistName = d?.pharmacist
            ? `${d.pharmacist.firstName || ''} ${d.pharmacist.lastName || ''}`.trim()
            : 'Pharmacist'

          const items = Array.isArray(d?.items) ? d.items : []
          const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

          return {
            id: d?._id || d?.id || `DSP-${idx + 1}`,
            patientName: patientName || 'Unknown Patient',
            hospitalId,
            isDependant,
            pharmacistName,
            items,
            totalQty,
            status: d?.status || 'dispensed',
            dispensedAt: d?.dispensedAt || d?.createdAt,
            createdAt: d?.createdAt,
            raw: d
          }
        })

        // Sort newest first
        mappedDispenses.sort((a, b) => new Date(b.dispensedAt || 0) - new Date(a.dispensedAt || 0))
        setDispenses(mappedDispenses)
      }

      // Inventories
      if (invRes.status === 'fulfilled') {
        const rawInv = invRes.value?.data ?? invRes.value ?? []
        const invList = Array.isArray(rawInv) ? rawInv : (rawInv?.data ?? [])
        setInventories(invList)
      }

    } catch (err) {
      console.error('Reports: Error loading reports data', err)
      toast.error('Failed to load reports data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchReportData()
  }, [fetchReportData])

  // Computed Top Metrics
  const totalPrescriptionsCount = prescriptions.length
  const completedPrescriptions = prescriptions.filter(p => {
    const s = String(p.status || '').toLowerCase()
    return s.includes('dispensed') || s.includes('complete')
  }).length
  const pendingPrescriptions = prescriptions.filter(p => {
    const s = String(p.status || '').toLowerCase()
    return s.includes('pending') || s.includes('awaiting')
  }).length

  const totalUnitsDispensed = useMemo(() => {
    return dispenses.reduce((acc, d) => acc + (d.totalQty || 0), 0)
  }, [dispenses])

  const inventoryValuation = useMemo(() => {
    return inventories.reduce((acc, item) => {
      const qty = Number(item.quantity ?? item.stock ?? 0)
      const price = Number(item.unitPrice ?? item.price ?? 0)
      return acc + (qty * price)
    }, 0)
  }, [inventories])

  const lowStockCount = useMemo(() => {
    return inventories.filter(item => {
      const s = String(item.status || '').toLowerCase()
      const qty = Number(item.quantity ?? item.stock ?? 0)
      const reorder = Number(item.reorderLevel ?? 10)
      return s === 'low_stock' || s === 'out_of_stock' || qty <= reorder
    }).length
  }, [inventories])

  // Filtered Dispenses for Report Table
  const filteredDispenses = useMemo(() => {
    return dispenses.filter(d => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchPatient = d.patientName.toLowerCase().includes(q)
        const matchId = d.hospitalId.toLowerCase().includes(q)
        const matchPharmacist = d.pharmacistName.toLowerCase().includes(q)
        const matchItems = d.items.some(it => (it.drugName || '').toLowerCase().includes(q) || (it.batchNumber || '').toLowerCase().includes(q))
        if (!matchPatient && !matchId && !matchPharmacist && !matchItems) return false
      }

      return isDateInPeriod(d.dispensedAt, dateFilter, customStartDate, customEndDate)
    })
  }, [dispenses, searchQuery, dateFilter, customStartDate, customEndDate])

  // Filtered Inventory for Report Table
  const filteredInventory = useMemo(() => {
    return inventories.filter(item => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = String(item.name || item.drugName || '').toLowerCase().includes(q)
        const matchCategory = String(item.category || item.form || '').toLowerCase().includes(q)
        const matchSupplier = String(item.supplier || '').toLowerCase().includes(q)
        if (!matchName && !matchCategory && !matchSupplier) return false
      }

      if (stockStatusFilter !== 'all') {
        const s = String(item.status || '').toLowerCase()
        const qty = Number(item.quantity ?? item.stock ?? 0)
        const reorder = Number(item.reorderLevel ?? 10)

        if (stockStatusFilter === 'out_of_stock') {
          if (s !== 'out_of_stock' && qty > 0) return false
        } else if (stockStatusFilter === 'low_stock') {
          if (s !== 'low_stock' && (qty === 0 || qty > reorder)) return false
        } else if (stockStatusFilter === 'in_stock') {
          if (s !== 'in_stock' && qty <= reorder) return false
        }
      }

      return true
    })
  }, [inventories, searchQuery, stockStatusFilter])

  // Active dataset & pagination
  const currentDataset = activeTab === 'dispenses' ? filteredDispenses : filteredInventory
  const totalPages = Math.ceil(currentDataset.length / entriesPerPage) || 1
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage
    return currentDataset.slice(start, start + entriesPerPage)
  }, [currentDataset, currentPage, entriesPerPage])

  // Reset pagination on tab/filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery, dateFilter, customStartDate, customEndDate, stockStatusFilter, entriesPerPage])

  // Export to CSV Function
  const handleExportCSV = () => {
    if (currentDataset.length === 0) {
      toast.error('No report data to export')
      return
    }

    let csvContent = ''
    const todayStr = new Date().toISOString().split('T')[0]

    if (activeTab === 'dispenses') {
      const headers = ['S/N', 'Patient Name', 'Hospital ID', 'Type', 'Medications', 'Total Qty', 'Dispensed By', 'Date', 'Status']
      const rows = filteredDispenses.map((d, idx) => [
        idx + 1,
        `"${d.patientName}"`,
        `"${d.hospitalId}"`,
        `"${d.isDependant ? 'Dependant' : 'Patient'}"`,
        `"${d.items.map(it => `${it.drugName || 'Item'} (${it.quantity ?? 1})`).join('; ')}"`,
        d.totalQty,
        `"${d.pharmacistName}"`,
        `"${d.dispensedAt ? formatNigeriaDateTime(d.dispensedAt) : '—'}"`,
        `"${d.status}"`
      ])
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    } else {
      const headers = ['S/N', 'Medication Name', 'Form', 'Category', 'Current Stock', 'Reorder Level', 'Unit Price (NGN)', 'Valuation (NGN)', 'Status']
      const rows = filteredInventory.map((item, idx) => {
        const qty = Number(item.quantity ?? item.stock ?? 0)
        const price = Number(item.unitPrice ?? item.price ?? 0)
        return [
          idx + 1,
          `"${item.name || item.drugName || 'Item'}"`,
          `"${item.form || '—'}"`,
          `"${item.category || '—'}"`,
          qty,
          item.reorderLevel ?? 10,
          price,
          qty * price,
          `"${item.status || 'in_stock'}"`
        ]
      })
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Pharmacy_${activeTab === 'dispenses' ? 'Dispensation_Report' : 'Inventory_Valuation_Report'}_${todayStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Report successfully exported to CSV')
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
                <TbReportAnalytics className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-base-content tracking-tight">
                  Pharmacy Analytics & Reports
                </h1>
                <p className="text-xs text-base-content/60 mt-0.5">
                  {formatNigeriaDate(new Date())} • Comprehensive records on drug dispensing, fulfillment & stock valuation
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => fetchReportData(true)}
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
              <span className="text-xs">Export CSV Report</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW (4 CARDS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Prescriptions Processed */}
          <div className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-base-content/60">Prescriptions Processed</span>
                <div className="text-3xl font-black text-primary mt-1">
                  {totalPrescriptionsCount}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <FaPills className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-base-200 flex items-center justify-between text-xs font-medium">
              <span className="text-success">✓ {completedPrescriptions} Dispensed</span>
              <span className="text-warning">⏳ {pendingPrescriptions} Pending</span>
            </div>
          </div>

          {/* Card 2: Total Medication Units Dispensed */}
          <div className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-base-content/60">Total Medication Units</span>
                <div className="text-3xl font-black text-success mt-1">
                  {totalUnitsDispensed.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-success/10 text-success">
                <FaCheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-base-200 text-xs text-base-content/60">
              Across <strong className="text-base-content font-bold">{dispenses.length}</strong> dispensation events
            </div>
          </div>

          {/* Card 3: Total Inventory Valuation */}
          <div className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-base-content/60">Total Stock Valuation</span>
                <div className="text-2xl font-black text-base-content mt-1">
                  ₦{inventoryValuation.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-info/10 text-info">
                <TbCurrencyNaira className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-base-200 text-xs text-base-content/60">
              Calculated across <strong className="text-base-content font-bold">{inventories.length}</strong> catalog items
            </div>
          </div>

          {/* Card 4: Low Stock Alert Items */}
          <div className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-base-content/60">Stock Warnings</span>
                <div className="text-3xl font-black text-warning mt-1">
                  {lowStockCount}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-warning/10 text-warning">
                <FaExclamationTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-base-200 flex items-center justify-between text-xs">
              <span className="text-base-content/70">Needs Reordering</span>
              <Link to="/dashboard/pharmacist/Inventory&stocks" className="text-primary font-semibold hover:underline flex items-center gap-1">
                Restock <FaArrowRight className="w-2.5 h-2.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* REPORT CONTENT CARD */}
        <div className="rounded-2xl bg-base-100 border border-base-300 shadow-sm overflow-hidden">
          {/* TAB HEADER */}
          <div className="p-4 sm:p-5 border-b border-base-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-base-content tracking-tight">Pharmacy Performance Records</h2>
              <p className="text-xs text-base-content/60 mt-0.5">
                Detailed audit trail and item-by-item breakdown
              </p>
            </div>

            {/* View Selector Tabs */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('dispenses')}
                className={`btn btn-sm gap-2 transition-all ${
                  activeTab === 'dispenses'
                    ? 'btn-primary text-white shadow-xs'
                    : 'btn-ghost border border-base-300 text-base-content/70'
                }`}
              >
                <FaPills className="w-3.5 h-3.5" />
                <span>Dispensation History ({filteredDispenses.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className={`btn btn-sm gap-2 transition-all ${
                  activeTab === 'inventory'
                    ? 'btn-primary text-white shadow-xs'
                    : 'btn-ghost border border-base-300 text-base-content/70'
                }`}
              >
                <FaBoxes className="w-3.5 h-3.5" />
                <span>Inventory Valuation ({filteredInventory.length})</span>
              </button>
            </div>
          </div>

          {/* FILTER TOOLBAR */}
          <div className="p-4 bg-base-100/60 border-b border-base-200 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'dispenses'
                      ? 'Search patient, ID, medication, or pharmacist...'
                      : 'Search medicine name, category, or supplier...'
                  }
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

              {/* Inventory Status Filter (if inventory tab) */}
              {activeTab === 'inventory' && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-base-content/60 mr-1">Status:</span>
                  {[
                    { id: 'all', label: 'All Stock' },
                    { id: 'in_stock', label: 'In Stock' },
                    { id: 'low_stock', label: 'Low Stock' },
                    { id: 'out_of_stock', label: 'Out of Stock' },
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStockStatusFilter(st.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        stockStatusFilter === st.id
                          ? 'bg-primary text-primary-content shadow-xs'
                          : 'bg-base-200 text-base-content/70 hover:text-base-content'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Filters Row (Active on Dispenses Tab) */}
            {activeTab === 'dispenses' && (
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

                <div className="ml-auto text-xs text-base-content/60 font-medium">
                  Showing <strong className="text-primary font-bold">{filteredDispenses.length}</strong> records
                </div>
              </div>
            )}

            {/* Custom Date Range Picker */}
            {activeTab === 'dispenses' && dateFilter === 'custom' && (
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

          {/* REPORT DATA TABLE */}
          <div className="overflow-x-auto">
            {activeTab === 'dispenses' ? (
              /* DISPENSATION REPORT TABLE */
              <table className="table table-zebra w-full text-xs">
                <thead>
                  <tr className="bg-base-200/70 text-base-content font-bold">
                    <th className="w-12">S/N</th>
                    <th>Patient Profile</th>
                    <th>Hospital ID</th>
                    <th>Medications & Quantity</th>
                    <th>Batch No</th>
                    <th>Dispensed By</th>
                    <th>Date & Time</th>
                    <th className="text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-base-content/60">
                        <EmptyState
                          title="No dispensation records found"
                          description="No dispense events match your active search or date filters."
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
                        <tr key={dsp.id || idx} className="hover">
                          <td className="font-bold text-base-content/70">{serialNumber}</td>
                          <td>
                            <div className="flex flex-col">
                              <span className="font-bold text-base-content text-xs">{dsp.patientName}</span>
                              {dsp.isDependant && (
                                <span className="badge badge-secondary badge-xs w-fit mt-0.5">Dependant</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="font-mono text-xs font-semibold text-base-content/80 bg-base-200 px-2 py-0.5 rounded">
                              {dsp.hospitalId}
                            </span>
                          </td>
                          <td>
                            <div className="space-y-0.5">
                              {dsp.items.length === 0 ? (
                                <span className="text-base-content/50 italic">No item details</span>
                              ) : (
                                dsp.items.map((it, iIdx) => (
                                  <div key={iIdx} className="font-medium text-base-content">
                                    {it.drugName || 'Item'}
                                    <span className="text-primary font-bold ml-1">× {it.quantity ?? 1}</span>
                                    {it.form && <span className="text-base-content/50 ml-1">({it.form})</span>}
                                  </div>
                                ))
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="font-mono text-xs text-base-content/70">
                              {dsp.items?.[0]?.batchNumber || '—'}
                            </span>
                          </td>
                          <td>
                            <span className="font-medium text-base-content">{dsp.pharmacistName}</span>
                          </td>
                          <td>
                            <div className="flex flex-col text-[11px] leading-tight text-base-content/70">
                              <span className="font-semibold text-base-content">
                                {dsp.dispensedAt ? new Date(dsp.dispensedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                              </span>
                              <span className="text-[10px] text-base-content/50 font-mono">
                                {dsp.dispensedAt ? new Date(dsp.dispensedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                          </td>
                          <td className="text-right">
                            <span className="badge badge-sm badge-success text-white font-semibold">
                              Dispensed
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            ) : (
              /* INVENTORY VALUATION TABLE */
              <table className="table table-zebra w-full text-xs">
                <thead>
                  <tr className="bg-base-200/70 text-base-content font-bold">
                    <th className="w-12">S/N</th>
                    <th>Medication Name</th>
                    <th>Form & Category</th>
                    <th>Current Stock</th>
                    <th>Reorder Level</th>
                    <th>Unit Price</th>
                    <th>Stock Valuation</th>
                    <th className="text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-base-content/60">
                        <EmptyState
                          title="No inventory records found"
                          description="No inventory items match your active filters."
                          actionLabel="Clear Filters"
                          onAction={() => {
                            setSearchQuery('')
                            setStockStatusFilter('all')
                          }}
                        />
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((item, idx) => {
                      const serialNumber = (currentPage - 1) * entriesPerPage + idx + 1
                      const qty = Number(item.quantity ?? item.stock ?? 0)
                      const reorder = Number(item.reorderLevel ?? 10)
                      const price = Number(item.unitPrice ?? item.price ?? 0)
                      const totalValuation = qty * price

                      const isOut = qty === 0 || item.status === 'out_of_stock'
                      const isLow = !isOut && (qty <= reorder || item.status === 'low_stock')

                      return (
                        <tr key={item._id || item.id || idx} className="hover">
                          <td className="font-bold text-base-content/70">{serialNumber}</td>
                          <td>
                            <div className="font-bold text-base-content text-xs">
                              {item.name || item.drugName || 'Item'}
                            </div>
                          </td>
                          <td>
                            <div className="text-base-content/70">
                              {item.form || '—'} {item.category ? `• ${item.category}` : ''}
                            </div>
                          </td>
                          <td>
                            <span className={`font-bold ${isOut ? 'text-error' : isLow ? 'text-warning' : 'text-success'}`}>
                              {qty.toLocaleString()} units
                            </span>
                          </td>
                          <td>
                            <span className="text-base-content/60 font-mono">
                              {reorder} units
                            </span>
                          </td>
                          <td>
                            <span className="font-medium text-base-content">
                              ₦{price.toLocaleString()}
                            </span>
                          </td>
                          <td>
                            <span className="font-bold text-primary">
                              ₦{totalValuation.toLocaleString()}
                            </span>
                          </td>
                          <td className="text-right">
                            <span className={`badge badge-sm font-semibold capitalize ${
                              isOut
                                ? 'badge-error text-white'
                                : isLow
                                ? 'badge-warning'
                                : 'badge-success text-white'
                            }`}>
                              {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* TABLE FOOTER & PAGINATION */}
          <div className="p-4 border-t border-base-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-base-content/70">
            <div className="flex items-center gap-3">
              <span>
                Showing {currentDataset.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to{' '}
                {Math.min(currentPage * entriesPerPage, currentDataset.length)} of {currentDataset.length} entries
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

export default Reports
