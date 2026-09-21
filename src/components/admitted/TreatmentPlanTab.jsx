import React, { useState, useEffect, useMemo } from 'react';
import { FaPills, FaCheckCircle, FaNotesMedical, FaSyringe, FaCalendarDay, FaFileInvoiceDollar, FaBed } from 'react-icons/fa';
import api from '@/services/api/apiClient';
import toast from 'react-hot-toast';
import { administerMedication, getMedicationAdministrations } from '@/services/api/nurseAPI';
import { dispenseMedicationSlot, getMedicationDispenseSlots } from '@/services/api/dispensesAPI';

const TIME_SLOTS = ['Morning', 'Midday', 'Afternoon', 'Evening', 'Night'];
const MAX_CHART_DAYS = 14;

const getFrequencyCount = (frequency) => {
  const normalized = String(frequency || '').toLowerCase();
  if (normalized === 'stat') return 1;
  if (normalized === 'dly' || normalized === 'mane' || normalized === 'nocte') return 1;
  if (normalized === 'b.d' || normalized === 'bd') return 2;
  if (normalized === 'tds') return 3;
  if (normalized === 'qds') return 4;
  const number = Number.parseInt(normalized.match(/\d+/)?.[0] || '', 10);
  return Number.isFinite(number) ? Math.min(number, TIME_SLOTS.length) : TIME_SLOTS.length;
};

// "5 days" -> 5, "1 week" -> 7, unparseable -> fallback
const parseDurationDays = (duration) => {
  if (!duration) return 3;
  const str = String(duration).toLowerCase();
  const num = parseInt(str.match(/\d+/)?.[0], 10);
  if (!num) return 3;
  if (str.includes('week')) return Math.min(num * 7, MAX_CHART_DAYS);
  return Math.min(num, MAX_CHART_DAYS);
};

const isSameDay = (a, b) => {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

const getId = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value.$oid) return String(value.$oid);
  if (value._id) return getId(value._id);
  if (value.id) return getId(value.id);
  return '';
};

const getDose = (medication) => {
  const dose = medication.dosageAmount || medication.dosage || medication.dose;
  const parsed = Number.parseFloat(String(dose || ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const TreatmentPlanTab = ({ admissionId, isPharmacy = false, isNurse = true, isDoctor = false }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlot, setActiveSlot] = useState(null);
  const [doseGiven, setDoseGiven] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for dispense/administer records tracking
  const [administrations, setAdministrations] = useState([]);
  const [dispenses, setDispenses] = useState([]);

  const fetchData = async () => {
    if (!admissionId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Fetch prescriptions (use appropriate endpoint if needed, but standard is fine)
      const endpoint = (isPharmacy || isDoctor)
        ? `/admission/${admissionId}/prescriptions` 
        : `/nurse/admissions/${admissionId}/prescriptions`;
      const response = await api.get(endpoint);
      const data = response.data?.data || response.data || [];
      setPrescriptions(data);

      // Fetch tracking records
      const [adminRecords, dispenseRecords] = await Promise.all([
        getMedicationAdministrations(admissionId).catch(() => []),
        getMedicationDispenseSlots(admissionId).catch(() => [])
      ]);
      
      setAdministrations(Array.isArray(adminRecords) ? adminRecords : []);
      setDispenses(Array.isArray(dispenseRecords) ? dispenseRecords : []);

    } catch (error) {
      console.error('Failed to load treatment plans:', error);
      toast.error('Failed to load treatment plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [admissionId, isPharmacy, isNurse, isDoctor]);

  const handleLogAction = async (e) => {
    e.preventDefault();
    if (!activeSlot) return;

    try {
      setIsSubmitting(true);
      
      const payload = {
        prescriptionId: activeSlot.prescriptionId,
        ...(activeSlot.medicationId ? { medicationId: activeSlot.medicationId } : { medicationIndex: activeSlot.medicationIndex }),
        ...(isPharmacy ? { doseDispensed: Number(doseGiven) } : { doseGiven: Number(doseGiven) }),
        notes: `${isPharmacy ? 'Dispensed' : 'Administered'} ${activeSlot.slotName}, day ${activeSlot.dayIdx + 1}${notes.trim() ? ` - ${notes.trim()}` : ''}`,
        ...(isPharmacy ? { dispensedAt: new Date().toISOString() } : { administeredAt: new Date().toISOString() })
      };

      if (isPharmacy) {
        await dispenseMedicationSlot(admissionId, payload);
        toast.success('Dose dispensed successfully.');
      } else {
        await administerMedication(admissionId, payload);
        toast.success('Dose administered successfully.');
      }

      setActiveSlot(null);
      setDoseGiven(1);
      setNotes('');
      fetchData(); // Refresh the records to show the updated slot
    } catch (error) {
      console.error('Action error:', error);
      toast.error(error?.response?.data?.error || `Failed to log ${isPharmacy ? 'dispense' : 'administration'}.`);
    } finally {
      setIsSubmitting(false);
    }
  };



  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-12 text-center">
        <FaNotesMedical className="w-12 h-12 text-base-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-base-content/80">No Treatment Plans Found</h3>
        <p className="text-sm text-base-content/60 mt-1">
          There are currently no active prescriptions for this admission.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden">
        <div className="p-4 border-b border-base-200 bg-base-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <FaBed className="text-primary" /> 
            {isPharmacy ? 'Pharmacy Ward Dispense Chart' : 'Active Treatment Plans'}
          </h2>
        </div>

        <div className="p-4 space-y-6">
          {prescriptions.map((prescription, pIdx) => {
            const prescriptionId = getId(prescription) || `rx-${pIdx}`;
            return (
            <div key={prescriptionId} className="collapse collapse-arrow border border-base-200 rounded-xl overflow-hidden shadow-sm hover:border-primary/20 transition-all bg-base-100">
              <input type="checkbox" defaultChecked={pIdx === 0} className="peer" />
              <div className="collapse-title bg-base-200/50 p-3 px-4 flex justify-between items-center border-b border-base-200">
                <div className="pr-8">
                  <p className="text-xs font-semibold text-base-content/70 uppercase tracking-wider">Prescription Details</p>
                  <p className="text-sm font-medium mt-0.5">
                    Prescribed by {prescription.doctorName || 'Doctor'} •{' '}
                    {new Date(prescription.createdAt || Date.now()).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="badge badge-primary badge-outline font-semibold z-10">{prescription.status || 'Active'}</div>
              </div>

              <div className="collapse-content p-0 m-0 divide-y divide-base-200">
                {(prescription.medications || []).map((med, mIdx) => {
                  const medicationId = getId(med);
                  const totalDays = parseDurationDays(med.duration);
                  const startDate = prescription.createdAt || new Date();
                  
                  // Extract tracking data for this medication
                  const medAdministrations = administrations.filter(a => 
                    a.prescriptionId === getId(prescription) && 
                    (medicationId ? a.medicationId === medicationId : a.medicationIndex === mIdx)
                  );
                  const medDispenses = dispenses.filter(d => 
                    d.prescriptionId === getId(prescription) && 
                    (medicationId ? d.medicationId === medicationId : d.medicationIndex === mIdx)
                  );

                  return (
                    <div key={medicationId || mIdx} className="p-4 space-y-4 hover:bg-base-50/50 transition-colors">
                      {/* Drug header */}
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          {med.medicationType === 'injection' ? (
                            <FaSyringe className="text-primary w-5 h-5" />
                          ) : (
                            <FaPills className="text-primary w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-base-content text-lg">{med.drugName}</h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-base-content/70">
                            <span><strong className="text-base-content/90">Dose:</strong> {med.dosage || med.dosageAmount} {med.dosageUnit || med.dose}</span>
                            <span><strong className="text-base-content/90">Freq:</strong> {med.frequency}</span>
                            <span><strong className="text-base-content/90">Duration:</strong> {med.duration}</span>
                          </div>
                          {med.instructions && (
                            <p className="text-xs mt-2 text-warning-content/80 bg-warning/10 px-2.5 py-1.5 rounded-lg inline-block font-medium">
                              Note: {med.instructions}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2.5">
                            <p className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                              Dispensed: {medDispenses.length || 0}
                            </p>
                            <p className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded">
                              Administered: {medAdministrations.length || med.dosesGiven || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Treatment chart */}
                      <div className="overflow-x-auto rounded-xl border border-base-200 min-w-0 bg-base-100 shadow-sm">
                        <table className="table table-xs sm:table-sm w-full">
                          <thead>
                            <tr className="bg-base-200/60">
                              <th className="text-[10px] font-bold uppercase text-base-content/60 sticky left-0 bg-base-200/60 w-28">
                                <FaCalendarDay className="inline w-3 h-3 mr-1" /> Day
                              </th>
                              {TIME_SLOTS.map((slotName, i) => (
                                <th key={i} className="text-center text-[10px] font-bold text-base-content/60 w-16">
                                  {slotName}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-base-100">
                            {Array.from({ length: totalDays }).map((_, dayIdx) => {
                              const dayDate = addDays(startDate, dayIdx);
                              const today = new Date();
                              const isToday = isSameDay(dayDate, today);
                              const isFuture = dayDate > today && !isToday;

                              // Count records for this specific day
                              const adminsOnDay = medAdministrations.filter((a) =>
                                isSameDay(a.administeredAt || a.createdAt, dayDate)
                              );
                              const dispensesOnDay = medDispenses.filter((d) =>
                                isSameDay(d.dispensedAt || d.createdAt, dayDate)
                              );
                              
                              const adminCount = adminsOnDay.length;
                              const dispensedCount = dispensesOnDay.length;
                              
                              // Check for overflow doses
                              const overflow = isPharmacy 
                                ? Math.max(0, dispensesOnDay.length - TIME_SLOTS.length) 
                                : Math.max(0, adminsOnDay.length - TIME_SLOTS.length);
                                
                              const frequencyCount = getFrequencyCount(med.frequency);

                              return (
                                <tr key={dayIdx} className={isToday ? 'bg-primary/5' : ''}>
                                  <td className="text-xs font-bold sticky left-0 bg-base-100 border-r border-base-100">
                                    <div className="flex flex-col">
                                      <span>{dayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                      {isToday && <span className="badge badge-primary badge-xs mt-0.5 shadow-sm">Today</span>}
                                    </div>
                                  </td>
                                  {TIME_SLOTS.map((slotName, slotIdx) => {
                                    const matchesSlot = (record, sName, sIdx) => {
                                      const notes = record.notes || '';
                                      return notes.includes(sName) || notes.includes(`Dose ${sIdx + 1}`);
                                    };
                                    
                                    const dispenseRecord = dispensesOnDay.find(d => matchesSlot(d, slotName, slotIdx));
                                    const adminRecord = adminsOnDay.find(a => matchesSlot(a, slotName, slotIdx));
                                    
                                    const isDispensed = !!dispenseRecord;
                                    const isAdministered = !!adminRecord;

                                    // Permission Logic
                                    const pharmacyTappable = isPharmacy && (isToday || dayDate < today) && !isDispensed && (dispensedCount < frequencyCount);
                                    const nurseTappable = isNurse && (isToday || dayDate < today) && isDispensed && !isAdministered && (adminCount < frequencyCount);
                                    const tappable = isPharmacy ? pharmacyTappable : nurseTappable;

                                    let btnClass = 'w-6 h-6 rounded-lg border-2 flex items-center justify-center mx-auto transition-all duration-200 shadow-sm ';
                                    let title = '';
                                    let showCheck = false;
                                    
                                    if (isPharmacy) {
                                      if (isDispensed) {
                                        btnClass += 'bg-primary border-primary text-white cursor-default shadow-md';
                                        title = `Dispensed at ${dispenseRecord?.dispensedAt ? new Date(dispenseRecord.dispensedAt).toLocaleTimeString() : 'Unknown'}`;
                                        showCheck = true;
                                      } else if (pharmacyTappable) {
                                        btnClass += 'border-primary/40 hover:bg-primary/20 hover:border-primary cursor-pointer text-primary bg-base-100';
                                        title = `Tap to dispense ${slotName} dose`;
                                      } else if (isFuture) {
                                        btnClass += 'border-base-300 opacity-30 bg-base-200/50 cursor-not-allowed shadow-none';
                                        title = 'Not yet due';
                                      } else {
                                        btnClass += 'border-base-300 opacity-30 bg-base-200/50 cursor-not-allowed shadow-none';
                                        title = dispensedCount >= frequencyCount ? 'Daily dispensing limit reached' : 'Cannot dispense';
                                      }
                                    } else {
                                      if (isAdministered) {
                                        btnClass += 'bg-success border-success text-white cursor-default shadow-md';
                                        title = `Administered at ${adminRecord?.administeredAt ? new Date(adminRecord.administeredAt).toLocaleTimeString() : 'Unknown'}`;
                                        showCheck = true;
                                      } else if (isDispensed) {
                                        if (nurseTappable) {
                                          btnClass += 'border-success/40 hover:bg-success/20 hover:border-success cursor-pointer text-success bg-base-100';
                                          title = `Tap to log ${slotName} administration`;
                                        } else {
                                          btnClass += 'border-success/30 text-success/40 bg-success/5 cursor-not-allowed shadow-none';
                                          title = isDoctor ? 'Dispensed, pending administration' : (adminCount >= frequencyCount ? 'Daily administration limit reached' : 'Cannot administer');
                                        }
                                      } else if (isFuture) {
                                        btnClass += 'border-base-300 opacity-30 bg-base-200/50 cursor-not-allowed shadow-none';
                                        title = 'Not yet due';
                                      } else {
                                        btnClass += 'border-base-300 opacity-40 bg-base-200/50 cursor-not-allowed shadow-none text-base-content/20';
                                        title = 'Waiting for Pharmacy to dispense';
                                      }
                                    }

                                    return (
                                      <td key={slotIdx} className="text-center align-middle border-l border-base-100">
                                        <button
                                          type="button"
                                          disabled={!tappable}
                                          title={title}
                                          onClick={() =>
                                            setActiveSlot({
                                              prescriptionId: getId(prescription),
                                              medicationId: getId(med),
                                              medicationIndex: mIdx,
                                              drugName: med.drugName,
                                              date: dayDate,
                                              dayIdx: dayIdx,
                                              slotIdx: slotIdx,
                                              slotName: slotName,
                                              defaultDose: getDose(med)
                                            })
                                          }
                                          className={btnClass}
                                        >
                                          {showCheck && <FaCheckCircle className="w-3.5 h-3.5" />}
                                          {!showCheck && (!isPharmacy && !isDispensed && !isFuture) && <span className="text-[10px] font-bold opacity-30">P</span>}
                                        </button>
                                      </td>
                                    );
                                  })}
                                  {overflow > 0 && (
                                    <td colSpan={0}>
                                      <span className="badge badge-ghost badge-xs shadow-sm">+{overflow} more</span>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Action Modal */}
      {activeSlot && (
        <div className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box bg-base-100 rounded-2xl shadow-2xl border border-base-200 p-0 overflow-hidden">
            <div className={`p-5 border-b border-base-200 ${isPharmacy ? 'bg-primary/10' : 'bg-success/10'}`}>
              <h3 className={`font-bold text-xl flex items-center gap-2 ${isPharmacy ? 'text-primary' : 'text-success'}`}>
                {isPharmacy ? <FaPills /> : <FaSyringe />} 
                {isPharmacy ? 'Dispense Medication' : 'Log Administration'}
              </h3>
              <p className="text-sm mt-1.5 text-base-content/80">
                Drug: <strong className="text-base-content font-bold">{activeSlot.drugName}</strong>
                <span className="opacity-70">
                  {' '}• Day {activeSlot.dayIdx + 1} ({activeSlot.slotName})
                </span>
              </p>
            </div>

            <form onSubmit={handleLogAction} className="p-6 space-y-5">
              <div className="form-control w-full">
                <label className="label pb-1.5">
                  <span className="label-text font-bold text-base-content">
                    {isPharmacy ? 'Dose Dispensed (Units)' : 'Dose Given (Units)'}
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  className={`input input-bordered w-full rounded-xl focus:outline-none focus:ring-2 ${isPharmacy ? 'focus:ring-primary focus:border-primary' : 'focus:ring-success focus:border-success'}`}
                  value={doseGiven}
                  onChange={(e) => setDoseGiven(e.target.value)}
                  required
                />
              </div>

              <div className="form-control w-full">
                <label className="label pb-1.5">
                  <span className="label-text font-bold text-base-content">
                    {isPharmacy ? 'Dispense Notes' : 'Administration Notes'} <span className="text-base-content/50 font-normal">(Optional)</span>
                  </span>
                </label>
                <textarea
                  className={`textarea textarea-bordered h-28 rounded-xl focus:outline-none focus:ring-2 ${isPharmacy ? 'focus:ring-primary focus:border-primary' : 'focus:ring-success focus:border-success'}`}
                  placeholder={isPharmacy ? "E.g., Dispensed partial packet..." : "E.g., Patient responded well..."}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>

              <div className="modal-action mt-8 pt-5 border-t border-base-200 flex gap-3">
                <button
                  type="button"
                  className="btn btn-ghost rounded-xl flex-1 hover:bg-base-200"
                  onClick={() => setActiveSlot(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`btn rounded-xl flex-1 text-white shadow-sm hover:shadow-md transition-all ${isPharmacy ? 'btn-primary' : 'btn-success'}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <span className="loading loading-spinner loading-sm"></span> : (isPharmacy ? 'Confirm Dispense' : 'Confirm Log')}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && setActiveSlot(null)}></div>
        </div>
      )}
      {/* Action Modal */}
    </div>
  );
};

export default TreatmentPlanTab;