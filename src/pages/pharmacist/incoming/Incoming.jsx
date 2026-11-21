import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { MdInventory } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { getPatients, getPatientById, updatePatientStatus } from '@/services/api/patientsAPI'
import { getDependants, updateDependantStatus } from '@/services/api/dependantAPI'
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils'
import KolakLoader from '@/components/common/KolakLoader'
import { useNotifications } from '@/contexts/NotificationContext'
import { PATIENT_STATUS } from '@/constants/patientStatus'
import { PatientStatusBadge, EmptyState } from '@/components/common'
import ClearItemButton from '@/components/common/ClearIncomingButton'
import ClearAllButton from '@/components/common/ClearAllButton'
import { FaSearch, FaTimes, FaArrowRight, FaClock } from 'react-icons/fa'
import { RiRefreshLine } from 'react-icons/ri'

const Incoming = () => {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'awaiting' | 'completed'
  const [currentPage, setCurrentPage] = useState(1)
  const [patientsPerPage, setPatientsPerPage] = useState(10)
  const navigate = useNavigate()

  const { refreshQueueCount, lastUpdate } = useNotifications()

  const fetchIncoming = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [patientsRes, dependantsRes] = await Promise.allSettled([
        getPatients({ status: 'awaiting_pharmacy', limit: 100 }),
        getDependants({ status: 'awaiting_pharmacy', limit: 100 }),
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

      const PHARMACY_STATUSES = new Set(['awaiting_pharmacy', 'awaiting_pharmacist'])

      const mappedPatients = patientList
        .filter(p => PHARMACY_STATUSES.has(String(p?.status).toLowerCase()))
        .map(p => ({
          type: 'patient',
          id: p?.id || p?._id,
          patientId: p?.id || p?._id,
          dependantId: null,
          name: `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || p?.fullName || 'Unknown',
          displayId: p?.hospitalId || p?.id || '—',
          hospitalId: p?.hospitalId || null,
          status: p?.status || 'awaiting_pharmacy',
          updatedAt: p?.updatedAt || p?.createdAt,
          cardType: p?.cardType || 'personal',
          familyName: p?.familyName || '',
          companyName: p?.companyName || '',
          gender: p?.gender || null,
          dob: p?.dob || p?.dateOfBirth || null,
          snapshot: p,
          statusUser: p?.statusUser,
          statusSenderName: p?.statusSenderName,
        }))

      const patientMap = new Map(patientList.map(p => [p.id || p._id, p]))

      // Fetch any missing parent patients for dependants
      const missingParentIds = Array.from(new Set(
        dependantList
          .map(d => d?.patientId || d?.patient?.id)
          .filter(id => id && !patientMap.has(id) && !dependantList.find(dep => (dep?.patientId === id || dep?.patient?.id === id) && dep?.patient?.hospitalId))
      ))

      if (missingParentIds.length > 0) {
        const fetchedParents = await Promise.allSettled(
          missingParentIds.map(id => getPatientById(id))
        )
        fetchedParents.forEach(res => {
          if (res.status === 'fulfilled') {
            const p = res.value?.data?.data ?? res.value?.data
            if (p && (p.id || p._id)) {
              patientMap.set(p.id || p._id, p)
            }
          }
        })
      }

      const mappedDependants = dependantList
        .filter(d => PHARMACY_STATUSES.has(String(d?.status).toLowerCase()))
        .map(d => {
          const parentPatient = d?.patient || patientMap.get(d?.patientId)
          const parentHospitalId = parentPatient?.hospitalId || d?.patient?.hospitalId || patientMap.get(d?.patientId)?.hospitalId
          return {
            type: 'dependant',
            id: d?.id || d?._id,
            patientId: d?.patientId,
            dependantId: d?.id || d?._id,
            hospitalId: parentHospitalId || null,
            name: `${d?.firstName || ''} ${d?.lastName || ''}`.trim() || 'Unknown',
            displayId: parentHospitalId || '—',
            badge: d?.relationshipType || 'Dependant',
            status: d?.status || 'awaiting_pharmacy',
            updatedAt: d?.updatedAt || d?.createdAt,
            cardType: null,
            familyName: '',
            companyName: '',
            gender: d?.gender || null,
            dob: d?.dob || d?.dateOfBirth || null,
            snapshot: d,
            statusUser: d?.statusUser,
            statusSenderName: d?.statusSenderName,
          }
        })

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
  }, [fetchIncoming, lastUpdate])

  // Filtered patients (strictly awaiting pharmacy queue)
  const processed = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return patients.filter(p => {
      if (!q) return true
      const matchName = p.name.toLowerCase().includes(q)
      const matchId = String(p.displayId || '').toLowerCase().includes(q)
      const matchStatus = String(p.status || '').toLowerCase().includes(q)
      return matchName || matchId || matchStatus
    })
  }, [patients, searchQuery])

  const totalPages = Math.max(1, Math.ceil(processed.length / patientsPerPage))
  const startIndex = (currentPage - 1) * patientsPerPage
  const current = processed.slice(startIndex, startIndex + patientsPerPage)

  const awaitingCount = patients.length

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
      await updateDependantStatus(p.dependantId, { status: PATIENT_STATUS.COMPLETED })
    } else {
      await updatePatientStatus(p.patientId, { status: PATIENT_STATUS.COMPLETED })
    }
    localStorage.setItem('refreshIncoming', Date.now().toString())
    refreshQueueCount()
    fetchIncoming()
  }

  const calculateAge = (dob) => {
    if (!dob) return null
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <PharmacistLayout>
      {loading && <KolakLoader fullscreen />}

      <div className="flex flex-col gap-6 p-2 sm:p-4 lg:p-6 min-w-0">
        {/* HEADER SECTION */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <MdInventory className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-base-content tracking-tight">
                  Incoming Pharmacy Queue
                </h1>
                <p className="text-xs text-base-content/60 mt-0.5">
                  Patients awaiting medication dispensing, prescription fulfillment, or recently attended
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={fetchIncoming}
              className="btn btn-ghost btn-sm gap-1.5 border border-base-300"
            >
              <RiRefreshLine className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-xs font-semibold">Refresh</span>
            </button>
            <ClearAllButton
              items={patients}
              updateStatusFn={handleClear}
              onCleared={fetchIncoming}
            />
          </div>
        </div>

        {/* LIST CONTAINER */}
        <div className="rounded-2xl bg-base-100 border border-base-300 shadow-sm overflow-hidden">
          {/* FILTER & SEARCH TOOLBAR */}
          <div className="p-4 bg-base-100 border-b border-base-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search by patient name, ID, or status..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input input-sm input-bordered w-full pl-9 pr-8 text-xs rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Queue Badge (Only Awaiting Pharmacy) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-content shadow-xs flex items-center gap-1.5">
                Awaiting Pharmacy ({processed.length})
              </span>
            </div>
          </div>

          {/* LIST ITEM TABLE HEADER (SEQUENTIAL STANDARD) */}
          <div className="hidden border-b border-base-200 bg-base-200/50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-base-content/70 md:grid md:grid-cols-12 md:gap-3 items-center">
            <div className="col-span-1">S/N</div>
            <div className="col-span-3">Patient Profile</div>
            <div className="col-span-2">Hospital ID</div>
            <div className="col-span-1">Type</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Time and Date</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* LIST ROWS */}
          <div className="divide-y divide-base-200">
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-3 px-5 py-4 items-center"
                >
                  <div className="col-span-1">
                    <div className="skeleton h-4 w-6 rounded" />
                  </div>
                  <div className="col-span-3 space-y-1.5">
                    <div className="skeleton h-4 w-36 rounded" />
                    <div className="skeleton h-3 w-20 rounded" />
                  </div>
                  <div className="col-span-2">
                    <div className="skeleton h-4 w-24 rounded" />
                  </div>
                  <div className="col-span-1">
                    <div className="skeleton h-5 w-16 rounded-full" />
                  </div>
                  <div className="col-span-2">
                    <div className="skeleton h-5 w-28 rounded-full" />
                  </div>
                  <div className="col-span-1">
                    <div className="skeleton h-4 w-16 rounded" />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <div className="skeleton h-7 w-20 rounded-lg" />
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="py-12 text-center text-error text-sm font-semibold">
                Failed to load incoming patients. Please try refreshing.
              </div>
            ) : current.length === 0 ? (
              <div className="py-16">
                <EmptyState
                  title="No incoming patients"
                  description={
                    searchQuery
                      ? 'No matching patients found for your search query.'
                      : statusFilter !== 'all'
                      ? 'No patients found under this specific status filter.'
                      : 'There are currently no patients in the pharmacy queue.'
                  }
                  actionLabel={searchQuery ? 'Clear search' : 'Refresh Queue'}
                  onAction={searchQuery ? () => setSearchQuery('') : fetchIncoming}
                />
              </div>
            ) : (
              current.map((p, index) => {
                const serialNumber = (currentPage - 1) * patientsPerPage + index + 1
                const age = calculateAge(p.dob)

                return (
                  <div
                    key={p.id || index}
                    onClick={() => handleViewDetails(p)}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 px-4 py-3.5 md:px-5 md:py-4 items-center hover:bg-base-200/50 transition-colors cursor-pointer"
                  >
                    {/* S/N */}
                    <div className="hidden md:block col-span-1 font-bold text-xs text-base-content/70">
                      {serialNumber}
                    </div>

                    {/* Patient Profile */}
                    <div className="col-span-12 md:col-span-3 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-bold text-xs grid place-items-center shrink-0">
                          {p.name?.charAt(0)?.toUpperCase() || 'P'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-base-content text-sm truncate hover:text-primary transition-colors">
                            {p.name}
                          </p>
                          {(age !== null || p.gender) && (
                            <p className="text-[11px] text-base-content/50">
                              {[age !== null ? `Age: ${age}y` : null, p.gender ? `Gender: ${p.gender}` : null]
                                .filter(Boolean).join(' • ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hospital ID */}
                    <div className="col-span-6 md:col-span-2">
                      <span className="text-xs font-mono font-semibold text-base-content/80 bg-base-200 px-2 py-1 rounded-lg">
                        {p.displayId || '—'}
                      </span>
                    </div>

                    {/* Record Type */}
                    <div className="col-span-6 md:col-span-1">
                      {p.type === 'dependant' ? (
                        <span className="badge badge-sm badge-secondary capitalize font-medium">
                          {p.badge || 'Dependant'}
                        </span>
                      ) : (
                        <span className="badge badge-sm badge-ghost font-semibold">
                          Patient
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="col-span-6 md:col-span-2" onClick={(e) => e.stopPropagation()}>
                      <PatientStatusBadge
                        status={p.status}
                        statusSenderName={p.statusSenderName}
                        statusUser={p.statusUser}
                        updatedAt={p.updatedAt}
                        tooltipAlign="left"
                      />
                    </div>

                    {/* Time & Date (Compact & smaller) */}
                    <div className="col-span-6 md:col-span-1 flex flex-col text-[11px] leading-tight text-base-content/70">
                      <span className="font-semibold text-base-content whitespace-nowrap">
                        {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}
                      </span>
                      <span className="text-[10px] text-base-content/50 font-mono whitespace-nowrap">
                        {p.updatedAt ? new Date(p.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    {/* Actions (Full col-span-2 for View & Clear buttons) */}
                    <div
                      className="col-span-12 md:col-span-2 flex items-center justify-end gap-2 mt-2 md:mt-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleViewDetails(p)}
                        className="btn btn-xs btn-primary font-bold text-white shadow-xs gap-1"
                      >
                        <span>View</span>
                        <FaArrowRight className="w-2.5 h-2.5" />
                      </button>
                      <ClearItemButton
                        item={p}
                        onClear={handleClear}
                        onCleared={fetchIncoming}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* LIST FOOTER & PAGINATION */}
          <div className="p-4 border-t border-base-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-base-content/70">
            <div className="flex items-center gap-3">
              <span>
                Showing {processed.length === 0 ? 0 : (currentPage - 1) * patientsPerPage + 1} to{' '}
                {Math.min(currentPage * patientsPerPage, processed.length)} of {processed.length} entries
              </span>
              <div className="flex items-center gap-1">
                <span>Show:</span>
                <select
                  value={patientsPerPage}
                  onChange={(e) => {
                    setPatientsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="select select-bordered select-xs text-xs rounded-lg"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="join">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="join-item btn btn-xs btn-ghost border border-base-300"
                >
                  « Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum = i + 1
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 2 + i
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i)
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`join-item btn btn-xs ${
                        currentPage === pageNum ? 'btn-primary text-white font-bold' : 'btn-ghost border border-base-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="join-item btn btn-xs btn-ghost border border-base-300"
                >
                  Next »
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PharmacistLayout>
  )
}

export default Incoming
