import React, { useEffect, useState } from 'react';
import { FaTimes, FaHospital } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { confirmAdmission } from '@/services/api/admissionApi';
import { getAllWards } from '@/services/api/wardAPI';

const ConfirmAdmissionModal = ({ isOpen, onClose, item, onConfirmed }) => {
  const [wards, setWards] = useState([]);
  const [loadingWards, setLoadingWards] = useState(false);
  const [wardId, setWardId] = useState('');
  const [bedNumber, setBedNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const loadWards = async () => {
      try {
        setLoadingWards(true);
        const res = await getAllWards();
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : (raw?.wards ?? []);
        const active = list.filter(w => !w.status || w.status === 'active');
        if (mounted) setWards(active.length ? active : list);
      } catch (err) {
        console.error('Failed to load wards', err);
        toast.error('Failed to load wards');
      } finally {
        if (mounted) setLoadingWards(false);
      }
    };
    loadWards();
    return () => { mounted = false; };
  }, [isOpen]);

  useEffect(() => {
    setWardId('');
    setBedNumber('');
  }, [item]);

  if (!isOpen || !item) return null;

  const admissionId = item.admission?._id || item.admission?.id;
  const isBilled = !!item.admission?.isBilled;

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
    setIsSubmitting(true);
    try {
      await confirmAdmission(admissionId, { wardId, bedNumber: bedNumber.trim() });
      toast.success(`${item.name} admitted successfully`);
      onConfirmed?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to admit patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-base-100 rounded-xl shadow-2xl border border-base-200">
        <div className="p-6 border-b border-base-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
              <FaHospital />
            </div>
            <h2 className="text-lg font-bold">Confirm Admission</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-base-content/70">
            Confirming admission for <span className="font-semibold">{item.name}</span>
          </p>

          {!isBilled && (
            <div className="alert alert-warning text-sm py-2">
              This patient has not been billed yet. Confirm payment before admitting.
            </div>
          )}

          <div className="form-control w-full">
            <label className="label"><span className="label-text font-medium">Ward *</span></label>
            <select
              className="select select-bordered w-full"
              value={wardId}
              onChange={(e) => setWardId(e.target.value)}
              disabled={loadingWards}
              required
            >
              <option value="" disabled>
                {loadingWards ? 'Loading wards...' : 'Select a ward'}
              </option>
              {wards.map((ward) => (
                <option key={ward.id || ward._id} value={ward.id || ward._id}>
                  {ward.name}
                </option>
              ))}
            </select>
            {!loadingWards && wards.length === 0 && (
              <span className="text-error text-xs mt-1">No wards found. Create one first.</span>
            )}
          </div>

          <div className="form-control w-full">
            <label className="label"><span className="label-text font-medium">Bed Number</span></label>
            <input
              type="text"
              placeholder="e.g. B12 (optional)"
              className="input input-bordered w-full"
              value={bedNumber}
              onChange={(e) => setBedNumber(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || loadingWards}>
              {isSubmitting ? 'Admitting...' : 'Confirm Admission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmAdmissionModal;