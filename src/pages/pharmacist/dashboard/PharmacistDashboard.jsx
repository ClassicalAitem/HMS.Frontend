import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { 
  FaPills, 
  FaPrescriptionBottleAlt, 
  FaBoxes, 
  FaCalendarAlt, 
  FaEye, 
  FaArrowRight, 
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaSearch,
  FaTimes
} from 'react-icons/fa'
import { MdInventory, MdLocalPharmacy } from 'react-icons/md'
import { GiMedicines } from 'react-icons/gi'
import { RiRefreshLine } from 'react-icons/ri'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Link, useNavigate } from 'react-router-dom'
import { getMetrics } from '@/services/api/metricsAPI'
import { getPrescriptions } from '@/services/api/prescriptionsAPI'
import dispensesAPI from '@/services/api/dispensesAPI'
import { getInventories } from '@/services/api/inventoryAPI'
import { getPatients } from '@/services/api/patientsAPI'
import { getDependants } from '@/services/api/dependantAPI'
import PrescriptionDetailsModal from '@/components/modals/PrescriptionDetailsModal'
import { formatNigeriaDate, formatNigeriaDateTime } from '@/utils/formatDateTimeUtils'
import KolakLoader from '@/components/common/KolakLoader'
import { toast } from 'react-hot-toast'

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

const PharmacistDashboard = () => {
  const navigate = useNavigate()
  const today = new Date()
  const dateText = formatNigeriaDate(today)

  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Domain data
  const [metrics, setMetrics] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [dispenses, setDispenses] = useState([])
  const [incomingPatients, setIncomingPatients] = useState([])
  const [inventoryItems, setInventoryItems] = useState([])
  const [patientsMap, setPatientsMap] = useState({})

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null)

  // Table active tab and filters
  const [activeTab, setActiveTab] = useState('prescriptions') // 'prescriptions' | 'dispenses'
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'dispensed' | 'pending'
  const [dateFilter, setDateFilter] = useState('all') // 'all' | 'today' | 'week' | 'month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [entriesPerPage, setEntriesPerPage] = useState(10)

  // Fetch all pharmacy dashboard data
  const fetchAllData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const [metricsRes, prescriptionsRes, dispensesRes, incomingRes, inventoriesRes, patientsRes] = await Promise.allSettled([
        getMetrics(),
        getPrescriptions(),
        dispensesAPI.getDispenses(),
        Promise.allSettled([
          getPatients({ status: 'awaiting_pharmacy', limit: 100 }),
          getDependants({ status: 'awaiting_pharmacy', limit: 100 }),
        ]),
        getInventories(),
        getPatients({ limit: 300 }),
      ])

      // 1. Process Metrics
      if (metricsRes.status === 'fulfilled') {
        const mData = metricsRes.value?.data ?? metricsRes.value
        setMetrics(mData)
      }

      // 2. Process Patients Map for accurate name & hospitalId lookups
      const pMap = {}
      if (patientsRes.status === 'fulfilled') {
        const rawP = patientsRes.value?.data ?? patientsRes.value ?? []
        const pList = Array.isArray(rawP) ? rawP : (rawP.data ?? [])
        pList.forEach(p => {
          const name = `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || p?.fullName || 'Patient'
          const idKeys = [p?.id, p?._id, p?.hospitalId].filter(Boolean)
          idKeys.forEach(k => {
            pMap[k] = { name, hospitalId: p?.hospitalId || '—', phone: p?.phoneNumber || p?.phone || '—' }
          })
        })
      }
      setPatientsMap(pMap)

      // 3. Process Prescriptions
      if (prescriptionsRes.status === 'fulfilled') {
        const rawP = prescriptionsRes.value?.data ?? prescriptionsRes.value ?? []
        const pList = Array.isArray(rawP) ? rawP : []
        const mappedP = pList.map((p, idx) => {
          const patientId = p?.patientId || p?.patient?.id || p?.patient?._id
          const resolvedP = patientId ? pMap[patientId] : null
          
          let patientName = p?.patientName
          let hospitalId = p?.patient?.hospitalId || resolvedP?.hospitalId || ''
          let isDependant = Boolean(p?.dependantId || p?.dependant)

          if (p?.dependant) {
            patientName = `${p.dependant.firstName || ''} ${p.dependant.lastName || ''}`.trim() || 'Dependant'
            hospitalId = p?.dependant?.hospitalId || hospitalId
          } else if (p?.patient) {
            patientName = `${p.patient.firstName || ''} ${p.patient.lastName || ''}`.trim() || p.patient.fullName
            hospitalId = p.patient.hospitalId || hospitalId
          } else if (resolvedP) {
            patientName = resolvedP.name
          }

          const doctorName = p?.doctorName || 
            (p?.doctor ? `Dr. ${p.doctor.firstName || ''} ${p.doctor.lastName || ''}`.trim() : null) || 
            'Attending Doctor'

          return {
            id: p?._id || p?.id || `RX-${idx + 1}`,
            rawId: p?._id || p?.id,
            patientName: patientName || 'Unknown Patient',
            hospitalId: hospitalId || '—',
            isDependant,
            doctorName,
            medications: Array.isArray(p?.medications) ? p.medications : [],
            status: (p?.status || 'pending').toLowerCase(),
            createdAt: p?.createdAt,
            updatedAt: p?.updatedAt,
            raw: p
          }
        })

        // Sort descending by created date
        mappedP.sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
        setPrescriptions(mappedP)
      }

      // 4. Process Dispenses
      if (dispensesRes.status === 'fulfilled') {
        const rawD = dispensesRes.value?.data ?? dispensesRes.value ?? []
        const dList = Array.isArray(rawD) ? rawD : []
        const mappedD = dList.map((d, idx) => {
          const pId = d?.prescriptionId?.patientId || d?.patientId || d?.patient?.id
          const resolvedP = pId ? pMap[pId] : null

          let patientName = null
          let hospitalId = d?.patient?.hospitalId || resolvedP?.hospitalId || ''
          let isDependant = Boolean(d?.dependantId || d?.prescriptionId?.dependantId || d?.dependant)

          if (d?.dependant) {
            patientName = `${d.dependant.firstName || ''} ${d.dependant.lastName || ''}`.trim()
            hospitalId = d.dependant.hospitalId || hospitalId
          } else if (d?.patient) {
            patientName = `${d.patient.firstName || ''} ${d.patient.lastName || ''}`.trim() || d.patient.fullName
            hospitalId = d.patient.hospitalId || hospitalId
          } else if (resolvedP) {
            patientName = resolvedP.name
          }

          const pharmacistName = d?.pharmacist 
            ? `${d.pharmacist.firstName || ''} ${d.pharmacist.lastName || ''}`.trim() 
            : 'Pharmacist'

          const items = Array.isArray(d?.items) ? d.items : []

          return {
            id: d?._id || d?.id || `DSP-${idx + 1}`,
            rawId: d?._id || d?.id,
            prescriptionId: d?.prescriptionId?._id || d?.prescriptionId?.id || d?.prescriptionId,
            patientName: patientName || 'Unknown Patient',
            hospitalId: hospitalId || '—',
            isDependant,
            pharmacistName: pharmacistName || 'Pharmacist',
            items,
            status: (d?.status || 'dispensed').toLowerCase(),
            dispensedAt: d?.dispensedAt || d?.createdAt,
            createdAt: d?.createdAt,
            raw: d
          }
        })

        // Sort descending by dispensedAt
        mappedD.sort((a, b) => new Date(b.dispensedAt || b.createdAt || 0) - new Date(a.dispensedAt || a.createdAt || 0))
        setDispenses(mappedD)
      }

      // 5. Process Incoming Queue (Patients awaiting pharmacy)
      if (incomingRes.status === 'fulfilled' && Array.isArray(incomingRes.value)) {
        const [patSettled, depSettled] = incomingRes.value
        const patientsList = patSettled.status === 'fulfilled' ? (Array.isArray(patSettled.value?.data) ? patSettled.value.data : []) : []
        const dependantsRaw = depSettled.status === 'fulfilled' ? (depSettled.value?.data?.data ?? depSettled.value?.data ?? []) : []
        const dependantsList = Array.isArray(dependantsRaw) ? dependantsRaw : (dependantsRaw?.dependants ?? [])

        const PHARMACY_STATUSES = new Set(['awaiting_pharmacy', 'awaiting_pharmacist'])

        const queueP = patientsList
          .filter(p => PHARMACY_STATUSES.has(String(p?.status).toLowerCase()))
          .map(p => ({
            id: p?.id || p?._id,
            name: `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || p?.fullName || 'Unknown',
            hospitalId: p?.hospitalId || '—',
            updatedAt: p?.updatedAt || p?.createdAt,
            isDependant: false
          }))

        const queueD = dependantsList
          .filter(d => PHARMACY_STATUSES.has(String(d?.status).toLowerCase()))
          .map(d => ({
            id: d?.id || d?._id,
            name: `${d?.firstName || ''} ${d?.lastName || ''}`.trim() || 'Dependant',
            hospitalId: d?.hospitalId || d?.patient?.hospitalId || '—',
            updatedAt: d?.updatedAt || d?.createdAt,
            isDependant: true
          }))

        const mergedQueue = [...queueP, ...queueD].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
        setIncomingPatients(mergedQueue)
      }

      // 6. Process Inventories
      if (inventoriesRes.status === 'fulfilled') {
        const rawInv = inventoriesRes.value?.data ?? inventoriesRes.value ?? []
        const invList = Array.isArray(rawInv) ? rawInv : (rawInv?.data ?? [])
        setInventoryItems(invList)
      }

    } catch (err) {
      console.error('PharmacistDashboard: Error fetching dashboard data', err)
      toast.error('Failed to load some pharmacy data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Computed KPI Metrics
  const queueCount = incomingPatients.length
  const totalPrescriptions = prescriptions.length
  const completedPrescriptions = prescriptions.filter(p => 
    p.status.includes('dispensed') || p.status.includes('completed') || p.status === 'done'
  ).length
  const pendingPrescriptions = prescriptions.filter(p => 
    p.status.includes('pending') || p.status.includes('active') || p.status.includes('awaiting')
  ).length

  const totalDispenses = dispenses.length
  const todayStr = new Date().toISOString().split('T')[0]
  const todayDispenses = dispenses.filter(d => {
    if (!d.dispensedAt) return false
    return new Date(d.dispensedAt).toISOString().split('T')[0] === todayStr
  }).length

  // Inventory Stock Counts
  const inStock = metrics?.totalInStock ?? inventoryItems.filter(i => i.status === 'in_stock').length
  const lowStock = metrics?.totalLowStock ?? inventoryItems.filter(i => i.status === 'low_stock').length
  const outOfStock = metrics?.totalOutOfStock ?? inventoryItems.filter(i => i.status === 'out_of_stock').length
  const stockTotal = inStock + lowStock + outOfStock

  const pct = (v) => (stockTotal === 0 ? 0 : Math.round((v / stockTotal) * 100))
  const stockPercent = pct(inStock)

  const chartData = [
    { name: 'In Stock', value: pct(inStock), raw: inStock, color: '#16a34a' },
    { name: 'Low Stock', value: pct(lowStock), raw: lowStock, color: '#f59e0b' },
    { name: 'Out Of Stock', value: pct(outOfStock), raw: outOfStock, color: '#ef4444' },
  ]

  // Low stock medicine alerts
  const lowStockMedicines = useMemo(() => {
    return inventoryItems
      .filter(item => {
        const s = (item.status || '').toLowerCase()
        const qty = Number(item.quantity ?? 0)
        const reorder = Number(item.reorderLevel ?? 10)
        return s === 'low_stock' || s === 'out_of_stock' || qty <= reorder
      })
      .slice(0, 5)
  }, [inventoryItems])

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null
    const item = payload[0]?.payload
    return (
      <div className="bg-base-100 border border-base-300 p-2.5 text-xs rounded-xl shadow-lg">
        <div className="font-bold text-base-content">{item?.name}</div>
        <div className="text-base-content/70 mt-1">{item?.value}% ({item?.raw} items)</div>
      </div>
    )
  }

  // Filtered Prescriptions Dataset
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter(p => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchPatient = p.patientName.toLowerCase().includes(q)
        const matchId = p.hospitalId.toLowerCase().includes(q)
        const matchDoctor = p.doctorName.toLowerCase().includes(q)
        const matchMeds = p.medications.some(m => (m.drugName || m.drugCode || '').toLowerCase().includes(q))
        if (!matchPatient && !matchId && !matchDoctor && !matchMeds) return false
      }

      // 2. Status Filter
      if (statusFilter === 'dispensed') {
        const s = p.status.toLowerCase()
        if (!s.includes('dispensed') && !s.includes('completed')) return false
      } else if (statusFilter === 'pending') {
        const s = p.status.toLowerCase()
        if (!s.includes('pending') && !s.includes('active') && !s.includes('awaiting')) return false
      }

      // 3. Date Filter
      return isDateInPeriod(p.createdAt || p.updatedAt, dateFilter, customStartDate, customEndDate)
    })
  }, [prescriptions, searchQuery, statusFilter, dateFilter, customStartDate, customEndDate])

  // Filtered Dispenses Dataset
  const filteredDispenses = useMemo(() => {
    return dispenses.filter(d => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchPatient = d.patientName.toLowerCase().includes(q)
        const matchId = d.hospitalId.toLowerCase().includes(q)
        const matchPharmacist = d.pharmacistName.toLowerCase().includes(q)
        const matchItems = d.items.some(it => (it.drugName || '').toLowerCase().includes(q) || (it.batchNumber || '').toLowerCase().includes(q))
        if (!matchPatient && !matchId && !matchPharmacist && !matchItems) return false
      }

      // 2. Date Filter
      return isDateInPeriod(d.dispensedAt || d.createdAt, dateFilter, customStartDate, customEndDate)
    })
  }, [dispenses, searchQuery, dateFilter, customStartDate, customEndDate])

  // Active dataset for pagination
  const currentDataset = activeTab === 'prescriptions' ? filteredPrescriptions : filteredDispenses
  const totalPages = Math.ceil(currentDataset.length / entriesPerPage) || 1
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage
    return currentDataset.slice(start, start + entriesPerPage)
  }, [currentDataset, currentPage, entriesPerPage])

  // Reset page when filters or tab change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery, statusFilter, dateFilter, customStartDate, customEndDate, entriesPerPage])

  const handleOpenPrescription = (id) => {
    if (id) {
      setSelectedPrescriptionId(id)
      setIsModalOpen(true)
    }
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
                <FaPills className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-base-content tracking-tight">
                  Pharmacy Operations & Dispensation
                </h1>
                <p className="text-xs text-base-content/60 mt-0.5">
                  {dateText} • Comprehensive medication dispensing and inventory overview
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => fetchAllData(true)}
              className="btn btn-ghost btn-sm gap-1.5 border border-base-300"
              disabled={refreshing}
            >
              <RiRefreshLine className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-xs">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <Link
              to="/dashboard/pharmacist/incoming"
              className="btn btn-outline btn-primary btn-sm gap-2 relative"
            >
              <FaClock className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Incoming Queue</span>
              {queueCount > 0 && (
                <span className="badge badge-error badge-xs text-white font-bold animate-pulse">
                  {queueCount}
                </span>
              )}
            </Link>

            <Link
              to="/dashboard/pharmacist/DrugDispensation"
              className="btn btn-primary btn-sm gap-1.5 text-white font-semibold shadow-xs"
            >
              <GiMedicines className="w-4 h-4" />
              <span className="text-xs">Dispense Drugs</span>
            </Link>
          </div>
        </div>

        {/* TOP KPI CARDS (4 CARDS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Patients Waiting in Queue */}
          <div 
            onClick={() => navigate('/dashboard/pharmacist/incoming')}
            className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-xs hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-base-content/60">Waiting at Pharmacy</span>
                <div className="text-3xl font-black text-base-content mt-1 flex items-baseline gap-2">
                  {queueCount}
                  {queueCount > 0 && (
                    <span className="text-[11px] font-semibold text-warning px-2 py-0.5 rounded-full bg-warning/10">
                      Needs Attention
                    </span>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-warning/10 text-warning">
                <FaClock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-base-200 flex items-center justify-between text-xs text-primary font-semibold">
              <span>View Incoming Queue</span>
              <FaArrowRight className="w-3 h-3" />
            </div>
          </div>

          {/* Card 2: Total Prescriptions Processed */}
          <div className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-base-content/60">Doctor Prescriptions</span>
                <div className="text-3xl font-black text-primary mt-1">
                  {totalPrescriptions}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <FaPrescriptionBottleAlt className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-base-200 flex items-center justify-between text-xs">
              <span className="text-success font-medium">✓ {completedPrescriptions} Dispensed</span>
              <span className="text-warning font-medium">⏳ {pendingPrescriptions} Pending</span>
            </div>
          </div>

          {/* Card 3: Total Dispenses */}
          <div 
            onClick={() => navigate('/dashboard/pharmacist/DrugDispensation')}
            className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-xs hover:border-success/50 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-base-content/60">Medication Dispenses</span>
                <div className="text-3xl font-black text-success mt-1">
                  {totalDispenses}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-success/10 text-success">
                <FaCheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-base-200 flex items-center justify-between text-xs">
              <span className="text-base-content/70">
                Today: <strong className="text-success font-bold">{todayDispenses}</strong> dispenses
              </span>
              <span className="text-success font-semibold flex items-center gap-1">
                Log <FaArrowRight className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>

          {/* Card 4: Inventory & Stock Health */}
          <div 
            onClick={() => navigate('/dashboard/pharmacist/Inventory&stocks')}
            className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-xs hover:border-info/50 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-base-content/60">Stock Health Status</span>
                <div className="text-3xl font-black text-base-content mt-1">
                  {stockPercent}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-info/10 text-info">
                <MdInventory className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-base-200 flex items-center justify-between text-xs">
              <span className="text-success font-semibold">{inStock} In Stock</span>
              {lowStock > 0 ? (
                <span className="text-warning font-semibold flex items-center gap-1">
                  <FaExclamationTriangle className="w-2.5 h-2.5" /> {lowStock} Low
                </span>
              ) : (
                <span className="text-base-content/60">0 Low</span>
              )}
              {outOfStock > 0 && (
                <span className="text-error font-semibold">{outOfStock} Out</span>
              )}
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: STOCK DISTRIBUTION & LIVE WAITING QUEUE (2 COLUMNS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (5 cols): Inventory Health Donut & Low Stock Alert */}
          <div className="lg:col-span-5 rounded-2xl bg-base-100 border border-base-300 p-5 shadow-xs flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaBoxes className="text-primary w-4 h-4" />
                <h2 className="text-base font-bold text-base-content">Inventory Health & Stock</h2>
              </div>
              <Link to="/dashboard/pharmacist/Inventory&stocks" className="text-xs text-primary font-semibold hover:underline">
                Manage Stock →
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
              {/* Donut Chart */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <PieChart width={144} height={144}>
                  <Pie
                    data={chartData}
                    dataKey="raw"
                    cx={72}
                    cy={72}
                    innerRadius={46}
                    outerRadius={66}
                    paddingAngle={3}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-primary">{stockPercent}%</span>
                  <span className="text-[10px] text-base-content/50 uppercase font-bold">Healthy</span>
                </div>
              </div>

              {/* Legend & Summary */}
              <div className="space-y-2.5 text-xs w-full sm:w-auto">
                <div className="flex items-center justify-between gap-4 p-2 rounded-lg bg-base-200/50">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-success" />
                    <span className="font-medium text-base-content">In Stock</span>
                  </div>
                  <span className="font-bold text-success">{inStock} items</span>
                </div>
                <div className="flex items-center justify-between gap-4 p-2 rounded-lg bg-base-200/50">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-warning" />
                    <span className="font-medium text-base-content">Low Stock</span>
                  </div>
                  <span className="font-bold text-warning">{lowStock} items</span>
                </div>
                <div className="flex items-center justify-between gap-4 p-2 rounded-lg bg-base-200/50">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-error" />
                    <span className="font-medium text-base-content">Out of Stock</span>
                  </div>
                  <span className="font-bold text-error">{outOfStock} items</span>
                </div>
              </div>
            </div>

            {/* Low stock notice alert */}
            {lowStockMedicines.length > 0 && (
              <div className="pt-3 border-t border-base-200">
                <div className="text-xs font-bold text-warning flex items-center gap-1.5 mb-2">
                  <FaExclamationTriangle className="w-3.5 h-3.5" />
                  <span>Low Stock Warnings ({lowStockMedicines.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {lowStockMedicines.map((m, idx) => (
                    <span key={idx} className="badge badge-warning badge-outline text-[11px] gap-1 font-medium">
                      {m.name || m.drugName || 'Medicine'} ({m.quantity ?? 0} left)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (7 cols): Live Pharmacy Queue Preview */}
          <div className="lg:col-span-7 rounded-2xl bg-base-100 border border-base-300 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <FaClock className="text-primary w-4 h-4" />
                  {queueCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-error animate-ping" />
                  )}
                </div>
                <h2 className="text-base font-bold text-base-content">Live Pharmacy Queue</h2>
                <span className="badge badge-primary badge-sm font-semibold">{queueCount} Waiting</span>
              </div>
              <Link to="/dashboard/pharmacist/incoming" className="text-xs text-primary font-semibold hover:underline">
                View All Queue →
              </Link>
            </div>

            {/* Patients Waiting Cards or Clean State */}
            {incomingPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-base-200/30 rounded-xl border border-dashed border-base-300 flex-1">
                <div className="p-3 rounded-full bg-success/10 text-success mb-2">
                  <FaCheckCircle className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-base-content">Pharmacy Counter Queue is Clear</p>
                <p className="text-xs text-base-content/60 mt-1 max-w-sm">
                  There are no patients currently waiting for prescription dispensation.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 flex-1">
                {incomingPatients.slice(0, 4).map((pt, idx) => (
                  <div
                    key={pt.id || idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-base-200/50 hover:bg-base-200 border border-base-200 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold text-sm grid place-items-center">
                        {pt.name?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-base-content">{pt.name}</span>
                          {pt.isDependant && (
                            <span className="badge badge-secondary badge-xs">Dependant</span>
                          )}
                        </div>
                        <div className="text-[11px] text-base-content/60 font-mono">
                          ID: {pt.hospitalId} • Waiting since {pt.updatedAt ? new Date(pt.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/dashboard/pharmacist/DrugDispensation"
                      state={{ patientId: pt.id }}
                      className="btn btn-primary btn-xs font-semibold text-white gap-1"
                    >
                      <span>Dispense</span>
                      <FaArrowRight className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-base-200 flex items-center justify-between text-xs text-base-content/60">
              <span>Patients are automatically updated from Doctor and Inpatient consultations</span>
              <Link to="/dashboard/pharmacist/admissions" className="text-primary font-medium hover:underline">
                Inpatient Wards →
              </Link>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: RECENT ACTIVITIES (REAL DATA, TABS & CONTROLS) */}
        <div className="rounded-2xl bg-base-100 border border-base-300 shadow-sm overflow-hidden">
          {/* Title & Navigation Tabs */}
          <div className="p-4 sm:p-5 border-b border-base-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-base-content tracking-tight">Recent Pharmacy Activities</h2>
              <p className="text-xs text-base-content/60 mt-0.5">
                Real-time stream of doctor prescriptions and completed drug dispensations
              </p>
            </div>

            {/* Toggle Tabs */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('prescriptions')}
                className={`btn btn-sm gap-2 transition-all ${
                  activeTab === 'prescriptions'
                    ? 'btn-primary text-white shadow-xs'
                    : 'btn-ghost border border-base-300 text-base-content/70'
                }`}
              >
                <FaPrescriptionBottleAlt className="w-3.5 h-3.5" />
                <span>Doctor Prescriptions ({prescriptions.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('dispenses')}
                className={`btn btn-sm gap-2 transition-all ${
                  activeTab === 'dispenses'
                    ? 'btn-primary text-white shadow-xs'
                    : 'btn-ghost border border-base-300 text-base-content/70'
                }`}
              >
                <FaCheckCircle className="w-3.5 h-3.5" />
                <span>Completed Dispenses ({dispenses.length})</span>
              </button>
            </div>
          </div>

          {/* FILTER BAR */}
          <div className="p-4 bg-base-100/60 border-b border-base-200 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder={activeTab === 'prescriptions' ? 'Search by patient, ID, doctor, or drug...' : 'Search by patient, ID, or drug...'}
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

              {/* Status Filter (if Prescriptions tab) */}
              {activeTab === 'prescriptions' && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-base-content/60 mr-1">Status:</span>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'dispensed', label: 'Dispensed' },
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStatusFilter(st.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        statusFilter === st.id
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

              <div className="ml-auto text-xs text-base-content/60 font-medium">
                Showing <strong className="text-primary font-bold">{currentDataset.length}</strong> records
              </div>
            </div>

            {/* Custom Range Picker */}
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
            {activeTab === 'prescriptions' ? (
              /* DOCTOR PRESCRIPTIONS TABLE */
              <table className="table table-zebra w-full text-xs">
                <thead>
                  <tr className="bg-base-200/70 text-base-content font-bold">
                    <th className="w-12">S/N</th>
                    <th>Patient Profile</th>
                    <th>Prescribed By</th>
                    <th>Medications / Dosage</th>
                    <th>Prescription Date</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-base-content/60">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FaPrescriptionBottleAlt className="w-8 h-8 text-base-content/30" />
                          <p className="font-semibold text-sm">No prescriptions found</p>
                          <p className="text-xs text-base-content/50">Try adjusting your filters or date range</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((rx, idx) => {
                      const serialNumber = (currentPage - 1) * entriesPerPage + idx + 1
                      const isDispensed = rx.status.includes('dispensed') || rx.status.includes('complete')

                      return (
                        <tr 
                          key={rx.id || idx} 
                          className="hover cursor-pointer"
                          onClick={() => handleOpenPrescription(rx.rawId || rx.id)}
                        >
                          <td className="font-semibold text-base-content/70">{serialNumber}</td>
                          <td>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-base-content text-xs">{rx.patientName}</span>
                                {rx.isDependant && (
                                  <span className="badge badge-secondary badge-xs">Dependant</span>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-base-content/60">
                                ID: {rx.hospitalId}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="font-medium text-base-content">{rx.doctorName}</div>
                          </td>
                          <td>
                            <div className="max-w-md space-y-0.5">
                              {rx.medications.length === 0 ? (
                                <span className="text-base-content/50 italic">No drugs listed</span>
                              ) : (
                                rx.medications.slice(0, 2).map((m, mIdx) => (
                                  <div key={mIdx} className="text-xs">
                                    <span className="font-semibold text-base-content">
                                      {m.drugName || m.drugCode || 'Medication'}
                                    </span>
                                    {m.dosage && <span className="text-base-content/60 ml-1">({m.dosage})</span>}
                                    {m.frequency && <span className="text-base-content/50 ml-1">• {m.frequency}</span>}
                                  </div>
                                ))
                              )}
                              {rx.medications.length > 2 && (
                                <span className="text-[10px] text-primary font-semibold">
                                  +{rx.medications.length - 2} more drugs
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="text-base-content/70">
                              {rx.createdAt ? formatNigeriaDateTime(rx.createdAt) : '—'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-sm font-semibold capitalize ${
                              isDispensed
                                ? 'badge-success text-white'
                                : rx.status.includes('pending')
                                ? 'badge-warning'
                                : 'badge-ghost'
                            }`}>
                              {rx.status || 'Pending'}
                            </span>
                          </td>
                          <td className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenPrescription(rx.rawId || rx.id)}
                                className="btn btn-xs btn-ghost gap-1"
                              >
                                <FaEye className="w-3 h-3 text-base-content/60" />
                                <span>View</span>
                              </button>
                              {!isDispensed && (
                                <Link
                                  to="/dashboard/pharmacist/DrugDispensation"
                                  state={{ prescriptionId: rx.rawId || rx.id }}
                                  className="btn btn-xs btn-primary font-semibold text-white gap-1"
                                >
                                  <span>Dispense</span>
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            ) : (
              /* COMPLETED DISPENSES TABLE */
              <table className="table table-zebra w-full text-xs">
                <thead>
                  <tr className="bg-base-200/70 text-base-content font-bold">
                    <th className="w-12">S/N</th>
                    <th>Patient Profile</th>
                    <th>Dispensed Items</th>
                    <th>Batch No</th>
                    <th>Dispensed By</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-base-content/60">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FaCheckCircle className="w-8 h-8 text-base-content/30" />
                          <p className="font-semibold text-sm">No dispense records found</p>
                          <p className="text-xs text-base-content/50">Try adjusting your filters or date range</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((dsp, idx) => {
                      const serialNumber = (currentPage - 1) * entriesPerPage + idx + 1
                      return (
                        <tr key={dsp.id || idx} className="hover">
                          <td className="font-semibold text-base-content/70">{serialNumber}</td>
                          <td>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-base-content text-xs">{dsp.patientName}</span>
                                {dsp.isDependant && (
                                  <span className="badge badge-secondary badge-xs">Dependant</span>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-base-content/60">
                                ID: {dsp.hospitalId}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="space-y-0.5">
                              {dsp.items.length === 0 ? (
                                <span className="text-base-content/50 italic">Dispensed item</span>
                              ) : (
                                dsp.items.slice(0, 2).map((it, iIdx) => (
                                  <div key={iIdx} className="font-medium text-base-content">
                                    {it.drugName || 'Item'}
                                    <span className="text-primary font-bold ml-1">× {it.quantity ?? 1}</span>
                                    {it.form && <span className="text-base-content/50 ml-1">({it.form})</span>}
                                  </div>
                                ))
                              )}
                              {dsp.items.length > 2 && (
                                <span className="text-[10px] text-primary font-semibold">
                                  +{dsp.items.length - 2} more items
                                </span>
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
                            <span className="text-base-content/70">
                              {dsp.dispensedAt ? formatNigeriaDateTime(dsp.dispensedAt) : '—'}
                            </span>
                          </td>
                          <td>
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
                  onChange={(e) => setEntriesPerPage(Number(e.target.value))}
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

      {/* Prescription Details Modal */}
      <PrescriptionDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedPrescriptionId(null)
        }}
        prescriptionId={selectedPrescriptionId}
      />
    </PharmacistLayout>
  )
}

export default PharmacistDashboard
