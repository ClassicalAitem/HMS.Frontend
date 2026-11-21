import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { MdAdd } from 'react-icons/md'
import { 
  FaFileUpload, 
  FaFileDownload, 
  FaSearch, 
  FaTimes, 
  FaBoxes, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaClock, 
  FaBan, 
  FaPills, 
  FaEdit, 
  FaSyncAlt, 
  FaLayerGroup,
  FaWarehouse,
  FaInfoCircle
} from 'react-icons/fa'
import { RiRefreshLine } from 'react-icons/ri'
import { GiMedicines } from 'react-icons/gi'
import toast from 'react-hot-toast'
import {
  getInventories,
  createInventory,
  updateInventory,
  restockInventory,
  reduceInventory,
} from '@/services/api/inventoryAPI'
import { PharmacistLayout } from '@/layouts/pharmacist'
import KolakLoader from '@/components/common/KolakLoader'
import { EmptyState } from '@/components/common'
import { getErrorMessage, showErrorToast } from '@/utils/errorHandler'
import { InventoryFormModal } from '@/components/modals/InventoryFormModal'

const UNIT_LABELS = {
  tablet: 'Tablet',
  ml: 'ml',
  iu: 'IU',
  ampoule: 'Ampoule',
  tube: 'Tube',
}

const pricePerUnit = (item) => {
  const packSize = Number(item.packSize) || 1
  const sellingPrice = Number(item.sellingPrice) || 0
  return sellingPrice / packSize
}

// Compact pagination numbers generator
const getPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('...')
  for (let p = start; p <= end; p += 1) pages.push(p)
  if (end < total - 1) pages.push('...')
  pages.push(total)
  return pages
}

const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return { text: 'No expiry', badgeClass: 'bg-base-200 text-base-content/50', days: null }
  const exp = new Date(expiryDate).getTime()
  if (isNaN(exp)) return { text: 'Invalid date', badgeClass: 'bg-base-200 text-base-content/50', days: null }
  const now = Date.now()
  const days = Math.ceil((exp - now) / (1000 * 60 * 60 * 24))

  if (days < 0) {
    return { text: `Expired (${Math.abs(days)}d ago)`, badgeClass: 'bg-error text-white font-bold', days }
  }
  if (days <= 30) {
    return { text: `Expiring in ${days}d`, badgeClass: 'bg-warning/20 text-warning-content border border-warning/40 font-bold', days }
  }
  if (days <= 90) {
    return { text: `${days} days left`, badgeClass: 'bg-info/15 text-info border border-info/30 font-medium', days }
  }
  return { 
    text: new Date(expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), 
    badgeClass: 'bg-base-200 text-base-content/70', 
    days 
  }
}

const getStockStatus = (item) => {
  const stock = Number(item.stock) || 0
  const reorder = Number(item.reorderLevel) || 0
  if (stock === 0) {
    return { label: 'Out of Stock', badgeClass: 'bg-error/15 text-error border border-error/30 font-bold', level: 'out' }
  }
  if (stock <= reorder) {
    return { label: `Low Stock (${stock})`, badgeClass: 'bg-warning/15 text-warning-content border border-warning/30 font-bold', level: 'low' }
  }
  return { label: `In Stock (${stock})`, badgeClass: 'bg-success/15 text-success border border-success/30 font-semibold', level: 'ok' }
}

const InventoryStocks = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showCsvUpload, setShowCsvUpload] = useState(false)
  const [editing, setEditing] = useState(null)
  const [restockingFor, setRestockingFor] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const fetchInventoryData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await getInventories()
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : []
      setItems(list)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load inventory'))
      showErrorToast(err, 'Failed to load inventory')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchInventoryData()
  }, [fetchInventoryData])

  // Aggregate stock counts
  const totalItems = items.length
  const inStockCount = useMemo(() => items.filter((i) => Number(i.stock) > 0).length, [items])
  const lowStockCount = useMemo(() => items.filter((i) => Number(i.stock) > 0 && Number(i.stock) <= Number(i.reorderLevel || 0)).length, [items])
  const outOfStockCount = useMemo(() => items.filter((i) => Number(i.stock) === 0).length, [items])
  const expiringSoonCount = useMemo(() => {
    return items.filter((i) => {
      if (!i.expiryDate) return false
      const diff = (new Date(i.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      return diff <= 30 && diff >= 0
    }).length
  }, [items])
  const expiredCount = useMemo(() => {
    return items.filter((i) => i.expiryDate && new Date(i.expiryDate).getTime() < Date.now()).length
  }, [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = items.filter((i) =>
      !q ||
      (i.name || '').toLowerCase().includes(q) ||
      (i.strength || '').toLowerCase().includes(q) ||
      (i.form || '').toLowerCase().includes(q) ||
      (i.batchNumber || '').toLowerCase().includes(q) ||
      (i.supplier || '').toLowerCase().includes(q)
    )

    if (activeTab === 'in_stock') {
      list = list.filter((i) => Number(i.stock) > 0)
    } else if (activeTab === 'low') {
      list = list.filter((i) => Number(i.stock) > 0 && Number(i.stock) <= Number(i.reorderLevel || 0))
    } else if (activeTab === 'out') {
      list = list.filter((i) => Number(i.stock) === 0)
    } else if (activeTab === 'expiring') {
      list = list.filter((i) => {
        if (!i.expiryDate) return false
        const diff = (new Date(i.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        return diff <= 30 && diff >= 0
      })
    } else if (activeTab === 'expired') {
      list = list.filter((i) => i.expiryDate && new Date(i.expiryDate).getTime() < Date.now())
    } else if (activeTab === 'recent') {
      list = list.slice().sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    }

    if (activeTab !== 'recent') {
      list = list.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }
    return list
  }, [items, search, activeTab])

  // Reset page when filtering
  useEffect(() => {
    setCurrentPage(1)
  }, [search, activeTab, itemsPerPage])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const pageItems = filtered.slice(startIndex, startIndex + itemsPerPage)

  const exportCsv = (list) => {
    try {
      if (list.length === 0) {
        toast.error('No items to export')
        return
      }
      const rows = list.map((i) => ({
        id: i._id,
        name: i.name,
        strength: i.strength || '',
        form: i.form || '',
        unit: i.unit || 'tablet',
        packSize: i.packSize ?? 1,
        stock: i.stock ?? 0,
        reorderLevel: i.reorderLevel ?? 0,
        costPrice: i.costPrice ?? 0,
        sellingPrice: i.sellingPrice ?? 0,
        pricePerUnit: pricePerUnit(i).toFixed(2),
        supplier: i.supplier || '',
        expiryDate: i.expiryDate ? new Date(i.expiryDate).toISOString().split('T')[0] : '',
        batchNumber: i.batchNumber || '',
        description: i.description || '',
      }))
      const header = Object.keys(rows[0] || {}).join(',') + '\n'
      const csv = header + rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inventory_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Inventory exported successfully')
    } catch (e) {
      showErrorToast(e, 'Export failed')
    }
  }

  const handleAdd = async (payload) => {
    const p = createInventory(payload)
    toast.promise(p, { loading: 'Creating item...', success: 'Item created successfully', error: (e) => getErrorMessage(e, 'Failed creating item') })
    try {
      await p
      fetchInventoryData()
      setShowAdd(false)
    } catch (error) {
      console.error(error)
    }
  }

  const handleEdit = async (id, payload) => {
    const p = updateInventory(id, payload)
    toast.promise(p, { loading: 'Updating item...', success: 'Item updated successfully', error: (e) => getErrorMessage(e, 'Failed updating item') })
    try {
      await p
      fetchInventoryData()
      setEditing(null)
    } catch (error) {
      console.error(error)
    }
  }

  const handleRestock = async (id, payload) => {
    const p = restockInventory(id, payload)
    toast.promise(p, { loading: 'Restocking...', success: 'Restocked successfully', error: (e) => getErrorMessage(e, 'Failed to restock item') })
    try {
      await p
      fetchInventoryData()
      setRestockingFor(null)
    } catch (error) {
      console.error(error)
    }
  }

  const handleReduce = async (id, payload) => {
    const p = reduceInventory(id, payload)
    toast.promise(p, { loading: 'Reducing stock...', success: 'Stock reduced successfully', error: (e) => getErrorMessage(e, 'Failed to reduce stock') })
    try {
      await p
      fetchInventoryData()
      setRestockingFor(null)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <PharmacistLayout>
      {loading && <KolakLoader fullscreen />}
      <div className="flex flex-col flex-1 bg-base-100 min-w-0">
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">

          {/* PAGE HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#00943C]/10 text-[#00943C]">
                <GiMedicines size={24} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-base-content">Inventory & Stocks</h1>
                <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
                  Manage hospital pharmacy stock, restock medications, and track batch expiries
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => fetchInventoryData(true)}
                disabled={refreshing}
                className="btn btn-outline border-base-300 hover:border-primary hover:bg-primary/5 hover:text-primary btn-sm gap-2"
                title="Refresh inventory list"
              >
                <RiRefreshLine className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-xs font-semibold">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>

              <button
                onClick={() => exportCsv(filtered)}
                className="btn btn-outline border-base-300 hover:border-success hover:bg-success/5 hover:text-success btn-sm gap-1.5"
                title="Export filtered items to CSV"
              >
                <FaFileDownload className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">Export CSV</span>
              </button>

              <button
                onClick={() => setShowCsvUpload(true)}
                className="btn btn-outline border-base-300 hover:border-primary hover:bg-primary/5 hover:text-primary btn-sm gap-1.5"
                title="Bulk import items from CSV"
              >
                <FaFileUpload className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">Import CSV</span>
              </button>

              <button
                onClick={() => setShowAdd(true)}
                className="btn btn-primary btn-sm gap-1.5 font-bold shadow-xs"
              >
                <MdAdd className="w-4 h-4" />
                <span className="text-xs">Add New Item</span>
              </button>
            </div>
          </div>

          {/* TOP 5 KPI STAT CARDS WITH INTERACTIVE FILTERING */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            
            {/* 1. Total Items */}
            <div
              onClick={() => setActiveTab('all')}
              className={`p-4 rounded-2xl bg-base-100 border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                activeTab === 'all'
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                  : 'border-base-300 hover:border-base-content/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Total Items</span>
                  <div className="text-2xl sm:text-3xl font-black text-base-content mt-1">
                    {totalItems}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-base-200 text-base-content">
                  <FaBoxes className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-base-200/60 text-[11px] text-base-content/60 flex items-center justify-between">
                <span>Unique medicines</span>
                {activeTab === 'all' && <span className="badge badge-primary badge-xs font-bold">Active</span>}
              </div>
            </div>

            {/* 2. In Stock */}
            <div
              onClick={() => setActiveTab('in_stock')}
              className={`p-4 rounded-2xl bg-base-100 border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                activeTab === 'in_stock'
                  ? 'border-success ring-2 ring-success/20 bg-success/5'
                  : 'border-base-300 hover:border-base-content/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">In Stock</span>
                  <div className="text-2xl sm:text-3xl font-black text-success mt-1">
                    {inStockCount}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-success/10 text-success">
                  <FaCheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-base-200/60 text-[11px] text-success font-medium flex items-center justify-between">
                <span>{totalItems ? Math.round((inStockCount / totalItems) * 100) : 0}% available</span>
                {activeTab === 'in_stock' && <span className="badge badge-success badge-xs font-bold text-white">Active</span>}
              </div>
            </div>

            {/* 3. Low Stock */}
            <div
              onClick={() => setActiveTab('low')}
              className={`p-4 rounded-2xl bg-base-100 border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                activeTab === 'low'
                  ? 'border-warning ring-2 ring-warning/20 bg-warning/5'
                  : 'border-base-300 hover:border-base-content/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Low Stock</span>
                  <div className="text-2xl sm:text-3xl font-black text-warning mt-1">
                    {lowStockCount}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-warning/10 text-warning">
                  <FaExclamationTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-base-200/60 text-[11px] text-warning-content/80 font-medium flex items-center justify-between">
                <span>Needs reorder</span>
                {activeTab === 'low' && <span className="badge badge-warning badge-xs font-bold">Active</span>}
              </div>
            </div>

            {/* 4. Expiring Soon */}
            <div
              onClick={() => setActiveTab('expiring')}
              className={`p-4 rounded-2xl bg-base-100 border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                activeTab === 'expiring'
                  ? 'border-info ring-2 ring-info/20 bg-info/5'
                  : 'border-base-300 hover:border-base-content/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Expiring Soon</span>
                  <div className="text-2xl sm:text-3xl font-black text-info mt-1">
                    {expiringSoonCount}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-info/10 text-info">
                  <FaClock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-base-200/60 text-[11px] text-info font-medium flex items-center justify-between">
                <span>Within 30 days</span>
                {activeTab === 'expiring' && <span className="badge badge-info badge-xs font-bold text-white">Active</span>}
              </div>
            </div>

            {/* 5. Expired */}
            <div
              onClick={() => setActiveTab('expired')}
              className={`p-4 rounded-2xl bg-base-100 border transition-all cursor-pointer shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1 ${
                activeTab === 'expired'
                  ? 'border-error ring-2 ring-error/20 bg-error/5'
                  : 'border-base-300 hover:border-base-content/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Expired</span>
                  <div className="text-2xl sm:text-3xl font-black text-error mt-1">
                    {expiredCount}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-error/10 text-error">
                  <FaBan className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-base-200/60 text-[11px] text-error font-medium flex items-center justify-between">
                <span>Past shelf life</span>
                {activeTab === 'expired' && <span className="badge badge-error badge-xs font-bold text-white">Active</span>}
              </div>
            </div>
          </div>

          {/* MAIN CARD: TOOLBAR + TABLE */}
          <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
            
            {/* FILTER TOOLBAR */}
            <div className="p-4 sm:p-5 bg-base-100 border-b border-base-200 flex flex-col gap-3.5">
              
              {/* Row 1: Search + Quick Stats */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
                  <input
                    type="text"
                    placeholder="Search medication, strength, form, batch number, supplier..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input input-sm input-bordered w-full pl-9 pr-8 text-xs rounded-xl"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  <span className="text-xs text-base-content/60 font-medium">
                    Showing <strong className="text-primary font-bold">{filtered.length}</strong> of{' '}
                    <strong className="text-base-content">{totalItems}</strong> medications
                  </span>

                  {/* Rows per page selector */}
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="select select-bordered select-xs text-xs rounded-lg"
                    aria-label="Items per page"
                  >
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Category Filter Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-base-200">
                <span className="text-xs font-semibold text-base-content/60 mr-1.5 flex items-center gap-1">
                  <FaLayerGroup className="w-3 h-3 text-primary" /> Filter:
                </span>

                {[
                  { key: 'all', label: 'All Items', count: totalItems },
                  { key: 'in_stock', label: 'In Stock', count: inStockCount },
                  { key: 'low', label: 'Low Stock', count: lowStockCount, warn: lowStockCount > 0 },
                  { key: 'out', label: 'Out of Stock', count: outOfStockCount, danger: outOfStockCount > 0 },
                  { key: 'expiring', label: 'Expiring Soon', count: expiringSoonCount, info: expiringSoonCount > 0 },
                  { key: 'expired', label: 'Expired', count: expiredCount, danger: expiredCount > 0 },
                  { key: 'recent', label: 'Recent Activity', count: null },
                ].map(({ key, label, count, warn, danger, info }) => {
                  const isActive = activeTab === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveTab(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-primary text-primary-content shadow-xs'
                          : 'bg-base-200 text-base-content/70 hover:text-base-content hover:bg-base-300'
                      }`}
                    >
                      <span>{label}</span>
                      {count !== null && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive
                              ? 'bg-primary-content/20 text-primary-content'
                              : danger
                                ? 'bg-error/20 text-error'
                                : warn
                                  ? 'bg-warning/20 text-warning-content'
                                  : info
                                    ? 'bg-info/20 text-info'
                                    : 'bg-base-300 text-base-content/60'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}

                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="btn btn-ghost btn-xs text-error font-medium ml-auto"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            </div>

            {/* CONTENT AREA */}
            {loading ? (
              <div className="py-20 flex justify-center">
                <KolakLoader />
              </div>
            ) : error ? (
              <div className="py-16 text-center text-sm text-error">
                {error}
                <div className="mt-3">
                  <button onClick={() => fetchInventoryData(true)} className="btn btn-sm btn-outline btn-error">
                    Try Again
                  </button>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16">
                <EmptyState
                  title="No medications found"
                  description={
                    search
                      ? `No inventory items matched "${search}".`
                      : activeTab !== 'all'
                        ? `No items found under the "${activeTab}" filter category.`
                        : 'No medicines recorded in the inventory yet.'
                  }
                  actionLabel={search || activeTab !== 'all' ? 'Reset Filters' : 'Add First Item'}
                  onAction={() => {
                    if (search || activeTab !== 'all') {
                      setSearch('')
                      setActiveTab('all')
                    } else {
                      setShowAdd(true)
                    }
                  }}
                />
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="table w-full text-xs">
                    <thead>
                      <tr className="bg-base-200/60 border-b border-base-200 text-base-content/60 uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4 font-bold">Medication</th>
                        <th className="py-3 px-3 font-bold">Category & Form</th>
                        <th className="py-3 px-3 font-bold">Batch & Expiry</th>
                        <th className="py-3 px-3 font-bold">Stock Status</th>
                        <th className="py-3 px-3 font-bold">Pack Size</th>
                        <th className="py-3 px-3 font-bold">Pack Price</th>
                        <th className="py-3 px-3 font-bold">Price / Unit</th>
                        <th className="py-3 px-4 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-200">
                      {pageItems.map((item) => {
                        const stockStat = getStockStatus(item)
                        const expiryStat = getExpiryStatus(item.expiryDate)
                        const unitName = UNIT_LABELS[item.unit] || item.unit || 'Tablet'
                        const packSizeNum = Number(item.packSize) || 1
                        const stockNum = Number(item.stock) || 0
                        const reorderNum = Number(item.reorderLevel) || 0

                        return (
                          <tr key={item._id} className="hover:bg-base-200/40 transition-colors">
                            {/* Medication Name & Supplier */}
                            <td className="py-3 px-4 min-w-[180px]">
                              <div className="font-bold text-sm text-base-content">{item.name}</div>
                              <div className="text-[11px] text-base-content/50 flex items-center gap-1.5 mt-0.5">
                                {item.supplier ? (
                                  <span>Supplier: {item.supplier}</span>
                                ) : (
                                  <span className="italic">No supplier listed</span>
                                )}
                              </div>
                            </td>

                            {/* Category & Form */}
                            <td className="py-3 px-3 min-w-[130px]">
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-base-200 text-base-content/80 font-semibold text-[11px]">
                                <FaPills className="w-2.5 h-2.5 text-primary opacity-80" />
                                <span>{item.form || 'Tablet'}</span>
                              </div>
                              {item.strength && (
                                <div className="text-[11px] font-medium text-base-content/60 mt-0.5">
                                  {item.strength}
                                </div>
                              )}
                            </td>

                            {/* Batch & Expiry */}
                            <td className="py-3 px-3 min-w-[140px]">
                              <div className="font-mono text-[11px] font-bold text-base-content/80">
                                {item.batchNumber ? `Batch: ${item.batchNumber}` : <span className="text-base-content/40 italic">No batch</span>}
                              </div>
                              <div className="mt-1">
                                <span className={`badge badge-xs px-2 py-0.5 text-[10px] ${expiryStat.badgeClass}`}>
                                  {expiryStat.text}
                                </span>
                              </div>
                            </td>

                            {/* Stock Status + Indicator */}
                            <td className="py-3 px-3 min-w-[150px]">
                              <div className="flex items-center gap-1.5">
                                <span className={`badge badge-sm py-1 px-2 text-[11px] ${stockStat.badgeClass}`}>
                                  {stockStat.label}
                                </span>
                              </div>
                              <div className="text-[11px] text-base-content/50 mt-1">
                                Reorder at: <strong className="text-base-content/70">{reorderNum}</strong> {unitName}s
                              </div>
                            </td>

                            {/* Pack Size */}
                            <td className="py-3 px-3 font-semibold text-base-content/80">
                              {packSizeNum} {unitName}{packSizeNum > 1 ? 's' : ''}/pack
                            </td>

                            {/* Pack Price */}
                            <td className="py-3 px-3 font-bold text-base-content">
                              {item.sellingPrice != null ? `₦${Number(item.sellingPrice).toLocaleString()}` : '—'}
                            </td>

                            {/* Price / Unit */}
                            <td className="py-3 px-3 font-semibold text-primary">
                              ₦{pricePerUnit(item).toFixed(2)}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setRestockingFor(item)}
                                  className="btn btn-outline border-primary/40 hover:bg-primary hover:border-primary text-primary hover:text-white btn-xs font-semibold gap-1"
                                  title="Restock or reduce stock"
                                >
                                  <FaSyncAlt className="w-2.5 h-2.5" />
                                  <span>Restock</span>
                                </button>
                                <button
                                  onClick={() => setEditing(item)}
                                  className="btn btn-ghost btn-xs text-base-content/70 hover:text-base-content gap-1 font-semibold"
                                  title="Edit medication details"
                                >
                                  <FaEdit className="w-2.5 h-2.5" />
                                  <span>Edit</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="block md:hidden divide-y divide-base-200">
                  {pageItems.map((item) => {
                    const stockStat = getStockStatus(item)
                    const expiryStat = getExpiryStatus(item.expiryDate)
                    const unitName = UNIT_LABELS[item.unit] || item.unit || 'Tablet'
                    const packSizeNum = Number(item.packSize) || 1

                    return (
                      <div key={item._id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-base text-base-content">{item.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-base-content/60">
                              <span className="font-semibold">{item.form || 'Tablet'}</span>
                              {item.strength && <span>• {item.strength}</span>}
                            </div>
                          </div>
                          <span className={`badge badge-sm py-1 px-2 text-[11px] ${stockStat.badgeClass}`}>
                            {stockStat.label}
                          </span>
                        </div>

                        {/* Middle info grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs bg-base-200/40 p-2.5 rounded-xl border border-base-200">
                          <div>
                            <span className="text-base-content/50">Stock: </span>
                            <strong className="text-base-content font-bold">{item.stock ?? 0} {unitName}s</strong>
                          </div>
                          <div>
                            <span className="text-base-content/50">Pack Size: </span>
                            <span className="text-base-content font-medium">{packSizeNum} {unitName}/pack</span>
                          </div>
                          <div>
                            <span className="text-base-content/50">Pack Price: </span>
                            <span className="text-base-content font-bold">₦{item.sellingPrice ?? '—'}</span>
                          </div>
                          <div>
                            <span className="text-base-content/50">Unit Price: </span>
                            <span className="text-primary font-bold">₦{pricePerUnit(item).toFixed(2)}</span>
                          </div>
                          <div className="col-span-2 flex items-center justify-between pt-1 border-t border-base-200">
                            <span className="text-base-content/50 font-mono text-[11px]">
                              {item.batchNumber ? `Batch: ${item.batchNumber}` : 'No batch'}
                            </span>
                            <span className={`badge badge-xs ${expiryStat.badgeClass}`}>
                              {expiryStat.text}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => setEditing(item)}
                            className="btn btn-ghost btn-xs text-base-content/70 font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setRestockingFor(item)}
                            className="btn btn-primary btn-xs font-semibold gap-1"
                          >
                            <FaSyncAlt className="w-2.5 h-2.5" />
                            <span>Restock</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* PAGINATION BAR */}
                <div className="p-4 border-t border-base-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-base-100">
                  <div className="text-xs text-base-content/60">
                    Showing <strong className="text-base-content">{startIndex + 1}</strong> to{' '}
                    <strong className="text-base-content">{Math.min(startIndex + itemsPerPage, filtered.length)}</strong> of{' '}
                    <strong className="text-base-content">{filtered.length}</strong> items
                  </div>

                  {totalPages > 1 && (
                    <div className="join">
                      <button
                        className="join-item btn btn-sm btn-outline border-base-300"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        «
                      </button>

                      {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                        p === '...' ? (
                          <button key={`ellipsis-${idx}`} className="join-item btn btn-sm btn-disabled pointer-events-none">
                            …
                          </button>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className={`join-item btn btn-sm ${
                              currentPage === p
                                ? 'bg-primary text-white font-bold border-primary'
                                : 'btn-outline border-base-300'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}

                      <button
                        className="join-item btn btn-sm btn-outline border-base-300"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        »
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* MODALS */}
        {showAdd && <InventoryFormModal onClose={() => setShowAdd(false)} onSubmit={handleAdd} />}
        {editing && (
          <InventoryFormModal
            item={editing}
            onClose={() => setEditing(null)}
            onSubmit={(payload) => handleEdit(editing._id, payload)}
          />
        )}
        {showCsvUpload && (
          <InventoryCsvUploadModal
            items={items}
            onClose={() => setShowCsvUpload(false)}
            onUploadSuccess={() => {
              fetchInventoryData()
              setShowCsvUpload(false)
            }}
          />
        )}
        {restockingFor && (
          <RestockModal
            item={restockingFor}
            onClose={() => setRestockingFor(null)}
            onSubmit={(payload) => handleRestock(restockingFor._id, payload)}
            onReduce={(payload) => handleReduce(restockingFor._id, payload)}
          />
        )}
      </div>
    </PharmacistLayout>
  )
}

export default InventoryStocks

// --- INLINE RESTOCK & REDUCE MODAL ---
function RestockModal({ item, onClose, onSubmit, onReduce }) {
  const [mode, setMode] = useState('restock')
  const [packs, setPacks] = useState('')
  const [batchNumber, setBatchNumber] = useState(item.batchNumber || '')
  const [expiryDate, setExpiryDate] = useState(
    item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : ''
  )
  const [costPrice, setCostPrice] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')

  const [reducePacks, setReducePacks] = useState('')
  const [reduceReason, setReduceReason] = useState('Damaged / Broken')
  const [customReason, setCustomReason] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const unit = UNIT_LABELS[item.unit] || item.unit || 'tablet'
  const packSize = Number(item.packSize) || 1
  const currentStock = Number(item.stock) || 0

  const REDUCE_REASONS = [
    'Damaged / Broken',
    'Expired stock',
    'Wastage / Spillage',
    'Dispensed without prescription',
    'Stock count / Audit correction',
    'Returned to supplier',
    'Manufacturer recall',
    'Other (Specify)',
  ]

  const handleRestockSubmit = async () => {
    if (!packs || Number(packs) <= 0) return toast.error('Enter a valid quantity to add')
    setSubmitting(true)
    try {
      await onSubmit({
        packs: Number(packs),
        batchNumber: batchNumber.trim() || undefined,
        expiryDate: expiryDate || undefined,
        costPrice: costPrice ? Number(costPrice) : undefined,
        sellingPrice: sellingPrice.trim() ? Number(sellingPrice) : undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReduceSubmit = async () => {
    const val = Number(reducePacks)
    if (!reducePacks || isNaN(val) || val <= 0) {
      return toast.error('Enter a valid quantity to reduce')
    }
    const unitsToRemove = val * packSize
    if (unitsToRemove > currentStock) {
      return toast.error(`Cannot reduce more than available stock (${currentStock} ${unit})`)
    }
    if (reduceReason === 'Other (Specify)' && !customReason.trim()) {
      return toast.error('Please specify the reason for reduction')
    }

    const finalReason =
      reduceReason === 'Other (Specify)'
        ? customReason.trim() || 'Manual stock reduction'
        : customReason.trim()
          ? `${reduceReason} - ${customReason.trim()}`
          : reduceReason

    setSubmitting(true)
    try {
      const payload = {
        packs: val,
        quantity: unitsToRemove,
        reason: finalReason,
        currentStock,
        packSize,
      }
      if (onReduce) {
        await onReduce(payload)
      } else {
        await onSubmit({ type: 'reduce', ...payload })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const restockUnits = Number(packs) > 0 ? Number(packs) * packSize : 0
  const reduceUnits = Number(reducePacks) > 0 ? Number(reducePacks) * packSize : 0
  const isReduceOver = reduceUnits > currentStock

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="z-10 w-full max-w-md card bg-base-100 p-5 shadow-2xl border border-base-300 rounded-2xl">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${mode === 'restock' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
              <FaSyncAlt className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-lg text-base-content">
              {mode === 'restock' ? 'Restock Medication' : 'Reduce Stock'}
            </h3>
          </div>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1 bg-base-200 rounded-xl mb-3">
          <button
            type="button"
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'restock'
                ? 'bg-primary text-primary-content shadow-xs'
                : 'text-base-content/70 hover:text-base-content'
            }`}
            onClick={() => setMode('restock')}
          >
            <span>+</span> Restock (Add)
          </button>
          <button
            type="button"
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'reduce'
                ? 'bg-error text-white shadow-xs'
                : 'text-base-content/70 hover:text-base-content'
            }`}
            onClick={() => setMode('reduce')}
          >
            <span>−</span> Reduce Stock
          </button>
        </div>

        {/* Item Stock Summary Banner */}
        <div className="bg-base-200/50 rounded-xl p-3 mb-3 border border-base-300/60">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-base-content">{item.name}</span>
              <span className="text-base-content/70 ml-1 font-medium">({item.form} {item.strength})</span>
            </div>
            <span className="badge badge-sm badge-outline font-mono">Batch: {item.batchNumber || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-base-300/40 text-xs">
            <span className="text-base-content/70 font-medium">Current Available Stock:</span>
            <span className="font-bold text-sm text-primary">
              {currentStock} <span className="text-xs font-normal text-base-content/70">{unit}s</span>
              {packSize > 1 && (
                <span className="text-[11px] font-normal text-base-content/60 ml-1">
                  ({(currentStock / packSize).toFixed(1)} packs)
                </span>
              )}
            </span>
          </div>
        </div>

        {mode === 'restock' ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-base-content/70 block mb-1 font-medium">
                {item.unit === 'tablet'
                  ? 'Number of tablets to add *'
                  : item.unit === 'tube'
                    ? 'Number of tubes to add *'
                    : item.unit === 'ampoule'
                      ? `Number of ampoules to add (each pack ${packSize}) *`
                      : `Number of ${unit === 'ml' ? 'bottles/vials' : 'packs'} to add (each ${packSize} ${unit}) *`}
              </label>
              <input
                className="input input-bordered input-sm w-full text-xs rounded-xl"
                placeholder="e.g. 50"
                type="number"
                min="1"
                value={packs}
                onChange={(e) => setPacks(e.target.value)}
              />
            </div>

            {packs && Number(packs) > 0 && (
              <div className="p-2.5 rounded-xl text-xs bg-success/10 text-success border border-success/30 font-medium">
                Adding <span className="font-bold">{restockUnits} {unit}s</span> to stock: ({currentStock} → <span className="font-bold">{currentStock + restockUnits} {unit}s</span>).
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-base-content/70 block mb-1 font-medium">Batch Number</label>
                <input
                  className="input input-bordered input-sm w-full text-xs rounded-xl"
                  placeholder="e.g. BATCH-01"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-base-content/70 block mb-1 font-medium">Expiry Date</label>
                <input
                  className="input input-bordered input-sm w-full text-xs rounded-xl"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-base-content/70 block mb-1 font-medium">Cost Price (Pack)</label>
                <input
                  className="input input-bordered input-sm w-full text-xs rounded-xl"
                  placeholder="₦ Cost"
                  type="number"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-base-content/70 block mb-1 font-medium">Selling Price (Pack)</label>
                <input
                  className="input input-bordered input-sm w-full text-xs rounded-xl"
                  placeholder="₦ Selling"
                  type="number"
                  min="0"
                  step="any"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-base-200">
              <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={submitting}>Cancel</button>
              <button
                className="btn btn-primary btn-sm font-bold shadow-xs"
                onClick={handleRestockSubmit}
                disabled={submitting || !packs || Number(packs) <= 0}
              >
                {submitting ? 'Restocking...' : 'Restock Item'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-base-content/70 block mb-1 font-medium">
                {item.unit === 'tablet'
                  ? 'Number of tablets to remove *'
                  : item.unit === 'tube'
                    ? 'Number of tubes to remove *'
                    : item.unit === 'ampoule'
                      ? `Number of ampoules to remove (each pack ${packSize}) *`
                      : `Number of ${unit === 'ml' ? 'bottles/vials' : 'packs'} to remove (each ${packSize} ${unit}) *`}
              </label>
              <input
                className={`input input-bordered input-sm w-full text-xs rounded-xl ${isReduceOver ? 'input-error' : ''}`}
                placeholder="e.g. 5"
                type="number"
                min="1"
                value={reducePacks}
                onChange={(e) => setReducePacks(e.target.value)}
              />
            </div>

            {reducePacks && Number(reducePacks) > 0 && (
              <div className={`p-2.5 rounded-xl text-xs font-medium ${isReduceOver ? 'bg-error/15 text-error border border-error/30' : 'bg-warning/15 text-warning-content border border-warning/30'}`}>
                {isReduceOver ? (
                  <span>⚠️ Cannot remove {reduceUnits} {unit}s. Available stock is only {currentStock} {unit}s.</span>
                ) : (
                  <span>Removing <span className="font-bold">{reduceUnits} {unit}s</span> from stock ({currentStock} → <span className="font-bold">{currentStock - reduceUnits} {unit}s</span>).</span>
                )}
              </div>
            )}

            <div>
              <label className="text-xs text-base-content/70 block mb-1 font-medium">Reason for Reduction *</label>
              <select
                className="select select-bordered select-sm w-full text-xs rounded-xl"
                value={reduceReason}
                onChange={(e) => setReduceReason(e.target.value)}
              >
                {REDUCE_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-base-content/70 block mb-1 font-medium">
                {reduceReason === 'Other (Specify)' ? 'Specify Reason *' : 'Additional Notes (optional)'}
              </label>
              <input
                className="input input-bordered input-sm w-full text-xs rounded-xl"
                placeholder={reduceReason === 'Other (Specify)' ? 'e.g. Lost during pharmacy relocation' : 'e.g. Expired batch, damaged bottle cap'}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-base-200">
              <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={submitting}>Cancel</button>
              <button
                className="btn btn-error btn-sm text-white font-bold shadow-xs"
                onClick={handleReduceSubmit}
                disabled={
                  submitting ||
                  !reducePacks ||
                  Number(reducePacks) <= 0 ||
                  isReduceOver ||
                  (reduceReason === 'Other (Specify)' && !customReason.trim())
                }
              >
                {submitting ? 'Reducing...' : 'Reduce Stock'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// --- CSV IMPORT MODAL ---
function InventoryCsvUploadModal({ items = [], onClose, onUploadSuccess }) {
  const [csvText, setCsvText] = useState('')
  const [previewRows, setPreviewRows] = useState([])
  const [fileName, setFileName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const FORM_ALIASES = {
    tablet: 'Tablet',
    tab: 'Tablet',
    cap: 'Tablet',
    capsule: 'Tablet',
    susp: 'Syrup',
    suspension: 'Syrup',
    syrup: 'Syrup',
    injection: 'Injection',
    injectiong: 'Injection',
  }

  const normalizeForm = (rawForm) => {
    const key = String(rawForm || '').trim().toLowerCase()
    return FORM_ALIASES[key] || 'Tablet'
  }

  const parseCsvLine = (line) => {
    const values = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i += 1
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    return values
  }

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a valid CSV file')
      return
    }
    setFileName(selectedFile.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      setCsvText(text)
      setPreviewRows(text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 5))
    }
    reader.readAsText(selectedFile)
  }

  const downloadTemplate = () => {
    const template = [
      'name,form,strength,unit,packSize,packs,costPrice,sellingPrice,reorderLevel,supplier,batchNumber,expiryDate,description',
      'Paracetamol,Tablet,500mg,tablet,1,100,50,70,20,Acme Pharma,BATCH001,2025-12-31,Pain reliever',
      'Amoxicillin Syrup,Syrup,125mg/5ml,ml,75,10,500,750,20,HealthCo,BATCH002,2025-09-15,Antibiotic syrup — 75ml bottle',
    ].join('\n')
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(template))
    element.setAttribute('download', 'inventory_import_template.csv')
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleUpload = async () => {
    if (!csvText) {
      toast.error('Please select a CSV file to upload')
      return
    }
    setIsLoading(true)
    const rows = csvText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    if (rows.length < 2) {
      toast.error('CSV must include a header row and at least one data row')
      setIsLoading(false)
      return
    }

    const headers = parseCsvLine(rows[0]).map((h) => h.toLowerCase())
    const parsedRows = rows.slice(1).map((row, rowIndex) => {
      const values = parseCsvLine(row)
      const entry = { __rowIndex: rowIndex + 2 }
      headers.forEach((header, index) => { entry[header] = values[index] ?? '' })
      return entry
    })

    const makeDuplicateKey = (name, strength, form, batch) =>
      [name, strength, form, batch].map((v) => String(v || '').trim().toLowerCase()).join('|')

    const existingKeys = new Set(
      items.map((item) => makeDuplicateKey(item.name, item.strength, item.form, item.batchNumber))
    )

    const seenKeys = new Set()
    const uploadPayloads = []
    const skippedDuplicateRows = []
    const skippedInvalidRows = []

    parsedRows.forEach((item) => {
      const name = String(item.name || item.drug || item.item || '').trim()
      if (!name) { skippedInvalidRows.push(item.__rowIndex); return }

      const rawForm = String(item.form || '').trim()
      const form = normalizeForm(rawForm)
      const strength = String(item.strength || '').trim()
      const batchNumber = String(item.batchnumber || item.batch_number || item.batch || '').trim()

      const key = makeDuplicateKey(name, strength, form, batchNumber)
      if (seenKeys.has(key) || existingKeys.has(key)) { skippedDuplicateRows.push(item.__rowIndex); return }
      seenKeys.add(key)

      const payload = { name, form }
      const unit = String(item.unit || 'tablet').trim().toLowerCase()
      const packSizeValue = String(item.packsize ?? item.pack_size ?? '1').trim()
      const packsValue = String(item.packs ?? item.stock ?? item.qty ?? item.quantity ?? '').trim()
      const costPriceValue = String(item.costprice ?? item.cost_price ?? item.cost ?? '').trim()
      const sellingPriceValue = String(item.sellingprice ?? item.selling_price ?? item.price ?? '').trim()
      const reorderLevelValue = String(item.reorderlevel ?? item.reorder_level ?? item.reorder ?? '').trim()
      const supplier = String(item.supplier || '').trim()
      const expiry = String(item.expirydate || item.expiry_date || item.expiry || '').trim()
      const description = String(item.description || item.notes || '').trim()

      if (strength) payload.strength = strength
      payload.unit = ['tablet', 'ml', 'iu', 'ampoule', 'tube'].includes(unit) ? unit : 'tablet'
      payload.packSize = packSizeValue !== '' ? Number(packSizeValue) : 1
      if (packsValue !== '') payload.packs = Number(packsValue)
      if (costPriceValue !== '') payload.costPrice = Number(costPriceValue)
      if (sellingPriceValue !== '') payload.sellingPrice = Number(sellingPriceValue)
      if (reorderLevelValue !== '') payload.reorderLevel = Number(reorderLevelValue)
      if (supplier) payload.supplier = supplier
      if (batchNumber) payload.batchNumber = batchNumber
      if (expiry) payload.expiryDate = expiry
      if (description) payload.description = description

      uploadPayloads.push(payload)
    })

    if (uploadPayloads.length === 0) {
      const components = []
      if (skippedDuplicateRows.length) components.push(`${skippedDuplicateRows.length} duplicate row(s) skipped`)
      if (skippedInvalidRows.length) components.push(`${skippedInvalidRows.length} invalid row(s) skipped`)
      toast.error(`No new items to upload. ${components.join(' and ')}`)
      setIsLoading(false)
      return
    }

    const uploadInBatches = async (payloads, batchSize = 50) => {
      const allResults = []
      let additionalSkipped = 0
      for (let i = 0; i < payloads.length; i += batchSize) {
        const batch = payloads.slice(i, i + batchSize)
        const batchResults = await Promise.allSettled(batch.map((payload) => createInventory(payload)))
        batchResults.forEach((result) => {
          if (result.status === 'rejected') {
            const msg = result.reason?.response?.data?.message || result.reason?.message || ''
            if (
              msg.includes('duplicate key error') ||
              msg.includes('E11000') ||
              msg.toLowerCase().includes('already exists') ||
              msg.toLowerCase().includes('use restock')
            ) {
              additionalSkipped += 1
            } else {
              allResults.push(result)
            }
          } else {
            allResults.push(result)
          }
        })
      }
      return { results: allResults, additionalSkipped }
    }

    const { results, additionalSkipped } = await uploadInBatches(uploadPayloads, 50)
    const successCount = results.filter((r) => r.status === 'fulfilled').length
    const failureResults = results.filter((r) => r.status === 'rejected')
    const duplicateCount = skippedDuplicateRows.length + additionalSkipped

    if (successCount > 0) {
      toast.success(duplicateCount ? `Imported ${successCount} item(s); ${duplicateCount} duplicates skipped.` : `Imported ${successCount} item(s)`)
      onUploadSuccess()
    } else if (duplicateCount && !failureResults.length) {
      toast.success(`${duplicateCount} item(s) already exist; use restock instead.`)
    }

    if (failureResults.length > 0) {
      failureResults.slice(0, 3).forEach((result) => {
        toast.error(getErrorMessage(result.reason, 'An inventory row could not be imported'), { duration: 3000 })
      })
    }

    setIsLoading(false)
    if (successCount > 0 && failureResults.length === 0) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="z-10 w-full max-w-lg card bg-base-100 p-5 shadow-2xl border border-base-300 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FaFileUpload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-base-content">Import Inventory from CSV</h3>
              <p className="text-xs text-base-content/60">Bulk upload medication catalog and stocks</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose} disabled={isLoading}>✕</button>
        </div>

        <div className="mb-4 p-3.5 bg-base-200/60 rounded-xl border border-base-300/60 flex items-start gap-3">
          <FaInfoCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-base-content/70">
            <div className="font-semibold text-base-content mb-1">CSV Template Guide:</div>
            Ensure your file contains columns: <code className="font-mono text-primary font-bold">name</code>, <code className="font-mono text-primary font-bold">form</code> (Tablet, Syrup, Injection), <code className="font-mono">strength</code>, <code className="font-mono">stock</code>. Duplicates are skipped.
            <div className="mt-2.5">
              <button
                type="button"
                className="btn btn-outline btn-xs border-primary text-primary hover:bg-primary hover:text-white font-semibold gap-1"
                onClick={downloadTemplate}
              >
                <FaFileDownload className="w-3 h-3" />
                <span>Download Sample Template</span>
              </button>
            </div>
          </div>
        </div>

        <div className="form-control mb-4">
          <label className="label py-1"><span className="text-xs font-bold text-base-content">Select CSV File</span></label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={isLoading}
            className="file-input file-input-bordered file-input-sm w-full rounded-xl text-xs"
          />
          {fileName && <span className="text-xs text-primary font-medium mt-1.5">Selected: {fileName}</span>}
        </div>

        {previewRows.length > 0 && (
          <div className="mb-4 p-3 bg-base-200/50 rounded-xl border border-base-300 max-h-36 overflow-y-auto">
            <p className="text-xs font-bold text-base-content mb-1.5">Preview (First 5 rows):</p>
            <div className="text-[11px] font-mono text-base-content/70 space-y-1">
              {previewRows.map((line, index) => (
                <div key={index} className="truncate">{line}</div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-base-200">
          <button className="btn btn-ghost btn-sm text-xs" onClick={onClose} disabled={isLoading}>Cancel</button>
          <button
            className="btn btn-primary btn-sm text-xs font-bold shadow-xs"
            onClick={handleUpload}
            disabled={isLoading || !csvText}
          >
            {isLoading ? 'Uploading...' : 'Upload CSV'}
          </button>
        </div>
      </div>
    </div>
  )
}
