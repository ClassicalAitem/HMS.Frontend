/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/frontdesk/dashboard';
import { FaUpload, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const Registration = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    
    // Patient Photo
    patientPhoto: null,
    
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      patientPhoto: file
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission logic here
  };

  return (
    <div className="flex h-screen">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>
      
      {/* Main Content */}
      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />
        
        {/* Page Content */}
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-base-content 2xl:text-3xl">Add Patients Information</h1>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Section */}
            <div className="shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <h2 className="mb-4 text-lg font-semibold text-base-content">First Section</h2>
                
                {/* Names Row */}
                <div className="mb-6">
                  <h3 className="mb-3 text-base font-medium text-base-content">Names</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="block mb-1 text-sm text-base-content/70">Surname</label>
                      <input
                        type="text"
                        name="surname"
                        value={formData.surname}
                        onChange={handleInputChange}
                        placeholder="Enter Your name"
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
                        placeholder="Enter Your name"
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
                        placeholder="Enter Your name"
                        className="w-full input input-bordered"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="mb-6">
                  <h3 className="mb-3 text-base font-medium text-base-content">Address</h3>
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">enter your address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter Your address"
                      className="w-full textarea textarea-bordered"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Phone, DOB, Gender Row */}
                <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
                  <div>
                    <h3 className="mb-3 text-base font-medium text-base-content">Phone Number</h3>
                    <label className="block mb-1 text-sm text-base-content/70">Enter Your Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="Enter Your number"
                      className="w-full input input-bordered"
                    />
                  </div>
                  <div>
                    <h3 className="mb-3 text-base font-medium text-base-content">Date Of Birth</h3>
                    <label className="block mb-1 text-sm text-base-content/70">DD/MM/YY</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full input input-bordered"
                    />
                  </div>
                  <div>
                    <h3 className="mb-3 text-base font-medium text-base-content">Gender</h3>
                    <label className="block mb-1 text-sm text-base-content/70">M / F</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full select select-bordered"
                    >
                      <option value="">male/female</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                {/* State, Town, LGA Row */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <h3 className="mb-3 text-base font-medium text-base-content">State Of Origin</h3>
                    <label className="block mb-1 text-sm text-base-content/70">SOO</label>
                    <select
                      name="stateOfOrigin"
                      value={formData.stateOfOrigin}
                      onChange={handleInputChange}
                      className="w-full select select-bordered"
                    >
                      <option value="">Ogun State</option>
                      <option value="Abia">Abia</option>
                      <option value="Adamawa">Adamawa</option>
                      <option value="Lagos">Lagos</option>
                      <option value="Ogun">Ogun</option>
                      <option value="Oyo">Oyo</option>
                    </select>
                  </div>
                  <div>
                    <h3 className="mb-3 text-base font-medium text-base-content">Town</h3>
                    <label className="block mb-1 text-sm text-base-content/70">Town</label>
                    <input
                      type="text"
                      name="town"
                      value={formData.town}
                      onChange={handleInputChange}
                      placeholder="Aba North"
                      className="w-full input input-bordered"
                    />
                  </div>
                  <div>
                    <h3 className="mb-3 text-base font-medium text-base-content">LGA</h3>
                    <label className="block mb-1 text-sm text-base-content/70">Local Gov Area</label>
                    <input
                      type="text"
                      name="lga"
                      value={formData.lga}
                      onChange={handleInputChange}
                      placeholder="Aba North"
                      className="w-full input input-bordered"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Second Section */}
            <div className="shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <h2 className="mb-4 text-lg font-semibold text-base-content">Second Section</h2>
                
                {/* Next of Kin */}
                <div className="mb-6">
                  <h3 className="mb-3 text-base font-medium text-base-content">Next Of Kin</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block mb-1 text-sm text-base-content/70">First name</label>
                      <input
                        type="text"
                        name="nokFirstName"
                        value={formData.nokFirstName}
                        onChange={handleInputChange}
                        placeholder="Next of kin"
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
                        placeholder="Next of kin"
                        className="w-full input input-bordered"
                      />
                    </div>
                  </div>
                </div>

                {/* Relationship and Phone */}
                <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
                  <div>
                    <h3 className="mb-3 text-base font-medium text-base-content">Relationship</h3>
                    <label className="block mb-1 text-sm text-base-content/70">Relationship</label>
                    <input
                      type="text"
                      name="nokRelationship"
                      value={formData.nokRelationship}
                      onChange={handleInputChange}
                      placeholder="Sister"
                      className="w-full input input-bordered"
                    />
                  </div>
                  <div>
                    <h3 className="mb-3 text-base font-medium text-base-content">Phone Number</h3>
                    <label className="block mb-1 text-sm text-base-content/70">Enter Your Phone Number</label>
                    <input
                      type="tel"
                      name="nokPhoneNumber"
                      value={formData.nokPhoneNumber}
                      onChange={handleInputChange}
                      placeholder="09090000"
                      className="w-full input input-bordered"
                    />
                  </div>
                </div>

                {/* NOK Address */}
                <div>
                  <h3 className="mb-3 text-base font-medium text-base-content">Address</h3>
                  <label className="block mb-1 text-sm text-base-content/70">enter your address</label>
                  <textarea
                    name="nokAddress"
                    value={formData.nokAddress}
                    onChange={handleInputChange}
                    placeholder="Enter Your address"
                    className="w-full textarea textarea-bordered"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Patient Photo Upload */}
            <div className="shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <h2 className="mb-4 text-lg font-semibold text-base-content">Patient Photo Upload</h2>
                <p className="mb-4 text-sm text-base-content/70">
                  Upload a clear photo of the patient (.JPG/.PNG). This will be attached to the patient record.
                </p>
                <div className="p-8 border-2 border-dashed rounded-lg border-base-300">
                  <div className="flex flex-col items-center">
                    <FaUpload className="mb-4 text-4xl text-base-content/50" />
                    <label className="btn btn-outline btn-sm">
                      <FaUpload className="w-4 h-4 mr-2" />
                      Choose Image
                      <input
                        type="file"
                        name="patientPhoto"
                        onChange={handleFileChange}
                        accept=".jpg,.jpeg,.png"
                        className="hidden"
                      />
                    </label>
                    {formData.patientPhoto && (
                      <p className="mt-2 text-sm text-base-content/70">
                        {formData.patientPhoto.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Connect To HMO */}
            <div className="shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <button
                  type="button"
                  onClick={() => setHmoExpanded(!hmoExpanded)}
                  className="flex justify-between items-center w-full mb-4 text-lg font-semibold text-left text-base-content"
                >
                  Connect To HMO
                  {hmoExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                
                {hmoExpanded && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <h3 className="mb-3 text-base font-medium text-base-content">HMO Provider</h3>
                        <label className="block mb-1 text-sm text-base-content/70">Enter provider</label>
                        <input
                          type="text"
                          name="hmoProvider"
                          value={formData.hmoProvider}
                          onChange={handleInputChange}
                          placeholder="Avon Industries"
                          className="w-full input input-bordered"
                        />
                      </div>
                      <div>
                        <h3 className="mb-3 text-base font-medium text-base-content">HMO Number</h3>
                        <label className="block mb-1 text-sm text-base-content/70">Enter HMO Number</label>
                        <input
                          type="text"
                          name="hmoNumber"
                          value={formData.hmoNumber}
                          onChange={handleInputChange}
                          placeholder="091919"
                          className="w-full input input-bordered"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <h3 className="mb-3 text-base font-medium text-base-content">HMO plan</h3>
                        <label className="block mb-1 text-sm text-base-content/70">HMO Plan</label>
                        <input
                          type="text"
                          name="hmoPlan"
                          value={formData.hmoPlan}
                          onChange={handleInputChange}
                          placeholder="Premium"
                          className="w-full input input-bordered"
                        />
                      </div>
                      <div>
                        <h3 className="mb-3 text-base font-medium text-base-content">Add Expiring Date</h3>
                        <label className="block mb-1 text-sm text-base-content/70">Enter expiring Date</label>
                        <input
                          type="date"
                          name="hmoExpiringDate"
                          value={formData.hmoExpiringDate}
                          onChange={handleInputChange}
                          className="w-full input input-bordered"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Add Dependent */}
            <div className="shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <button
                  type="button"
                  onClick={() => setDependentExpanded(!dependentExpanded)}
                  className="flex justify-between items-center w-full mb-4 text-lg font-semibold text-left text-base-content"
                >
                  Add Dependent
                  {dependentExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                
                {dependentExpanded && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <h3 className="mb-3 text-base font-medium text-base-content">First Name</h3>
                        <label className="block mb-1 text-sm text-base-content/70">Name</label>
                        <input
                          type="text"
                          name="dependentFirstName"
                          value={formData.dependentFirstName}
                          onChange={handleInputChange}
                          placeholder="Tosan"
                          className="w-full input input-bordered"
                        />
                      </div>
                      <div>
                        <h3 className="mb-3 text-base font-medium text-base-content">Last Name</h3>
                        <label className="block mb-1 text-sm text-base-content/70">Name"</label>
                        <input
                          type="text"
                          name="dependentLastName"
                          value={formData.dependentLastName}
                          onChange={handleInputChange}
                          placeholder="Oluwaseun"
                          className="w-full input input-bordered"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <h3 className="mb-3 text-base font-medium text-base-content">Relationship</h3>
                        <label className="block mb-1 text-sm text-base-content/70">Enter Relationship</label>
                        <select
                          name="dependentRelationship"
                          value={formData.dependentRelationship}
                          onChange={handleInputChange}
                          className="w-full select select-bordered"
                        >
                          <option value="">Wife</option>
                          <option value="Wife">Wife</option>
                          <option value="Husband">Husband</option>
                          <option value="Son">Son</option>
                          <option value="Daughter">Daughter</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                        </select>
                      </div>
                      <div>
                        <h3 className="mb-3 text-base font-medium text-base-content">Phone Number</h3>
                        <label className="block mb-1 text-sm text-base-content/70">Enter Number</label>
                        <input
                          type="tel"
                          name="dependentPhoneNumber"
                          value={formData.dependentPhoneNumber}
                          onChange={handleInputChange}
                          placeholder="0909000000"
                          className="w-full input input-bordered"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button type="submit" className="btn btn-primary btn-wide">
                Register Now
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Registration;
