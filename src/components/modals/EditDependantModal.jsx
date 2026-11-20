import React, { useMemo, useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { updateDependant } from '@/services/api/dependantAPI';
import { getErrorMessage } from '@/utils/errorHandler';
import { useAppSelector } from '@/store/hooks';
import { CARD_TYPE_LABELS, MAX_CARD_LIMIT, getDependantCardTypes, normalizeCardTypes } from '@/constants/cardTypes';

const EditDependantModal = ({ isOpen, onClose, patient, initialDependantId, onSuccess }) => {
  const { user } = useAppSelector((state) => state.auth);
  const userRole = (user?.role || user?.accountType || '').toLowerCase().trim().replace(/_/g, '-');
  const canEditCardType = ['frontdesk', 'front-desk', 'super-admin', 'admin', 'developer'].includes(userRole) || !userRole;
  const dependants = useMemo(() => patient?.dependants || [], [patient]);
  const [selectedDependantId, setSelectedDependantId] = useState('');
  const selectedDependant = dependants.find((d) => (d.id || d._id) === selectedDependantId) || {};
  const originalCardTypes = getDependantCardTypes(selectedDependant);
  const guardianCardTypes = normalizeCardTypes(patient?.cardTypes, patient?.cardType);
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    gender: '',
    relationshipType: '',
    cardType: '',
    cardTypes: [],
    familyName: '',
    companyName: ''
  });
  const addedCardTypes = form.cardTypes.filter((type) => !originalCardTypes.includes(type));
  const inheritedFamilyAvailable =
    guardianCardTypes.includes('family') && !form.cardTypes.includes('family');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    if (isOpen && dependants.length > 0) {
      const targetId = (initialDependantId && dependants.find(d => (d.id || d._id) === initialDependantId))
        ? initialDependantId
        : (dependants[0]?.id || dependants[0]?._id || '');
      setSelectedDependantId(targetId);
      const initial = dependants.find(d => (d.id || d._id) === targetId) || dependants[0] || {};
      setForm({
        firstName: initial.firstName || '',
        middleName: initial.middleName || '',
        lastName: initial.lastName || '',
        dob: initial.dob ? String(initial.dob).split('T')[0] : '',
        gender: (initial.gender || '').toLowerCase(),
        relationshipType: initial.relationshipType || '',
        cardType: initial.cardType || '',
        cardTypes: getDependantCardTypes(initial),
        familyName: initial.familyName || '',
        companyName: initial.companyName || ''
      });
      setPaymentConfirmed(false);
    } else {
      setSelectedDependantId('');
      setForm({ firstName: '', middleName: '', lastName: '', dob: '', gender: '', relationshipType: '', cardType: '', cardTypes: [], familyName: '', companyName: '' });
      setPaymentConfirmed(false);
    }
  }, [isOpen, dependants, initialDependantId]);

  if (!isOpen || !patient) return null;

  const onSelectChange = (id) => {
    setSelectedDependantId(id);
    const selected = dependants.find(d => (d.id || d._id) === id) || {};
    setForm({
      firstName: selected.firstName || '',
      middleName: selected.middleName || '',
      lastName: selected.lastName || '',
      dob: selected.dob || '',
      gender: (selected.gender || '').toLowerCase(),
      relationshipType: selected.relationshipType || '',
      cardType: selected.cardType || '',
      cardTypes: getDependantCardTypes(selected),
      familyName: selected.familyName || '',
      companyName: selected.companyName || ''
    });
    setPaymentConfirmed(false);
  };

const handleChange = (field, value) =>
  setForm(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!selectedDependantId) return 'Please select a dependant to update';
    if (!form.firstName || !form.lastName || !form.relationshipType) {
      return 'First name, last name, and relationship type are required';
    }
    if (form.cardTypes.length > MAX_CARD_LIMIT) {
      return `A dependant can hold a maximum of ${MAX_CARD_LIMIT} cards`;
    }
    if (canEditCardType && addedCardTypes.length > 0 && !paymentConfirmed) {
      return 'Confirm that payment for the new card was verified outside HMS';
    }
    if (canEditCardType && form.cardTypes.includes('family') && !form.familyName.trim()) return 'Family name is required for a family card';
    if (canEditCardType && form.cardTypes.includes('company') && !form.companyName.trim()) return 'Company name is required for a company card';
    if (form.dob) {
      const isoPattern = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
      if (!isoPattern.test(form.dob)) return 'Date of birth must be in YYYY-MM-DD format';
      const d = new Date(form.dob);
      if (Number.isNaN(d.getTime())) return 'Invalid date of birth';
    }
    return null;
  };

  const collectChangedFields = () => {
    const original = dependants.find(d => (d.id || d._id) === selectedDependantId) || {};
    const payload = {};
    Object.entries(form).forEach(([key, val]) => {
      if (['cardType', 'cardTypes', 'familyName', 'companyName'].includes(key)) return;
      const origVal = (original[key] || '').toString().toLowerCase();
      const newVal = (val || '').toString().toLowerCase();
      if (val !== undefined && newVal !== origVal) payload[key] = val || null;
    });
    const originalCardTypes = getDependantCardTypes(original);
    const cardListChanged =
      form.cardTypes.length !== originalCardTypes.length ||
      form.cardTypes.some((type) => !originalCardTypes.includes(type));
    if (
      canEditCardType &&
      (cardListChanged || (form.cardType || null) !== (original.cardType || null))
    ) {
      payload.cardTypes = form.cardTypes;
      if ((form.cardType || null) !== (original.cardType || null)) {
        payload.cardType = form.cardType || null;
      }
      if (form.cardTypes.includes('family')) payload.familyName = form.familyName || null;
      if (form.cardTypes.includes('company')) payload.companyName = form.companyName || null;
      if (addedCardTypes.length > 0) payload.paymentConfirmed = true;
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(getErrorMessage(err)); return; }

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
        error: (e) => getErrorMessage(e, 'Failed to update dependant'),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) { const btn = e.currentTarget.querySelector('button.btn-circle') || Array.from(e.currentTarget.querySelectorAll('button')).find(b => b.textContent.includes('\u2715') || b.textContent.toLowerCase().includes('cancel') || b.textContent.toLowerCase().includes('close')); if (btn) btn.click(); } }}>
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
                    <option key={d.id || d._id || `${d.firstName}-${d.lastName}`} value={d.id || d._id || ''}>
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
                      <select
                        className="w-full select select-bordered"
                        value={form.relationshipType}
                        onChange={(e) => handleChange( 'relationshipType', e.target.value)}
                      >
                        <option value="">Select relationship type</option>
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="child">Child</option>
                        <option value="others">Others</option>
                        <option value="spouse">Spouse</option>
                        <option value="sibling">Sibling</option>
                      </select>
                    </div>
            </div>

            {canEditCardType && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-base-content">
                      Registered cards for this dependant (Maximum {MAX_CARD_LIMIT} Cards)
                    </h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${form.cardTypes.length >= MAX_CARD_LIMIT ? 'bg-warning/20 text-warning-content' : 'text-base-content/60'}`}>
                      {form.cardTypes.length}/{MAX_CARD_LIMIT} registered
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(CARD_TYPE_LABELS).map(([type, label]) => {
                      const registered = form.cardTypes.includes(type);
                      const previouslyRegistered = originalCardTypes.includes(type);
                      const limitReached = !registered && form.cardTypes.length >= MAX_CARD_LIMIT;
                      return (
                        <label
                          key={type}
                          className={`flex items-center gap-2 text-sm ${previouslyRegistered ? 'cursor-not-allowed opacity-80' : limitReached ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          title={limitReached ? `Maximum limit of ${MAX_CARD_LIMIT} cards reached` : ''}
                        >
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={registered}
                            disabled={previouslyRegistered || limitReached}
                            onChange={(e) => {
                              if (e.target.checked && form.cardTypes.length >= MAX_CARD_LIMIT) {
                                toast.error(`A dependant can hold a maximum of ${MAX_CARD_LIMIT} cards`);
                                return;
                              }
                              setForm((current) => ({
                                ...current,
                                cardTypes: e.target.checked
                                  ? [...current.cardTypes, type]
                                  : current.cardTypes.filter((item) => item !== type),
                                cardType: e.target.checked
                                  ? type
                                  : current.cardType === type
                                    ? ''
                                    : current.cardType,
                              }));
                              if (e.target.checked) setPaymentConfirmed(false);
                            }}
                          />
                          <span className={registered ? "font-semibold text-primary" : ""}>
                            {label} Card {previouslyRegistered && <span className="text-xs text-base-content/50">(Registered)</span>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-base-content/60">
                    Registered cards cannot be removed. Dependants can hold a maximum of {MAX_CARD_LIMIT} cards. Adding a card requires payment confirmation outside HMS.
                  </p>
                </div>

                <div>
                  <label className="block mb-1 text-sm text-base-content/70">Current card for future visits</label>
                  <select
                    className="w-full select select-bordered"
                    value={form.cardType}
                    onChange={(e) => handleChange('cardType', e.target.value)}
                  >
                    <option value="">No individual card selected</option>
                    {form.cardTypes.map((type) => (
                      <option key={type} value={type}>{CARD_TYPE_LABELS[type]} Card</option>
                    ))}
                    {inheritedFamilyAvailable && (
                      <option value="family">Family Card (guardian coverage)</option>
                    )}
                  </select>
                  {inheritedFamilyAvailable && (
                    <p className="mt-1 text-xs text-base-content/60">
                      The guardian's family card is available without changing the guardian's card or registering a separate family card.
                    </p>
                  )}
                  {form.cardTypes.includes('family') && (
                    <input
                      type="text"
                      className="mt-2 w-full input input-bordered"
                      placeholder="Family name"
                      value={form.familyName}
                      onChange={(e) => handleChange('familyName', e.target.value)}
                    />
                  )}
                  {form.cardTypes.includes('company') && (
                    <input
                      type="text"
                      className="mt-2 w-full input input-bordered"
                      placeholder="Company name"
                      value={form.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                    />
                  )}
                </div>

                {addedCardTypes.length > 0 && (
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5 checkbox checkbox-sm checkbox-primary"
                      checked={paymentConfirmed}
                      onChange={(e) => setPaymentConfirmed(e.target.checked)}
                    />
                    <span>I confirm payment for the added card was verified outside HMS.</span>
                  </label>
                )}
              </div>
            )}

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