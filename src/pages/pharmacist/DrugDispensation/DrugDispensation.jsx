import React, { useEffect, useMemo, useState } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { FiSearch, FiDownload, FiRefreshCw } from 'react-icons/fi'
import dispensesAPI from '@/services/api/dispensesAPI'
import { usersAPI } from '@/services/api/usersAPI'
import { getPatientById } from '@/services/api/patientsAPI'
import { getDependantById } from '@/services/api/dependantAPI'
import toast from 'react-hot-toast'
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils'
import { useNavigate } from 'react-router-dom'
import KolakLoader from '@/components/common/KolakLoader'

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

const patientCache = new Map();

const resolvePatientName = async (patientId, dependantId) => {
  if (!patientId && !dependantId) return 'Unknown';

  const cacheKey = dependantId ? `dep:${dependantId}` : `pt:${patientId}`;
  if (patientCache.has(cacheKey)) return patientCache.get(cacheKey);

  // Case 1: we already know it's a dependant
  if (dependantId) {
    try {
      const res = await getDependantById(dependantId);
      const dep = res?.data?.data?.dependant || res?.data?.dependant || res?.data;
      const name = `${dep?.firstName || ''} ${dep?.lastName || ''}`.trim() || 'Dependant';
      patientCache.set(cacheKey, name);
      return name;
    } catch {
      patientCache.set(cacheKey, 'Unknown');
      return 'Unknown';
    }
  }

  // Case 2: only patientId is present — but it might actually BE a dependant id
  // (some records don't separate the two), so try patient first, then fall back
  try {
    const res = await getPatientById(patientId);
    const p = res?.data ?? res;
    const name = `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || 'Unknown Patient';
    patientCache.set(cacheKey, name);
    return name;
  } catch {
    // patientId lookup failed — try it as a dependant id before giving up
    try {
      const depRes = await getDependantById(patientId);
      const dep = depRes?.data?.data?.dependant || depRes?.data?.dependant || depRes?.data;
      const name = `${dep?.firstName || ''} ${dep?.lastName || ''}`.trim() || 'Dependant';
      patientCache.set(cacheKey, name);
      return name;
    } catch {
      patientCache.set(cacheKey, 'Unknown');
      return 'Unknown';
    }
  }
};
const ITEMS_PER_PAGE = 10;

const DrugDispensation = () => {
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All Categories')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    const fetchDispenses = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await dispensesAPI.getDispenses()

        if (res && res.success === false) {
          if (res.code === 403) {
            toast.error(res.message || 'Access denied. Insufficient permission.')
          } else {
            toast.error(res.message || 'Failed to fetch dispenses')
          }
          setError(res.message || 'API error')
          return
        }

        const data = res?.data ?? res
        const dispenseList = Array.isArray(data) ? data : []

        // Flatten items first, name resolution happens after
       const flatRows = dispenseList.flatMap(d => {
        if (dispenseList.indexOf(d) === 0) {
          console.log('🔍 Sample dispense object:', JSON.stringify(d, null, 2))
        }

        const patientId =
          d?.prescriptionId?.patientId ||
          d?.patientId ||
          d?.patient?.id ||
          d?.patient?._id ||
          d?.patientId?._id ||
          null

        const dependantId =
          d?.prescriptionId?.dependantId ||
          d?.dependantId ||
          d?.dependant?.id ||
          d?.dependant?._id ||
          null

        return (d.items || []).map(item => ({
          id: d._id,
          batch: item.batchNumber || item.batch || 'N/A',
          patientId,
          dependantId,
          name: null,
          pharmacist: `${d.pharmacist?.firstName || ''} ${d.pharmacist?.lastName || ''}`.trim() || '—',
          medication: item.drugName || d?.prescription?.medications?.[0]?.drugName || 'Unknown',
          form: item.form || d?.prescription?.medications?.[0]?.form || 'Unknown',
          quantity: item.quantity?.toString() ?? String(item.qty || '0'),
          price: item.price ? `₦${Number(item.price).toLocaleString()}` : '—',
          dispensedAt: d.dispensedAt || d.createdAt || null,
          status: (d.status || 'pending').toLowerCase(),
        }))
      })

        // Resolve unique patient/dependant names in parallel, then apply
        const uniqueSubjects = new Map();
        flatRows.forEach(r => {
          const key = r.dependantId ? `dep:${r.dependantId}` : `pt:${r.patientId}`;
          if (!uniqueSubjects.has(key)) {
            uniqueSubjects.set(key, { patientId: r.patientId, dependantId: r.dependantId });
          }
        });

        const nameEntries = await Promise.all(
          Array.from(uniqueSubjects.entries()).map(async ([key, { patientId, dependantId }]) => {
            const name = await resolvePatientName(patientId, dependantId);
            return [key, name];
          })
        );
        const nameMap = Object.fromEntries(nameEntries);

        const enrichedRows = flatRows.map(r => {
          const key = r.dependantId ? `dep:${r.dependantId}` : `pt:${r.patientId}`;
          return { ...r, name: nameMap[key] || 'Unknown' };
        });

        if (mounted) setRows(enrichedRows)
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
    const matchesQuery = !query || (() => {
      const q = query.toLowerCase()
      return (
        (r.name || '').toLowerCase().includes(q) ||
        (r.medication || '').toLowerCase().includes(q) ||
        (r.batch || '').toLowerCase().includes(q) ||
        (r.patientId || '').toLowerCase().includes(q)
      )
    })()

    const matchesCategory = category === 'All Categories' || (r.form || '').toLowerCase() === category.toLowerCase()

    return matchesQuery && matchesCategory
  }), [rows, query, category])

  useEffect(() => {
    setCurrentPage(1) // reset to page 1 whenever filters change
  }, [query, category])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginatedRows = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Real stats derived from actual data instead of hardcoded numbers
  const stats = useMemo(() => {
    const todayStr = new Date().toDateString()
    const todayCount = rows.filter(r => r.dispensedAt && new Date(r.dispensedAt).toDateString() === todayStr).length
    const dispensedCount = rows.filter(r => r.status === 'dispensed').length
    const pendingCount = rows.filter(r => r.status !== 'dispensed').length

    return {
      today: todayCount,
      dispensed: dispensedCount,
      pending: pendingCount,
      total: rows.length,
    }
  }, [rows])

  return (
    <PharmacistLayout>
      {loading && <KolakLoader fullscreen />}
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">Drug Dispensation</h1>
            <p className="text-xs text-base-content/70">Manage pharmacy dispensation records</p>
          </div>

          <div className="flex items-center space-x-3">
            <button className="btn btn-outline btn-sm flex items-center space-x-2"><FiDownload /><span className="text-xs">Export</span></button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Today's Dispensations" value={stats.today} hint="Dispensed today" />
          <StatCard title="Total Dispensed" value={stats.dispensed} hint="Completed records" color="green" />
          <StatCard title="Pending" value={stats.pending} hint="Awaiting dispensation" color="red" />
          <StatCard title="All Records" value={stats.total} hint="Total in system" />
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
                  placeholder="Search patient, medication, batch..."
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

          {filtered.length === 0 ? (
            <div className="py-16 text-center text-base-content/50">No dispensation records found.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table-compact w-full">
                  <thead>
                    <tr>
                      <th>Batch ID</th>
                      <th>Patient Name</th>
                      <th>Pharmacist</th>
                      <th>Item Name</th>
                      <th>Quantity Dispensed</th>
                      <th>Dispensed At</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row, idx) => (
                      <tr key={`${row.id}-${idx}`} className="hover">
                        <td className="font-medium">{row.batch}</td>
                        <td>
                          {row.patientId || row.dependantId ? (
                            <button
                              className="text-primary hover:underline text-left"
                              onClick={() => navigate(`/dashboard/pharmacist/incoming/${row.patientId}`, {
                                state: { dependantId: row.dependantId || null },
                              })}
                            >
                              {row.name}
                            </button>
                          ) : (
                            <span>{row.name}</span>
                          )}
                          {row.dependantId && <span className="badge badge-secondary badge-xs ml-2">Dependant</span>}
                        </td>
                        <td>{row.pharmacist}</td>
                        <td>{row.medication}</td>
                        <td>{row.quantity}</td>
                        <td>{row.dispensedAt ? formatNigeriaDateTime(row.dispensedAt) : '—'}</td>
                        <td>
                          {row.status === 'dispensed' ? <Badge variant="dispensed">Dispensed</Badge> : <Badge variant="partial">{row.status === 'pending' ? 'Pending' : 'Partial'}</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    className="btn btn-sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    «
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`btn btn-sm ${currentPage === page ? 'btn-active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="btn btn-sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    »
                  </button>
                </div>
              )}
            </>
          )}
          </>
          )}
        </div>
      </div>
    </PharmacistLayout>
  )
}

export default DrugDispensation