/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useAppDispatch } from '../../store/hooks';
import { editPatient } from '../../store/slices/patientsSlice';
import toast from 'react-hot-toast';

const EditPatientModal = ({ isOpen, onClose, patient, onSave }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
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
    dob: '',
    gender: '',
    
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

  // Pre-populate form when patient data is available
  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        middleName: patient.middleName || '',
        email: patient.email || '',
        phone: patient.phone || '',
        address: patient.address || '',
        dob: patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : '',
        gender: patient.gender || '',
        
        nextOfKin: {
          name: patient.nextOfKin?.name || '',
          phone: patient.nextOfKin?.phone || '',
          relationship: patient.nextOfKin?.relationship || '',
          address: patient.nextOfKin?.address || ''
        },
        
        hmo: patient.hmos || []
      });
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
    setIsLoading(true);
    
    try {
      console.log('🔄 EditPatientModal: Updating patient:', patient.id);
      console.log('📊 EditPatientModal: Raw form data:', formData);

      // Construct backend-compliant payload
      const updatePayload = {
        hospitalId: patient.hospitalId || '',
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName || '',
        dob: formData.dob, // already in YYYY-MM-DD
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        nextOfKin: {
          name: formData.nextOfKin.name,
          phone: formData.nextOfKin.phone,
          relationship: formData.nextOfKin.relationship,
        },
        status: patient.status || 'registered',
      };

      console.log('📦 EditPatientModal: PATCH payload:', updatePayload);

      const savePromise = dispatch(editPatient({
        patientId: patient.id,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleCancel} />
      
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

              {/* State, Town, LGA Row */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <h4 className="mb-3 text-base font-medium text-base-content">State Of Origin</h4>
                  <label className="block mb-1 text-sm text-base-content/70">SOO</label>
                  <select
                    name="stateOfOrigin"
                    value={formData.stateOfOrigin}
                    onChange={handleInputChange}
                    className="w-full select select-bordered"
                  >
                   <option value="Abia">Abia</option>
                    <option value="Adamawa">Adamawa</option>
                    <option value="Akwa Ibom">Akwa Ibom</option>
                    <option value="Anambra">Anambra</option>
                    <option value="Bauchi">Bauchi</option>
                    <option value="Bayelsa">Bayelsa</option>
                    <option value="Benue">Benue</option>
                    <option value="Borno">Borno</option>
                    <option value="Cross River">Cross River</option>
                    <option value="Delta">Delta</option>
                    <option value="Ebonyi">Ebonyi</option>
                    <option value="Edo">Edo</option>
                    <option value="Ekiti">Ekiti</option>
                    <option value="Enugu">Enugu</option>
                    <option value="Gombe">Gombe</option>
                    <option value="Imo">Imo</option>
                    <option value="Jigawa">Jigawa</option>
                    <option value="Kaduna">Kaduna</option>
                    <option value="Kano">Kano</option>
                    <option value="Katsina">Katsina</option>
                    <option value="Kebbi">Kebbi</option>
                    <option value="Kogi">Kogi</option>
                    <option value="Kwara">Kwara</option>
                    <option value="Lagos">Lagos</option>
                    <option value="Nasarawa">Nasarawa</option>
                    <option value="Niger">Niger</option>
                    <option value="Ogun">Ogun</option>
                    <option value="Ondo">Ondo</option>
                    <option value="Osun">Osun</option>
                    <option value="Oyo">Oyo</option>
                    <option value="Plateau">Plateau</option>
                    <option value="Rivers">Rivers</option>
                    <option value="Sokoto">Sokoto</option>
                    <option value="Taraba">Taraba</option>
                    <option value="Yobe">Yobe</option>
                    <option value="Zamfara">Zamfara</option>

                  </select>
                </div>
                <div>
                  <h4 className="mb-3 text-base font-medium text-base-content">Town</h4>
                  <label className="block mb-1 text-sm text-base-content/70">Town</label>
                  <input
                    type="text"
                    name="town"
                    value={formData.town}
                    onChange={handleInputChange}
                    className="w-full input input-bordered"
                  />
                </div>
                <div>
                  <h4 className="mb-3 text-base font-medium text-base-content">LGA</h4>
                  <label className="block mb-1 text-sm text-base-content/70">Local Gov Area</label>
                  <input
                    type="text"
                    name="lga"
                    value={formData.lga}
                    onChange={handleInputChange}
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
                    <option value="spouse">Spouse</option>
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                    <option value="sibling">Sibling</option>
                    <option value="friend">Friend</option>
                    <option value="other">Other</option>
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
                            {hmo.expiresAt ? new Date(hmo.expiresAt).toLocaleDateString() : 'N/A'}
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

