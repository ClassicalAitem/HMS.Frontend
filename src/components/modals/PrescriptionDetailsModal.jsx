import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPrescriptionById } from '@/services/api/prescriptionsAPI'
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils'
import { FaUser, FaArrowRight } from 'react-icons/fa'

const PrescriptionDetailsModal = ({ isOpen, onClose, prescriptionId }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [prescription, setPrescription] = useState(null)

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !prescriptionId) return
      try {
        setLoading(true)
        const res = await getPrescriptionById(prescriptionId)
        const data = res?.data ?? res
        setPrescription(data)
      } catch (e) {
        console.error('Failed to load prescription', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isOpen, prescriptionId])

  if (!isOpen) return null

  const meds = Array.isArray(prescription?.medications) ? prescription.medications : []

  const targetPatientId = prescription?.patient?._id || prescription?.patient?.id || prescription?.patientId
  const isDependant = Boolean(prescription?.dependantId || prescription?.dependant)
  const targetDependantId = prescription?.dependant?._id || prescription?.dependant?.id || prescription?.dependantId

  const handleNavigateToPatient = () => {
    if (!targetPatientId && !targetDependantId) return
    onClose()
    navigate(`/dashboard/pharmacist/incoming/${targetPatientId || targetDependantId}`, {
      state: isDependant ? { dependantId: targetDependantId, dependantSnapshot: prescription?.dependant } : {}
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) { const btn = e.currentTarget.querySelector('button.btn-circle') || Array.from(e.currentTarget.querySelectorAll('button')).find(b => b.textContent.includes('\u2715') || b.textContent.toLowerCase().includes('cancel') || b.textContent.toLowerCase().includes('close')); if (btn) btn.click(); } }}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl shadow-2xl card bg-base-100 border border-base-300">
        <div className="p-6 card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-base-content">Prescription Details</h2>
            <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>✕</button>
          </div>

          {loading ? (
            <div className="h-32 w-full rounded-xl bg-base-200 animate-pulse" />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-base-200/50 p-4 rounded-xl border border-base-200">
                <div>
                  <div className="text-xs text-base-content/60">Patient</div>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="font-bold text-primary text-base">
                      {prescription?.patient ? `${prescription.patient.firstName || ''} ${prescription.patient.lastName || ''}`.trim() : (prescription?.dependant ? `${prescription.dependant.firstName || ''} ${prescription.dependant.lastName || ''}`.trim() : prescription?.patientName || '—')}
                    </span>
                    {(prescription?.patient?.hospitalId || prescription?.dependant?.hospitalId) && (
                      <span className="text-xs font-mono text-base-content/70 font-semibold bg-base-300/60 px-1.5 py-0.5 rounded">
                        {prescription?.patient?.hospitalId || prescription?.dependant?.hospitalId}
                      </span>
                    )}
                    {isDependant && (
                      <span className="badge badge-secondary badge-xs">Dependant</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-base-content/60">Prescribed By</div>
                  <div className="font-semibold text-base-content mt-0.5">
                    {prescription?.doctorName || (prescription?.doctor ? `Dr. ${prescription.doctor.firstName || ''} ${prescription.doctor.lastName || ''}`.trim() : 'Attending Doctor')}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-base-content/60">Status</div>
                  <div className="mt-0.5">
                    <span className={`badge badge-sm font-semibold capitalize ${
                      String(prescription?.status).toLowerCase().includes('dispensed') || String(prescription?.status).toLowerCase().includes('complete')
                        ? 'badge-success text-white'
                        : String(prescription?.status).toLowerCase().includes('pending')
                        ? 'badge-warning'
                        : 'badge-ghost'
                    }`}>
                      {prescription?.status || 'Pending'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-base-content/60">Prescribed Date & Time</div>
                  <div className="font-medium text-xs text-base-content/80 mt-0.5">
                    {prescription?.createdAt ? formatNigeriaDateTime(prescription.createdAt) : (prescription?.updatedAt ? formatNigeriaDateTime(prescription.updatedAt) : '—')}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-base-content mb-2 flex items-center justify-between">
                  <span>Prescribed Medications ({meds.length})</span>
                </h3>
                <div className="overflow-x-auto rounded-xl border border-base-200">
                  <table className="table table-zebra table-sm w-full text-xs">
                    <thead>
                      <tr className="bg-base-200/70 text-base-content">
                        <th>#</th>
                        <th>Drug Name</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meds.length === 0 ? (
                        <tr><td colSpan={6} className="text-center text-base-content/60 py-4">No medications listed</td></tr>
                      ) : meds.map((m, i) => (
                        <tr key={i}>
                          <td className="font-bold">{i + 1}</td>
                          <td className="font-semibold text-base-content">{m.drugName || m.drugCode || '—'}</td>
                          <td>{m.dosage || '—'}</td>
                          <td>{m.frequency || '—'}</td>
                          <td>{m.duration || '—'}</td>
                          <td className="text-base-content/70">{m.instructions || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-base-200 mt-2">
                <span className="text-xs font-mono text-base-content/50">
                  Prescription ID: {prescription?._id || prescription?.id || '—'}
                </span>

                <div className="flex items-center gap-2">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
                    Close
                  </button>

                  {(targetPatientId || targetDependantId) && (
                    <button
                      type="button"
                      onClick={handleNavigateToPatient}
                      className="btn btn-primary btn-sm gap-2 font-bold text-white shadow-xs"
                    >
                      <FaUser className="w-3.5 h-3.5" />
                      <span>View Patient Details</span>
                      <FaArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PrescriptionDetailsModal
