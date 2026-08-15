import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { MdInventory } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { getPatients, updatePatientStatus } from '@/services/api/patientsAPI'
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils'
import PatientCardTypeInfo from '@/components/common/PatientCardTypeInfo'
import KolakLoader from '@/components/common/KolakLoader'
import { useNotifications } from '@/contexts/NotificationContext'
import { getDependants, updateDependantStatus } from '@/services/api/dependantAPI'
import { PATIENT_STATUS } from '@/constants/patientStatus'
import ClearItemButton from '@/components/common/ClearIncomingButton'
const Incoming = () => {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const patientsPerPage = 9
  const navigate = useNavigate()

  const { refreshQueueCount } = useNotifications()

  const fetchIncoming = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [patientsRes, dependantsRes] = await Promise.allSettled([
        getPatients(),
        getDependants(),
      ])

      const patientList = patientsRes.status === 'fulfilled'
        ? (Array.isArray(patientsRes.value?.data) ? patientsRes.value.data : [])
        : []

      const dependantList = dependantsRes.status === 'fulfilled'
        ? (() => {
            const raw = dependantsRes.value?.data?.data ?? dependantsRes.value?.data ?? []
            return Array.isArray(raw) ? raw : (raw?.dependants ?? [])
          })()
        : []

      const PHARMACY_STATUSES = new Set(['awaiting_pharmacy'])

      const mappedPatients = patientList
        .filter(p => PHARMACY_STATUSES.has(String(p?.status).toLowerCase()))
        .map(p => ({
          type: 'patient',
          id: p?.id || p?._id,
          patientId: p?.id || p?._id,
          dependantId: null,
          name: `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || 'Unknown',
          displayId: p?.hospitalId || p?.id || '—',
          status: p?.status || '—',
          updatedAt: p?.updatedAt || p?.createdAt,
          cardType: p?.cardType || 'personal',
          familyName: p?.familyName || '',
          companyName: p?.companyName || '',
          snapshot: p,
        }))

        
        const mappedDependants = dependantList
        .filter(d => PHARMACY_STATUSES.has(String(d?.status).toLowerCase()))
        .map(d => ({
          type: 'dependant',
          id: d?.id,
          patientId: d?.patientId,
          dependantId: d?.id,
          name: `${d?.firstName || ''} ${d?.lastName || ''}`.trim() || 'Unknown',
          displayId: d?.patient?.hospitalId || d?.patientId || '—',
          badge: d?.relationshipType || 'Dependant',
          status: d?.status || '—',
          updatedAt: d?.updatedAt || d?.createdAt,
          cardType: null,
          familyName: '',
          companyName: '',
          snapshot: d,
        }))
        const combined = [...mappedPatients, ...mappedDependants].sort((a, b) => {
          const aTime = new Date(a.updatedAt || 0).getTime()
          const bTime = new Date(b.updatedAt || 0).getTime()
          return bTime - aTime // newest first
        })

      setPatients(combined)
    } catch (err) {
      console.error('Incoming (pharmacist) failed to fetch patients', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchIncoming()
  }, [fetchIncoming])

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
    navigate(`/dashboard/pharmacist/incoming/${id}`, {
      state: {
        dependantId: p.dependantId || null,
        dependantSnapshot: p.type === 'dependant' ? p.snapshot : null,
      }
    })
  }

  const handleClear = async (p) => {
    if (p.type === 'dependant') {
      await updateDependantStatus(p.dependantId, { status: PATIENT_STATUS.CANCELLED })
    } else {
      await updatePatientStatus(p.patientId, { status: PATIENT_STATUS.CANCELLED })
    }
    localStorage.setItem('refreshIncoming', Date.now().toString())
    refreshQueueCount()
  }

  return (
    <PharmacistLayout>
      {loading && <KolakLoader fullscreen />}

      <div className="p-0 sm:p-2 lg:p-6">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <MdInventory className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-semibold text-primary">Incoming</h1>
          </div>
          <p className="text-xs text-base-content/70">Patients awaiting or completed in pharmacy.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
          <input type="text" placeholder="Search by name or ID" className="input input-bordered w-full sm:max-w-xs" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }} />
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
                  <button className="btn btn-ghost btn-sm" onClick={fetchIncoming}>Refresh</button>
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
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium">{p.name}</div>
                    <span className={`badge badge-sm ${p.type === 'dependant' ? 'badge-secondary' : 'badge-primary'}`}>
                      {p.type === 'dependant' ? (p.badge || 'Dependant') : 'Patient'}
                    </span>
                  </div>
                  <div className="text-xs text-base-content/60">
                    {p.type === 'dependant' ? `Patient ID: ${p.displayId}` : `Patient ID: ${p.displayId}`}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center border-t pt-3">
                <button className="text-sm text-primary hover:underline" onClick={() => handleViewDetails(p)}>View Details</button>
                <div className="text-xs text-base-content/60">Updated: {p.updatedAt ? formatNigeriaDateTime(p.updatedAt) : '—'}</div>
              </div>
              <div className="flex justify-end mt-2" onClick={(e) => e.stopPropagation()}>
                <ClearItemButton item={p} onClear={handleClear} onCleared={fetchIncoming} />
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex flex-wrap items-center justify-center gap-2">
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