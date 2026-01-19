import React, { useEffect, useMemo, useState } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { FiSearch, FiDownload } from 'react-icons/fi'
import inventoryAPI from '@/services/api/inventoryAPI'
import toast from 'react-hot-toast'

const StatCard = ({ title, value, hint }) => (
  <div className="p-4 rounded-xl bg-base-100 border border-base-300">
    <div className="text-sm text-base-content/70">{title}</div>
    <div className="mt-2 text-2xl font-semibold text-base-content">{value}</div>
    {hint && <div className="mt-1 text-xs text-base-content/60">{hint}</div>}
  </div>
)

const Badge = ({ children, variant }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-medium ${variant==='in' ? 'bg-success/10 text-success' : variant==='out' ? 'bg-error/10 text-error' : 'bg-base-200 text-base-content'}`}>{children}</span>
)

const Transactions = () => {
  const [inventoryTx, setInventoryTx] = useState([])
  const [dispenses, setDispenses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('in') // 'in' or 'out'
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All Categories')

  useEffect(() => {
    let mounted = true
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const allTx = await inventoryAPI.getAllInventoryTransactions().catch(e => { throw { source: 'inventory', e } });

        console.log("All transactions:", allTx)

          // Separate into "in" and "out"
          const txRes = allTx?.data.filter(tx => tx.type === 'in');
          const dRes  = allTx?.data.filter(tx => tx.type === 'out');

          // Now you can use txRes and dRes
          console.log("IN transactions:", txRes);
          console.log("OUT transactions:", dRes);


        if (!mounted) return

        const txs = txRes?.data ?? txRes
        const disp = dRes?.data ?? dRes

        console.log("Filtered OUT transactions:", disp);

        // Normalize inventory transactions (type: in/out)
        const invRows = (Array.isArray(txs) ? txs : []).map(t => ({
          id: t._id || t.id,
          batch: t.batchNumber,
          name: t.inventoryId?.name || 'Unknown',
          supplierId: t.inventoryId?.supplier || '-',
          description: t.inventoryName || t.itemName || t.description || 'Unknown',
          form: t.inventoryId?.form || '—',
          quantity: t.quantity ?? t.qty ?? 0,
          price: t.unitPrice ?? t.price ?? '₦70,890',
          datetime: t.createdAt || t.date || '-',
          purchaseOrder: t.purchaseOrder || t.orderId || '-',
          status: t.type === 'in' ? 'In' : 'Out',
          type: t.type || (t.category === 'Restock' ? 'in' : 'out')
        }))

        // Normalize dispenses as out transactions
        const dispRows = (Array.isArray(disp) ? disp : []).flatMap(d => {
          // Safely access dispensedId.items
          const items = d?.dispensedId?.items || [];

          return items.map(item => ({
            id: d._id,
            batch: item?.batchNumber || 'N/A',
            name: item?.drugName || 'N/A',
            description: d?.description,
            quantity: item?.quantity ?? 0,
            datetime: d.createdAt || '-',
            referenceId: d?.referenceId || 'N/A',
            type: d?.type || 'out',
          }));
        });


        console.log('Normalized inventory transactions:', dispRows)
        setInventoryTx(invRows)
        setDispenses(dispRows)
      } catch (err) {
        console.error('Transactions: failed to fetch', err)
        const e = err?.e || err
        const status = e?.response?.status
        const body = e?.response?.data
        if (status === 403 || body?.code === 403) {
          toast.error(body?.message || 'Access denied. Insufficient permission.')
          setError(body?.message || 'Access denied')
        } else {
          toast.error('Failed to load transactions')
          setError('Failed to load transactions')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetch()
    return () => { mounted = false }
  }, [])

  const allRows = useMemo(() => {
    const rows = [...inventoryTx, ...dispenses]
    return rows
  }, [inventoryTx, dispenses])

  const filtered = useMemo(() => {
    let list = allRows
    if (activeTab === 'in') list = list.filter(r => r.type === 'in')
    if (activeTab === 'out') list = list.filter(r => r.type === 'out')
    if (category && category !== 'All Categories') list = list.filter(r => (r.form || '').toLowerCase() === category.toLowerCase())
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(r => (String(r.drugName || r.name || r.batch || r.referenceId || r.referenceId)).toLowerCase().includes(q))
    }
    return list
  }, [allRows, activeTab, query, category])

  const totals = useMemo(() => ({
    total: allRows.length,
    inCount: allRows.filter(r => r.type === 'in').length,
    outCount: allRows.filter(r => r.type === 'out').length,
    net: Math.abs(allRows.filter(r => r.type === 'in').length - allRows.filter(r => r.type === 'out').length)
  }), [allRows])

  return (
    <PharmacistLayout>
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">Stock Transaction</h1>
            <p className="text-xs text-base-content/70">Track and manage stock movements (in/out)</p>
          </div>

          <div className="flex items-center space-x-3">
            <button className="btn btn-outline btn-sm flex items-center space-x-2"><FiDownload /><span className="text-xs">Export</span></button>
            {/* <button className="btn btn-success btn-sm flex items-center space-x-2"><BiPlus /><span className="text-xs">Record Transaction</span></button> */}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Stock" value={totals.total} hint="All Stock" />
          <StatCard title="Stock in" value={totals.inCount} hint="units received" />
          <StatCard title="Stock Out" value={totals.outCount} hint="units dispatched" />
          <StatCard title="Net Movement" value={totals.net} hint="units difference" />
        </div>

        <div className="rounded-xl bg-base-100 border border-base-300 p-4">
          <div className="flex items-center gap-3 mb-4">
            <button className={`px-3 py-1 rounded ${activeTab==='in' ? 'bg-primary text-primary-content' : 'bg-base-200'}`} onClick={()=>setActiveTab('in')}>Stock in</button>
            <button className={`px-3 py-1 rounded ${activeTab==='out' ? 'bg-primary text-primary-content' : 'bg-base-200'}`} onClick={()=>setActiveTab('out')}>Stock out</button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div />
            <div className="flex items-center space-x-2">
              <label className="relative">
                <FiSearch className="absolute left-3 top-2 text-base-content/50" />
                <input type="text" placeholder="Search Medications..." value={query} onChange={e=>setQuery(e.target.value)} className="input input-bordered input-sm pl-10 w-64" />
              </label>
              <select value={category} onChange={e=>setCategory(e.target.value)} className="select select-bordered select-sm">
                <option>All Categories</option>
                <option>Tablets</option>
                <option>Syrup</option>
                <option>Injections</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-compact w-full">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Name</th>
                  <th>{activeTab==='in' ? 'Supplier Name' : ''}</th>
                  <th>Description</th>
                  <th>{activeTab==='in' ? 'Form' : ''}</th>
                  <th>Quantity</th>
                  <th>{activeTab==='in' ? 'Price' : ''}</th>
                  <th>Date &amp; Time</th>
                  <th>{activeTab==='in' ? 'Purchase order' : 'Prescription ID'}</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={10} className="p-4 text-center">Loading...</td></tr>
                )}
                {!loading && !filtered.length && (
                  <tr><td colSpan={10} className="p-4 text-center text-base-content/60">No transactions found</td></tr>
                )}
                {filtered.map((row, idx) => (
                  <tr key={idx} className="hover">
                    <td className="font-medium">{row.batch}</td>
                    <td>{row.name}</td>
                    <td>{activeTab==='in' ? (row.supplierId || '-') : ('')}</td>
                    <td>{row.description}</td>
                    <td>{activeTab==='in' ? (row.form || '-') : ('')}</td>
                    <td>{row.quantity}</td>
                    <td>{activeTab==='in' ? (row.price || '-') : ('')}</td>
                    <td>{row.datetime ? new Date(row.datetime).toLocaleString() : '-'}</td>
                    <td>{activeTab==='in' ? (row.purchaseOrder || '-') : (row.referenceId || '-')}</td>
                    <td>{row.type === 'in' ? <Badge variant="in">In</Badge> : <Badge variant="out">Out</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div className="btn-group">
              <button className="btn btn-sm">«</button>
              <button className="btn btn-sm btn-active">1</button>
              <button className="btn btn-sm">2</button>
              <button className="btn btn-sm">3</button>
              <button className="btn btn-sm">»</button>
            </div>
          </div>
        </div>
      </div>
    </PharmacistLayout>
  )
}

export default Transactions
