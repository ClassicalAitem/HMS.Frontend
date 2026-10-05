import React, { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { createPrescription, getPrescriptionsForConsultation } from '@/services/api/prescriptionsAPI'
import { getInventories } from '@/services/api/inventoryAPI'

const getPrescriptionList = (response) => {
  const records = response?.data?.data ?? response?.data ?? response
  return Array.isArray(records) ? records : records ? [records] : []
}

const medicationInventoryId = (medication) => {
  const id = medication?.inventoryId
  return typeof id === 'object' ? id?._id || id?.id : id
}

const matchesMedicationType = (drug, medicationType) => {
  const form = (drug.form || '').toLowerCase();
  if (!form) return false;

  if (medicationType === 'tablet') {
    return form.includes('tablet') || form.includes('caplet') || form.includes('capsule') || form.includes('suppository') || form.includes('implant') || form.includes('powder') || form.includes('granules') || form.includes('enema');
  }
  if (medicationType === 'syrup') {
    return form.includes('syrup') || form.includes('suspension') || (form.includes('solution') && !form.includes('topical') && !form.includes('nebulizer')) || form.includes('oral gel');
  }
  if (medicationType === 'cream') {
    return form.includes('cream') || form.includes('ointment') || form.includes('gel') || form.includes('lotion') || form.includes('shampoo') || form.includes('lacquer') || form.includes('preparation');
  }
  if (medicationType === 'gutt') {
    return form.includes('drop') || form.includes('spray') || form.includes('inhaler') || form.includes('inhalation') || form.includes('nebulizer') || form.includes('gutt') || form.includes('mouthwash') || form.includes('gas');
  }
  if (medicationType === 'injection') {
    return form.includes('injection');
  }
  if (medicationType === 'infusion') {
    return form.includes('infusion');
  }
  return false;
};

const isDuplicateMedication = (medication, prescriptions) => prescriptions.some((prescription) =>
  (prescription?.medications || []).some((existing) => {
    const currentInventoryId = medicationInventoryId(medication)
    const existingInventoryId = medicationInventoryId(existing)
    if (currentInventoryId && existingInventoryId) {
      return String(currentInventoryId) === String(existingInventoryId)
    }
    return existing.medicationType === medication.medicationType &&
      existing.drugName?.trim().toLowerCase() === medication.drugName?.trim().toLowerCase()
  })
)

const PrescriptionModal = ({ isOpen, onClose, consultationId, patientId, onCreated }) => {
  const [loading, setLoading] = useState(false)
  const [drugName, setDrugName] = useState('')
  const [inventoryId, setInventoryId] = useState('')
  const [inventories, setInventories] = useState([])
  const [existingPrescriptions, setExistingPrescriptions] = useState([])
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [drugSearchOpen, setDrugSearchOpen] = useState(false)
  const [medicationType, setMedicationType] = useState('tablet')
  const [dosageAmount, setDosageAmount] = useState('')
  const [dosageUnit, setDosageUnit] = useState('tablet')
  const [frequency, setFrequency] = useState('b.d')
  const [instructions, setInstructions] = useState('')
  const drugSearchRef = useRef(null)

  const selectInventoryItem = (item) => {
    setDrugName(item.name || '')
    setInventoryId(String(item._id || item.id))
    setDrugSearchOpen(false)
  }

  useEffect(() => {
    if (isOpen) {
      getInventories()
        .then((res) => {
          const records = res?.data?.data ?? res?.data ?? res
          setInventories(Array.isArray(records) ? records : [])
        })
        .catch((err) => console.error('PrescriptionModal: inventory load error', err))
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !consultationId) {
      setExistingPrescriptions([])
      setLoadingExisting(false)
      return
    }

    let active = true
    setLoadingExisting(true)
    getPrescriptionsForConsultation(consultationId)
      .then((res) => {
        if (active) setExistingPrescriptions(getPrescriptionList(res))
      })
      .catch((err) => console.error('PrescriptionModal: existing prescription load error', err))
      .finally(() => {
        if (active) setLoadingExisting(false)
      })

    return () => {
      active = false
    }
  }, [isOpen, consultationId])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (drugSearchRef.current && !drugSearchRef.current.contains(event.target)) {
        setDrugSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setDrugName('')
      setInventoryId('')
      setDrugSearchOpen(false)
      setMedicationType('tablet')
      setDosageAmount('')
      setDosageUnit('tablet')
      setFrequency('b.d')
      setInstructions('')
    }
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!drugName) return toast.error('Drug name is required')
    if (!dosageAmount || Number(dosageAmount) <= 0) return toast.error('Valid dosage amount is required')
    if (loadingExisting) return toast.error('Please wait while existing prescriptions load')

    setLoading(true)
    try {
      const latestPrescriptions = getPrescriptionList(
        await getPrescriptionsForConsultation(consultationId)
      )
      setExistingPrescriptions(latestPrescriptions)
      if (isDuplicateMedication({ inventoryId, medicationType, drugName }, latestPrescriptions)) {
        toast.error('This medication is already prescribed for this consultation')
        return
      }

      const payload = {
        patientId,
        consultationId,
        medications: [
          {
            medicationType,
            drugName,
            ...(inventoryId ? { inventoryId } : {}),
            dosage: `${dosageAmount} ${dosageUnit}`,
            dosageAmount: Number(dosageAmount),
            dosageUnit,
            frequency,
            instructions: instructions || undefined,
            availability: inventoryId ? 'available' : 'unavailable',
          },
        ],
        status: 'pending',
      }
      await createPrescription(payload, consultationId, 'consultation')
      toast.success('Prescription created')
      onCreated && onCreated()
      onClose()
    } catch (err) {
      console.error('PrescriptionModal: error', err)
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create prescription')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) { const btn = e.currentTarget.querySelector('button.btn-circle') || Array.from(e.currentTarget.querySelectorAll('button')).find(b => b.textContent.includes('\u2715') || b.textContent.toLowerCase().includes('cancel') || b.textContent.toLowerCase().includes('close')); if (btn) btn.click(); } }}>
      <div className="w-full max-w-lg bg-base-100 rounded-xl p-5 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-primary">Create Prescription</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative" ref={drugSearchRef}>
            <label className="text-xs text-base-content/70 block mb-1">Drug Name *</label>
            <div className="relative">
              <input
                value={drugName}
                onFocus={() => setDrugSearchOpen(true)}
                onChange={(e) => {
                  setDrugName(e.target.value)
                  setInventoryId('')
                  setDrugSearchOpen(true)
                }}
                className={`input input-bordered w-full input-sm ${inventoryId ? 'pr-20' : ''}`}
                placeholder="Search inventory or enter a drug name"
                autoComplete="off"
                required
              />
              {inventoryId && (
                <button
                  type="button"
                  className="btn btn-ghost btn-xs absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => {
                    setDrugName('')
                    setInventoryId('')
                    setDrugSearchOpen(true)
                  }}
                  aria-label="Clear selected inventory item"
                  title="Clear selected item"
                >
                  Clear
                </button>
              )}
            </div>
            {drugSearchOpen && (
              <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-base-300 bg-base-100 py-1 shadow-lg">
                {(() => {
                  const filteredList = inventories
                    .filter((item) => matchesMedicationType(item, medicationType))
                    .filter((item) => {
                      const searchText = [item.name, item.strength, item.form].filter(Boolean).join(' ').toLowerCase()
                      return !drugName.trim() || searchText.includes(drugName.trim().toLowerCase())
                    })
                    .slice(0, 30);

                  return (
                    <>
                      {filteredList.map((item) => {
                        const isDuplicate = existingPrescriptions.some(prescription => 
                          (prescription?.medications || []).some(existing => {
                            const existingId = medicationInventoryId(existing);
                            return existingId && String(existingId) === String(item._id || item.id);
                          })
                        );

                        return (
                          <li key={item._id || item.id}>
                            <button
                              type="button"
                              className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between ${isDuplicate ? 'opacity-50 cursor-not-allowed bg-base-200' : 'hover:bg-base-200'}`}
                              onMouseDown={(event) => {
                                event.preventDefault()
                                if (!isDuplicate) selectInventoryItem(item)
                              }}
                              onClick={() => {
                                if (!isDuplicate) selectInventoryItem(item)
                              }}
                            >
                              <div>
                                <span className="font-medium">{item.name}</span>
                                {(item.strength || item.form) && (
                                  <span className="ml-2 text-xs text-base-content/60">
                                    {[item.strength, item.form].filter(Boolean).join(' - ')}
                                  </span>
                                )}
                              </div>
                              {isDuplicate && <span className="text-[10px] uppercase font-bold text-error bg-error/10 px-1.5 py-0.5 rounded">Already Prescribed</span>}
                            </button>
                          </li>
                        )
                      })}

                      {filteredList.length === 0 && drugName.trim() && (() => {
                        const isCustomDuplicate = existingPrescriptions.some(prescription => 
                          (prescription?.medications || []).some(existing => {
                            return !existing.inventoryId && existing.drugName?.trim().toLowerCase() === drugName.trim().toLowerCase();
                          })
                        );

                        return (
                          <li className="border-t">
                            <button
                              type="button"
                              className={`w-full px-3 py-2 text-left text-sm ${isCustomDuplicate ? 'opacity-50 cursor-not-allowed bg-base-200' : 'hover:bg-warning/10'}`}
                              onMouseDown={(event) => {
                                event.preventDefault();
                                if (!isCustomDuplicate) {
                                  setInventoryId('');
                                  setDrugSearchOpen(false);
                                }
                              }}
                              onClick={() => {
                                if (!isCustomDuplicate) {
                                  setInventoryId('');
                                  setDrugSearchOpen(false);
                                }
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-warning">+ Prescribe "{drugName}" (not in stock)</span>
                                {isCustomDuplicate && <span className="text-[10px] uppercase font-bold text-error bg-error/10 px-1.5 py-0.5 rounded">Already Prescribed</span>}
                              </div>
                              <p className="text-xs text-base-content/60 mt-0.5">Patient will source this externally</p>
                            </button>
                          </li>
                        );
                      })()}
                      
                      {filteredList.length === 0 && !drugName.trim() && (
                        <li className="px-3 py-2 text-sm text-base-content/60">No matching inventory item</li>
                      )}
                    </>
                  );
                })()}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-base-content/70 block mb-1">Type</label>
              <select
                className="select select-bordered w-full select-sm"
                value={medicationType}
                onChange={(e) => {
                  setMedicationType(e.target.value)
                  if (e.target.value === 'syrup' || e.target.value === 'gutt') setDosageUnit('ml')
                  else if (e.target.value === 'injection') setDosageUnit('ml')
                  else setDosageUnit('tablet')
                }}
              >
                <option value="tablet">Tablet / Cap</option>
                <option value="syrup">Syrup</option>
                <option value="injection">Injection</option>
                <option value="cream">Cream</option>
                <option value="gutt">Gutt</option>
                <option value="infusion">Infusion</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-base-content/70 block mb-1">Dose Amount *</label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={dosageAmount}
                onChange={(e) => setDosageAmount(e.target.value)}
                className="input input-bordered w-full input-sm"
                placeholder="e.g. 500"
                required
              />
            </div>
            <div>
              <label className="text-xs text-base-content/70 block mb-1">Dose Unit *</label>
              <input
                value={dosageUnit}
                onChange={(e) => setDosageUnit(e.target.value)}
                className="input input-bordered w-full input-sm"
                placeholder="e.g. mg, tablet, ml"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-base-content/70 block mb-1">Frequency</label>
            <select
              className="select select-bordered w-full select-sm"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              <option value="STAT">STAT (Once)</option>
              <option value="dly">Daily</option>
              <option value="b.d">b.d (2x daily)</option>
              <option value="tds">tds (3x daily)</option>
              <option value="qds">qds (4x daily)</option>
              <option value="mane">Mane (Morning)</option>
              <option value="nocte">Nocte (Night)</option>
              <option value="prn">PRN (As needed)</option>
              <option value="alt die">Alt Die</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-base-content/70 block mb-1">Instructions (optional)</label>
            <input
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="input input-bordered w-full input-sm"
              placeholder="e.g. After meals"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading || loadingExisting}>{loading ? 'Saving...' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PrescriptionModal
