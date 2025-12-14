import React, { useEffect, useState, useMemo } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { MdInventory } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { getPatients } from '@/services/api/patientsAPI'

const Incoming = () => {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const patientsPerPage = 9
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    const fetchIncoming = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await getPatients()
        const list = Array.isArray(res?.data) ? res.data : []
        const statuses = new Set(['awaiting_pharmacy', 'pharmacy_completed'])
        const filtered = list.filter((p) => statuses.has(String(p?.status || '').toLowerCase()))
        const mapped = filtered.map((p) => ({
          id: p?.id || p?._id || p?.patientId,
          snapshot: p,
          name: `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || 'Unknown',
          patientId: p?.id || p?._id || p?.hospitalId || '—',
          profilePicture: p?.profilePicture || p?.photo || null,
          status: p?.status || '—',
          updatedAt: p?.updatedAt || p?.createdAt,
        }))
        if (mounted) setPatients(mapped)
      } catch (err) {
        console.error('Incoming (pharmacist) failed to fetch patients', err)
        if (mounted) setError(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchIncoming()
    return () => { mounted = false }
  }, [])

  const processed = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return patients.filter(p => !q || p.name.toLowerCase().includes(q) || String(p.patientId).toLowerCase().includes(q))
  }, [patients, searchQuery])

  const totalPages = Math.max(1, Math.ceil(processed.length / patientsPerPage))
  const startIndex = (currentPage - 1) * patientsPerPage
  const current = processed.slice(startIndex, startIndex + patientsPerPage)

  const handleViewDetails = (p) => {
    const id = p?.patientId || p?.id
    if (!id) return
    navigate(`/dashboard/pharmacist/incoming/${id}`)
  }

  return (
    <PharmacistLayout>
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <MdInventory className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-semibold text-primary">Incoming</h1>
          </div>
          <p className="text-xs text-base-content/70">Patients awaiting or completed in pharmacy.</p>
        </div>

        <div className="flex gap-3 items-center mb-4">
          <input type="text" placeholder="Search by name or ID" className="input input-bordered max-w-xs" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }} />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="p-4 rounded-xl border bg-base-100 animate-pulse h-36" />
            ))
          ) : error ? (
            <div className="text-sm text-error">Failed to load incoming patients.</div>
          ) : current.length === 0 ? (
            <div className="col-span-full flex items-center justify-center">
              <div className="text-center p-8 rounded-xl border border-dashed border-base-300 bg-base-100 w-full max-w-md">
                <MdInventory className="mx-auto w-12 h-12 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">No incoming patients</h3>
                <p className="text-sm text-base-content/60 mb-4">There are currently no patients awaiting pharmacy or recently completed. They'll appear here once sent by clinicians.</p>
                <div className="flex justify-center gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={() => window.location.reload()}>Refresh</button>
                </div>
              </div>
            </div>
          ) : current.map((p) => (
            <div key={p.id} className="p-4 rounded-xl border shadow-sm bg-base-100">
              <div className="mb-2 text-sm text-base-content/70">Status: <span className="font-medium">{p.status}</span></div>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center text-xl font-semibold text-primary">
                  {p.name.split(' ').filter(Boolean).slice(0,2).map(n=>n[0]?.toUpperCase()).join('.')}
                </div>
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-base-content/60">Patient ID: {p.patientId}</div>
                </div>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <button className="text-sm text-primary hover:underline" onClick={() => handleViewDetails(p)}>View Details</button>
                <div className="text-xs text-base-content/60">Updated: {p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '—'}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i+1)} className={`w-8 h-8 rounded ${i+1===currentPage ? 'bg-primary text-white' : 'bg-base-200'}`}>{i+1}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </PharmacistLayout>
  )
}

export default Incoming
