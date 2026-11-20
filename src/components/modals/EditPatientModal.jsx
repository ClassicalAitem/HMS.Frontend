import React, { useState, useEffect } from 'react';
import { FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { editPatient } from '../../store/slices/patientsSlice';
import { updateDependant } from '@/services/api/dependantAPI';
import toast from 'react-hot-toast';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';
import { NIGERIAN_STATES, POPULAR_COUNTRIES } from '@/constants/locationConstants';
import { CARD_TYPE_LABELS, MAX_CARD_LIMIT, normalizeCardTypes } from '@/constants/cardTypes';

const EditPatientModal = ({ isOpen, onClose, patient, onSave }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const userRole = (user?.role || user?.accountType || '').toLowerCase().trim().replace(/_/g, '-');
  const canEditCardType = ['frontdesk', 'front-desk', 'super-admin', 'admin', 'developer'].includes(userRole) || !userRole;
  const existingCardTypes = normalizeCardTypes(patient?.cardTypes, patient?.cardType || 'personal');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [hmoExpanded, setHmoExpanded] = useState(false);
  const [dependentExpanded, setDependentExpanded] = useState(false);
  const [formData, setFormData] = useState({
    // Patient Basic Info
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    address: '',
    country: 'Nigeria',
    customCountry: '',
    stateOfOrigin: '',
    customState: '',
    town: '',
    LGA: '',
    dob: '',
    gender: '',
    cardType: 'personal',
    cardTypes: ['personal'],
    familyName: '',
    companyName: '',
    relationshipType: '',
    
    // Next of Kin
    nextOfKin: {
      name: '',
      phone: '',
      relationship: '',
      address: ''
    },
    
    // HMO (for display only - not editable in this modal)
    hmo: []
  });
  const addedCardTypes = formData.cardTypes.filter((type) => !existingCardTypes.includes(type));

  // Pre-populate form when patient data is available
  useEffect(() => {
    if (patient) {
      const patientCountry = patient.country || 'Nigeria';
      const isStandardCountry = POPULAR_COUNTRIES.includes(patientCountry) && patientCountry !== 'Other';
      const countryVal = isStandardCountry ? patientCountry : (patientCountry ? 'Other' : 'Nigeria');
      const customCountryVal = isStandardCountry ? '' : (patientCountry || '');

      const patientState = patient.stateOfOrigin || '';
      const isStandardState = NIGERIAN_STATES.includes(patientState);
      const stateVal = (countryVal === 'Nigeria' && isStandardState) ? patientState : (patientState ? 'Other' : '');
      const customStateVal = isStandardState ? '' : (patientState || '');

      const normalizedCards = normalizeCardTypes(patient.cardTypes, patient.cardType || 'personal');
      const activeCard = patient.cardType || normalizedCards[0] || 'personal';

      setFormData({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        middleName: patient.middleName || '',
        email: patient.email || '',
        phone: patient.phone || '',
        address: patient.address || '',
        country: countryVal,
        customCountry: customCountryVal,
        stateOfOrigin: stateVal,
        customState: customStateVal,
        town: patient.town || '',
        LGA: patient.LGA || '',
        dob: patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : '',
        gender: patient.gender || '',
        cardType: activeCard,
        cardTypes: normalizedCards,
        familyName: patient.familyName || '',
        companyName: patient.companyName || '',
        relationshipType: patient.relationshipType || '',
        
        nextOfKin: {
          name: patient.nextOfKin?.name || '',
          phone: patient.nextOfKin?.phone || '',
          relationship: patient.nextOfKin?.relationship || '',
          address: patient.nextOfKin?.address || ''
        },
        
        hmo: patient.hmos || []
      });
      setPaymentConfirmed(false);
    }
  }, [patient]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested nextOfKin fields
    if (name.startsWith('nextOfKin.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        nextOfKin: {
          ...prev.nextOfKin,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.cardTypes.length > MAX_CARD_LIMIT) {
      toast.error(`A patient can hold a maximum of ${MAX_CARD_LIMIT} cards`);
      return;
    }
    if (addedCardTypes.length > 0 && !paymentConfirmed) {
      toast.error('Confirm that payment for the new card was verified outside HMS');
      return;
    }
    if (formData.cardTypes.includes('family') && !(formData.familyName?.trim() || patient.familyName)) {
      toast.error('Family name is required for a family card');
      return;
    }
    if (formData.cardTypes.includes('company') && !(formData.companyName?.trim() || patient.companyName)) {
      toast.error('Company name is required for a company card');
      return;
    }
    setIsLoading(true);
    
    try {
      const targetId = patient.id || patient._id;
      console.log('🔄 EditPatientModal: Updating patient / subject:', targetId);
      console.log('📊 EditPatientModal: Raw form data:', formData);

      // Check if this is a dependant (safety guard)
      if (patient.relationshipType) {
        const depPayload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName || '',
          dob: formData.dob,
          gender: formData.gender,
          relationshipType: formData.relationshipType || patient.relationshipType,
          cardTypes: formData.cardTypes,
          cardType: formData.cardType || formData.cardTypes[0] || null,
          ...(formData.cardTypes.includes('family') && (formData.familyName?.trim() || patient.familyName) && {
            familyName: formData.familyName?.trim() || patient.familyName,
          }),
          ...(formData.cardTypes.includes('company') && (formData.companyName?.trim() || patient.companyName) && {
            companyName: formData.companyName?.trim() || patient.companyName,
          }),
          ...(addedCardTypes.length > 0 && { paymentConfirmed: true }),
        };
        const savePromise = updateDependant(targetId, depPayload);
        toast.promise(
          savePromise,
          {
            loading: 'Saving changes...',
            success: 'Dependant updated successfully',
            error: (err) => err?.response?.data?.message || 'Failed to update dependant',
          },
          { duration: 3000 }
        );
        const saved = await savePromise;
        onSave && onSave(saved?.data || saved);
        onClose();
        return;
      }

      // Compute effective country & state
      const effectiveCountry = formData.country === 'Other'
        ? (formData.customCountry?.trim() || 'Other')
        : (formData.country || 'Nigeria');

      const effectiveState = (formData.country === 'Nigeria' && formData.stateOfOrigin === 'Other')
        ? (formData.customState?.trim() || '')
        : (formData.country !== 'Nigeria' ? (formData.customState?.trim() || formData.stateOfOrigin?.trim() || '') : (formData.stateOfOrigin || ''));

      // Construct backend-compliant payload
      const updatePayload = {
        hospitalId: patient.hospitalId || '',
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName || '',
        dob: formData.dob, // already in YYYY-MM-DD
        gender: formData.gender,
        phone: formData.phone,
        address: formData.address,
        nextOfKin: {
          name: formData.nextOfKin.name,
          phone: formData.nextOfKin.phone,
          relationship: formData.nextOfKin.relationship,
        },
        status: patient.status || 'registered',
        cardTypes: formData.cardTypes,
        cardType: formData.cardType || formData.cardTypes[0] || 'personal',
        ...(formData.cardTypes.includes('family') && (formData.familyName?.trim() || patient.familyName) && {
          familyName: formData.familyName?.trim() || patient.familyName,
        }),
        ...(formData.cardTypes.includes('company') && (formData.companyName?.trim() || patient.companyName) && {
          companyName: formData.companyName?.trim() || patient.companyName,
        }),
        ...(addedCardTypes.length > 0 && { paymentConfirmed: true }),
        // Optional location and profile fields
        ...(effectiveCountry && { country: effectiveCountry }),
        ...(effectiveState && { stateOfOrigin: effectiveState }),
        ...(formData.email && { email: formData.email }),
        ...(formData.town && { town: formData.town }),
        ...(formData.LGA && { LGA: formData.LGA }),
      };

      console.log('📦 EditPatientModal: PATCH payload:', updatePayload);

      const savePromise = dispatch(editPatient({
        patientId: targetId,
        updateData: updatePayload
      })).unwrap();

      // Show a loading toast that resolves into success/error
      toast.promise(
        savePromise,
        {
          loading: 'Saving changes...',
          success: 'Patient updated successfully',
          error: (err) => err?.response?.data?.message || 'Failed to update patient',
        },
        {
          duration: 3000,
        }
      );

      const saved = await savePromise;
      onSave && onSave(saved?.data || saved);
      onClose();
    } catch (error) {
      console.error('❌ EditPatientModal: Update error:', error);
      // No additional toast here since toast.promise handles error messaging
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) { const btn = e.currentTarget.querySelector('button.btn-circle') || Array.from(e.currentTarget.querySelectorAll('button')).find(b => b.textContent.includes('\u2715') || b.textContent.toLowerCase().includes('cancel') || b.textContent.toLowerCase().includes('close')); if (btn) btn.click(); } }}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-opacity-50" onClick={handleCancel} />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl card bg-base-100">
        <div className="p-6 card-body">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-base-content">Edit Patients Information</h2>
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Information */}
            <div className="p-6 border rounded-lg border-base-300">
              <h3 className="mb-4 text-lg font-semibold text-base-content">Patient Information</h3>
              
              {/* Names Row */}
              <div className="mb-6">
                <h4 className="mb-3 text-base font-medium text-base-content">Names</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full input input-bordered"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full input input-bordered"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">Middle Name</label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleInputChange}
                      className="w-full input input-bordered"
                    />
                  </div>
                </div>
              </div>

              {/* Card Information */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-1">
                  <h4 className="text-base font-semibold text-base-content">Patient Cards</h4>
                  <span className="text-xs text-base-content/60">
                    Patients can have multiple cards (e.g. Personal + Antenatal). The frontdesk selects the active card for use.
                  </span>
                </div>

                {/* Registered Cards (Array of cards) */}
                <div className="p-4 rounded-lg bg-base-200/50 border border-base-300">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-base-content">
                      Registered Cards (Maximum {MAX_CARD_LIMIT} Cards)
                    </label>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${formData.cardTypes.length >= MAX_CARD_LIMIT ? 'bg-warning/20 text-warning-content' : 'text-base-content/60'}`}>
                      {formData.cardTypes.length}/{MAX_CARD_LIMIT} registered
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(CARD_TYPE_LABELS).map(([type, label]) => {
                      const registered = formData.cardTypes.includes(type);
                      const previouslyRegistered = existingCardTypes.includes(type);
                      const limitReached = !registered && formData.cardTypes.length >= MAX_CARD_LIMIT;
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
                            disabled={previouslyRegistered || !canEditCardType || limitReached}
                            onChange={(e) => {
                              if (e.target.checked && formData.cardTypes.length >= MAX_CARD_LIMIT) {
                                toast.error(`A patient can hold a maximum of ${MAX_CARD_LIMIT} cards`);
                                return;
                              }
                              setFormData((current) => {
                                const cardTypes = e.target.checked
                                  ? [...current.cardTypes, type]
                                  : current.cardTypes.filter((item) => item !== type);
                                const cardType = e.target.checked
                                  ? type
                                  : current.cardType === type
                                    ? (cardTypes[0] || 'personal')
                                    : current.cardType;
                                return {
                                  ...current,
                                  cardTypes,
                                  cardType,
                                };
                              });
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
                    Maximum {MAX_CARD_LIMIT} cards per patient. Patients can hold a Personal Card and an Antenatal Card alongside each other, or a Family Card and Antenatal Card.
                  </p>
                </div>

                {/* Active Card Selection */}
                <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-3">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-base-content/70">
                      Active Card for Current Visit *
                    </label>
                    <select
                      name="cardType"
                      value={formData.cardType}
                      disabled={!canEditCardType}
                      onChange={(e) => setFormData((current) => ({ ...current, cardType: e.target.value }))}
                      className="w-full select select-bordered"
                      required
                    >
                      {!formData.cardType && <option value="">Select active card</option>}
                      {formData.cardTypes.map((type) => (
                        <option key={type} value={type}>{CARD_TYPE_LABELS[type]} Card</option>
                      ))}
                    </select>
                    <span className="text-xs text-base-content/60">
                      Frontdesk chooses which registered card is active for use at the moment.
                    </span>
                  </div>

                  {formData.cardTypes.includes('family') && (
                    <div>
                      <label className="block mb-1 text-sm font-medium text-base-content/70">
                        Family Name {formData.cardType === 'family' ? '*' : ''}
                      </label>
                      <input
                        type="text"
                        name="familyName"
                        value={formData.familyName}
                        disabled={!canEditCardType}
                        onChange={handleInputChange}
                        placeholder="e.g. Adebayo Family"
                        className="w-full input input-bordered"
                        required={formData.cardType === 'family'}
                      />
                    </div>
                  )}

                  {formData.cardTypes.includes('company') && (
                    <div>
                      <label className="block mb-1 text-sm font-medium text-base-content/70">
                        Company Name {formData.cardType === 'company' ? '*' : ''}
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        disabled={!canEditCardType}
                        onChange={handleInputChange}
                        placeholder="e.g. Acme Corp"
                        className="w-full input input-bordered"
                        required={formData.cardType === 'company'}
                      />
                    </div>
                  )}
                </div>

                {addedCardTypes.length > 0 && (
                  <label className="mt-3 flex items-start gap-2 text-sm p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-warning mt-0.5"
                      checked={paymentConfirmed}
                      onChange={(e) => setPaymentConfirmed(e.target.checked)}
                    />
                    <span>
                      I confirm the card payment for newly added card ({addedCardTypes.map(t => CARD_TYPE_LABELS[t]).join(', ')}) was verified outside HMS.
                    </span>
                  </label>
                )}
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm text-base-content/70">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full input input-bordered"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm text-base-content/70">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full input input-bordered"
                    required
                  />
                </div>
              </div>

              {/* Address */}
              <div className="mb-6">
                <label className="block mb-1 text-sm text-base-content/70">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full textarea textarea-bordered"
                  rows={3}
                />
              </div>

              {/* DOB and Gender */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm text-base-content/70">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full input input-bordered"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm text-base-content/70">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full select select-bordered"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {/* Country, State, Town, LGA Grid */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Country */}
                <div>
                  <h4 className="mb-3 text-base font-medium text-base-content">Country</h4>
                  <label className="block mb-1 text-sm text-base-content/70">Country</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        country: val,
                        ...(val !== 'Other' ? { customCountry: '' } : {})
                      }));
                    }}
                    className="w-full select select-bordered"
                  >
                    {POPULAR_COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {formData.country === 'Other' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        name="customCountry"
                        value={formData.customCountry}
                        onChange={handleInputChange}
                        placeholder="Type country name..."
                        className="w-full input input-bordered input-sm"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* State of Origin / Province */}
                <div>
                  <h4 className="mb-3 text-base font-medium text-base-content">
                    {formData.country === 'Nigeria' ? 'State of Origin' : 'State / Province'}
                  </h4>
                  <label className="block mb-1 text-sm text-base-content/70">
                    {formData.country === 'Nigeria' ? 'SOO' : 'State / Province'}
                  </label>
                  {formData.country === 'Nigeria' ? (
                    <>
                      <select
                        name="stateOfOrigin"
                        value={formData.stateOfOrigin}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            stateOfOrigin: val,
                            ...(val !== 'Other' ? { customState: '' } : {})
                          }));
                        }}
                        className="w-full select select-bordered"
                      >
                        <option value="">Select State</option>
                        {NIGERIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                        <option value="Other">Other (Custom State)</option>
                      </select>
                      {formData.stateOfOrigin === 'Other' && (
                        <div className="mt-2">
                          <input
                            type="text"
                            name="customState"
                            value={formData.customState}
                            onChange={handleInputChange}
                            placeholder="Type state name..."
                            className="w-full input input-bordered input-sm"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <input
                      type="text"
                      name="customState"
                      value={formData.customState}
                      onChange={handleInputChange}
                      placeholder="e.g. Greater Accra, Texas..."
                      className="w-full input input-bordered"
                    />
                  )}
                </div>

                {/* Town */}
                <div>
                  <h4 className="mb-3 text-base font-medium text-base-content">Town / City</h4>
                  <label className="block mb-1 text-sm text-base-content/70">Town</label>
                  <input
                    type="text"
                    name="town"
                    value={formData.town}
                    onChange={handleInputChange}
                    placeholder="e.g. Ikeja"
                    className="w-full input input-bordered"
                  />
                </div>

                {/* LGA */}
                <div>
                  <h4 className="mb-3 text-base font-medium text-base-content">
                    {formData.country === 'Nigeria' ? 'Local Gov Area' : 'District / County'}
                  </h4>
                  <label className="block mb-1 text-sm text-base-content/70">
                    {formData.country === 'Nigeria' ? 'LGA' : 'District'}
                  </label>
                  <input
                    type="text"
                    name="LGA"
                    value={formData.LGA}
                    onChange={handleInputChange}
                    placeholder={formData.country === 'Nigeria' ? 'e.g. Ikeja' : 'District/County'}
                    className="w-full input input-bordered"
                  />
                </div>
              </div>
            </div>

            {/* Next of Kin Information */}
            <div className="p-6 border rounded-lg border-base-300">
              <h3 className="mb-4 text-lg font-semibold text-base-content">Next of Kin Information</h3>
              
              <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm text-base-content/70">Name</label>
                  <input
                    type="text"
                    name="nextOfKin.name"
                    value={formData.nextOfKin.name}
                    onChange={handleInputChange}
                    className="w-full input input-bordered"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm text-base-content/70">Phone Number</label>
                  <input
                    type="tel"
                    name="nextOfKin.phone"
                    value={formData.nextOfKin.phone}
                    onChange={handleInputChange}
                    className="w-full input input-bordered"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm text-base-content/70">Relationship</label>
                  <select
                    name="nextOfKin.relationship"
                    value={formData.nextOfKin.relationship}
                    onChange={handleInputChange}
                    className="w-full select select-bordered"
                  >
                    <option value="">Select Relationship</option>
                     <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="child">Child</option>
                        <option value="others">Others</option>
                        <option value="spouse">Spouse</option>
                        <option value="sibling">Sibling</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm text-base-content/70">Address</label>
                  <textarea
                    name="nextOfKin.address"
                    value={formData.nextOfKin.address}
                    onChange={handleInputChange}
                    className="w-full textarea textarea-bordered"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* HMO Information (Read-only) */}
            {formData.hmo && formData.hmo.length > 0 && (
              <div className="p-6 border rounded-lg border-base-300">
                <h3 className="mb-4 text-lg font-semibold text-base-content">HMO Information</h3>
                <div className="space-y-4">
                  {formData.hmo.map((hmo, index) => (
                    <div key={index} className="p-4 bg-base-200 rounded-lg">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block mb-1 text-sm text-base-content/70">Provider</label>
                          <p className="text-base-content font-medium">{hmo.provider}</p>
                        </div>
                        <div>
                          <label className="block mb-1 text-sm text-base-content/70">Member ID</label>
                          <p className="text-base-content font-medium">{hmo.memberId}</p>
                        </div>
                        <div>
                          <label className="block mb-1 text-sm text-base-content/70">Plan</label>
                          <p className="text-base-content font-medium">{hmo.plan || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block mb-1 text-sm text-base-content/70">Expires</label>
                          <p className="text-base-content font-medium">
                            {hmo.expiresAt ? formatNigeriaDate(hmo.expiresAt) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-sm text-base-content/60">
                  Note: HMO information cannot be edited through this form. Contact administration for HMO updates.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center pt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-outline"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Updating...
                  </>
                ) : (
                  'Save Details'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPatientModal;

