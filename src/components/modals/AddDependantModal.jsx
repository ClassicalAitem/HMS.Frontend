/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { addDependantForPatient } from '@/services/api/dependantAPI';

const emptyDependant = {
  firstName: '',
  middleName: '',
  lastName: '',
  dob: '',
  gender: '',
  relationshipType: ''
};

const AddDependantModal = ({ isOpen, onClose, patient, onSuccess }) => {
  const [dependants, setDependants] = useState([{ ...emptyDependant }]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !patient) return null;

  const handleChange = (index, field, value) => {
    setDependants(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addRow = () => setDependants(prev => [ ...prev, { ...emptyDependant } ]);
  const removeRow = (index) => setDependants(prev => prev.filter((_, i) => i !== index));

  const validate = () => {
    for (const d of dependants) {
      if (!d.firstName || !d.lastName || !d.relationshipType) {
        return 'Please fill first name, last name, and relationship type for all dependants';
      }
      if (d.dob) {
        const isoPattern = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
        if (!isoPattern.test(d.dob)) return 'Date of birth must be in YYYY-MM-DD format';
        const dateVal = new Date(d.dob);
        if (Number.isNaN(dateVal.getTime())) return 'Invalid date of birth';
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

    const first = dependants[0];
    setIsLoading(true);
    try {
      const promise = addDependantForPatient(patient.id, first);
      toast.promise(promise, {
        loading: 'Adding dependant...',
        success: 'Dependant added successfully',
        error: (err) => err?.response?.data?.message || 'Failed to add dependant'
      }, { duration: 3000 });

      await promise;
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      console.error('AddDependantModal submit error', err);
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
            <h2 className="text-2xl font-bold text-base-content">Add Dependant</h2>
            <button type="button" onClick={handleCancel} className="btn btn-ghost btn-sm btn-circle">
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {dependants.map((dep, index) => (
                <div key={index} className="p-4 border rounded-lg border-base-300">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-semibold">Dependant Details</h3>
                    {dependants.length > 1 && (
                      <button type="button" className="btn btn-ghost btn-xs" onClick={() => removeRow(index)}>
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 text-sm text-base-content/70">First Name</label>
                      <input
                        type="text"
                        className="w-full input input-bordered"
                        value={dep.firstName}
                        onChange={(e) => handleChange(index, 'firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm text-base-content/70">Middle Name</label>
                      <input
                        type="text"
                        className="w-full input input-bordered"
                        value={dep.middleName}
                        onChange={(e) => handleChange(index, 'middleName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm text-base-content/70">Last Name</label>
                      <input
                        type="text"
                        className="w-full input input-bordered"
                        value={dep.lastName}
                        onChange={(e) => handleChange(index, 'lastName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm text-base-content/70">Date of Birth</label>
                      <input
                        type="date"
                        className="w-full input input-bordered"
                        value={dep.dob}
                        onChange={(e) => handleChange(index, 'dob', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm text-base-content/70">Gender</label>
                      <select
                        className="w-full select select-bordered"
                        value={dep.gender}
                        onChange={(e) => handleChange(index, 'gender', e.target.value)}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 text-sm text-base-content/70">Relationship Type</label>
                      <select
                        className="w-full select select-bordered"
                        value={dep.relationshipType}
                        onChange={(e) => handleChange(index, 'relationshipType', e.target.value)}
                      >
                        <option value="">Select relationship type</option>
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="child">Child</option>
                        <option value="others">Others</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end items-center">
              <button type="button" className="btn btn-outline hidden" onClick={addRow}>Add another</button>
              <div className="space-x-2">
                <button type="button" className="btn" onClick={handleCancel} disabled={isLoading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Dependant'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDependantModal;