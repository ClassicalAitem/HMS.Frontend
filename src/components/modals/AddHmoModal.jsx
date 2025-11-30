/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { addHmoForPatient } from '@/services/api/hmoAPI';

const emptyHmo = { provider: '', memberId: '', plan: '', expiresAt: '' };

const AddHmoModal = ({ isOpen, onClose, patient, onSuccess }) => {
  const [hmos, setHmos] = useState([ { ...emptyHmo } ]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !patient) return null;

  const handleChange = (index, field, value) => {
    setHmos(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addRow = () => setHmos(prev => [ ...prev, { ...emptyHmo } ]);
  const removeRow = (index) => setHmos(prev => prev.filter((_, i) => i !== index));

  const validate = () => {
    for (const h of hmos) {
      if (!h.provider || !h.memberId || !h.plan || !h.expiresAt) {
        return 'Please fill provider, memberId, plan, and expiresAt for all HMOs';
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setIsLoading(true);
    try {
      const promise = addHmoForPatient(patient.id, hmos);
      toast.promise(promise, {
        loading: 'Adding HMO(s)...',
        success: 'HMO(s) added successfully',
        error: (err) => err?.response?.data?.message || 'Failed to add HMO(s)'
      }, { duration: 3000 });

      await promise;
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      // errors handled in toast.promise
      console.error('AddHmoModal submit error', err);
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
            <h2 className="text-2xl font-bold text-base-content">Add HMO Plan(s)</h2>
            <button type="button" onClick={handleCancel} className="btn btn-ghost btn-sm btn-circle">
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {hmos.map((hmo, index) => (
                <div key={index} className="p-4 border rounded-lg border-base-300">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-semibold">HMO Entry #{index + 1}</h3>
                    {hmos.length > 1 && (
                      <button type="button" className="btn btn-ghost btn-xs" onClick={() => removeRow(index)}>
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm text-base-content/70">Provider</label>
                      <input
                        type="text"
                        className="w-full input input-bordered"
                        value={hmo.provider}
                        onChange={(e) => handleChange(index, 'provider', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm text-base-content/70">Plan</label>
                      <input
                        type="text"
                        className="w-full input input-bordered"
                        value={hmo.plan}
                        onChange={(e) => handleChange(index, 'plan', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm text-base-content/70">Member ID</label>
                      <input
                        type="text"
                        className="w-full input input-bordered"
                        value={hmo.memberId}
                        onChange={(e) => handleChange(index, 'memberId', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm text-base-content/70">Expiry Date</label>
                      <input
                        type="date"
                        className="w-full input input-bordered"
                        value={hmo.expiresAt}
                        onChange={(e) => handleChange(index, 'expiresAt', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <button type="button" className="btn btn-outline" onClick={addRow}>Add another</button>
              <div className="space-x-2">
                <button type="button" className="btn" onClick={handleCancel} disabled={isLoading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save HMO(s)'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddHmoModal;