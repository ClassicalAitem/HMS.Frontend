import React, { useEffect, useState, useRef } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { FaPills } from 'react-icons/fa6'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { RiRefreshLine } from "react-icons/ri"
import { Link } from 'react-router-dom'
import { getMetrics } from '@/services/api/metricsAPI'
import { getPrescriptions } from '@/services/api/prescriptionsAPI'
import PrescriptionDetailsModal from '@/components/modals/PrescriptionDetailsModal'

const PharmacistDashboard = () => {
  const today = new Date()
  const dateText = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false)
  const [prescriptionsError, setPrescriptionsError] = useState(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState(null)

  // Prescriptions (local sample for now) - converted to state so we can compute counts
  const [recentRows, setRecentRows] = useState([
    { id: 'P-001', description: 'Restock added to inventory', drug: 'Amoxicillin 250mg', qty: 2, date: '01/01/01', status: 'in' },
    { id: 'P-002', description: 'Restock added to inventory', drug: 'Amoxicillin 250mg', qty: 2, date: '01/01/01', status: 'in' },
    { id: 'P-003', description: 'Drug dispensed from inventory', drug: 'Amoxicillin 250mg', qty: 2, date: '01/01/01', status: 'out' },
    { id: 'P-004', description: 'Drug dispensed from inventory', drug: 'Amoxicillin 250mg', qty: 2, date: '01/01/01', status: 'out' },
    { id: 'P-005', description: 'Restock added to inventory', drug: 'Amoxicillin 250mg', qty: 2, date: '01/01/01', status: 'in' },
  ])

  // Compute prescription stats (total, completed, pending, other)
  const computePrescriptionStats = (rows) => {
    const stats = { total: 0, completed: 0, pending: 0, other: 0 }
    stats.total = rows.length
    rows.forEach(r => {
      const s = (r.status || '').toString().toLowerCase()
      if (s.includes('dispensed') || s === 'out' || s.includes('successful') || s === 'done' || s === 'completed') stats.completed += 1
      else if (s.includes('pending') || s === 'in') stats.pending += 1
      else stats.other += 1
    })
    return stats
  }

  const prescriptionStats = computePrescriptionStats(recentRows)
  const totalPrescriptions = prescriptionStats.total

  const isMountedRef = useRef(true)

  // helper: wrap a promise with a timeout so hanging requests fail fast
  // helper: run an API helper with AbortController-based timeout so requests are cancelled on timeout/unmount
  const runWithAbort = async (apiFn, ms = 8000) => {
    const controller = new AbortController()
    const id = setTimeout(() => {
      controller.abort()
    }, ms)
    try {
      // apiFn is expected to accept an axios config object (we pass { signal: controller.signal })
      const res = await apiFn({ signal: controller.signal })
      return res
    } finally {
      clearTimeout(id)
    }
  }

  const fetchMetrics = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await runWithAbort(getMetrics, 8000)
      // metricsAPI.getMetrics returns response.data; keep compatibility with previous handling
      console.log('we get: Metrics response: res:', res)
      const data = res?.data ?? res
      console.log('we get: Data response: data:', data)
      if (isMountedRef.current) setMetrics(data)
    } catch (err) {
      // If aborted, axios uses error.code === 'ERR_CANCELED' (or message contains 'canceled')
      const isCanceled = err?.code === 'ERR_CANCELED' || err?.message?.toLowerCase?.().includes('abort') || err?.message?.toLowerCase?.().includes('canceled')
      console.error('PharmacistDashboard: failed to fetch metrics', err)
      if (isMountedRef.current) setError(isCanceled ? new Error('Request cancelled or timed out') : err)
    } finally {
      // always clear loading flag (un-block UI even if a previous mount cleaned up)
      setLoading(false)
    }
  }

  const fetchPrescriptions = async () => {
    setPrescriptionsLoading(true)
    setPrescriptionsError(null)
    try {
      const res = await runWithAbort(getPrescriptions, 8000)
      const data = res?.data ?? res
      // data is expected to be an array of prescription objects
      const mapped = Array.isArray(data) ? data.map(p => ({
        _raw: p,
        id: p._id,
        description: p.medications && p.medications.length ? (p.medications[0].instructions || p.status) : p.status,
        drug: p.medications && p.medications.length ? (p.medications[0].drugName || p.medications[0].drugCode) : '—',
        qty: p.medications ? p.medications.length : 0,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        status: p.status || '—'
      })) : []

      // sort desc by updatedAt
      mapped.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
      if (isMountedRef.current) setRecentRows(mapped)
    } catch (err) {
      console.error('Failed to fetch prescriptions', err)
      const isCanceled = err?.code === 'ERR_CANCELED' || err?.message?.toLowerCase?.().includes('abort') || err?.message?.toLowerCase?.().includes('canceled')
      if (isMountedRef.current) setPrescriptionsError(isCanceled ? new Error('Request cancelled or timed out') : err)
    } finally {
      // ensure prescriptions loading flag is cleared so UI won't stay blocked
      setPrescriptionsLoading(false)
    }
  }

  useEffect(() => {
    // mark mounted for this effect run (fixes React StrictMode double-invoke)
    isMountedRef.current = true
    // fetch both metrics and prescriptions
    fetchMetrics()
    fetchPrescriptions()
    return () => { isMountedRef.current = false }
  }, [])

  // Compute chart values as percentages (sum to 100). If totals are all zero, show zeros.
  const inStock = metrics?.totalInStock ?? 0
  const lowStock = metrics?.totalLowStock ?? 0
  const outOfStock = metrics?.totalOutOfStock ?? 0
  const stockTotal = inStock + lowStock + outOfStock

  const pct = (v) => {
    if (stockTotal === 0) return 0
    return Math.round((v / stockTotal) * 100)
  }

  const stockPercent = stockTotal === 0 ? 0 : pct(inStock)

  const chartData = [
    { name: 'In Stock', value: pct(inStock), raw: inStock, color: '#22c55e' },
    { name: 'Low Stock', value: pct(lowStock), raw: lowStock, color: '#fb923c' },
    { name: 'Out Of stock', value: pct(outOfStock), raw: outOfStock, color: '#ef4444' },
  ]

  // Custom tooltip to display raw count + percentage
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null
    const item = payload[0]?.payload
    const percentText = `${item?.value ?? 0}%`
    const rawText = `(${item?.raw ?? 0})`
    return (
      <div className="bg-base-100 border border-base-300 p-2 text-sm rounded">
        <div className="font-medium">{item?.name}</div>
        <div className="text-xs text-base-content/70">{percentText} {rawText}</div>
      </div>
    )
  }

  // ...recentRows is stored in state above

  return (
    <PharmacistLayout>
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-primary">Pharmacist Dashboard</h1>
            <div className="flex gap-2">
              <Link to="/dashboard/pharmacist/DrugDispensation" className="btn btn-primary btn-sm">Dispensation</Link>
              <Link to="/dashboard/pharmacist/incoming" className="btn btn-outline btn-sm">Incoming</Link>
            </div>
          </div>
          <p className="text-sm text-base-content/70 mb-6">Overview of today’s pharmacy operations. {dateText}</p>

          <div className="grid grid-cols-1 md:flex gap-4 mb-6">
            <div className="p-6 rounded-xl bg-base-100 border border-base-300 w-3/5 flex gap-6 lg:gap-20">
              <div className='w-full'>
                <div className="text-base font-medium text-base-content mb-4 flex items-center justify-between">
                  <span>Stock Update <button onClick={fetchMetrics} className="btn btn-ghost btn-sm" disabled={loading}>
                    {loading ? 'Refreshing...' : <RiRefreshLine />}
                  </button></span>
                  
                </div>
                <div className="flex items-center gap-8 justify-center">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartData[0].color }} /> In Stock <span className="text-xs text-base-content/60">({loading ? '—' : inStock})</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartData[1].color }} /> Low Stock <span className="text-xs text-base-content/60">({loading ? '—' : lowStock})</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartData[2].color }} /> Out Of stock <span className="text-xs text-base-content/60">({loading ? '—' : outOfStock})</span></div>
                  </div>
                </div>
              </div>

                <div className="relative w-40 h-40 flex items-center justify-center">
                  {loading ? (
                    // simple skeleton-loader using Tailwind/daisy classes
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full bg-base-200 animate-pulse" />
                    </div>
                  ) : error ? (
                    <div className="w-full h-full flex items-center justify-center text-sm text-error">Failed to load</div>
                  ) : (
                    <>
                      {/* Fixed-size PieChart to avoid clipping in small containers */}
                      <PieChart width={160} height={160}>
                        <Pie
                          data={chartData}
                          dataKey="raw"
                          cx={80}
                          cy={80}
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={2}
                          startAngle={90}
                          endAngle={-270}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-2xl font-semibold text-primary">{stockPercent}%</div>
                      </div>
                    </>
                  )}
              </div>
            </div>
            <div className="p-6 rounded-xl bg-base-100 border border-base-300 w-full flex flex-col justify-center ">
                <div className="text-base font-medium text-base-content mb-4 flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <FaPills className="text-primary" />
                    <span>Total Prescriptions Processed</span>
                  </div>
                  <button onClick={() => { /* placeholder for refresh if needed */ fetchMetrics() }} className="btn btn-ghost btn-xs">Refresh</button>
                </div>
                <div className="mb-2">
                  {loading ? (
                    <div className="h-12 w-full flex items-center">
                      <div className="h-12 w-48 rounded bg-base-200 animate-pulse" />
                    </div>
                  ) : (
                    <div className="text-7xl font-bold text-primary">{totalPrescriptions}</div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-base-content/70">
                  <div className="flex flex-col items-start">
                    <div className="text-xs">Completed</div>
                    <div className="font-medium text-base-content mt-1">{loading ? '—' : prescriptionStats.completed}</div>
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="text-xs">Pending</div>
                    <div className="font-medium text-base-content mt-1">{loading ? '—' : prescriptionStats.pending}</div>
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="text-xs">Other</div>
                    <div className="font-medium text-base-content mt-1">{loading ? '—' : prescriptionStats.other}</div>
                  </div>
                </div>
              </div>
          </div>

          <div className="p-4 2xl:p-6 rounded-xl bg-base-100 border border-base-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-base-content">Recent Activity</h2>
              <Link to="/dashboard/pharmacist/Transactions" className="btn btn-ghost btn-xs">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="bg-base-200">
                    <th>Bath NO</th>
                    <th>Description</th>
                    <th>Drug</th>
                    <th>Quantity</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptionsLoading ? (
                    <tr>
                      <td colSpan={6} className="p-6">
                        <div className="h-12 w-full rounded bg-base-200 animate-pulse" />
                      </td>
                    </tr>
                  ) : recentRows.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-base-content/70 py-6">No recent activity</td></tr>
                  ) : (
                    recentRows.map((r, idx) => (
                      <tr key={r.id || idx} className="cursor-pointer" onClick={() => { setSelectedPrescriptionId(r.id); setIsModalOpen(true); }}>
                        <td className='border-b py-2'>{r.id}</td>
                        <td className='border-b py-2'>{r.description}</td>
                        <td className='border-b py-2'>{r.drug}</td>
                        <td className='border-b py-2'>{r.qty}</td>
                        <td className='border-b py-2'>{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : (r.createdAt ? new Date(r.createdAt).toLocaleString() : '—')}</td>
                        <td className='border-b py-2'>
                          <span className={`badge ${r.status && r.status.toLowerCase().includes('completed') ? 'badge-success' : r.status && r.status.toLowerCase().includes('pending') ? 'badge-warning' : 'badge-error'}`}>{r.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-base-content/60">
          <div>Showing Recent Activity ({totalPrescriptions} Total)</div>
              <div className="join">
                <button className="join-item btn btn-ghost btn-xs">‹</button>
                <button className="join-item btn btn-ghost btn-xs">1</button>
                <button className="join-item btn btn-ghost btn-xs">2</button>
                <button className="join-item btn btn-ghost btn-xs">3</button>
                <button className="join-item btn btn-ghost btn-xs">4</button>
                <button className="join-item btn btn-ghost btn-xs">5</button>
                <button className="join-item btn btn-ghost btn-xs">›</button>
              </div>
            </div>
          </div>
            {/* Prescription details modal */}
            <PrescriptionDetailsModal
              isOpen={isModalOpen}
              onClose={() => { setIsModalOpen(false); setSelectedPrescriptionId(null); }}
              prescriptionId={selectedPrescriptionId}
            />
        </div>
    </PharmacistLayout>
  )
}

export default PharmacistDashboard
