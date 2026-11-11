import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/common'
import HmoSidebar from '@/components/hmo/dashboard/Sidebar'
import { getAdmissions } from '@/services/api/admissionApi'
import { getAllWards } from '@/services/api/wardAPI'
import { getPatientById } from '@/services/api/patientsAPI'
import { formatNigeriaDateTimeShort } from '@/utils/formatDateTimeUtils'
import toast from 'react-hot-toast'
import { FaBed, FaSearch, FaNotesMedical } from 'react-icons/fa'

const HmoAdmissions = () => {
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [sidebarMounted, setSidebarMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const [admitted, setAdmitted] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => setSidebarMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [admissionsRes, wardsRes] = await Promise.allSettled([
        getAdmissions(),
        getAllWards(),
      ])

      const rawWards = wardsRes.status === 'fulfilled' ? (wardsRes.value?.data ?? wardsRes.value ?? []) : []
      const wardList = Array.isArray(rawWards) ? rawWards : (rawWards?.wards ?? [])
      const wardMap = new Map(wardList.map(w => [String(w._id || w.id), w.name]))

      const allAdmissions = admissionsRes.status === 'fulfilled'
        ? (() => {
            const raw = admissionsRes.value?.data ?? admissionsRes.value ?? []
            return Array.isArray(raw) ? raw : []
          })()
        : []

      if (admissionsRes.status === 'rejected') console.error('HmoAdmissions: getAdmissions failed', admissionsRes.reason)
      
      // We only want patients who are actively in the ward with an assigned bed
      const activeAdmissions = allAdmissions.filter(a => {
        const b = String(a.bedNumber || '').trim().replace(/^bed\s*/i, '')
        return a.status !== 'discharged' && !!a.confirmedAt && !!b && !b.toLowerCase().includes('unassigned')
      })

      // Resolve missing parent patients for dependants
      const missingPatientIds = Array.from(new Set(
        activeAdmissions
          .filter(a => a.dependantId && (!a.patient?.hospitalId && !a.dependant?.patient?.hospitalId))
          .map(a => a.patientId)
          .filter(Boolean)
      ))
      const patientMap = new Map()
      if (missingPatientIds.length > 0) {
        const fetched = await Promise.allSettled(missingPatientIds.map(id => getPatientById(id)))
        fetched.forEach(res => {
          if (res.status === 'fulfilled') {
            const p = res.value?.data?.data ?? res.value?.data
            if (p && (p.id || p._id)) patientMap.set(String(p.id || p._id), p)
          }
        })
      }

      const buildItem = (admission) => {
        const isDependant = !!admission.dependantId
        const source = isDependant ? admission.dependant : admission.patient
        const parentPatient = isDependant ? (admission.patient || admission.dependant?.patient || patientMap.get(String(admission.patientId))) : null
        const parentHospitalId = isDependant
          ? (parentPatient?.hospitalId || admission.patient?.hospitalId || admission.dependant?.patient?.hospitalId || patientMap.get(String(admission.patientId))?.hospitalId)
          : (source?.hospitalId || admission.patient?.hospitalId || patientMap.get(String(admission.patientId))?.hospitalId)
        const displayId = parentHospitalId || '—'

        const rawWardKey = String(admission.wardId || admission.ward || '')
        const resolvedWard = wardMap.get(rawWardKey) || admission.wardName || (rawWardKey && !rawWardKey.includes('-') ? rawWardKey : null) || 'General Ward'
        const cleanBed = String(admission.bedNumber || '').trim().replace(/^bed\s*/i, '')

        return {
          type: isDependant ? 'dependant' : 'patient',
          key: `admission-${admission._id || admission.id}`,
          patientId: admission.patientId,
          hospitalId: displayId,
          displayId,
          dependantId: admission.dependantId || null,
          name: `${source?.firstName || ''} ${source?.lastName || ''}`.trim() || 'Unknown',
          ward: resolvedWard,
          bedNumber: cleanBed,
          admittedAt: admission.confirmedAt || admission.admittedAt || admission.createdAt,
          relationshipType: isDependant ? source?.relationshipType : null,
          parentPatient,
          admission,
          raw: source,
          snapshot: source
        }
      }

      const admittedItems = activeAdmissions.map(buildItem)
      setAdmitted(admittedItems)
    } catch (err) {
      console.error('Failed to load admissions', err)
      setError('Failed to load admitted patients directory')
      toast.error('Failed to load admissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return admitted
    return admitted.filter(item =>
      item.name.toLowerCase().includes(q) ||
      String(item.ward).toLowerCase().includes(q) ||
      String(item.bedNumber).toLowerCase().includes(q) ||
      String(item.displayId || '').toLowerCase().includes(q)
    )
  }, [admitted, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage])

  useEffect(() => { setCurrentPage(1) }, [search])

  const openPatientDetails = (item) => {
    if (item.patientId && item.admission) {
      const targetAdmissionId = item.admission._id || item.admission.id;
      navigate(`/dashboard/hmo/admissions/${item.patientId}/${targetAdmissionId}`, {
        state: {
          patientSnapshot: item.type === 'dependant' ? null : item.snapshot,
          dependantId: item.dependantId,
          dependantSnapshot: item.type === 'dependant' ? item.snapshot : null,
          from: 'admissions',
        },
      });
    } else {
      toast.error('Missing patient ID or admission details');
    }
  }

  const SidebarDrawer = () => (
    <>
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs" onClick={() => setIsSidebarOpen(false)} />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform lg:static lg:translate-x-0 lg:z-auto ${
          sidebarMounted ? 'transition-transform duration-300 ease-in-out' : ''
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <HmoSidebar onCloseSidebar={() => setIsSidebarOpen(false)} />
      </div>
    </>
  )

  if (loading) {
    return (
      <div className="flex h-screen bg-base-200">
        <SidebarDrawer />
        <div className="flex overflow-hidden flex-col flex-1">
          <Header onToggleSidebar={() => setIsSidebarOpen(true)} />
          <div className="flex items-center justify-center flex-1 px-4">
            <div className="text-center space-y-3">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-sm font-medium text-base-content/70">Loading active admissions...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-base-200">
        <SidebarDrawer />
        <div className="flex overflow-hidden flex-col flex-1">
          <Header onToggleSidebar={() => setIsSidebarOpen(true)} />
          <div className="flex items-center justify-center flex-1 px-4">
            <div className="text-center bg-base-100 p-8 rounded-2xl shadow-sm border border-base-300 max-w-md">
              <p className="text-sm font-semibold text-error mb-4">{error}</p>
              <button onClick={loadData} className="btn btn-primary btn-sm rounded-xl">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-base-200">
      <SidebarDrawer />
      <div className="flex overflow-hidden flex-col flex-1">
        <Header onToggleSidebar={() => setIsSidebarOpen(true)} />
        <div className="overflow-y-auto flex-1">
          <section className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                    <FaBed className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-base-content">Admitted Patients (HMO)</h1>
                    <p className="text-xs sm:text-sm text-base-content/60">
                      Review HMO items and charges for patients currently in the ward
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-base-100 p-2.5 sm:p-3 rounded-2xl border border-base-200 shadow-sm">
              <div className="inline-flex items-center p-2 rounded-xl text-sm font-semibold text-base-content">
                Total Admitted: {admitted.length}
              </div>

              <div className="relative w-full sm:w-80">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 text-sm" />
                <input
                  type="text"
                  placeholder="Search by patient ID, name, ward..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input input-sm sm:input-md input-bordered w-full pl-9 rounded-xl text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Mobile Card List (< lg) */}
            <div className="flex flex-col gap-3 lg:hidden">
              {paginated.map((item) => (
                <AdmittedCard key={item.key} item={item} onOpen={() => openPatientDetails(item)} />
              ))}
            </div>

            {/* Desktop DataTable (>= lg) */}
            <div className="hidden lg:block bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-base-200/60 text-xs uppercase tracking-wider text-base-content/70">
                    <tr>
                      <th className="py-3.5 px-4">Patient Profile</th>
                      <th className="py-3.5 px-4">Ward & Bed Number</th>
                      <th className="py-3.5 px-4">Admitted Timestamp</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-200 text-sm">
                    {paginated.map((item) => (
                      <tr key={item.key} className="hover:bg-base-200/40 transition-colors">
                        <td className="py-3.5 px-4 font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {item.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-base-content">{item.name}</div>
                              <div className="text-xs font-mono text-base-content/50 mt-0.5">
                                ID: {item.hospitalId}
                              </div>
                              {item.parentPatient && (
                                <div className="text-xs text-base-content/50">
                                  Beneficiary of {item.parentPatient.firstName} {item.parentPatient.lastName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-base-content">{item.ward}</span>
                            {item.bedNumber ? (
                              <span className="badge badge-outline badge-sm text-xs">
                                Bed {item.bedNumber}
                              </span>
                            ) : (
                              <span className="text-xs text-base-content/40 italic">Unassigned Bed</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-base-content/80">
                          {formatNigeriaDateTimeShort(item.admittedAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => openPatientDetails(item)}
                            className="btn btn-sm btn-primary rounded-xl gap-2 font-medium"
                          >
                            <FaNotesMedical className="w-3.5 h-3.5" />
                            Review HMO Items
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="join bg-base-100 shadow-sm border border-base-200">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="join-item btn btn-sm"
                  >
                    Prev
                  </button>
                  {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                    page === '...' ? (
                      <button key={`ellipsis-${idx}`} className="join-item btn btn-sm btn-disabled">…</button>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`join-item btn btn-sm ${page === currentPage ? 'btn-primary' : ''}`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="join-item btn btn-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {paginated.length === 0 && (
              <div className="bg-base-100 rounded-2xl border border-base-200 p-12 text-center shadow-sm">
                <FaBed className="w-12 h-12 mx-auto text-base-content/20 mb-3" />
                <h3 className="text-base font-bold text-base-content">No Admitted Patients Found</h3>
                <p className="text-xs text-base-content/60 mt-1 max-w-sm mx-auto">
                  {search
                    ? `No admitted records match "${search}". Try searching by another patient name or ward.`
                    : 'There are currently no active admitted patients.'}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

const getPageNumbers = (current, total) => {
  const delta = 1
  const pages = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      pages.push(i)
    }
  }
  const withEllipsis = []
  let prev = null
  for (const p of pages) {
    if (prev !== null && p - prev > 1) withEllipsis.push('...')
    withEllipsis.push(p)
    prev = p
  }
  return withEllipsis
}

const AdmittedCard = ({ item, onOpen }) => {
  return (
    <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-sm text-base-content truncate">{item.name}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="badge badge-primary badge-xs">{item.ward}</span>
            {item.bedNumber && <span className="badge badge-outline badge-xs">Bed {item.bedNumber}</span>}
          </div>
        </div>
      </div>

      <div className="text-xs text-base-content/70 space-y-1 bg-base-200/50 p-2.5 rounded-xl">
        <div className="flex justify-between">
          <span className="text-base-content/60">Admitted:</span>
          <span className="font-medium text-base-content">{formatNigeriaDateTimeShort(item.admittedAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-base-content/60">Patient ID:</span>
          <span className="font-medium font-mono text-base-content">{item.hospitalId}</span>
        </div>
      </div>

      <button
        onClick={onOpen}
        className="btn btn-primary btn-sm w-full rounded-xl gap-2 font-medium"
      >
        <FaNotesMedical className="w-3.5 h-3.5" />
        Review HMO Items
      </button>
    </div>
  )
}

export default HmoAdmissions
