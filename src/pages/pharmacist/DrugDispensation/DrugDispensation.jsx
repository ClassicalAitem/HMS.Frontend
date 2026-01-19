import React, { useEffect, useMemo, useState } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { FiSearch, FiDownload, FiRefreshCw } from 'react-icons/fi'
import { BiPlus } from 'react-icons/bi'
import dispensesAPI from '@/services/api/dispensesAPI'
import toast from 'react-hot-toast'

const initialRows = [
  { batch: 'DISP-001', name: 'Emily Davis', patientId: 'PT-2457', medication: 'Amoxicillin 500mg', form: 'Tablets', quantity: '30 tabs', price: '₦70,890', datetime: '2025-10-18 09:45 AM', prescriptionId: 'RX-1234', status: 'Dispensed' },
  { batch: 'Stock-001', name: 'Emily Davis', patientId: 'PT-2457', medication: 'Amoxicillin 500mg', form: 'Syrup', quantity: '30 ml', price: '₦70,890', datetime: '2025-10-18 09:45 AM', prescriptionId: 'RX-1234', status: 'Pending' },
  { batch: 'DISP-001', name: 'Emily Davis', patientId: 'PT-2457', medication: 'Amoxicillin 500mg', form: 'Tablets', quantity: '30 tabs', price: '₦70,890', datetime: '2025-10-18 09:45 AM', prescriptionId: 'RX-1234', status: 'Dispensed' },
  { batch: 'DISP-001', name: 'Emily Davis', patientId: 'PT-2457', medication: 'Amoxicillin 500mg', form: 'Syrup', quantity: '30 ml', price: '₦70,890', datetime: '2025-10-18 09:45 AM', prescriptionId: 'RX-1234', status: 'Dispensed' },
  { batch: 'Stock-001', name: 'Emily Davis', patientId: 'PT-2457', medication: 'Amoxicillin 500mg', form: 'Tablets', quantity: '30 tabs', price: '₦70,890', datetime: '2025-10-18 09:45 AM', prescriptionId: 'RX-1234', status: 'Pending' }
]

const StatCard = ({ title, value, hint, color }) => (
  <div className="rounded-lg border border-base-300 bg-base-100 p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-base-content/80">{title}</p>
        <p className="text-2xl font-semibold mt-2">{value}</p>
        {hint && <p className={`text-xs mt-1 ${color==='green' ? 'text-success' : color==='red' ? 'text-error' : 'text-base-content/70'}`}>{hint}</p>}
      </div>
    </div>
  </div>
)

const Badge = ({ children, variant }) => {
  const base = 'px-3 py-1 rounded-full text-xs font-medium';
  const cls = variant === 'dispensed' ? 'bg-success/10 text-success' : variant === 'partial' ? 'bg-warning/10 text-warning' : 'bg-base-200 text-base-content';
  return <span className={`${base} ${cls}`}>{children}</span>
}

const DrugDispensation = () => {
  const [rows, setRows] = useState(initialRows)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All Categories')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    const fetchDispenses = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await dispensesAPI.getDispenses()
        // res may be { success, code, message, data }
        if (res && res.success === false) {
          // API-level failure
          if (res.code === 403) {
            toast.error(res.message || 'Access denied. Insufficient permission.')
          } else {
            toast.error(res.message || 'Failed to fetch dispenses')
          }
          setError(res.message || 'API error')
        } else {
          const data = res?.data ?? res
          if (mounted) {
            // Map API dispense items to our table row shape
            const mapped = (Array.isArray(data) ? data : []).flatMap(d => {
              // Each dispense may have items array; create one row per item
              return (d.items || []).map(item => ({
                id: d._id,
                batch: item.batchNumber || item.batch || 'N/A',
                name: '', // user info can be fetched via patientId if needed
                pharmacist: `${d.pharmacist.firstName} ${d.pharmacist.lastName || ''}`.trim(),
                patientId: d?.prescription?.patientId || '-',
                medication: item.drugName || (d?.prescription?.medications?.[0]?.drugName) || 'Unknown',
                quantity: item.quantity?.toString() ?? String(item.qty || '0'),
                price: item.price ? `₦${item.price}` : '—',
                dispensedAt: d.dispensedAt ? new Date(d.dispensedAt).toLocaleString() : (d.createdAt ? new Date(d.createdAt).toLocaleString() : '-'),
                status: d.status
              }))
            })
            setRows(mapped.length ? mapped : [])
          }
        }
      } catch (err) {
        console.error('DrugDispensation: fetchDispenses error', err)
        const status = err?.response?.status
        const body = err?.response?.data
        if (status === 403 || body?.code === 403) {
          toast.error(body?.message || 'Access denied. Insufficient permission.')
          setError(body?.message || 'Access denied')
        } else {
          toast.error('Failed to load dispenses')
          setError(err?.message || 'Network error')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchDispenses()

    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => rows.filter(r => {
    if (!query) return true
    const q = query.toLowerCase()
    return r.name.toLowerCase().includes(q) || r.medication.toLowerCase().includes(q) || r.batch.toLowerCase().includes(q) || r.prescriptionId.toLowerCase().includes(q)
  }), [rows, query])

  const totals = useMemo(() => ({
    today: 20,
    stockIn: 4,
    stockOut: 30,
    net: 8
  }), [])

  return (
    <PharmacistLayout>
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">Drug Dispensation</h1>
            <p className="text-xs text-base-content/70">Manage pharmacy inventory and stock levels</p>
          </div>

          <div className="flex items-center space-x-3">
            <button className="btn btn-outline btn-sm flex items-center space-x-2"><FiDownload /><span className="text-xs">Export</span></button>
            <button className="btn btn-success btn-sm flex items-center space-x-2"><BiPlus /><span className="text-xs">Record dispensation</span></button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Today's Dispensations" value={totals.today} hint="Total dispensation" />
          <StatCard title="Stock in" value={totals.stockIn} hint="2000 units dispensed" color="green" />
          <StatCard title="Stock Out" value={totals.stockOut} hint="500 units dispensed" color="red" />
          <StatCard title="Net Movement" value={totals.net} hint="units difference" />
        </div>

        <div className="rounded-xl bg-base-100 border border-base-300 p-4">
          {loading && (
            <div className="p-6 flex items-center justify-center">
              <FiRefreshCw className="animate-spin mr-2" />
              <span className="text-sm">Loading dispenses...</span>
            </div>
          )}
          {error && !loading && (
            <div className="p-4 bg-error/10 text-error rounded">{error}</div>
          )}
          {!loading && !error && (
          <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <button className="btn btn-sm btn-success">All Activity</button>
            </div>

            <div className="flex items-center space-x-2">
              <label className="relative">
                <FiSearch className="absolute left-3 top-2 text-base-content/50" />
                <input
                  type="text"
                  placeholder="Search Medications..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="input input-bordered input-sm pl-10 w-64"
                />
              </label>

              <select value={category} onChange={e => setCategory(e.target.value)} className="select select-bordered select-sm">
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
                  <th>Patient Name</th>
                  <th>Pharmacist</th>
                  <th>Medication Name</th>
                  <th>Quantity Dispensed</th>
                  <th>Price</th>
                  <th>Dispensed At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => (
                  <tr key={idx} className="hover">
                    <td className="font-medium">{row.batch}</td>
                    <td>{row.name}</td>
                    <td>{row.pharmacist}</td>
                    <td>{row.medication}</td>
                    <td>{row.quantity}</td>
                    <td>{row.price}</td>
                    <td>{row.dispensedAt}</td>
                    <td>
                      {row.status === 'dispensed' ? <Badge variant="dispensed">Dispensed</Badge> : <Badge variant="partial">Partial</Badge>}
                    </td>
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
          </>
          )}
        </div>
      </div>
    </PharmacistLayout>
  )
}

export default DrugDispensation
