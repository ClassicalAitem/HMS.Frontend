import React, { useEffect, useMemo, useState } from 'react'
import { MdAdd } from 'react-icons/md'
import { FaTrash, FaFileUpload } from 'react-icons/fa'
import toast from 'react-hot-toast'
import {
  getInventories,
  createInventory,
  updateInventory,
  restockInventory,
  deleteInventory,
} from '@/services/api/inventoryAPI'
import { SuperAdminLayout } from '@/layouts/superadmin'
import { getErrorMessage, showErrorToast } from '@/utils/errorHandler'

const UNIT_LABELS = {
  tablet: 'Tablet',
  ml: 'ml',
  iu: 'IU',
  ampoule: 'Ampoule',
}
const pricePerUnit = (item) => {
  const packSize = Number(item.packSize) || 1
  const sellingPrice = Number(item.sellingPrice) || 0
  return sellingPrice / packSize
}

const InventoryStocks = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showCsvUpload, setShowCsvUpload] = useState(false)
  const [editing, setEditing] = useState(null)
  const [restockingFor, setRestockingFor] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getInventories()
      const list = Array.isArray(res?.data) ? res.data : (res?.data ?? [])
      setItems(list)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load inventory'))
      showErrorToast(err, 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"? This cannot be undone.`)) return
    setDeleting(item._id)
    try {
      await deleteInventory(item._id)
      toast.success('Item deleted')
      await fetch()
    } catch (e) {
      showErrorToast(e, 'Failed to delete item')
    } finally {
      setDeleting(null)
    }
  }

  const totalItems = items.length
  const inStockCount = items.filter(i => Number(i.stock) > 0).length
  const lowStockCount = items.filter(i => Number(i.stock) > 0 && Number(i.stock) <= Number(i.reorderLevel || 0)).length
  const expiringSoonCount = items.filter(i => {
    if (!i.expiryDate) return false
    const diff = (new Date(i.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return diff <= 30 && diff >= 0
  }).length
  const expiredCount = items.filter(i => i.expiryDate && new Date(i.expiryDate).getTime() < Date.now()).length

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = items.filter(i =>
      !q ||
      (i.name || '').toLowerCase().includes(q) ||
      (i.strength || '').toLowerCase().includes(q) ||
      (i.form || '').toLowerCase().includes(q)
    )
    if (activeTab === 'low') list = list.filter(i => Number(i.stock) > 0 && Number(i.stock) <= Number(i.reorderLevel || 0))
    if (activeTab === 'out') list = list.filter(i => Number(i.stock) === 0)
    if (activeTab === 'recent') {
      list = list.slice().sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    }
    if (activeTab === 'expiring') {
      list = list.filter(i => {
        if (!i.expiryDate) return false
        const diff = (new Date(i.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        return diff <= 30 && diff >= 0
      })
    }
    if (activeTab === 'expired') {
      list = list.filter(i => i.expiryDate && new Date(i.expiryDate).getTime() < Date.now())
    }
    return list
  }, [items, search, activeTab])

  const startIndex = (currentPage - 1) * itemsPerPage
  const pageItems = filtered.slice(startIndex, startIndex + itemsPerPage)

  const exportCsv = (list) => {
    try {
      const rows = list.map(i => ({
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
      const csv = header + rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'inventory.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      showErrorToast(e, 'Export failed')
    }
  }

  const lowStock = (i) => (Number(i.stock) === 0 ? 'out' : (Number(i.stock) <= Number(i.reorderLevel || 0) ? 'low' : 'ok'))

  const handleAdd = async (payload) => {
    const p = createInventory(payload)
    toast.promise(p, { loading: 'Creating item...', success: 'Item created', error: (e) => getErrorMessage(e, 'Failed creating item') })
    try {
      await p
      fetch()
      setShowAdd(false)
    } catch { }
  }

  const handleEdit = async (id, payload) => {
    const p = updateInventory(id, payload)
    toast.promise(p, { loading: 'Updating item...', success: 'Item updated', error: (e) => getErrorMessage(e, 'Failed updating item') })
    try {
      await p
      fetch()
      setEditing(null)
    } catch { }
  }

  const handleRestock = async (id, payload) => {
    const p = restockInventory(id, payload)
    toast.promise(p, { loading: 'Restocking...', success: 'Restocked', error: (e) => getErrorMessage(e, 'Failed to restock item') })
    try {
      await p
      fetch()
      setRestockingFor(null)
    } catch { }
  }

  return (
    <SuperAdminLayout>
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">Inventory & Stocks</h1>
            <p className="text-xs text-base-content/70">Manage medicines, restock and view transactions</p>
          </div>
          <div className="flex items-center gap-3">
            <input className="input input-sm input-bordered" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="btn btn-outline btn-sm flex items-center gap-2" onClick={() => setShowCsvUpload(true)}><FaFileUpload /> Import CSV</button>
            <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={() => setShowAdd(true)}><MdAdd /> Add new item</button>
          </div>
        </div>

        <div className="rounded-xl bg-base-100 border border-base-300 p-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-40 rounded-xl bg-base-200 animate-pulse" />))}
            </div>
          ) : error ? (
            <div className="text-sm text-error">Failed to load inventory.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <StatCard label="Total Items" value={totalItems} sub="Unique medications" />
                <StatCard label="In Stock" value={inStockCount} sub={`${totalItems ? Math.round((inStockCount / totalItems) * 100) : 0}% availability`} subClass="text-success/70" />
                <StatCard label="Low Stock" value={lowStockCount} sub="Needs reordering" subClass="text-warning/70" />
                <StatCard label="Expiring Soon" value={expiringSoonCount} sub="Within 30 days" subClass="text-error/70" />
                <StatCard label="Expired" value={expiredCount} sub="Past expiry date" subClass="text-error/70" />
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    ['all', 'All Items'],
                    ['low', 'Low Stock'],
                    ['out', 'Out of Stock'],
                    ['expiring', 'Expiring Soon'],
                    ['expired', 'Expired'],
                    ['recent', 'Recent Activity'],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      className={`px-2 py-1 rounded ${activeTab === key ? 'bg-primary text-primary-content' : 'bg-base-200'}`}
                      onClick={() => { setActiveTab(key); setCurrentPage(1) }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input className="input input-sm input-bordered" placeholder="Search Medications..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} />
                  <button className="btn btn-outline btn-sm" onClick={() => exportCsv(filtered)}>Export</button>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="block md:hidden">
                <div className="grid grid-cols-1 gap-4">
                  {pageItems.map(item => (
                    <div key={item._id} className="p-4 rounded-xl border flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{item.name}</div>
                        <div className={`text-xs px-2 py-1 rounded ${lowStock(item) === 'out' ? 'bg-error/10 text-error' : lowStock(item) === 'low' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                          {lowStock(item) === 'out' ? 'Out of stock' : lowStock(item) === 'low' ? 'Low stock' : 'In stock'}
                        </div>
                      </div>
                      <div className="text-sm text-base-content/70">{item.form} {item.strength}</div>
                      <div className="flex items-center justify-between text-sm">
                        <div>Stock: <span className="font-medium">{item.stock ?? 0} {UNIT_LABELS[item.unit] || 'tablet'}</span></div>
                        <div>Pack: <span className="font-medium">{item.packSize ?? 1} {UNIT_LABELS[item.unit] || 'tablet'}/pack</span></div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div>Pack price: <span className="font-medium">₦{item.sellingPrice ?? '—'}</span></div>
                        <div>Per unit: <span className="font-medium">₦{pricePerUnit(item).toFixed(2)}</span></div>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(item)}>Edit</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setRestockingFor(item)}>Restock</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="bg-base-200">
                      <th>Item</th>
                      <th>Form / Strength</th>
                      <th>Unit</th>
                      <th>Pack Size</th>
                      <th>Stock</th>
                      <th>Reorder Level</th>
                      <th>Pack Price</th>
                      <th>Price / Unit</th>
                      <th>Expiry Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map(item => (
                      <tr key={item._id}>
                        <td>{item.name}</td>
                        <td>{item.form} {item.strength}</td>
                        <td>{UNIT_LABELS[item.unit] || 'Tablet'}</td>
                        <td>{item.packSize ?? 1}</td>
                        <td>{item.stock ?? 0}</td>
                        <td>{item.reorderLevel ?? 0}</td>
                        <td>{item.sellingPrice != null ? `₦${item.sellingPrice}` : '—'}</td>
                        <td>₦{pricePerUnit(item).toFixed(2)}</td>
                        <td>{item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '—'}</td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-ghost btn-xs" onClick={() => setEditing(item)}>Edit</button>
                            <button className="btn btn-outline btn-xs" onClick={() => setRestockingFor(item)}>Restock</button>
                            <button
                              disabled={deleting === item._id}
                              onClick={() => handleDelete(item)}
                              className="btn btn-ghost btn-xs text-error"
                              title="Delete Item"
                            >
                              <FaTrash className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-base-content/60">
                <div>
                  Showing Result for {
                    { all: 'All Items', low: 'Low Stock', out: 'Out of Stock', expiring: 'Expiring Soon', expired: 'Expired Items', recent: 'Recent Activity' }[activeTab]
                  } ({filtered.length} Total)
                </div>
                <div className="join">
                  {Array.from({ length: Math.max(1, Math.ceil(filtered.length / itemsPerPage)) }).map((_, idx) => (
                    <button key={idx} onClick={() => setCurrentPage(idx + 1)} className={`join-item btn btn-ghost btn-xs ${currentPage === idx + 1 ? 'bg-primary text-white' : ''}`}>{idx + 1}</button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {showAdd && <InventoryFormModal onClose={() => setShowAdd(false)} onSubmit={handleAdd} />}
        {showCsvUpload && (
          <InventoryCsvUploadModal
            items={items}
            onClose={() => setShowCsvUpload(false)}
            onUploadSuccess={() => { fetch(); setShowCsvUpload(false) }}
          />
        )}
        {editing && <InventoryFormModal item={editing} onClose={() => setEditing(null)} onSubmit={(payload) => handleEdit(editing._id, payload)} />}
        {restockingFor && <RestockModal item={restockingFor} onClose={() => setRestockingFor(null)} onSubmit={(payload) => handleRestock(restockingFor._id, payload)} />}
      </div>
    </SuperAdminLayout>
  )
}

export default InventoryStocks

function StatCard({ label, value, sub, subClass = 'text-base-content/60' }) {
  return (
    <div className="p-2 rounded-xl bg-base-100 border border-base-300">
      <div className="text-sm text-base-content/70">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className={`text-xs ${subClass}`}>{sub}</div>
    </div>
  )
}

// --- Inline modal components ---

function InventoryFormModal({ item, onClose, onSubmit }) {
  const isEdit = !!item?._id
  const [form, setForm] = useState({
    name: item?.name || '',
    form: item?.form || '',
    strength: item?.strength || '',
    costPrice: item?.costPrice ?? '',
    sellingPrice: item?.sellingPrice ?? '',
    reorderLevel: item?.reorderLevel ?? '',
    supplier: item?.supplier || '',
    packs: '',
    packSize: item?.packSize ?? 1,
    unit: item?.unit || 'tablet',
    concentrationAmount: item?.concentrationAmount || '',
    concentrationPer: item?.concentrationPer || '',
    batchNumber: item?.batchNumber || '',
    expiryDate: item?.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
    description: item?.description || '',
  })
  const [submitting, setSubmitting] = useState(false)

  const safeString = (value) => String(value || '').trim()
  const safeNumber = (value) => {
    const str = String(value ?? '').trim()
    return str === '' ? undefined : Number(str)
  }

  const handle = async () => {
    if (!form.name.trim()) return toast.error('Item name is required')
    if (!form.form) return toast.error('Please select a form (Tablet, Syrup, or Injection)')
    if (!form.batchNumber.trim()) return toast.error('Batch number is required')
    if (!isEdit && (!form.packs || Number(form.packs) <= 0)) {
      return toast.error(form.unit === 'tablet' ? 'Enter number of tablets' : 'Enter number of bottles/vials')
    }

    const payload = { name: safeString(form.name) }

    const formValue = safeString(form.form)
    const strengthValue = safeString(form.strength)
    const costPriceValue = safeNumber(form.costPrice)
    const sellingPriceValue = safeNumber(form.sellingPrice)
    const reorderLevelValue = safeNumber(form.reorderLevel)
    const supplierValue = safeString(form.supplier)
    const batchNumberValue = safeString(form.batchNumber)
    const expiryDateValue = safeString(form.expiryDate)
    const descriptionValue = safeString(form.description)
    const packSizeValue = safeNumber(form.packSize) || 1

    payload.packSize = packSizeValue
    payload.unit = form.unit
    payload.concentrationUnit = form.unit
    if (safeNumber(form.concentrationAmount) !== undefined) payload.concentrationAmount = safeNumber(form.concentrationAmount)
    if (safeNumber(form.concentrationPer) !== undefined) payload.concentrationPer = safeNumber(form.concentrationPer)

    // Only creating a new item sets initial stock (via packs). Editing an
    // existing item never touches stock — that's what Restock is for.
    if (!isEdit) {
      payload.packs = safeNumber(form.packs)
    }

    if (formValue) payload.form = formValue
    if (strengthValue) payload.strength = strengthValue
    if (costPriceValue !== undefined) payload.costPrice = costPriceValue
    if (sellingPriceValue !== undefined) payload.sellingPrice = sellingPriceValue
    if (reorderLevelValue !== undefined) payload.reorderLevel = reorderLevelValue
    if (supplierValue) payload.supplier = supplierValue
    if (batchNumberValue) payload.batchNumber = batchNumberValue
    if (expiryDateValue) payload.expiryDate = expiryDateValue
    if (descriptionValue) payload.description = descriptionValue

    setSubmitting(true)
    try {
      await onSubmit(payload)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="z-10 w-full max-w-lg card bg-base-100 p-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">{isEdit ? 'Edit Item' : 'Add Item'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>

        <div className="space-y-3">
            <div className="flex gap-2">
              <input className="input input-bordered flex-1" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <select
                className="select select-bordered flex-1"
                value={form.form}
                onChange={(e) => {
                  const nextForm = e.target.value
                  // Keep unit sensible when form changes — tablet form implies tablet unit,
                  // syrup/injection imply a liquid/IU unit (doctor's filter depends on this).
                  const nextUnit = nextForm === 'Tablet' ? 'tablet' : (form.unit === 'tablet' ? 'ml' : form.unit)
                  setForm({ ...form, form: nextForm, unit: nextUnit })
                }}
              >
                <option value="">Select form</option>
                <option value="Tablet">Tablet</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
              </select>
            </div> 

          <div className="flex gap-2">
            <input className="input input-bordered flex-1" placeholder="Strength" value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} />
            <select className="select select-bordered flex-1" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                <option value="tablet">Tablet (counted individually)</option>
                <option value="ml">Liquid — ml (syrup, injection)</option>
                <option value="iu">IU (injection)</option>
                <option value="ampoule">Ampoule (injection, counted individually)</option>
              </select>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-base-content/60 block mb-1">
                {form.unit === 'ampoule' ? 'Pack size — ampoules per pack' : form.unit === 'tablet' ? 'Pack size — tablets per pack (usually 1)' : 'Pack size — volume of ONE bottle/vial'}
              </label>
              <input className="input input-bordered w-full" placeholder={form.unit === 'tablet' ? 'e.g. 1' : 'e.g. 75 = 75ml bottle'} value={form.packSize} onChange={(e) => setForm({ ...form, packSize: e.target.value })} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-base-content/60 block mb-1">Concentration (optional, for mg dosing)</label>
              <div className="flex items-center gap-1">
                <input className="input input-bordered input-sm flex-1" placeholder="mg e.g. 500" value={form.concentrationAmount} onChange={(e) => setForm({ ...form, concentrationAmount: e.target.value })} />
                <span className="text-xs whitespace-nowrap">mg per</span>
                <input className="input input-bordered input-sm w-16" placeholder="1" value={form.concentrationPer} onChange={(e) => setForm({ ...form, concentrationPer: e.target.value })} />
                <span className="text-xs">{form.unit}</span>
              </div>
            </div>
          </div>

          {isEdit ? (
            <div className="text-xs text-base-content/60 bg-base-200/50 rounded px-3 py-2">
              Current stock: <span className="font-medium">{item.stock ?? 0} {UNIT_LABELS[form.unit] || 'tablet'}</span>
              {' '}— to change stock, use <span className="font-medium">Restock</span> instead.
            </div>
          ) : (
            <div>
              <label className="text-xs text-base-content/60 block mb-1">
                {form.unit === 'tablet' ? 'Number of tablets' : form.unit === 'ampoule' ? 'Number of ampoules' : `Number of ${form.unit === 'ml' ? 'bottles/vials' : 'packs'}`}
              </label>
              <input className="input input-bordered w-full" placeholder="e.g. 10" value={form.packs} onChange={(e) => setForm({ ...form, packs: e.target.value })} />
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-base-content/60 block mb-1">Cost Price (per pack)</label>
              <input className="input input-bordered w-full" placeholder="Cost Price" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-base-content/60 block mb-1">Selling Price (per pack)</label>
              <input className="input input-bordered w-full" placeholder="Selling Price" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-2">
            <input className="input input-bordered flex-1" placeholder="Reorder Level" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} />
            <input className="input input-bordered flex-1" placeholder="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          </div>

          <div className="flex gap-2">
            <input className="input input-bordered flex-1" placeholder="Batch Number" value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} />
            <input className="input input-bordered flex-1" type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
          </div>

          <textarea className="textarea textarea-bordered w-full" rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handle} disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RestockModal({ item, onClose, onSubmit }) {
  const [packs, setPacks] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const unit = UNIT_LABELS[item.unit] || 'tablet'
  const packSize = item.packSize ?? 1

  const handle = async () => {
    if (!packs || Number(packs) <= 0) return toast.error('Enter a valid quantity')
    setSubmitting(true)
    try {
      await onSubmit({ packs: Number(packs), batchNumber: item.batchNumber, costPrice: costPrice ? Number(costPrice) : undefined })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="z-10 w-full max-w-md card bg-base-100 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Restock {item.name}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-base-content/60 block mb-1">
              {item.unit === 'tablet' ? 'Number of tablets to add' : item.unit === 'ampoule' ? `Number of ampoules to add (each pack ${packSize})` : `Number of ${unit === 'ml' ? 'bottles/vials' : 'packs'} to add (each ${packSize} ${unit})`}
            </label>
            <input className="input input-bordered w-full" placeholder="e.g. 10" value={packs} onChange={(e) => setPacks(e.target.value)} />
          </div>
          {packs && Number(packs) > 0 && (
            <p className="text-xs text-base-content/60">
              This adds {Number(packs) * packSize} {unit} to stock ({item.stock ?? 0} → {(Number(item.stock) || 0) + Number(packs) * packSize}).
            </p>
          )}
          <input className="input input-bordered w-full" placeholder="Batch number" value={item.batchNumber} disabled />
          <input className="input input-bordered w-full" placeholder="Cost price (optional)" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handle} disabled={submitting}>{submitting ? 'Restocking...' : 'Restock'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function InventoryCsvUploadModal({ items = [], onClose, onUploadSuccess }) {
  const [csvText, setCsvText] = useState('')
  const [previewRows, setPreviewRows] = useState([])
  const [fileName, setFileName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const parseCsvLine = (line) => {
    const values = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i += 1 } else { inQuotes = !inQuotes }
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

    const makeDuplicateKey = (name) => String(name || '').trim().toLowerCase()
    const existingKeys = new Set(items.map((item) => makeDuplicateKey(item.name)))
    const seenKeys = new Set()
    const uploadPayloads = []
    const skippedDuplicateRows = []
    const skippedInvalidRows = []

    parsedRows.forEach((item) => {
      const name = String(item.name || item.drug || item.item || '').trim()
      if (!name) { skippedInvalidRows.push(item.__rowIndex); return }
      const rawForm = String(item.form || '').trim()
      const normalizedForm = rawForm.toLowerCase()
      const form = ['Tablet', 'Syrup', 'Injection'].includes(rawForm)
        ? rawForm
        : (normalizedForm === 'tablet' ? 'Tablet' : normalizedForm === 'syrup' ? 'Syrup' : normalizedForm === 'injection' ? 'Injection' : '')
      if (!form) { skippedInvalidRows.push(item.__rowIndex); return }
      const key = makeDuplicateKey(name)
      if (seenKeys.has(key) || existingKeys.has(key)) { skippedDuplicateRows.push(item.__rowIndex); return }
      seenKeys.add(key)

      const payload = { name }
      const strength = String(item.strength || '').trim()
      const unit = String(item.unit || 'tablet').trim().toLowerCase()
      const packSizeValue = String(item.packsize ?? item.pack_size ?? '1').trim()
      const packsValue = String(item.packs ?? item.stock ?? item.qty ?? item.quantity ?? '').trim()
      const costPriceValue = String(item.costprice ?? item.cost_price ?? item.cost ?? '').trim()
      const sellingPriceValue = String(item.sellingprice ?? item.selling_price ?? item.price ?? '').trim()
      const reorderLevelValue = String(item.reorderlevel ?? item.reorder_level ?? item.reorder ?? '').trim()
      const supplier = String(item.supplier || '').trim()
      const batchNumber = String(item.batchnumber || item.batch_number || item.batch || '').trim()
      const expiry = String(item.expirydate || item.expiry_date || item.expiry || '').trim()
      const description = String(item.description || item.notes || '').trim()

      if (form) payload.form = form
      if (strength) payload.strength = strength
      payload.unit = ['tablet', 'ml', 'iu'].includes(unit) ? unit : 'tablet'
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

    const messages = []
    if (failureResults.length) messages.push(`${failureResults.length} item(s) failed to upload`)
    if (duplicateCount) messages.push(`${duplicateCount} item(s) already exist; use restock instead`)
    if (skippedInvalidRows.length) messages.push(`${skippedInvalidRows.length} invalid row(s) skipped`)

    if (successCount > 0) {
      toast.success(duplicateCount ? `Imported ${successCount} item(s); ${duplicateCount} already exist. Use restock instead.` : `Imported ${successCount} item(s)`)
      onUploadSuccess()
    } else if (duplicateCount && !failureResults.length) {
      toast.success(`${duplicateCount} item(s) already exist; use restock instead.`)
    }

    if (messages.length && (failureResults.length || !successCount)) {
      toast(() => (
        <div>
          <div>{messages.join(' and ')}</div>
          {failureResults.length > 0 && <div className="text-xs text-error">Some rows could not be imported.</div>}
        </div>
      ))
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="z-10 w-full max-w-lg card bg-base-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-medium">Import Inventory from CSV</h3>
            <p className="text-sm text-base-content/70">Upload a CSV file to add many inventory items at once.</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={isLoading}>Close</button>
        </div>

        <div className="mb-4 p-3 bg-base-200 rounded-lg">
          <button className="btn btn-sm btn-ghost w-full" onClick={downloadTemplate}>Download CSV Template</button>
          <p className="text-xs text-base-content/70 mt-2">
            <strong>name</strong> and <strong>form</strong> (Tablet, Syrup, or Injection) are required. For liquids/injections set <strong>unit</strong> (ml/iu) and <strong>packSize</strong> (volume per bottle/vial). Duplicates are automatically skipped.
          </p>
        </div>

        <div className="form-control mb-4">
          <label className="label"><span className="font-medium label-text">Select CSV File</span></label>
          <input type="file" accept=".csv" onChange={handleFileChange} disabled={isLoading} className="file-input file-input-bordered w-full" />
          {fileName && <span className="text-xs text-base-content/70 mt-2">Selected: {fileName}</span>}
        </div>

        {previewRows.length > 0 && (
          <div className="mb-4 p-3 bg-base-200 rounded-lg max-h-40 overflow-y-auto">
            <p className="text-sm font-medium text-base-content mb-2">Preview</p>
            <div className="text-xs font-mono text-base-content/70 space-y-1">
              {previewRows.map((line, index) => (<div key={index}>{line}</div>))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onClose} disabled={isLoading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpload} disabled={isLoading || !csvText}>
            {isLoading ? 'Uploading...' : 'Upload CSV'}
          </button>
        </div>
      </div>
    </div>
  )
}