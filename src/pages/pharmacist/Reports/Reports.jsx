import React, { useEffect, useMemo, useState } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import metricsAPI from '@/services/api/metricsAPI'
import dispensesAPI from '@/services/api/dispensesAPI'
import inventoryAPI from '@/services/api/inventoryAPI'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const MetricCard = ({ title, value, hint }) => (
  <div className="p-4 rounded-xl bg-base-100 border border-base-300">
    <div className="text-sm text-base-content/70">{title}</div>
    <div className="mt-2 text-2xl font-semibold text-base-content">{value}</div>
    <div className="mt-1 text-xs text-base-content/60">{hint}</div>
  </div>
)

const Badge = ({ children, variant }) => (
  <span className={`px-3 py-1 rounded text-xs font-medium ${variant==='success' ? 'bg-success/10 text-success' : variant==='warning' ? 'bg-warning/10 text-warning' : 'bg-base-200 text-base-content'}`}>{children}</span>
)

const Reports = () => {
  const [metrics, setMetrics] = useState({})
  const [transactions, setTransactions] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [mRes, dRes, invRes] = await Promise.all([
          metricsAPI.getMetrics().catch(e => { throw { source: 'metrics', e } }),
          dispensesAPI.getDispenses().catch(e => { throw { source: 'dispenses', e } }),
          inventoryAPI.getInventories().catch(e => { throw { source: 'inventory', e } })
        ])

        if (!mounted) return

        // metricsAPI returns response.data in earlier code
        setMetrics(mRes?.data ?? mRes)

        // dispenses: map to transaction rows
        const dispenses = dRes?.data ?? dRes
        const tx = (Array.isArray(dispenses) ? dispenses : []).map(d => ({
          id: d._id,
          date: d.dispensedAt || d.createdAt,
          medication: d?.prescription?.medications?.[0]?.drugName || d?.items?.[0]?.drugName || 'Unknown',
          quantity: (d.items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0),
          amount: d.totalAmount || d.amount || null,
          status: d.status || 'pending'
        }))
        setTransactions(tx)

        // inventories: find low stock items
        const inventories = invRes?.data ?? invRes
        const low = (Array.isArray(inventories) ? inventories : []).filter(i => {
          const stock = Number(i.stock ?? i.quantity ?? 0)
          const reorder = Number(i.reorderLevel ?? i.minStock ?? 0)
          return stock === 0 || (reorder > 0 && stock <= reorder)
        }).map(i => ({
          id: i._id,
          name: i.name || i.itemName || 'Unknown',
          minStock: i.reorderLevel ?? i.minStock ?? 0,
          remaining: Number(i.stock ?? i.quantity ?? 0),
          supplier: i.supplier || '—'
        }))
        setLowStock(low)

      } catch (err) {
        console.error('Reports: fetch error', err)
        // err may be thrown with source
        const source = err?.source || err
        const e = err?.e || err
        const status = e?.response?.status
        const body = e?.response?.data
        if (status === 403 || body?.code === 403 || (body && body.success === false && body.code === 403)) {
          toast.error(body?.message || 'Access denied. Insufficient permission.')
        } else {
          toast.error('Failed to load reports data')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchAll()
    return () => { mounted = false }
  }, [])

  const totalSales = useMemo(() => metrics?.totalSales ?? metrics?.totalRevenue ?? '—', [metrics])
  const prescriptionsFilled = useMemo(() => metrics?.totalPrescriptions ?? metrics?.prescriptionsFilled ?? transactions.length, [metrics, transactions])
  const inventoryValue = useMemo(() => metrics?.inventoryValue ?? '—', [metrics])
  const lowStockCount = useMemo(() => lowStock.length, [lowStock])

  return (
    <PharmacistLayout>
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">Reports</h1>
            <p className="text-xs text-base-content/70">View and analyze pharmacy performance metrics</p>
          </div>

          <div className="flex items-center space-x-3">
            <button className="btn btn-outline btn-sm">Date Range</button>
            <button className="btn btn-success btn-sm">Export Report</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <MetricCard title="Total Sales" value={totalSales ?? '—'} hint="" />
          <MetricCard title="Prescriptions filled" value={prescriptionsFilled ?? '—'} hint="" />
          <MetricCard title="Inventory Value" value={inventoryValue ?? '—'} hint="" />
          <MetricCard title="Low Stock Items" value={lowStockCount} hint="" />
        </div>

        <div className="rounded-xl bg-base-100 border border-base-300 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-primary">Recent Sales Transactions</h3>
            <div className="text-sm text-base-content/60">Latest medication sales and dispensing records</div>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full table-compact">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Login Time</th>
                  <th>Medication</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(transactions.length ? transactions : []).slice(0,6).map(tx => (
                  <tr key={tx.id}>
                    <td className="font-medium">{tx.id}</td>
                    <td>{tx.date ? new Date(tx.date).toLocaleDateString() : '-'}</td>
                    <td>{tx.medication}</td>
                    <td>{tx.quantity}</td>
                    <td>{tx.amount ? `₦${tx.amount}` : '₦70,890'}</td>
                    <td>{tx.status === 'dispensed' || tx.status === 'completed' ? <Badge variant="success">Completed</Badge> : <Badge variant="warning">Pending</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl bg-base-100 border border-base-300 p-4">
          <h3 className="text-base font-semibold text-primary mb-3">Low Stock Alerts</h3>
          <div className="space-y-3">
            {lowStock.length ? lowStock.map(item => (
              <div key={item.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-base-content/60">Minimum stock: {item.minStock ?? 0} units</div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-error">{item.remaining} units remaining</div>
                  <Link to="/dashboard/pharmacist/Inventory&stocks" className="btn btn-sm btn-success">Reorder</Link>
                </div>
              </div>
            )) : (
              <div className="text-sm text-base-content/60">No low stock alerts</div>
            )}
          </div>
        </div>
      </div>
    </PharmacistLayout>
  )
}

export default Reports
