/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const EditPatientModal = ({ isOpen, onClose, patient, onSave }) => {
  const [hmoExpanded, setHmoExpanded] = useState(false);
  const [dependentExpanded, setDependentExpanded] = useState(false);
  const [formData, setFormData] = useState({
    // First Section
    surname: '',
    firstName: '',
    middleName: '',
    address: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    stateOfOrigin: '',
    town: '',
    lga: '',
    
    // Second Section - Next of Kin
    nokFirstName: '',
    nokLastName: '',
    nokRelationship: '',
    nokPhoneNumber: '',
    nokAddress: '',
    
    // HMO Section
    hmoProvider: '',
    hmoNumber: '',
    hmoPlan: '',
    hmoExpiringDate: '',
    
    // Dependent Section
    dependentFirstName: '',
    dependentLastName: '',
    dependentRelationship: '',
    dependentPhoneNumber: ''
  });

  // Pre-populate form when patient data is available
  useEffect(() => {
    if (patient) {
      setFormData({
        surname: patient.surname || 'Malik',
        firstName: patient.firstName || 'Williamson',
        middleName: patient.middleName || 'Cameron',
        address: patient.address || '4517 Washington Ave. Manchester, Kentucky 39495',
        phoneNumber: patient.phoneNumber || '11111111111',
        dateOfBirth: patient.dateOfBirth || '08/02/19',
        gender: patient.gender || 'Female',
        stateOfOrigin: patient.stateOfOrigin || 'Ogun State',
        town: patient.town || 'Aba North',
        lga: patient.lga || 'Aba North',
        
        nokFirstName: patient.nokFirstName || 'Esther Howard',
        nokLastName: patient.nokLastName || 'Sister',
        nokRelationship: patient.nokRelationship || 'Sister',
        nokPhoneNumber: patient.nokPhoneNumber || '(603) 555-0123',
        nokAddress: patient.nokAddress || '4517 Washington Ave. Manchester, Kentucky 39495',
        
        hmoProvider: patient.hmoProvider || 'Avon Industries',
        hmoNumber: patient.hmoNumber || '091919',
        hmoPlan: patient.hmoPlan || 'Premium',
        hmoExpiringDate: patient.hmoExpiringDate || 'April 2025',
        
        dependentFirstName: patient.dependentFirstName || 'Tosan',
        dependentLastName: patient.dependentLastName || 'Tosanade',
        dependentRelationship: patient.dependentRelationship || 'Wife',
        dependentPhoneNumber: patient.dependentPhoneNumber || '0909000000'
      });
    }
  }, [patient]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
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
            {/* First Section */}
            <div className="p-6 border rounded-lg border-base-300">
              <h3 className="mb-4 text-lg font-semibold text-base-content">First Section</h3>
              
              {/* Names Row */}
              <div className="mb-6">
                <h4 className="mb-3 text-base font-medium text-base-content">Names</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">Surname</label>
                    <input
                      type="text"
                      name="surname"
                      value={formData.surname}
                      onChange={handleInputChange}
                      className="w-full input input-bordered"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full input input-bordered"
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

              {/* Address */}
              <div className="mb-6">
                <h4 className="mb-3 text-base font-medium text-base-content">Address</h4>
                <div>
                  <label className="block mb-1 text-sm text-base-content/70">enter your address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full textarea textarea-bordered"
                    rows={3}
                  />
                </div>
              </div>

              {/* Phone, DOB, Gender Row */}
              <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
                <div>
                  <h4 className="mb-3 text-base font-medium text-base-content">Phone Number</h4>
                  <label className="block mb-1 text-sm text-base-content/70">Enter Your Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full input input-bordered"
                  />
                </div>
                <div>
                  <h4 className="mb-3 text-base font-medium text-base-content">Date Of Birth</h4>
                  <label className="block mb-1 text-sm text-base-content/70">DD/MM/YY</label>
                  <input
                    type="text"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full input input-bordered"
                  />
                </div>
                <div>
                  <h4 className="mb-3 text-base font-medium text-base-content">Gender</h4>
                  <label className="block mb-1 text-sm text-base-content/70">M / F</label>
                  <input
                    type="text"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full input input-bordered"
                  />
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
                    <option value="Ogun State">Ogun State</option>
                    <option value="Lagos">Lagos</option>
                    <option value="Oyo">Oyo</option>
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

            {/* Second Section */}
            <div className="p-6 border rounded-lg border-base-300">
              <h3 className="mb-4 text-lg font-semibold text-base-content">Second Section</h3>
              
              {/* Next of Kin */}
              <div className="mb-6">
                <h4 className="mb-3 text-base font-medium text-base-content">Next Of Kin</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">First name</label>
                    <input
                      type="text"
                      name="nokFirstName"
                      value={formData.nokFirstName}
                      onChange={handleInputChange}
                      className="w-full input input-bordered"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">Last Name</label>
                    <input
                      type="text"
                      name="nokLastName"
                      value={formData.nokLastName}
                      onChange={handleInputChange}
                      className="w-full input input-bordered"
                    />
                  </div>
                </div>
              </div>

              {/* Relationship and Phone */}
              <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-3 text-base font-medium text-base-content">Relationship</h4>
                  <label className="block mb-1 text-sm text-base-content/70">Relationship</label>
                  <input
                    type="text"
                    name="nokRelationship"
                    value={formData.nokRelationship}
                    onChange={handleInputChange}
                    className="w-full input input-bordered"
                  />
                </div>
                <div>
                  <h4 className="mb-3 text-base font-medium text-base-content">Phone Number</h4>
                  <label className="block mb-1 text-sm text-base-content/70">Enter Your Phone Number</label>
                  <input
                    type="tel"
                    name="nokPhoneNumber"
                    value={formData.nokPhoneNumber}
                    onChange={handleInputChange}
                    className="w-full input input-bordered"
                  />
                </div>
              </div>

              {/* NOK Address */}
              <div>
                <h4 className="mb-3 text-base font-medium text-base-content">Address</h4>
                <label className="block mb-1 text-sm text-base-content/70">enter your address</label>
                <textarea
                  name="nokAddress"
                  value={formData.nokAddress}
                  onChange={handleInputChange}
                  className="w-full textarea textarea-bordered"
                  rows={3}
                />
              </div>
            </div>

            {/* Connected HMO */}
            <div className="p-6 border rounded-lg border-base-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-base-content">Connected HMO</h3>
                <button
                  type="button"
                  className="text-sm btn btn-outline btn-sm text-primary"
                >
                  Remove
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 text-base font-medium text-base-content">HMO Provider</h4>
                    <label className="block mb-1 text-sm text-base-content/70">Enter provider</label>
                    <input
                      type="text"
                      name="hmoProvider"
                      value={formData.hmoProvider}
                      onChange={handleInputChange}
                      className="w-full input input-bordered"
                    />
                  </div>
                  <div>
                    <h4 className="mb-3 text-base font-medium text-base-content">HMO Number</h4>
                    <label className="block mb-1 text-sm text-base-content/70">Enter HMO Number</label>
                    <input
                      type="text"
                      name="hmoNumber"
                      value={formData.hmoNumber}
                      onChange={handleInputChange}
                      className="w-full input input-bordered"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 text-base font-medium text-base-content">HMO plan</h4>
                    <label className="block mb-1 text-sm text-base-content/70">HMO Plan</label>
                    <input
                      type="text"
                      name="hmoPlan"
                      value={formData.hmoPlan}
                      onChange={handleInputChange}
                      className="w-full input input-bordered"
                    />
                  </div>
                  <div>
                    <h4 className="mb-3 text-base font-medium text-base-content">Add Expiring Date</h4>
                    <label className="block mb-1 text-sm text-base-content/70">Enter expiring Date</label>
                    <input
                      type="text"
                      name="hmoExpiringDate"
                      value={formData.hmoExpiringDate}
                      onChange={handleInputChange}
                      className="w-full input input-bordered"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Change or add new dependent */}
            <div className="p-6 border rounded-lg border-base-300">
              <button
                type="button"
                onClick={() => setDependentExpanded(!dependentExpanded)}
                className="flex justify-between items-center w-full mb-4 text-lg font-semibold text-left text-base-content"
              >
                Change or add new dependent
                {dependentExpanded ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              
              {dependentExpanded && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="mb-3 text-base font-medium text-base-content">First Name</h4>
                      <label className="block mb-1 text-sm text-base-content/70">Name</label>
                      <input
                        type="text"
                        name="dependentFirstName"
                        value={formData.dependentFirstName}
                        onChange={handleInputChange}
                        className="w-full input input-bordered"
                      />
                    </div>
                    <div>
                      <h4 className="mb-3 text-base font-medium text-base-content">Last Name</h4>
                      <label className="block mb-1 text-sm text-base-content/70">Name</label>
                      <input
                        type="text"
                        name="dependentLastName"
                        value={formData.dependentLastName}
                        onChange={handleInputChange}
                        className="w-full input input-bordered"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="mb-3 text-base font-medium text-base-content">Relationship</h4>
                      <label className="block mb-1 text-sm text-base-content/70">Enter Relationship</label>
                      <select
                        name="dependentRelationship"
                        value={formData.dependentRelationship}
                        onChange={handleInputChange}
                        className="w-full select select-bordered"
                      >
                        <option value="Wife">Wife</option>
                        <option value="Husband">Husband</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                      </select>
                    </div>
                    <div>
                      <h4 className="mb-3 text-base font-medium text-base-content">Phone Number</h4>
                      <label className="block mb-1 text-sm text-base-content/70">Enter Number</label>
                      <input
                        type="tel"
                        name="dependentPhoneNumber"
                        value={formData.dependentPhoneNumber}
                        onChange={handleInputChange}
                        className="w-full input input-bordered"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center pt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Save Details
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPatientModal;
