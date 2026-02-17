import React, { useEffect, useMemo, useState } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { MdAdd, MdInventory2 } from 'react-icons/md'
import toast from 'react-hot-toast'
import { getInventories, createInventory, updateInventory, restockInventory, getAllInventoryTransactions, deleteInventory } from '@/services/api/inventoryAPI'
import { SuperAdminLayout } from '@/layouts/superadmin'

const InventoryStocks = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = items.filter(i => !q || (i.name || '').toLowerCase().includes(q) || (i.strength || '').toLowerCase().includes(q) || (i.form || '').toLowerCase().includes(q))
    if (activeTab === 'low') list = list.filter(i => (Number(i.stock) > 0 && Number(i.stock) <= Number(i.reorderLevel || 0)))
    if (activeTab === 'out') list = list.filter(i => Number(i.stock) === 0)
    if (activeTab === 'recent') list = list.slice().sort((a,b)=> new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
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
        sku: i.sku || '',
        reorderLevel: i.reorderLevel ?? 0,
        form: i.form || '',
        stock: i.stock ?? 0,
        costPrice: i.costPrice ?? 0,
        sellingPrice: i.sellingPrice ?? 0,
        unitPrice: i.unitPrice ?? 0,
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="p-4 rounded-xl bg-base-100 border border-base-300">
                  <div className="text-sm text-base-content/70">Total Items</div>
                  <div className="text-3xl font-bold">{totalItems}</div>
                  <div className="text-xs text-base-content/60">Unique medications</div>
                </div>
                <div className="p-4 rounded-xl bg-base-100 border border-base-300">
                  <div className="text-sm text-base-content/70">In Stock</div>
                  <div className="text-3xl font-bold">{inStockCount}</div>
                  <div className="text-xs text-success/70">{totalItems ? Math.round((inStockCount/totalItems)*100) : 0}% availability</div>
                </div>
                <div className="p-4 rounded-xl bg-base-100 border border-base-300">
                  <div className="text-sm text-base-content/70">Low Stock</div>
                  <div className="text-3xl font-bold">{lowStockCount}</div>
                  <div className="text-xs text-warning/70">Needs reordering</div>
                </div>
                <div className="p-4 rounded-xl bg-base-100 border border-base-300">
                  <div className="text-sm text-base-content/70">Expiring Soon</div>
                  <div className="text-3xl font-bold">{expiringSoonCount}</div>
                  <div className="text-xs text-error/70">Within 30 days</div>
                </div>
              </div>

              {/* Tabs and controls */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <button className={`px-3 py-1 rounded ${activeTab==='all'?'bg-primary text-primary-content':'bg-base-200'}`} onClick={()=>{setActiveTab('all'); setCurrentPage(1)}}>All Items</button>
                  <button className={`px-3 py-1 rounded ${activeTab==='low'?'bg-primary text-primary-content':'bg-base-200'}`} onClick={()=>{setActiveTab('low'); setCurrentPage(1)}}>Low Stock</button>
                  <button className={`px-3 py-1 rounded ${activeTab==='out'?'bg-primary text-primary-content':'bg-base-200'}`} onClick={()=>{setActiveTab('out'); setCurrentPage(1)}}>Out of Stock</button>
                  <button className={`px-3 py-1 rounded ${activeTab==='recent'?'bg-primary text-primary-content':'bg-base-200'}`} onClick={()=>{setActiveTab('recent'); setCurrentPage(1)}}>Recent Activity</button>
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
                              className="btn btn-error btn-xs"
                              title="Delete"
                              disabled={deleting === item._id}
                              onClick={() => handleDelete(item)}
                            >
                              {deleting === item._id ? 'Deleting...' : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
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
                <div>Showing Result for {activeTab==='all'?'All Items': activeTab==='low'?'Low Stock': activeTab==='out'?'Out of Stock':'Recent Activity'} ({filtered.length} Total)</div>
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
    name: item?.name || '', form: item?.form || '', strength: item?.strength || '', costPrice: item?.costPrice, sellingPrice: item?.sellingPrice, reorderLevel: item?.reorderLevel, supplier: item?.supplier, sku: item?.sku || '', unitPrice: item?.unitPrice, stock: item?.stock, batchNumber: item?.batchNumber || '', expiryDate: item?.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '', description: item?.description || ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handle = async () => {
    // basic validation
    if (!form.name) return toast.error('Name required')
    if(!form.batchNumber) return toast.error('Batch number required')

    setSubmitting(true)
    try{
      await onSubmit(form)
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
          <input className="input input-bordered flex-1" placeholder="Name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} />
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
            <input className="input input-bordered flex-1" placeholder="Sku" value={form.sku} onChange={(e)=>setForm({...form,sku:e.target.value})} />
            <input className="input input-bordered flex-1" placeholder="Unit Price" value={form.unitPrice} onChange={(e)=>setForm({...form,unitPrice:e.target.value})} />
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

