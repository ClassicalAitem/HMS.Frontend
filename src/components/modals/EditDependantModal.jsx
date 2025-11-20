/* eslint-disable no-unused-vars */
import React, { useMemo, useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { updateDependant } from '@/services/api/dependantAPI';

const EditDependantModal = ({ isOpen, onClose, patient, onSuccess }) => {
  const dependants = useMemo(() => patient?.dependants || [], [patient]);
  const [selectedDependantId, setSelectedDependantId] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    gender: '',
    relationshipType: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && dependants.length > 0) {
      const initialId = dependants[0]?.id || '';
      setSelectedDependantId(initialId);
      const initial = dependants.find(d => (d.id || '') === initialId) || {};
      setForm({
        firstName: initial.firstName || '',
        middleName: initial.middleName || '',
        lastName: initial.lastName || '',
        dob: initial.dob || '',
        gender: (initial.gender || '').toLowerCase(),
        relationshipType: initial.relationshipType || ''
      });
    } else {
      setSelectedDependantId('');
      setForm({ firstName: '', middleName: '', lastName: '', dob: '', gender: '', relationshipType: '' });
    }
  }, [isOpen, dependants]);

  if (!isOpen || !patient) return null;

  const onSelectChange = (id) => {
    setSelectedDependantId(id);
    const selected = dependants.find(d => (d.id || '') === id) || {};
    setForm({
      firstName: selected.firstName || '',
      middleName: selected.middleName || '',
      lastName: selected.lastName || '',
      dob: selected.dob || '',
      gender: (selected.gender || '').toLowerCase(),
      relationshipType: selected.relationshipType || ''
    });
  };

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!selectedDependantId) return 'Please select a dependant to update';
    if (!form.firstName || !form.lastName || !form.relationshipType) {
      return 'First name, last name, and relationship type are required';
    }
    if (form.dob) {
      const isoPattern = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
      if (!isoPattern.test(form.dob)) return 'Date of birth must be in YYYY-MM-DD format';
      const d = new Date(form.dob);
      if (Number.isNaN(d.getTime())) return 'Invalid date of birth';
    }
    return null;
  };

  const collectChangedFields = () => {
    const original = dependants.find(d => (d.id || '') === selectedDependantId) || {};
    const payload = {};
    Object.entries(form).forEach(([key, val]) => {
      const origVal = (original[key] || '').toString().toLowerCase();
      const newVal = (val || '').toString().toLowerCase();
      if (val !== undefined && newVal !== origVal) payload[key] = val;
    });
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }

    const updates = collectChangedFields();
    if (Object.keys(updates).length === 0) {
      toast('No changes detected', { icon: 'ℹ️' });
      return;
    }

    setIsLoading(true);
    try {
      const promise = updateDependant(selectedDependantId, updates);
      toast.promise(promise, {
        loading: 'Updating dependant...',
        success: 'Dependant updated successfully',
        error: (e) => e?.response?.data?.message || 'Failed to update dependant',
      }, { duration: 3000 });

      await promise;
      onSuccess && onSuccess();
      onClose();
    } catch (e) {
      console.error('EditDependantModal error', e);
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
            <h2 className="text-2xl font-bold text-base-content">Edit Dependant</h2>
            <button type="button" onClick={handleCancel} className="btn btn-ghost btn-sm btn-circle">
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dependant selection */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm text-base-content/70">Dependant</label>
                <select
                  className="w-full select select-bordered"
                  value={selectedDependantId}
                  onChange={(e) => onSelectChange(e.target.value)}
                  required
                  disabled={dependants.length === 0}
                >
                  {dependants.length === 0 && <option value="">No dependants</option>}
                  {dependants.map((d) => (
                    <option key={d.id || `${d.firstName}-${d.lastName}`} value={d.id || ''}>
                      {d.firstName} {d.middleName ? d.middleName + ' ' : ''}{d.lastName} ({d.relationshipType || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm text-base-content/70">Date of Birth</label>
                <input
                  type="date"
                  className="w-full input input-bordered"
                  value={form.dob}
                  onChange={(e) => handleChange('dob', e.target.value)}
                />
              </div>
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm text-base-content/70">First Name</label>
                <input
                  type="text"
                  className="w-full input input-bordered"
                  value={form.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-base-content/70">Middle Name</label>
                <input
                  type="text"
                  className="w-full input input-bordered"
                  value={form.middleName}
                  onChange={(e) => handleChange('middleName', e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-base-content/70">Last Name</label>
                <input
                  type="text"
                  className="w-full input input-bordered"
                  value={form.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-base-content/70">Gender</label>
                <select
                  className="w-full select select-bordered"
                  value={form.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm text-base-content/70">Relationship Type</label>
                <input
                  type="text"
                  className="w-full input input-bordered"
                  value={form.relationshipType}
                  onChange={(e) => handleChange('relationshipType', e.target.value)}
                  placeholder="e.g., child, spouse"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button type="button" className="btn" onClick={handleCancel} disabled={isLoading}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isLoading || dependants.length === 0}>
                {isLoading ? 'Saving...' : 'Update Dependant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditDependantModal;