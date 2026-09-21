import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { dispenseMedicationSlot, getMedicationDispenseSlots } from '@/services/api/dispensesAPI'

const TIME_SLOTS = ['Morning', 'Midday', 'Afternoon', 'Evening', 'Night']

const getId = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value.$oid) return String(value.$oid)
  if (value._id) return getId(value._id)
  if (value.id) return getId(value.id)
  return ''
}

const getFrequencyCount = (frequency) => {
  const normalized = String(frequency || '').toLowerCase()
  if (normalized === 'stat') return 1
  if (normalized === 'dly' || normalized === 'mane' || normalized === 'nocte') return 1
  if (normalized === 'b.d' || normalized === 'bd') return 2
  if (normalized === 'tds') return 3
  if (normalized === 'qds') return 4
  const number = Number.parseInt(normalized.match(/\d+/)?.[0] || '', 10)
  return Number.isFinite(number) ? Math.min(number, TIME_SLOTS.length) : TIME_SLOTS.length
}

const getDurationDays = (duration) => {
  const value = String(duration || '')
  const amount = Number.parseFloat(value)
  if (!Number.isFinite(amount) || amount <= 0) return 3
  if (value.includes('/52')) return Math.max(1, Math.round(amount * 7))
  if (value.includes('/12')) return Math.max(1, Math.round(amount * 30))
  if (value.toLowerCase().includes('yr')) return Math.max(1, Math.round(amount * 365))
  return Math.max(1, Math.round(amount))
}

const getDose = (medication) => {
  const dose = medication.dosageAmount || medication.dosage || medication.dose
  const parsed = Number.parseFloat(String(dose || ''))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

const PharmacyWardRoundDispenseModal = ({ isOpen, onClose, admissionId, prescriptions = [], readOnly = false, onCompleted }) => {
  const [days, setDays] = useState(3)
  const [checked, setChecked] = useState({})
  const [administrationTimes, setAdministrationTimes] = useState({})
  const [savingKeys, setSavingKeys] = useState(() => new Set())
  const [notes, setNotes] = useState('')
  const [notes, setNotes] = useState('')

  const medications = useMemo(
    () => prescriptions.flatMap((prescription, prescriptionIndex) =>
      (prescription.medications || []).map((medication, medicationIndex) => {
        const prescriptionId = getId(prescription)
        const medicationId = getId(medication)
        const fallbackId = String(medicationIndex)

        return {
        prescriptionId,
        medicationId,
        medicationIndex,
        medication,
        key: `${prescriptionId || `prescription-${prescriptionIndex}`}-${medicationId || fallbackId}`,
        }
      })
    ),
    [prescriptions]
  )

  useEffect(() => {
    if (!isOpen) return
    const durationDays = medications.reduce(
      (longest, item) => Math.max(longest, getDurationDays(item.medication.duration)),
      1
    )
    setDays(durationDays)
    setChecked({})
    setNotes('')
    if (!admissionId) return

    getMedicationDispenseSlots(admissionId)
      .then((records) => {
        const nextChecked = {}
        const nextTimes = {}
        ;(Array.isArray(records) ? records : []).forEach((record) => {
          const noteMatch = String(record.notes || '').match(/Dispensed ([^,]+), day (\d+)/i)
          const medicationKey = `${record.prescriptionId}-${record.medicationId}`
          if (!noteMatch) return
          const key = `${medicationKey}-${noteMatch[2]}-${noteMatch[1]}`
          nextChecked[key] = true
          nextTimes[key] = record.dispensedAt
        })
        setChecked(nextChecked)
        setAdministrationTimes(nextTimes)
      })
      .catch((error) => console.error('PharmacyWardRoundDispenseModal: failed to load logs', error))
  }, [isOpen, medications, admissionId])

  const countCheckedForDay = (item, day, frequencyCount) =>
    TIME_SLOTS.slice(0, frequencyCount).filter((slot) => checked[`${item.key}-${day}-${slot}`]).length

  const handleBoxClick = async (item, day, slotIndex, slot) => {
    if (readOnly) return

    const frequencyCount = getFrequencyCount(item.medication.frequency)
    const key = `${item.key}-${day}-${slot}`

    if (slotIndex >= frequencyCount) return // not part of this medication's frequency
    if (checked[key] || savingKeys.has(key)) return // already logged, or in flight
    if (countCheckedForDay(item, day, frequencyCount) >= frequencyCount) return // day's dose quota met

    if (!item.prescriptionId || (!item.medicationId && item.medicationIndex === undefined)) {
      return toast.error('This medication cannot be identified')
    }
    if (!admissionId) return toast.error('No admission found for this patient')

    setSavingKeys((prev) => new Set(prev).add(key))
    try {
      await dispenseMedicationSlot(admissionId, {
        prescriptionId: item.prescriptionId,
        ...(item.medicationId ? { medicationId: item.medicationId } : { medicationIndex: item.medicationIndex }),
        doseDispensed: getDose(item.medication),
        notes: `Dispensed ${slot}, day ${day}${notes.trim() ? ` - ${notes.trim()}` : ''}`,
        dispensedAt: new Date().toISOString(),
      })
      setChecked((current) => ({ ...current, [key]: true }))
      setAdministrationTimes((current) => ({ ...current, [key]: new Date().toISOString() }))
      toast.success(`${item.medication.drugName} dispensed — ${slot}, day ${day}`)
      onCompleted && onCompleted()
    } catch (error) {
      console.error('PharmacyWardRoundDispenseModal: dispense error', error)
      toast.error(error?.response?.data?.error || error?.message || 'Failed to dispense dose')
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden bg-base-100 rounded-2xl shadow-2xl border border-base-200 flex flex-col">
        <div className="flex items-center justify-between gap-4 p-5 border-b border-base-200">
          <div>
            <h3 className="text-lg font-bold text-base-content">Ward Dispense Chart</h3>
            <p className="text-xs text-base-content/60">
              {readOnly
                ? 'Viewing dispensed doses.'
                : 'Tick a box to dispense that dose to the ward. Each tick saves instantly and updates inventory.'}
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          <div className="flex items-center gap-2">
            <label htmlFor="treatment-days" className="text-sm font-semibold">Number of days</label>
            <input
              id="treatment-days"
              type="number"
              min="1"
              max="90"
              value={days}
              disabled={readOnly}
              onChange={(event) => setDays(Math.min(90, Math.max(1, Number(event.target.value) || 1)))}
              className="input input-bordered input-sm w-20"
            />
          </div>

          <div className="overflow-x-auto border border-base-200 rounded-xl">
            <table className="table table-sm min-w-max">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-base-200 min-w-48">Medication</th>
                  {Array.from({ length: days }, (_, index) => (
                    <th key={index} colSpan={TIME_SLOTS.length} className="text-center bg-base-200">Day {index + 1}</th>
                  ))}
                </tr>
                <tr>
                  <th className="sticky left-0 z-10 bg-base-100">Frequency</th>
                  {Array.from({ length: days }, (_, day) => TIME_SLOTS.map((slot) => (
                    <th key={`${day}-${slot}`} className="text-center text-[10px] font-normal">{slot.slice(0, 1)}</th>
                  )))}
                </tr>
              </thead>
              <tbody>
                {medications.map((item) => {
                  const frequencyCount = getFrequencyCount(item.medication.frequency)
                  return (
                    <tr key={item.key}>
                      <td className="sticky left-0 z-10 bg-base-100">
                        <div className="flex items-center gap-1.5">
                          <div className="font-semibold text-xs">{item.medication.drugName}</div>
                          <span className="badge badge-outline badge-xs capitalize">
                            {item.medication.medicationType || item.medication.type || 'Medication'}
                          </span>
                        </div>
                        <div className="text-[10px] text-base-content/60">
                          {item.medication.frequency || 'As prescribed'} ({frequencyCount}/day) · {item.medication.dosage || item.medication.dose || '1 dose'}
                        </div>
                      </td>
                      {Array.from({ length: days }, (_, dayIndex) => TIME_SLOTS.map((slot, slotIndex) => {
                        const day = dayIndex + 1
                        const key = `${item.key}-${day}-${slot}`
                        const eligible = slotIndex < frequencyCount
                        const isChecked = Boolean(checked[key])
                        const isSaving = savingKeys.has(key)
                        const dayQuotaMet = countCheckedForDay(item, day, frequencyCount) >= frequencyCount
                        const disabled = readOnly || !eligible || isChecked || isSaving || (dayQuotaMet && !isChecked)

                        return (
                          <td key={key} className="text-center px-2">
                            {eligible ? (
                              <div className="flex flex-col items-center">
                                <div 
                                  className="tooltip tooltip-primary" 
                                  data-tip={isChecked ? `Dispensed at ${new Date(administrationTimes[key]).toLocaleTimeString()}` : `Click to dispense ${slot} dose`}
                                >
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary checkbox-sm"
                                    checked={isChecked}
                                    disabled={disabled}
                                    onChange={() => handleBoxClick(item, day, slotIndex, slot)}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-base-content/20">-</span>
                            )}
                          </td>
                        )
                      }))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {!readOnly && (
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="textarea textarea-bordered w-full"
              placeholder="General dispense notes (optional — applied to the next dose you log)"
              rows={2}
            />
          )}

          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
              {readOnly ? 'Done' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PharmacyWardRoundDispenseModal