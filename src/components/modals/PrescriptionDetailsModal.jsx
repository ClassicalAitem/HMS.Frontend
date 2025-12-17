import React, { useEffect, useState } from 'react'
import { getPrescriptionById } from '@/services/api/prescriptionsAPI'

const PrescriptionDetailsModal = ({ isOpen, onClose, prescriptionId }) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl shadow-xl card bg-base-100">
        <div className="p-6 card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-base-content">Prescription Details</h2>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          </div>

          {loading ? (
            <div className="h-24 w-full rounded bg-base-200 animate-pulse" />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-base-content/70">Prescription ID</div>
                  <div className="font-medium">{prescription?._id || prescription?.id || '—'}</div>
                </div>
                <div>
                  <div className="text-base-content/70">Status</div>
                  <div className="font-medium">{prescription?.status || '—'}</div>
                </div>
                <div>
                  <div className="text-base-content/70">Created At</div>
                  <div className="font-medium">{prescription?.createdAt ? new Date(prescription.createdAt).toLocaleString() : '—'}</div>
                </div>
                <div>
                  <div className="text-base-content/70">Updated At</div>
                  <div className="font-medium">{prescription?.updatedAt ? new Date(prescription.updatedAt).toLocaleString() : '—'}</div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold mb-2">Medications</h3>
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Drug</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meds.length === 0 ? (
                        <tr><td colSpan={6} className="text-center text-base-content/70">No medications</td></tr>
                      ) : meds.map((m, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{m.drugName || m.drugCode || '—'}</td>
                          <td>{m.dosage || '—'}</td>
                          <td>{m.frequency || '—'}</td>
                          <td>{m.duration || '—'}</td>
                          <td>{m.instructions || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
