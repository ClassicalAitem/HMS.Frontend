/* eslint-disable no-unused-vars */
import React, { useMemo, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { updateHmoExpiry } from '@/services/api/hmoAPI';

const EditHmoModal = ({ isOpen, onClose, patient, onSuccess }) => {
  const [selectedHmoId, setSelectedHmoId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const hmos = useMemo(() => patient?.hmos || [], [patient]);

  // Set default selection when modal opens
  React.useEffect(() => {
    if (isOpen && hmos.length > 0) {
      setSelectedHmoId(hmos[0]?.id || '');
    } else {
      setSelectedHmoId('');
    }
    setExpiresAt('');
  }, [isOpen, hmos]);

  if (!isOpen || !patient) return null;

  const validateDate = (value) => {
    const isoPattern = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
    if (!isoPattern.test(value)) return 'Date must be in YYYY-MM-DD format';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'Invalid date';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHmoId) {
      toast.error('Please select an HMO to update');
      return;
    }
    const err = validateDate(expiresAt);
    if (err) {
      toast.error(err);
      return;
    }

    setIsLoading(true);
    try {
      const promise = updateHmoExpiry(selectedHmoId, expiresAt);
      toast.promise(promise, {
        loading: 'Updating HMO expiry...',
        success: 'HMO expiry updated successfully',
        error: (e) => e?.response?.data?.message || 'Failed to update HMO expiry',
      }, { duration: 3000 });

      await promise;
      onSuccess && onSuccess();
      onClose();
    } catch (e) {
      console.error('EditHmoModal error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => onClose();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={handleCancel} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl card bg-base-100">
        <div className="p-6 card-body">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-base-content">Edit HMO Expiry</h2>
            <button type="button" onClick={handleCancel} className="btn btn-ghost btn-sm btn-circle">
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* HMO selection */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm text-base-content/70">HMO</label>
                <select
                  className="w-full select select-bordered"
                  value={selectedHmoId}
                  onChange={(e) => setSelectedHmoId(e.target.value)}
                  required
                  disabled={hmos.length === 0}
                >
                  {hmos.length === 0 && <option value="">No HMO plans</option>}
                  {hmos.map((hmo) => (
                    <option key={hmo.id || hmo.memberId} value={hmo.id || ''}>
                      {hmo.provider} ({hmo.memberId}){hmo.plan ? ` - ${hmo.plan}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm text-base-content/70">New Expiry Date</label>
                <input
                  type="date"
                  className="w-full input input-bordered"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button type="button" className="btn" onClick={handleCancel} disabled={isLoading}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isLoading || hmos.length === 0}>
                {isLoading ? 'Saving...' : 'Update Expiry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditHmoModal;