import React, { useEffect, useMemo, useState } from 'react';
import { FaTimes, FaHospital, FaBed, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { confirmAdmission, getAdmissions } from '@/services/api/admissionApi';
import { getAllWards } from '@/services/api/wardAPI';

const ConfirmAdmissionModal = ({ isOpen, onClose, item, onConfirmed }) => {
  const [wards, setWards] = useState([]);
  const [allAdmissions, setAllAdmissions] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [wardId, setWardId] = useState('');
  const [selectedBed, setSelectedBed] = useState('');
  const [isCustomBed, setIsCustomBed] = useState(false);
  const [customBedInput, setCustomBedInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [wardsRes, admissionsRes] = await Promise.allSettled([
          getAllWards(),
          getAdmissions(),
        ]);

        const rawWards =
          wardsRes.status === 'fulfilled'
            ? (wardsRes.value?.data ?? wardsRes.value ?? [])
            : [];
        const wardList = Array.isArray(rawWards) ? rawWards : (rawWards?.wards ?? []);
        const activeWards = wardList.filter((w) => !w.status || w.status === 'active');

        const rawAdmissions =
          admissionsRes.status === 'fulfilled'
            ? (admissionsRes.value?.data ?? admissionsRes.value ?? [])
            : [];
        const admissionsList = Array.isArray(rawAdmissions) ? rawAdmissions : [];

        if (mounted) {
          setWards(activeWards.length ? activeWards : wardList);
          setAllAdmissions(admissionsList);
        }
      } catch (err) {
        console.error('Failed to load wards or admissions', err);
        toast.error('Failed to load wards or active admissions');
      } finally {
        if (mounted) setLoadingData(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // Pre-fill recommended ward and reset bed selection when item or wards change
  useEffect(() => {
    if (!item) return;

    const recWardId = item.admission?.wardId;
    const recWardName = item.admission?.ward;

    const matchedWard = wards.find(
      (w) =>
        (recWardId && (w.id === recWardId || w._id === recWardId)) ||
        (recWardName && w.name?.toLowerCase() === recWardName?.toLowerCase())
    );

    if (matchedWard) {
      setWardId(matchedWard.id || matchedWard._id);
    } else if (wards.length === 1) {
      setWardId(wards[0].id || wards[0]._id);
    } else {
      setWardId('');
    }

    setSelectedBed(item.admission?.bedNumber || '');
    setIsCustomBed(false);
    setCustomBedInput('');
  }, [item, wards]);

  const selectedWard = useMemo(() => {
    if (!wardId) return null;
    return wards.find((w) => (w.id || w._id) === wardId) || null;
  }, [wards, wardId]);

  // Compute available and occupied beds for selected ward
  const { capacity, availableBeds, occupiedList, isFull } = useMemo(() => {
    if (!selectedWard) {
      return { capacity: 0, availableBeds: [], occupiedList: [], isFull: false };
    }

    const cap = Math.max(0, parseInt(selectedWard.occupancy || selectedWard.capacity, 10) || 0);
    const currentAdmId = String(item?.admission?._id || item?.admission?.id || '');

    // Active confirmed admissions in this ward
    const activeInWard = allAdmissions.filter((a) => {
      const aId = String(a._id || a.id || '');
      if (aId === currentAdmId) return false;
      if (a.status === 'discharged' || a.dischargedAt) return false;
      if (!a.confirmedAt) return false;

      const matchesWardId =
        a.wardId &&
        (a.wardId === selectedWard.id || a.wardId === selectedWard._id);
      const matchesWardName =
        a.ward &&
        selectedWard.name &&
        a.ward.toLowerCase() === selectedWard.name.toLowerCase();
      return matchesWardId || matchesWardName;
    });

    // Map of normalized occupied bed numbers
    const occupiedMap = new Map();
    activeInWard.forEach((a) => {
      if (a.bedNumber) {
        const raw = String(a.bedNumber).trim();
        const norm = raw.toLowerCase().replace(/^bed\s*/i, '');
        const pName = a.patient
          ? `${a.patient.firstName || ''} ${a.patient.lastName || ''}`.trim()
          : a.dependant
          ? `${a.dependant.firstName || ''} ${a.dependant.lastName || ''}`.trim()
          : 'Admitted Patient';
        occupiedMap.set(norm, { raw, patientName: pName });
      }
    });

    const avail = [];
    const occList = [];

    // If capacity is defined (> 0), generate Bed 1 to Bed N
    if (cap > 0) {
      for (let i = 1; i <= cap; i++) {
        const bedLabel = `Bed ${i}`;
        const norm = String(i);
        const occ =
          occupiedMap.get(norm) ||
          occupiedMap.get(bedLabel.toLowerCase()) ||
          occupiedMap.get(String(i).padStart(2, '0'));

        if (occ) {
          occList.push({ bed: bedLabel, patientName: occ.patientName });
        } else {
          avail.push(bedLabel);
        }
      }

      // Any occupied bed beyond 1..cap or with custom string
      occupiedMap.forEach((occ, norm) => {
        const num = parseInt(norm, 10);
        if (isNaN(num) || num < 1 || num > cap) {
          occList.push({ bed: occ.raw, patientName: occ.patientName });
        }
      });
    }

    return {
      capacity: cap,
      availableBeds: avail,
      occupiedList: occList,
      isFull: cap > 0 && avail.length === 0,
    };
  }, [selectedWard, allAdmissions, item]);

  // When ward changes, reset bed choice
  const handleWardChange = (newWardId) => {
    setWardId(newWardId);
    setSelectedBed('');
    setIsCustomBed(false);
    setCustomBedInput('');
  };

  const handleBedSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomBed(true);
      setSelectedBed('');
    } else {
      setIsCustomBed(false);
      setSelectedBed(val);
    }
  };

  if (!isOpen || !item) return null;

  const admissionId = item.admission?._id || item.admission?.id;
  const paymentInfo = item.paymentInfo || {
    status: item.admission?.isBilled ? 'unpaid' : 'unbilled',
    totalAmount: 0,
    paidAmount: 0,
    outstandingAmount: 0,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!wardId) {
      toast.error('Ward is required');
      return;
    }
    if (!admissionId) {
      toast.error('No admission record found for this patient');
      return;
    }

    const finalBed = (isCustomBed ? customBedInput : selectedBed).trim();
    if (!finalBed) {
      toast.error('Please pick an available bed or enter a bed number');
      return;
    }

    // Verify bed is not already occupied
    const normFinal = finalBed.toLowerCase().replace(/^bed\s*/i, '');
    const isAlreadyOccupied = occupiedList.some(
      (o) => o.bed.toLowerCase().replace(/^bed\s*/i, '') === normFinal
    );
    if (isAlreadyOccupied) {
      toast.error(
        `"${finalBed}" is already occupied in this ward. Please choose an available bed.`
      );
      return;
    }

    const cleanBed = finalBed.replace(/^bed\s*/i, '');
    setIsSubmitting(true);
    try {
      await confirmAdmission(admissionId, {
        wardId,
        bedNumber: cleanBed || finalBed,
      });
      toast.success(
        `${item.name} admitted successfully to ${selectedWard?.name || 'Ward'} (Bed ${cleanBed || finalBed})`
      );
      onConfirmed?.();
      onClose();
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Failed to admit patient'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const btn =
            e.currentTarget.querySelector('button.btn-circle') ||
            Array.from(e.currentTarget.querySelectorAll('button')).find(
              (b) =>
                b.textContent.includes('✕') ||
                b.textContent.toLowerCase().includes('cancel') ||
                b.textContent.toLowerCase().includes('close')
            );
          if (btn) btn.click();
        }
      }}
    >
      <div className="w-full max-w-lg mx-4 bg-base-100 rounded-2xl shadow-2xl border border-base-200 overflow-hidden">
        {/* HEADER */}
        <div className="p-6 border-b border-base-200 flex justify-between items-center bg-base-200/40">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
              <FaHospital className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Confirm Inpatient Admission</h2>
              <p className="text-xs text-base-content/60">
                Ward confirmation and bed assignment
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
            <FaTimes />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-base-200/50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-base-content/70">Admitting Patient:</span>
            <span className="text-sm font-bold text-base-content">{item.name}</span>
          </div>

          {/* PAYMENT STATUS ALERTS */}
          {paymentInfo.status === 'paid' && (
            <div className="alert alert-success text-xs py-2.5 rounded-xl border border-success/20">
              <div>
                <span className="font-bold">Admission Bill Paid in Full</span>
                {paymentInfo.totalAmount > 0 && (
                  <span className="block text-[11px] opacity-90 mt-0.5">
                    Total amount confirmed: ₦{paymentInfo.totalAmount.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          )}

          {paymentInfo.status === 'partial' && (
            <div className="alert alert-info text-xs py-2.5 rounded-xl border border-info/20">
              <div>
                <span className="font-bold">Partial Payment Received</span>
                <span className="block text-[11px] opacity-90 mt-0.5">
                  Paid: ₦{paymentInfo.paidAmount.toLocaleString()} of ₦
                  {paymentInfo.totalAmount.toLocaleString()} (Remaining: ₦
                  {paymentInfo.outstandingAmount.toLocaleString()}). You may proceed to admit this patient.
                </span>
              </div>
            </div>
          )}

          {paymentInfo.status === 'unpaid' && (
            <div className="alert alert-warning text-xs py-2.5 rounded-xl border border-warning/20">
              <div>
                <span className="font-bold">Awaiting Payment</span>
                <span className="block text-[11px] opacity-90 mt-0.5">
                  Billed amount: ₦
                  {paymentInfo.totalAmount > 0
                    ? paymentInfo.totalAmount.toLocaleString()
                    : 'Pending'}
                  . You can still assign a bed and admit the patient at clinical discretion.
                </span>
              </div>
            </div>
          )}

          {paymentInfo.status === 'unbilled' && (
            <div className="alert alert-warning text-xs py-2.5 rounded-xl border border-warning/20">
              <div>
                <span className="font-bold">Admission Not Yet Billed</span>
                <span className="block text-[11px] opacity-90 mt-0.5">
                  No bill has been submitted to Cashier or HMO yet. You can still assign a bed and admit the patient at clinical discretion.
                </span>
              </div>
            </div>
          )}

          {/* WARD SELECTION */}
          <div className="form-control w-full">
            <div className="flex justify-between items-center mb-1">
              <label className="label p-0">
                <span className="label-text font-medium">Select Inpatient Ward *</span>
              </label>
              {selectedWard && (
                <span
                  className={`badge badge-sm font-semibold ${
                    isFull
                      ? 'badge-error text-error-content'
                      : availableBeds.length > 0
                      ? 'badge-success text-success-content'
                      : 'badge-ghost'
                  }`}
                >
                  {isFull
                    ? 'Ward Full (0 beds)'
                    : capacity > 0
                    ? `${availableBeds.length} of ${capacity} beds available`
                    : 'Active Ward'}
                </span>
              )}
            </div>
            <select
              className="select select-bordered w-full"
              value={wardId}
              onChange={(e) => handleWardChange(e.target.value)}
              disabled={loadingData}
              required
            >
              <option value="" disabled>
                {loadingData ? 'Loading wards...' : 'Choose a ward'}
              </option>
              {wards.map((ward) => (
                <option key={ward.id || ward._id} value={ward.id || ward._id}>
                  {ward.name}
                  {ward.occupancy ? ` (${ward.occupancy} Total Capacity)` : ''}
                </option>
              ))}
            </select>
            {!loadingData && wards.length === 0 && (
              <span className="text-error text-xs mt-1">
                No wards found. Create one first in Settings.
              </span>
            )}
          </div>

          {/* BED PICKING */}
          {selectedWard && (
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <label className="label p-0">
                  <span className="label-text font-medium flex items-center gap-1.5">
                    <FaBed className="text-primary w-3.5 h-3.5" />
                    Assign Bed *
                  </span>
                </label>
                {capacity > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomBed(!isCustomBed);
                      if (!isCustomBed) setSelectedBed('');
                    }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    {isCustomBed ? '← Choose from available beds' : 'Enter custom bed code'}
                  </button>
                )}
              </div>

              {isFull && !isCustomBed && (
                <div className="alert alert-error text-xs py-2 rounded-xl flex items-center gap-2">
                  <FaExclamationTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    This ward is at full capacity (all {capacity} beds are occupied). Select another ward or enter a specialized bed.
                  </span>
                </div>
              )}

              {/* DROPDOWN BED PICKER (WHEN CAPACITY CONFIGURED AND NOT CUSTOM) */}
              {!isCustomBed && capacity > 0 ? (
                <div className="space-y-1">
                  <select
                    className="select select-bordered w-full"
                    value={selectedBed}
                    onChange={handleBedSelectChange}
                    required
                  >
                    <option value="">-- Pick an available bed --</option>
                    {availableBeds.length > 0 && (
                      <optgroup label={`Available Beds (${availableBeds.length})`}>
                        {availableBeds.map((bed) => (
                          <option key={bed} value={bed}>
                            ✓ {bed} (Available)
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {occupiedList.length > 0 && (
                      <optgroup label={`Occupied Beds (${occupiedList.length})`}>
                        {occupiedList.map((occ) => (
                          <option key={occ.bed} value={occ.bed} disabled>
                            ✕ {occ.bed} (Occupied - {occ.patientName})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <option value="__custom__">+ Enter custom bed identifier...</option>
                  </select>
                  <span className="text-[11px] text-base-content/60 block mt-1">
                    Once picked and confirmed, this bed will be deducted from the available beds list.
                  </span>
                </div>
              ) : (
                /* MANUAL INPUT (WHEN CUSTOM MODE OR WARD CAPACITY NOT CONFIGURED) */
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="e.g. Bed 4, B12, ICU-02"
                    className="input input-bordered w-full"
                    value={isCustomBed ? customBedInput : selectedBed}
                    onChange={(e) => {
                      if (isCustomBed) {
                        setCustomBedInput(e.target.value);
                      } else {
                        setSelectedBed(e.target.value);
                      }
                    }}
                    required
                  />
                  {occupiedList.length > 0 && (
                    <div className="text-[11px] text-base-content/60 mt-1">
                      <span className="font-semibold">Currently occupied:</span>{' '}
                      {occupiedList.map((o) => o.bed).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="flex justify-end gap-3 pt-3 border-t border-base-200">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || loadingData || (isFull && !isCustomBed && !customBedInput)}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-xs" /> Admitting...
                </>
              ) : (
                'Confirm Admission'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmAdmissionModal;
