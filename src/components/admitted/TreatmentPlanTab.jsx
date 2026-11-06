import React, { useState, useEffect, useMemo } from 'react';
import {
  FaPills,
  FaCheckCircle,
  FaNotesMedical,
  FaSyringe,
  FaCalendarDay,
  FaBed,
  FaBoxOpen,
  FaPlus,
  FaCheck,
  FaSearch,
  FaClock,
} from 'react-icons/fa';
import api from '@/services/api/apiClient';
import toast from 'react-hot-toast';
import { administerMedication, getMedicationAdministrations } from '@/services/api/nurseAPI';
import {
  dispenseMedicationSlot,
  getMedicationDispenseSlots,
  orderTreatmentConsumables,
  getTreatmentConsumables,
  dispenseTreatmentConsumable,
} from '@/services/api/dispensesAPI';
import { getInventories } from '@/services/api/inventoryAPI';

const TIME_SLOTS = ['Morning', 'Midday', 'Afternoon', 'Evening', 'Night'];
const SLOT_TIMINGS = { Morning: '08:00', Midday: '12:00', Afternoon: '16:00', Evening: '20:00', Night: '22:00' };
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

  // State for Consumables
  const [treatmentConsumables, setTreatmentConsumables] = useState([]);
  const [showConsumablesModal, setShowConsumablesModal] = useState(false);
  const [selectedConsumables, setSelectedConsumables] = useState([]);
  const [consumableSearch, setConsumableSearch] = useState('');
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('');
  const [consumableNotes, setConsumableNotes] = useState('');
  const [inventoryList, setInventoryList] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [submittingConsumables, setSubmittingConsumables] = useState(false);
  const [dispensingConsumableId, setDispensingConsumableId] = useState(null);

  const fetchData = async () => {
    if (!admissionId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const endpoint = (isPharmacy || isDoctor)
        ? `/admission/${admissionId}/prescriptions`
        : `/nurse/admissions/${admissionId}/prescriptions`;
      const response = await api.get(endpoint);
      const data = response.data?.data || response.data || [];
      setPrescriptions(data);

      const [adminRecords, dispenseRecords, consumableRecords] = await Promise.all([
        getMedicationAdministrations(admissionId).catch(() => []),
        getMedicationDispenseSlots(admissionId).catch(() => []),
        getTreatmentConsumables(admissionId).catch(() => []),
      ]);

      setAdministrations(Array.isArray(adminRecords) ? adminRecords : []);
      setDispenses(Array.isArray(dispenseRecords) ? dispenseRecords : []);
      setTreatmentConsumables(Array.isArray(consumableRecords) ? consumableRecords : []);
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

  const loadConsumablesInventory = async () => {
    try {
      setLoadingInventory(true);
      const res = await getInventories();
      const items = res?.data?.data || res?.data || res || [];
      setInventoryList(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Failed to load inventory for consumables:', err);
      toast.error('Failed to load inventory items.');
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    if (showConsumablesModal && inventoryList.length === 0) {
      loadConsumablesInventory();
    }
  }, [showConsumablesModal]);

  const filteredInventory = useMemo(() => {
    const q = consumableSearch.trim().toLowerCase();
    if (!q) return [];
    return inventoryList.filter((item) => {
      const name = String(item?.name || item?.itemName || '').toLowerCase();
      const form = String(item?.form || '').toLowerCase();
      return name.includes(q) || form.includes(q);
    });
  }, [inventoryList, consumableSearch]);

  const handleAddConsumableItem = (inv) => {
    const invId = getId(inv);
    const existingIndex = selectedConsumables.findIndex(
      (c) => (c.inventoryId && c.inventoryId === invId) || c.itemName.toLowerCase() === inv.name.toLowerCase()
    );

    if (existingIndex >= 0) {
      const updated = [...selectedConsumables];
      updated[existingIndex].quantity = (Number(updated[existingIndex].quantity) || 1) + 1;
      setSelectedConsumables(updated);
    } else {
      const packSize = Number(inv.packSize) || 1;
      const unitPrice = inv.sellingPrice ? Number(inv.sellingPrice) / packSize : 0;
      setSelectedConsumables([
        ...selectedConsumables,
        {
          inventoryId: invId,
          itemName: inv.name,
          quantity: 1,
          unitPrice,
          stock: inv.stock ?? 0,
          form: inv.form || inv.unit || 'units',
        },
      ]);
    }
  };

  const handleUpdateConsumableQuantity = (index, qty) => {
    const updated = [...selectedConsumables];
    const newQty = Math.max(1, parseInt(qty, 10) || 1);
    updated[index].quantity = newQty;
    setSelectedConsumables(updated);
  };

  const handleRemoveConsumableItem = (index) => {
    const updated = [...selectedConsumables];
    updated.splice(index, 1);
    setSelectedConsumables(updated);
  };

  const handleSubmitConsumablesOrder = async (e) => {
    e.preventDefault();
    if (!selectedConsumables.length) {
      toast.error('Please select at least one consumable item.');
      return;
    }

    try {
      setSubmittingConsumables(true);
      const payload = {
        items: selectedConsumables.map((item) => ({
          inventoryId: item.inventoryId,
          itemName: item.itemName,
          quantity: Number(item.quantity) || 1,
          unitPrice: item.unitPrice || 0,
        })),
        prescriptionId: selectedPrescriptionId || undefined,
        notes: consumableNotes.trim() || undefined,
      };

      await orderTreatmentConsumables(admissionId, payload);
      toast.success('Treatment plan consumables ordered successfully!');
      setShowConsumablesModal(false);
      setSelectedConsumables([]);
      setConsumableSearch('');
      setConsumableNotes('');
      setSelectedPrescriptionId('');
      fetchData();
    } catch (error) {
      console.error('Failed to order consumables:', error);
      toast.error(error?.response?.data?.error || 'Failed to order consumables.');
    } finally {
      setSubmittingConsumables(false);
    }
  };

  const handleDispenseConsumables = async (orderId) => {
    try {
      setDispensingConsumableId(orderId);
      await dispenseTreatmentConsumable(orderId);
      toast.success('Treatment consumables dispensed successfully.');
      fetchData();
    } catch (error) {
      console.error('Failed to dispense consumables:', error);
      toast.error(error?.response?.data?.error || 'Failed to dispense consumables.');
    } finally {
      setDispensingConsumableId(null);
    }
  };

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
        ...(isPharmacy ? { dispensedAt: new Date().toISOString() } : { administeredAt: new Date().toISOString() }),
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
      fetchData();
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

  const pendingConsumablesCount = treatmentConsumables.filter((o) => !o.isDispensed).length;

  return (
    <div className="space-y-6">
      {/* Main Treatment Plan Container */}
      <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-base-200 bg-base-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <FaBed className="text-primary" />
              {isPharmacy ? 'Pharmacy Ward Dispense Chart' : 'Active Treatment Plans'}
            </h2>
            {pendingConsumablesCount > 0 && (
              <span className="badge badge-warning text-xs font-bold gap-1">
                <FaClock className="w-2.5 h-2.5" /> {pendingConsumablesCount} Consumable {pendingConsumablesCount === 1 ? 'Order' : 'Orders'} Pending
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isPharmacy && (
              <button
                type="button"
                onClick={() => setShowConsumablesModal(true)}
                className="btn btn-sm btn-primary text-white rounded-xl shadow-xs gap-2 font-medium"
              >
                <FaBoxOpen className="w-4 h-4" />
                Order Consumables
              </button>
            )}
          </div>
        </div>

        {/* Prescriptions List */}
        <div className="p-4 space-y-6">
          {prescriptions.length === 0 ? (
            <div className="bg-base-50 rounded-2xl border border-dashed border-base-200 p-8 text-center">
              <FaNotesMedical className="w-10 h-10 text-base-300 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-base-content/80">No Active Prescriptions Found</h3>
              <p className="text-xs text-base-content/60 mt-1 max-w-md mx-auto">
                There are currently no doctor medication prescriptions for this admission. You can still order treatment consumables below.
              </p>
            </div>
          ) : (
            prescriptions.map((prescription, pIdx) => {
              const prescriptionId = getId(prescription) || `rx-${pIdx}`;
              return (
                <div
                  key={prescriptionId}
                  className="collapse collapse-arrow border border-base-200 rounded-xl overflow-hidden shadow-sm hover:border-primary/20 transition-all bg-base-100"
                >
                  <input type="checkbox" defaultChecked={pIdx === 0} className="peer" />
                  <div className="collapse-title bg-base-200/50 p-3 px-4 flex justify-between items-center border-b border-base-200">
                    <div className="pr-8">
                      <p className="text-xs font-semibold text-base-content/70 uppercase tracking-wider">Prescription Details</p>
                      <p className="text-sm font-medium mt-0.5">
                        Prescribed by {prescription.doctorName || 'Doctor'} â€¢{' '}
                        {new Date(prescription.createdAt || Date.now()).toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="badge badge-primary badge-outline font-semibold z-10">
                      {prescription.status || 'Active'}
                    </div>
                  </div>

                  <div className="collapse-content p-0 m-0 divide-y divide-base-200">
                    {(prescription.medications || []).map((med, mIdx) => {
                      const medicationId = getId(med);
                      const totalDays = parseDurationDays(med.duration);
                      const startDate = prescription.createdAt || new Date();

                      // Extract tracking data for this medication
                      const medAdministrations = administrations.filter(
                        (a) =>
                          a.prescriptionId === getId(prescription) &&
                          (medicationId ? a.medicationId === medicationId : a.medicationIndex === mIdx)
                      );
                      const medDispenses = dispenses.filter(
                        (d) =>
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
                                <span>
                                  <strong className="text-base-content/90">Dose:</strong> {med.dosage || med.dosageAmount}{' '}
                                  {med.dosageUnit || med.dose}
                                </span>
                                <span>
                                  <strong className="text-base-content/90">Freq:</strong> {med.frequency}
                                </span>
                                <span>
                                  <strong className="text-base-content/90">Duration:</strong> {med.duration}
                                </span>
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

                                  const adminsOnDay = medAdministrations.filter((a) =>
                                    isSameDay(a.administeredAt || a.createdAt, dayDate)
                                  );
                                  const dispensesOnDay = medDispenses.filter((d) =>
                                    isSameDay(d.dispensedAt || d.createdAt, dayDate)
                                  );

                                  const adminCount = adminsOnDay.length;
                                  const dispensedCount = dispensesOnDay.length;

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
                                          const noteText = record.notes || '';
                                          return noteText.includes(sName) || noteText.includes(`Dose ${sIdx + 1}`);
                                        };

                                        const dispenseRecord = dispensesOnDay.find((d) => matchesSlot(d, slotName, slotIdx));
                                        const adminRecord = adminsOnDay.find((a) => matchesSlot(a, slotName, slotIdx));

                                        const isDispensed = !!dispenseRecord;
                                        const isAdministered = !!adminRecord;

                                        const pharmacyTappable =
                                          isPharmacy && (isToday || dayDate < today) && !isDispensed && dispensedCount < frequencyCount;
                                        const nurseTappable =
                                          isNurse && (isToday || dayDate < today) && isDispensed && !isAdministered && adminCount < frequencyCount;
                                        const tappable = isPharmacy ? pharmacyTappable : nurseTappable;

                                        let btnClass =
                                          'w-6 h-6 rounded-lg border-2 flex items-center justify-center mx-auto transition-all duration-200 shadow-sm ';
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
                                              title = isDoctor
                                                ? 'Dispensed, pending administration'
                                                : adminCount >= frequencyCount
                                                ? 'Daily administration limit reached'
                                                : 'Cannot administer';
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
                                                  defaultDose: getDose(med),
                                                })
                                              }
                                              className={btnClass}
                                            >
                                              {showCheck && <FaCheckCircle className="w-3.5 h-3.5" />}
                                              {!showCheck && !isPharmacy && !isDispensed && !isFuture && (
                                                <span className="text-[10px] font-bold opacity-30">P</span>
                                              )}
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
            })
          )}
        </div>

        {/* Treatment Plan Consumables Section */}
        <div className="p-4 border-t border-base-200 bg-base-50/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-base-100 p-4 rounded-xl border border-base-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                <FaBoxOpen />
              </div>
              <div>
                <h3 className="font-bold text-base text-base-content flex items-center gap-2">
                  Treatment Plan Consumables
                  <span className="badge badge-primary badge-sm font-semibold">
                    {treatmentConsumables.length} {treatmentConsumables.length === 1 ? 'order' : 'orders'}
                  </span>
                  {pendingConsumablesCount > 0 && (
                    <span className="badge badge-warning badge-sm font-semibold">
                      {pendingConsumablesCount} pending
                    </span>
                  )}
                </h3>
                <p className="text-xs text-base-content/70">
                  Consumables ordered by nurses for treatment, medication administration & procedures.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isPharmacy && (
                <button
                  type="button"
                  onClick={() => setShowConsumablesModal(true)}
                  className="btn btn-sm btn-primary text-white rounded-xl gap-1.5 shadow-sm font-medium"
                >
                  <FaPlus className="w-3 h-3" /> Order Consumables
                </button>
              )}
            </div>
          </div>

          {/* Consumables Orders List */}
          {treatmentConsumables.length === 0 ? (
            <div className="bg-base-100 rounded-xl border border-dashed border-base-300 p-8 text-center space-y-2">
              <FaBoxOpen className="w-8 h-8 text-base-300 mx-auto" />
              <p className="text-sm font-medium text-base-content/70">No Consumables Ordered Yet</p>
              <p className="text-xs text-base-content/50 max-w-sm mx-auto">
                Nurses can order syringes, needles, cannula, cotton wool, giving sets, and other consumables needed for treatment.
              </p>
              {!isPharmacy && (
                <button
                  type="button"
                  onClick={() => setShowConsumablesModal(true)}
                  className="btn btn-xs btn-outline btn-primary rounded-lg mt-2 gap-1"
                >
                  <FaPlus className="w-2.5 h-2.5" /> Order Consumables Now
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {treatmentConsumables.map((order, orderIdx) => {
                const orderId = getId(order) || `tc-${orderIdx}`;
                const isDispensed = !!order.isDispensed;

                return (
                  <div
                    key={orderId}
                    className="bg-base-100 rounded-xl border border-base-200 overflow-hidden shadow-xs hover:border-primary/30 transition-all"
                  >
                    {/* Order Header */}
                    <div className="p-3 px-4 bg-base-200/40 border-b border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-base-content">
                          Ordered by {order.orderedByName || 'Nurse'}
                        </span>
                        <span className="text-xs text-base-content/50">â€¢</span>
                        <span className="text-xs text-base-content/70">
                          {new Date(order.orderedAt || order.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {order.prescriptionName && (
                          <span className="badge badge-ghost badge-sm text-[11px] font-medium">
                            Rx: {order.prescriptionName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isDispensed ? (
                          <span className="badge badge-success text-white text-xs font-bold gap-1 shadow-xs">
                            <FaCheckCircle className="w-3 h-3" /> Dispensed by {order.dispensedByName || 'Pharmacist'}
                          </span>
                        ) : (
                          <span className="badge badge-warning text-xs font-bold gap-1 shadow-xs">
                            <FaClock className="w-3 h-3" /> Pending Dispense
                          </span>
                        )}
                        {order.isBilled && (
                          <span className="badge badge-info text-white text-xs font-bold shadow-xs">
                            Billed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {(order.items || []).map((item, itemIdx) => (
                          <div
                            key={item._id || itemIdx}
                            className="flex items-center justify-between bg-base-200/30 p-2.5 rounded-lg border border-base-200"
                          >
                            <span className="text-sm font-semibold text-base-content truncate pr-2">
                              {item.itemName}
                            </span>
                            <span className="badge badge-neutral badge-sm font-bold shrink-0">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <p className="text-xs text-base-content/70 bg-base-200/40 p-2 rounded-lg italic">
                          <strong className="not-italic text-base-content/80">Note:</strong> {order.notes}
                        </p>
                      )}
                    </div>

                    {/* Pharmacist Action Bar */}
                    {isPharmacy && !isDispensed && (
                      <div className="p-3 px-4 bg-primary/5 border-t border-base-200 flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-base-content/70">
                          Awaiting pharmacist dispensation to ward
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDispenseConsumables(orderId)}
                          disabled={dispensingConsumableId === orderId}
                          className="btn btn-sm btn-primary rounded-xl font-bold shadow-xs gap-1.5"
                        >
                          {dispensingConsumableId === orderId ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <FaCheck className="w-3 h-3" />
                          )}
                          Dispense Consumables
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Medication Slot Action Modal (Dispense or Administer) */}
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
                  {' '}â€¢ Day {activeSlot.dayIdx + 1} ({activeSlot.slotName})
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
                  className={`input input-bordered w-full rounded-xl focus:outline-none focus:ring-2 ${
                    isPharmacy ? 'focus:ring-primary focus:border-primary' : 'focus:ring-success focus:border-success'
                  }`}
                  value={doseGiven}
                  onChange={(e) => setDoseGiven(e.target.value)}
                  required
                />
              </div>

              <div className="form-control w-full">
                <label className="label pb-1.5">
                  <span className="label-text font-bold text-base-content">
                    {isPharmacy ? 'Dispense Notes' : 'Administration Notes'}{' '}
                    <span className="text-base-content/50 font-normal">(Optional)</span>
                  </span>
                </label>
                <textarea
                  className={`textarea textarea-bordered h-28 rounded-xl focus:outline-none focus:ring-2 ${
                    isPharmacy ? 'focus:ring-primary focus:border-primary' : 'focus:ring-success focus:border-success'
                  }`}
                  placeholder={isPharmacy ? 'E.g., Dispensed partial packet...' : 'E.g., Patient responded well...'}
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
                  className={`btn rounded-xl flex-1 text-white shadow-sm hover:shadow-md transition-all ${
                    isPharmacy ? 'btn-primary' : 'btn-success'
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : isPharmacy ? (
                    'Confirm Dispense'
                  ) : (
                    'Confirm Log'
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && setActiveSlot(null)}></div>
        </div>
      )}

      {/* Order Consumables Modal */}
      {showConsumablesModal && (
        <div className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box bg-base-100 rounded-3xl shadow-2xl border border-base-200 max-w-2xl p-0 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-base-200 bg-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
                  <FaBoxOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-base-content">Order Consumables</h3>
                  <p className="text-xs text-base-content/70">
                    Order syringes, needles, giving sets, dressings & consumables for this treatment plan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowConsumablesModal(false);
                  setSelectedConsumables([]);
                  setConsumableSearch('');
                }}
                className="btn btn-sm btn-ghost btn-circle"
              >
                âœ•
              </button>
            </div>

            <form onSubmit={handleSubmitConsumablesOrder} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Optional prescription link */}
              {prescriptions.length > 0 && (
                <div className="form-control w-full">
                  <label className="label pb-1.5">
                    <span className="label-text font-bold text-base-content text-xs uppercase tracking-wider">
                      Associated Prescription (Optional)
                    </span>
                  </label>
                  <select
                    className="select select-bordered w-full rounded-xl text-sm"
                    value={selectedPrescriptionId}
                    onChange={(e) => setSelectedPrescriptionId(e.target.value)}
                  >
                    <option value="">General Treatment Plan Consumables</option>
                    {prescriptions.map((rx, idx) => {
                      const rxId = getId(rx);
                      const medNames = (rx.medications || []).map((m) => m.drugName).join(', ');
                      return (
                        <option key={rxId || idx} value={rxId}>
                          {medNames || `Prescription #${idx + 1}`} ({rx.doctorName || 'Doctor'})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Search hospital inventory */}
              <div className="form-control w-full space-y-2">
                <label className="label pb-0">
                  <span className="label-text font-bold text-base-content text-xs uppercase tracking-wider">
                    Search Hospital Inventory
                  </span>
                  {loadingInventory && <span className="loading loading-spinner loading-xs text-primary"></span>}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search consumable (e.g. syringe, needle, cotton wool, cannula, giving set, gloves)..."
                    className="input input-bordered w-full rounded-xl pl-10 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                    value={consumableSearch}
                    onChange={(e) => setConsumableSearch(e.target.value)}
                  />
                  <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
                </div>

                {/* Search results dropdown */}
                {consumableSearch.trim() && (
                  <div className="bg-base-100 border border-base-200 rounded-xl shadow-lg max-h-48 overflow-y-auto p-2 space-y-1 z-10">
                    {filteredInventory.length === 0 ? (
                      <p className="text-xs text-base-content/50 p-3 text-center">
                        No items matching "{consumableSearch}" found in inventory.
                      </p>
                    ) : (
                      filteredInventory.map((item) => {
                        const invId = getId(item);
                        const isAlreadySelected = selectedConsumables.some(
                          (c) => (c.inventoryId && c.inventoryId === invId) || c.itemName.toLowerCase() === item.name.toLowerCase()
                        );
                        return (
                          <div
                            key={invId}
                            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-base-200/60 transition-colors"
                          >
                            <div className="min-w-0 flex-1 pr-3">
                              <p className="font-semibold text-sm text-base-content truncate">{item.name}</p>
                              <div className="flex items-center gap-3 text-xs text-base-content/60 mt-0.5">
                                <span>
                                  Stock:{' '}
                                  <strong className={item.stock > 0 ? 'text-success font-bold' : 'text-error font-bold'}>
                                    {item.stock ?? 0}
                                  </strong>{' '}
                                  {item.unit || 'units'}
                                </span>
                                {item.form && <span>Form: {item.form}</span>}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddConsumableItem(item)}
                              className={`btn btn-xs rounded-lg ${isAlreadySelected ? 'btn-primary btn-outline' : 'btn-primary text-white'}`}
                            >
                              {isAlreadySelected ? '+ Add More' : '+ Add'}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Selected Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-base-content uppercase tracking-wider flex items-center justify-between">
                  <span>Selected Consumables ({selectedConsumables.length})</span>
                  {selectedConsumables.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedConsumables([])}
                      className="text-error text-[11px] font-semibold hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </h4>

                {selectedConsumables.length === 0 ? (
                  <div className="bg-base-200/40 border border-dashed border-base-300 rounded-xl p-6 text-center text-xs text-base-content/60">
                    Search and add consumable items above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedConsumables.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-base-200/50 p-3 rounded-xl border border-base-200 gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-base-content truncate">{item.itemName}</p>
                          <p className="text-xs text-base-content/60">
                            Available stock: {item.stock} {item.form}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-base-content/70">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            className="input input-xs input-bordered w-16 text-center font-bold rounded-lg"
                            value={item.quantity}
                            onChange={(e) => handleUpdateConsumableQuantity(idx, e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveConsumableItem(idx)}
                            className="btn btn-ghost btn-xs btn-circle text-error"
                            title="Remove item"
                          >
                            âœ•
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Notes */}
              <div className="form-control w-full">
                <label className="label pb-1.5">
                  <span className="label-text font-bold text-base-content text-xs uppercase tracking-wider">
                    Order Notes / Purpose <span className="text-base-content/50 font-normal lowercase">(optional)</span>
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered rounded-xl h-20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                  placeholder="E.g., 2ml syringes for ceftriaxone injection, sterile dressing pack..."
                  value={consumableNotes}
                  onChange={(e) => setConsumableNotes(e.target.value)}
                ></textarea>
              </div>

              <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 text-xs text-base-content/70">
                <p>
                  <strong>Note:</strong> Once submitted, this order will be sent to the Pharmacist for dispensation to the ward and recorded in the patient&apos;s treatment bill.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="modal-action pt-4 border-t border-base-200 flex gap-3">
                <button
                  type="button"
                  className="btn btn-ghost rounded-xl flex-1"
                  onClick={() => {
                    setShowConsumablesModal(false);
                    setSelectedConsumables([]);
                    setConsumableSearch('');
                  }}
                  disabled={submittingConsumables}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-white rounded-xl flex-1 shadow-sm font-bold"
                  disabled={submittingConsumables || selectedConsumables.length === 0}
                >
                  {submittingConsumables ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Place Consumables Order'
                  )}
                </button>
              </div>
            </form>
          </div>
          <div
            className="modal-backdrop bg-black/60 backdrop-blur-sm"
            onClick={() => !submittingConsumables && setShowConsumablesModal(false)}
          ></div>
        </div>
      )}
    </div>
  );
};

export default TreatmentPlanTab;
