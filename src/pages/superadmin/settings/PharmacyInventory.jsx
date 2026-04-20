import React, { useEffect, useMemo, useState } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { MdAdd, MdInventory2 } from 'react-icons/md'
import { FaTrash, FaFileUpload } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { getInventories, createInventory, updateInventory, restockInventory, getAllInventoryTransactions, deleteInventory } from '@/services/api/inventoryAPI'
import { SuperAdminLayout } from '@/layouts/superadmin'

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
  
  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"? This cannot be undone.`)) return;
    setDeleting(item._id);
    try {
      await deleteInventory(item._id);
      toast.success('Item deleted');
      await fetch();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to delete item');
    } finally {
      setDeleting(null);
    }
  };

  const fetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getInventories()
      const list = Array.isArray(res?.data) ? res.data : (res?.data ?? [])
      setItems(list)
    } catch (err) {
      console.error('InventoryStocks: fetch error', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const [activeTab, setActiveTab] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const totalItems = items.length
  const inStockCount = items.filter(i => Number(i.stock) > 0).length
  const outOfStockCount = items.filter(i => Number(i.stock) === 0).length
  const lowStockCount = items.filter(i => Number(i.stock) > 0 && Number(i.stock) <= Number(i.reorderLevel || 0)).length
  const expiringSoonCount = items.filter(i => {
    if (!i.expiryDate) return false
    const d = new Date(i.expiryDate)
    const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return diff <= 30 && diff >= 0
  }).length
  const expiredCount = items.filter(i => {
    if (!i.expiryDate) return false
    const d = new Date(i.expiryDate)
    return d.getTime() < Date.now()
  }).length
 
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = items.filter(i => !q || (i.name || '').toLowerCase().includes(q) || (i.strength || '').toLowerCase().includes(q) || (i.form || '').toLowerCase().includes(q))
    if (activeTab === 'low') list = list.filter(i => (Number(i.stock) > 0 && Number(i.stock) <= Number(i.reorderLevel || 0)))
    if (activeTab === 'out') list = list.filter(i => Number(i.stock) === 0)
    if (activeTab === 'recent') list = list.slice().sort((a,b)=> new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    if (activeTab === 'expiring') {
      list = list.filter(i => {
        if (!i.expiryDate) return false
        const d = new Date(i.expiryDate)
        const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        return diff <= 30 && diff >= 0
      })
    }
    if (activeTab === 'expired') {
      list = list.filter(i => {
        if (!i.expiryDate) return false
        const d = new Date(i.expiryDate)
        return d.getTime() < Date.now()
      })
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
        reorderLevel: i.reorderLevel ?? 0,
        form: i.form || '',
        stock: i.stock ?? 0,
        costPrice: i.costPrice ?? 0,
        sellingPrice: i.sellingPrice ?? 0,
        supplier: i.supplier || '',
        expiryDate: i.expiryDate ? new Date(i.expiryDate).toISOString().split('T')[0] : '',
        batchNumber: i.batchNumber || '',
        description: i.description || ''
      }))
      const header = Object.keys(rows[0] || {}).join(',') + '\n'
      const csv = header + rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'inventory.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error('Export failed')
    }
  }

  const lowStock = (i) => (Number(i.stock) === 0 ? 'out' : (Number(i.stock) <= Number(i.reorderLevel || 0) ? 'low' : 'ok'))

  const handleAdd = async (payload) => {
    const p = createInventory(payload)
    toast.promise(p, { loading: 'Creating item...', success: 'Item created', error: 'Failed creating' })
    try {
      await p
      fetch()
      setShowAdd(false)
    } catch (e) {
      console.error('Error creating inventory item:', e)
    }
  }

  const handleEdit = async (id, payload) => {
    const p = updateInventory(id, payload)
    toast.promise(p, { loading: 'Updating item...', success: 'Item updated', error: 'Failed updating' })
    try {
      await p
      fetch()
      setEditing(null)
    } catch (e) {
      console.error('Error updating inventory item:', e)
    }
  }

  const handleRestock = async (id, payload) => {
    const p = restockInventory(id, payload)
    toast.promise(p, { loading: 'Restocking...', success: 'Restocked', error: 'Failed restock' })
    try {
      await p
      fetch()
      setRestockingFor(null)
    } catch (e) {
      console.error('Error restocking inventory item:', e)
    }
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
            <input className="input input-sm input-bordered" placeholder="Search" value={search} onChange={(e)=>setSearch(e.target.value)} />
            <button className="btn btn-outline btn-sm flex items-center gap-2" onClick={() => setShowCsvUpload(true)}><FaFileUpload /> Import CSV</button>
            <button className="btn btn-primary btn-sm flex items-center gap-2" onClick={() => setShowAdd(true)}><MdAdd/> Add new item</button>
          </div>
        </div>

        <div className="rounded-xl bg-base-100 border border-base-300 p-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({length:6}).map((_,i)=>(<div key={i} className="h-40 rounded-xl bg-base-200 animate-pulse"/>))}
            </div>
          ) : error ? (
            <div className="text-sm text-error">Failed to load inventory.</div>
          ) : (
            <>
              {/* Top stat cards */}
<div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div className="p-2 rounded-xl bg-base-100 border border-base-300">
                  <div className="text-sm text-base-content/70">Total Items</div>
                  <div className="text-3xl font-bold">{totalItems}</div>
                  <div className="text-xs text-base-content/60">Unique medications</div>
                </div>
                <div className="p-2 rounded-xl bg-base-100 border border-base-300">
                  <div className="text-sm text-base-content/70">In Stock</div>
                  <div className="text-3xl font-bold">{inStockCount}</div>
                  <div className="text-xs text-success/70">{totalItems ? Math.round((inStockCount/totalItems)*100) : 0}% availability</div>
                </div>
                <div className="p-2 rounded-xl bg-base-100 border border-base-300">
                  <div className="text-sm text-base-content/70">Low Stock</div>
                  <div className="text-3xl font-bold">{lowStockCount}</div>
                  <div className="text-xs text-warning/70">Needs reordering</div>
                </div>
                <div className="p-2 rounded-xl bg-base-100 border border-base-300">
                  <div className="text-sm text-base-content/70">Expiring Soon</div>
                  <div className="text-3xl font-bold">{expiringSoonCount}</div>
                  <div className="text-xs text-error/70">Within 90 days</div>
                </div>
                <div className="p-2 rounded-xl bg-base-100 border border-base-300">
                  <div className="text-sm text-base-content/70">Expired</div>
                  <div className="text-3xl font-bold">{expiredCount}</div>
                  <div className="text-xs text-error/70">Past expiry date</div>
                </div>
              </div>

              {/* Tabs and controls */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <button className={`px-2 py-1 rounded ${activeTab==='all'?'bg-primary text-primary-content':'bg-base-200'}`} onClick={()=>{setActiveTab('all'); setCurrentPage(1)}}>All Items</button>
                  <button className={`px-2 py-1 rounded ${activeTab==='low'?'bg-primary text-primary-content':'bg-base-200'}`} onClick={()=>{setActiveTab('low'); setCurrentPage(1)}}>Low Stock</button>
                  <button className={`px-2 py-1 rounded ${activeTab==='out'?'bg-primary text-primary-content':'bg-base-200'}`} onClick={()=>{setActiveTab('out'); setCurrentPage(1)}}>Out of Stock</button>
                  <button className={`px-2 py-1 rounded ${activeTab==='expiring'?'bg-primary text-primary-content':'bg-base-200'}`} onClick={()=>{setActiveTab('expiring'); setCurrentPage(1)}}>Expiring Soon</button>
                  <button className={`px-2 py-1 rounded ${activeTab==='expired'?'bg-primary text-primary-content':'bg-base-200'}`} onClick={()=>{setActiveTab('expired'); setCurrentPage(1)}}>Expired</button>
                  <button className={`px-2 py-1 rounded ${activeTab==='recent'?'bg-primary text-primary-content':'bg-base-200'}`} onClick={()=>{setActiveTab('recent'); setCurrentPage(1)}}>Recent Activity</button>
                </div>
                <div className="flex items-center gap-2">
                  <input className="input input-sm input-bordered" placeholder="Search Medications..." value={search} onChange={(e)=>{setSearch(e.target.value); setCurrentPage(1)}} />
                  <select className="select select-sm select-bordered">
                    <option>All Categories</option>
                  </select>
                  <button className="btn btn-outline btn-sm" onClick={() => exportCsv(filtered)}>Export</button>
                </div>
              </div>

              {/* Cards for narrow; table for wide */}
              <div className="block md:hidden">
                <div className="grid grid-cols-1 gap-4">
                  {pageItems.map(item => (
                    <div key={item._id} className="p-4 rounded-xl border flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{item.name}</div>
                        <div className={`text-xs px-2 py-1 rounded ${lowStock(item)==='out' ? 'bg-error/10 text-error' : lowStock(item)==='low' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>{lowStock(item)==='out' ? 'Out of stock' : lowStock(item)==='low' ? 'Low stock' : 'In stock'}</div>
                      </div>
                      <div className="text-sm text-base-content/70">{item.form} {item.strength}</div>
                      <div className="flex items-center justify-between text-sm">
                        <div>Stock: <span className="font-medium">{item.stock ?? 0}</span></div>
                        <div>Price: <span className="font-medium">{item.sellingPrice ?? '—'}</span></div>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(item)}>Edit</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setRestockingFor(item)}>Restock</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden md:block">
                <table className="table w-full">
                  <thead>
                    <tr className="bg-base-200">
                      <th>Item</th>
                      <th>Form / Strength</th>
                      <th>Stock</th>
                      <th>Reorder Level</th>
                      <th>Price</th>
                      <th>Expiry Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map(item => (
                      <tr key={item._id}>
                        <td>{item.name}</td>
                        <td>{item.form} {item.strength}</td>
                        <td>{item.stock ?? 0}</td>
                        <td>{item.reorderLevel ?? 0}</td>
                        <td>{item.sellingPrice ?? '—'}</td>
                        <td>
                          {item.expiryDate
                            ? new Date(item.expiryDate).toISOString().split('T')[0]
                            : '—'}
                        </td>


                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-ghost btn-xs" onClick={() => setEditing(item)}>Edit</button>
                            <button className="btn btn-outline btn-xs" onClick={() => setRestockingFor(item)}>Restock</button>
                            <button
                              disabled={deleting === item._id}
                              onClick={() => handleDelete(item)}
                              className="btn btn-ghost btn-xs text-error"
                              title="Delete Item"><FaTrash className="w-3 h-3" />
                            </button>
                          
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <div className="mt-4 flex items-center justify-between text-xs text-base-content/60">
                <div>Showing Result for {activeTab==='all'?'All Items': activeTab==='low'?'Low Stock': activeTab==='out'?'Out of Stock': activeTab==='expiring'?'Expiring Soon': activeTab==='expired'?'Expired Items':'Recent Activity'} ({filtered.length} Total)</div>
                <div className="join">
                  {Array.from({ length: Math.max(1, Math.ceil(filtered.length / itemsPerPage)) }).map((_, idx) => (
                    <button key={idx} onClick={() => setCurrentPage(idx+1)} className={`join-item btn btn-ghost btn-xs ${currentPage===idx+1?'bg-primary text-white':''}`}>{idx+1}</button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAdd && (
          <InventoryFormModal onClose={() => setShowAdd(false)} onSubmit={handleAdd} />
        )}

        {showCsvUpload && (
          <InventoryCsvUploadModal
            items={items}
            onClose={() => setShowCsvUpload(false)}
            onUploadSuccess={() => {
              fetch()
              setShowCsvUpload(false)
            }}
          />
        )}

        {editing && (
          <InventoryFormModal item={editing} onClose={() => setEditing(null)} onSubmit={(payload) => handleEdit(editing._id, payload)} />
        )}

        {restockingFor && (
          <RestockModal item={restockingFor} onClose={() => setRestockingFor(null)} onSubmit={(payload) => handleRestock(restockingFor._id, payload)} />
        )}
         </div>

</SuperAdminLayout>




  )
}

export default InventoryStocks

// --- Inline modal components ---
function InventoryFormModal({ item, onClose, onSubmit }){
  const [form, setForm] = useState({
    name: item?.name || '', form: item?.form || '', strength: item?.strength || '', costPrice: item?.costPrice, sellingPrice: item?.sellingPrice, reorderLevel: item?.reorderLevel, supplier: item?.supplier, stock: item?.stock, batchNumber: item?.batchNumber || '', expiryDate: item?.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '', description: item?.description || ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handle = async () => {
    // basic validation
    if (!form.name) return toast.error('Name required')

    const payload = {
      name: String(form.name).trim(),
    }

    const safeString = (value) => String(value || '').trim()
    const safeNumber = (value) => {
      const str = String(value ?? '').trim()
      return str === '' ? undefined : Number(str)
    }

    const formValue = safeString(form.form)
    const strengthValue = safeString(form.strength)
    const stockValue = safeNumber(form.stock)
    const costPriceValue = safeNumber(form.costPrice)
    const sellingPriceValue = safeNumber(form.sellingPrice)
    const reorderLevelValue = safeNumber(form.reorderLevel)
    const supplierValue = safeString(form.supplier)
    const batchNumberValue = safeString(form.batchNumber)
    const expiryDateValue = safeString(form.expiryDate)
    const descriptionValue = safeString(form.description)

    if (formValue) payload.form = formValue
    if (strengthValue) payload.strength = strengthValue
    if (stockValue !== undefined) payload.stock = stockValue
    if (costPriceValue !== undefined) payload.costPrice = costPriceValue
    if (sellingPriceValue !== undefined) payload.sellingPrice = sellingPriceValue
    if (reorderLevelValue !== undefined) payload.reorderLevel = reorderLevelValue
    if (supplierValue) payload.supplier = supplierValue
    if (batchNumberValue) payload.batchNumber = batchNumberValue
    if (expiryDateValue) payload.expiryDate = expiryDateValue
    if (descriptionValue) payload.description = descriptionValue

    setSubmitting(true)
    try{
      await onSubmit(payload)
    }finally{ setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="z-10 w-full max-w-lg card bg-base-100 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">{item?._id ? 'Edit Item' : 'Add Item'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
        <div className="space-y-2">
          <div className="flex gap-2">
          <input className="input input-bordered flex-1" placeholder="Name" value={form.name}  onChange={(e)=>setForm({...form,name:e.target.value})} />
          <input className="input input-bordered flex-1" placeholder="Stock" value={form.stock} onChange={(e)=>setForm({...form,stock:e.target.value})} />
          </div>
          <div className="flex gap-2">
            <input className="input input-bordered flex-1" placeholder="Form" value={form.form} onChange={(e)=>setForm({...form,form:e.target.value})} />
            <input className="input input-bordered flex-1" placeholder="Strength" value={form.strength} onChange={(e)=>setForm({...form,strength:e.target.value})} />
          </div>
          <div className="flex gap-2">
            <input className="input input-bordered flex-1" placeholder="Cost Price" value={form.costPrice} onChange={(e)=>setForm({...form,costPrice:e.target.value})} />
            <input className="input input-bordered flex-1" placeholder="Selling Price" value={form.sellingPrice} onChange={(e)=>setForm({...form,sellingPrice:e.target.value})} />
          </div>
             
          <div className="flex gap-2">
            <input className="input input-bordered flex-1" placeholder="Reorder Level" value={form.reorderLevel} onChange={(e)=>setForm({...form,reorderLevel:e.target.value})} />
            <input className="input input-bordered flex-1" placeholder="Supplier" value={form.supplier} onChange={(e)=>setForm({...form,supplier:e.target.value})} />
          </div>
          <div className="flex gap-2">
            <input className="input input-bordered flex-1" placeholder="Batch Number" value={form.batchNumber} onChange={(e)=>setForm({...form,batchNumber:e.target.value})} />
            <input className="input input-bordered flex-1" type="date" placeholder="YYYY-MM-DD" value={form.expiryDate} onChange={(e)=>setForm({...form,expiryDate:e.target.value})} />
          </div>
          <div className="flex gap-2">
            <textarea className="textarea textarea-bordered w-full" rows={3} placeholder='Description'
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handle} disabled={submitting}>{submitting? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RestockModal({ item, onClose, onSubmit }){
  const [qty, setQty] = useState('')
  const [batch, setBatch] = useState('')
  const [costPrice, setCostPrice] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const handle = async () => {
    if (!qty || Number(qty) <= 0) return toast.error('Enter valid quantity')
    setSubmitting(true)
    try{

      await onSubmit({ quantity: qty, batchNumber: item.batchNumber, costPrice: costPrice })
    }finally{ setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="z-10 w-full max-w-md card bg-base-100 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Restock {item.name}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
        <div className="space-y-2">
          <input className="input input-bordered w-full" placeholder="Quantity" value={qty} onChange={(e)=>setQty(e.target.value)} />
          <input className="input input-bordered w-full" placeholder="Batch number (optional)" value={item.batchNumber} onChange={(e)=>setBatch(e.target.value)} />
          <input className="input input-bordered w-full" placeholder="cost price (optional)" value={costPrice} onChange={(e)=>setCostPrice(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handle} disabled={submitting}>{submitting? 'Restocking...' : 'Restock'}</button>
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
      const rows = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
      setPreviewRows(rows.slice(0, 5))
    }
    reader.readAsText(selectedFile)
  }

  const downloadTemplate = () => {
    const template = [
      'name,form,strength,stock,costPrice,sellingPrice,reorderLevel,supplier,batchNumber,expiryDate,description',
      'Paracetamol,Tablet,500mg,100,50,70,20,Acme Pharma,BATCH001,2025-12-31,Pain reliever',
      'Amoxicillin,Capsule,250mg,200,100,150,30,HealthCo,BATCH002,2025-09-15,Antibiotic'
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
    const rows = csvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    if (rows.length < 2) {
      toast.error('CSV must include a header row and at least one data row')
      setIsLoading(false)
      return
    }

    const headers = parseCsvLine(rows[0]).map((header) => header.toLowerCase())
    const parsedRows = rows.slice(1).map((row, rowIndex) => {
      const values = parseCsvLine(row)
      const entry = { __rowIndex: rowIndex + 2 }
      headers.forEach((header, index) => {
        entry[header] = values[index] ?? ''
      })
      return entry
    })

    const makeDuplicateKey = (name, batch) => {
      const trimmedName = String(name || '').trim().toLowerCase()
      return trimmedName
    }

    const existingKeys = new Set(
      items.map((item) => {
        const name = item.name || ''
        return makeDuplicateKey(name, '')
      })
    )
    const seenKeys = new Set()
    const uploadPayloads = []
    const skippedDuplicateRows = []
    const skippedInvalidRows = []

    parsedRows.forEach((item) => {
      const name = String(item.name || item.drug || item.item || '').trim()
      if (!name) {
        skippedInvalidRows.push(item.__rowIndex)
        return
      }
      const batch = String(item.batchNumber || item.batch_number || item.batch || '').trim()
      const key = makeDuplicateKey(name, batch)
      if (seenKeys.has(key) || existingKeys.has(key)) {
        skippedDuplicateRows.push(item.__rowIndex)
        return
      }
      seenKeys.add(key)
      const payload = { name }
      const form = String(item.form || '').trim()
      const strength = String(item.strength || '').trim()
      const stockValue = String(item.stock ?? item.qty ?? item.quantity ?? '').trim()
      const costPriceValue = String(item.costprice ?? item.cost_price ?? item.cost ?? '').trim()
      const sellingPriceValue = String(item.sellingprice ?? item.selling_price ?? item.price ?? '').trim()
      const reorderLevelValue = String(item.reorderlevel ?? item.reorder_level ?? item.reorder ?? '').trim()
      const supplier = String(item.supplier || '').trim()
      const batchNumber = batch
      const expiry = String(item.expirydate || item.expiry_date || item.expiry || '').trim()
      const description = String(item.description || item.notes || '').trim()

      if (form) payload.form = form
      if (strength) payload.strength = strength
      if (stockValue !== '') payload.stock = Number(stockValue)
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
            const errorMessage = result.reason?.response?.data?.message || result.reason?.message || ''
            if (
              errorMessage.includes('duplicate key error') ||
              errorMessage.includes('E11000') ||
              errorMessage.toLowerCase().includes('already exists') ||
              errorMessage.toLowerCase().includes('use restock')
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
    const successCount = results.filter((result) => result.status === 'fulfilled').length
    const failureResults = results.filter((result) => result.status === 'rejected')

    const duplicateCount = skippedDuplicateRows.length + additionalSkipped
    const messages = []
    if (failureResults.length) messages.push(`${failureResults.length} item(s) failed to upload`)
    if (duplicateCount) messages.push(`${duplicateCount} item(s) already exist; use restock instead`)
    if (skippedInvalidRows.length) messages.push(`${skippedInvalidRows.length} invalid row(s) skipped`)

    if (successCount > 0) {
      const successMessage = duplicateCount
        ? `Imported ${successCount} item(s); ${duplicateCount} already exist. Use restock instead.`
        : `Imported ${successCount} item(s)`
      toast.success(successMessage)
      onUploadSuccess()
    } else if (duplicateCount && !failureResults.length) {
      toast.success(`${duplicateCount} item(s) already exist; use restock instead.`)
    }

    if (messages.length && (failureResults.length || !successCount)) {
      toast(message => (
        <div>
          <div>{messages.join(' and ')}</div>
          {failureResults.length > 0 && <div className="text-xs text-error">Check console for failed rows.</div>}
        </div>
      ))
    }

    if (failureResults.length > 0) {
      failureResults.forEach((result, index) => {
        console.error(`Import error ${index + 1}:`, result.reason)
      })
    }

    setIsLoading(false)
    if (successCount > 0 && failureResults.length === 0) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
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
            Only <strong>name</strong> is required. Other columns are optional. Duplicates are automatically skipped.
          </p>
        </div>

        <div className="form-control mb-4">
          <label className="label">
            <span className="font-medium label-text">Select CSV File</span>
          </label>
          <input type="file" accept=".csv" onChange={handleFileChange} disabled={isLoading} className="file-input file-input-bordered w-full" />
          {fileName && <span className="text-xs text-base-content/70 mt-2">Selected: {fileName}</span>}
        </div>

        {previewRows.length > 0 && (
          <div className="mb-4 p-3 bg-base-200 rounded-lg max-h-40 overflow-y-auto">
            <p className="text-sm font-medium text-base-content mb-2">Preview</p>
            <div className="text-xs font-mono text-base-content/70 space-y-1">
              {previewRows.map((line, index) => (
                <div key={index}>{line}</div>
              ))}
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

