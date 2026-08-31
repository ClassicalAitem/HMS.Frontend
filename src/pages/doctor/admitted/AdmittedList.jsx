import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/common'
import DoctorSidebar from '@/components/doctor/dashboard/Sidebar'
import { getPatients } from '@/services/api/patientsAPI'
import { getDependants } from '@/services/api/dependantAPI'
import { getAdmissions } from '@/services/api/admissionApi'
import toast from 'react-hot-toast'

const DRAdmittedList = () => {
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [sidebarMounted, setSidebarMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('pending')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const [pending, setPending] = useState([])
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

      const [patientsRes, dependantsRes, admissionsRes] = await Promise.allSettled([
        getPatients(),
        getDependants(),
        getAdmissions(),
      ])

      const patients = patientsRes.status === 'fulfilled'
        ? (Array.isArray(patientsRes.value?.data) ? patientsRes.value.data : [])
        : []

      const dependants = dependantsRes.status === 'fulfilled'
        ? (() => {
            const raw = dependantsRes.value?.data?.data ?? dependantsRes.value?.data ?? []
            return Array.isArray(raw) ? raw : (raw?.dependants ?? [])
          })()
        : []

      const allAdmissions = admissionsRes.status === 'fulfilled'
        ? (() => {
            const raw = admissionsRes.value?.data ?? admissionsRes.value ?? []
            return Array.isArray(raw) ? raw : []
          })()
        : []

      if (patientsRes.status === 'rejected') console.error('DRAdmittedList: getPatients failed', patientsRes.reason)
      if (dependantsRes.status === 'rejected') console.error('DRAdmittedList: getDependants failed', dependantsRes.reason)
      if (admissionsRes.status === 'rejected') console.error('DRAdmittedList: getAdmissions failed', admissionsRes.reason)

      const patientMap = new Map(patients.map(p => [p.id, p]))
      const dependantMap = new Map(dependants.map(d => [d.id, d]))
      const activeAdmissions = allAdmissions.filter(a => a.status !== 'discharged')

      const buildItem = (admission) => {
        const isDependant = !!admission.dependantId
        const source = isDependant
          ? dependantMap.get(admission.dependantId)
          : patientMap.get(admission.patientId)
        const parentPatient = isDependant ? patientMap.get(admission.patientId) : null

        return {
          type: isDependant ? 'dependant' : 'patient',
          key: `admission-${admission._id || admission.id}`,
          patientId: admission.patientId,
          dependantId: admission.dependantId || null,
          name: `${source?.firstName || ''} ${source?.lastName || ''}`.trim() || 'Unknown',
          ward: admission.ward || admission.wardId || '—',
          admittedAt: admission.confirmedAt,
          relationshipType: isDependant ? source?.relationshipType : null,
          parentPatient,
          admission,
          raw: source,
        }
      }

      const pendingItems = activeAdmissions.filter(a => !a.confirmedAt).map(buildItem)
      const admittedItems = activeAdmissions.filter(a => !!a.confirmedAt).map(buildItem)

      setPending(pendingItems)
      setAdmitted(admittedItems)
    } catch (err) {
      console.error('Failed to load admissions', err)
      setError('Failed to load admissions')
      toast.error('Failed to load admissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const list = activeTab === 'pending' ? pending : admitted

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(item => item.name.toLowerCase().includes(q))
  }, [list, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage])

  useEffect(() => { setCurrentPage(1) }, [activeTab, search])

  const openAdmission = (item) => {
    navigate(`/dashboard/doctor/admittedPatients/${item.patientId}`, {
      state: { admission: item.raw, dependantId: item.dependantId }
    })
  }

  const SidebarDrawer = () => (
    <>
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform lg:static lg:translate-x-0 lg:z-auto ${
          sidebarMounted ? 'transition-transform duration-300 ease-in-out' : ''
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <DoctorSidebar onCloseSidebar={() => setIsSidebarOpen(false)} />
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
            <p className="text-base lg:text-lg text-gray-600 text-center">Loading admissions...</p>
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
            <div className="text-center">
              <p className="text-base lg:text-lg text-red-600 mb-4">{error}</p>
              <button
                onClick={() => navigate('/dashboard/doctor')}
                className="px-6 py-2 bg-[#00943C] text-white font-semibold rounded-lg"
              >
                Back to Dashboard
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
          <section className="p-4 lg:p-7">
            <div className="mb-4 lg:mb-6">
              <h1 className="text-2xl lg:text-[32px] text-[#00943C] font-bold">Admissions</h1>
              <p className="text-xs lg:text-[12px] text-[#605D66]">
                Patients pending admission and currently admitted
              </p>
            </div>

            <div className="flex gap-2 mb-4 lg:mb-6">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'pending' ? 'bg-[#00943C] text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Pending Admission {pending.length > 0 && `(${pending.length})`}
              </button>
              <button
                onClick={() => setActiveTab('admitted')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'admitted' ? 'bg-[#00943C] text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Admitted {admitted.length > 0 && `(${admitted.length})`}
              </button>
            </div>

            <div className="mb-4 lg:mb-6">
              <input
                type="text"
                placeholder="Search by patient name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-bordered w-full text-sm lg:text-base"
              />
            </div>

            <div className="flex flex-col gap-3 lg:hidden">
              {paginated.map((item) => (
                activeTab === 'pending' ? (
                  <PendingCard key={item.key} item={item} />
                ) : (
                  <AdmittedCard key={item.key} item={item} onOpen={() => openAdmission(item)} />
                )
              ))}
            </div>

            <div className="hidden lg:block bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left">Patient Name</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Ward</th>
                      {activeTab === 'pending' ? (
                        <th className="px-4 py-3 text-left">Payment Status</th>
                      ) : (
                        <th className="px-4 py-3 text-left">Admitted At</th>
                      )}
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((item) => (
                      <tr key={item.key} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3">
                          {item.type === 'dependant' ? (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 capitalize">
                              {item.relationshipType || 'Dependant'}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">Patient</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">{item.ward}</td>
                        {activeTab === 'pending' ? (
                          <td className="px-4 py-3">
                            {item.admission?.isBilled ? (
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Paid</span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Awaiting Payment</span>
                            )}
                          </td>
                        ) : (
                          <td className="px-4 py-3 text-sm">
                            {item.admittedAt ? new Date(item.admittedAt).toLocaleString() : '—'}
                          </td>
                        )}
                        <td className="px-4 py-3">
                          {activeTab === 'pending' ? (
                            <span className="text-xs text-gray-400 italic">Awaiting nurse confirmation</span>
                          ) : (
                            <button
                              onClick={() => openAdmission(item)}
                              className="px-3 py-1 bg-[#00943C] text-white text-sm rounded hover:bg-[#007a31] transition-all"
                            >
                              Open
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex flex-wrap justify-center items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                    page === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-sm text-gray-400">…</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm rounded ${page === currentPage ? 'bg-[#00943C] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {paginated.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm lg:text-base text-gray-600">
                  {activeTab === 'pending' ? 'No patients pending admission.' : 'No admitted patients.'}
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

const PendingCard = ({ item }) => (
  <div className="bg-white rounded-lg shadow-md p-4">
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{item.name}</p>
        {item.type === 'dependant' && (
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 capitalize">
            {item.relationshipType || 'Dependant'}
          </span>
        )}
      </div>
      {item.admission?.isBilled ? (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800 shrink-0">Paid</span>
      ) : (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-800 shrink-0">Awaiting Payment</span>
      )}
    </div>
    <div className="text-xs text-gray-600 mb-3">
      <p><span className="font-semibold">Ward:</span> {item.ward}</p>
    </div>
    <p className="text-xs text-gray-400 italic text-center">Awaiting nurse confirmation</p>
  </div>
)

const AdmittedCard = ({ item, onOpen }) => (
  <div className="bg-white rounded-lg shadow-md p-4">
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{item.name}</p>
        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">{item.ward}</span>
      </div>
      <span className="inline-block h-[10px] w-[10px] rounded-full bg-[#71B908] shrink-0 mt-1"></span>
    </div>
    <div className="text-xs text-gray-600 mb-3">
      <p><span className="font-semibold">Admitted:</span> {item.admittedAt ? new Date(item.admittedAt).toLocaleString() : '—'}</p>
    </div>
    <button onClick={onOpen} className="w-full px-3 py-2 bg-[#00943C] text-white text-xs rounded hover:bg-[#007a31] transition-all">
      Open
    </button>
  </div>
)

export default DRAdmittedList