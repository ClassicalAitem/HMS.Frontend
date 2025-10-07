/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/frontdesk/dashboard';
import { FaUpload, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useAppDispatch } from '../../../store/hooks';
import { addPatient } from '../../../store/slices/patientsSlice';
import toast from 'react-hot-toast';

const Registration = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hmoExpanded, setHmoExpanded] = useState(false);
  const [dependentExpanded, setDependentExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Patient Basic Info (matching backend API)
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    address: '',
    dob: '',
    gender: '',
    
    // Next of Kin (matching backend API structure)
    nextOfKin: {
      name: '',
      phone: '',
      relationship: ''
    },
    
    // Patient Photo
    patientPhoto: null,
    
    // HMO Section (matching backend API structure)
    hmos: [
      {
        provider: '',
        memberId: '',
        plan: '',
        expiresAt: ''
      }
    ],
    
    // Dependent Section (for future use)
    dependent: {
      firstName: '',
      lastName: '',
      relationship: '',
      phone: ''
    }
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

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
    } else if (name.startsWith('hmo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        hmos: prev.hmos.map((hmo, index) => 
          index === 0 ? { ...hmo, [field]: value } : hmo
        )
      }));
    } else if (name.startsWith('dependent.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        dependent: {
          ...prev.dependent,
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      patientPhoto: file
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('🔄 Registration: Creating new patient');
      console.log('📊 Registration: Patient data:', formData);
      
      // Prepare data for API (only include HMO if provider is provided)
      const patientData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        dob: formData.dob,
        gender: formData.gender,
        nextOfKin: formData.nextOfKin,
        ...(formData.hmos[0].provider && {
          hmos: formData.hmos.filter(hmo => hmo.provider)
        })
      };
      
      console.log('📤 Registration: Final API data being sent:', JSON.stringify(patientData, null, 2));
      
      const result = await dispatch(addPatient(patientData));
      
      if (addPatient.fulfilled.match(result)) {
        toast.success('Patient registered successfully!');
        console.log('✅ Registration: Patient created:', result.payload);
        
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          middleName: '',
          email: '',
          phone: '',
          address: '',
          dob: '',
          gender: '',
          nextOfKin: {
            name: '',
            phone: '',
            relationship: '',
          },
          patientPhoto: null,
          hmos: [
            {
              provider: '',
              memberId: '',
              plan: '',
              expiresAt: ''
            }
          ],
          dependent: {
            firstName: '',
            lastName: '',
            relationship: '',
            phone: ''
          }
        });
        
        // Navigate to patients list
        navigate('/frontdesk/patients');
      } else {
        toast.error('Failed to register patient');
      }
    } catch (error) {
      console.error('❌ Registration: Registration error:', error);
      toast.error('Failed to register patient');
    } finally {
      setIsLoading(false);
    }
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
                      <label className="block mb-1 text-sm text-base-content/70">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Enter first name"
                        className="w-full input input-bordered"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm text-base-content/70">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Enter last name"
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
                        placeholder="Enter middle name"
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

                {/* Contact Information */}
                <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      className="w-full input input-bordered"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      className="w-full input input-bordered"
                      required
                    />
                  </div>
                </div>

                {/* DOB and Gender */}
                <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">Date of Birth *</label>
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
                    <label className="block mb-1 text-sm text-base-content/70">Gender *</label>
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
                      <label className="block mb-1 text-sm text-base-content/70">Name</label>
                      <input
                        type="text"
                        name="nextOfKin.name"
                        value={formData.nextOfKin.name}
                        onChange={handleInputChange}
                        placeholder="Enter next of kin name"
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
                        placeholder="Enter phone number"
                        className="w-full input input-bordered"
                      />
                    </div>
                  </div>
                </div>

                {/* Relationship and Address */}
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
                  <div className='hidden'>
                    <label className="block mb-1 text-sm text-base-content/70">Address</label>
                    <textarea
                      name="nextOfKin.address"
                      value={formData.nextOfKin.address}
                      onChange={handleInputChange}
                      placeholder="Enter address"
                      className="w-full textarea textarea-bordered"
                      rows={2}
                    />
                  </div>
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
                <div className="p-8 rounded-lg border-2 border-dashed border-base-300">
                  <div className="flex flex-col items-center">
                    <FaUpload className="mb-4 text-4xl text-base-content/50" />
                    <label className="btn btn-outline btn-sm">
                      <FaUpload className="mr-2 w-4 h-4" />
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
                  className="flex justify-between items-center mb-4 w-full text-lg font-semibold text-left text-base-content"
                >
                  Connect To HMO
                  {hmoExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                
                {hmoExpanded && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block mb-1 text-sm text-base-content/70">HMO Provider</label>
                        <input
                          type="text"
                          name="hmo.provider"
                          value={formData.hmos[0].provider}
                          onChange={handleInputChange}
                          placeholder="e.g., Bastion, Avon"
                          className="w-full input input-bordered"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm text-base-content/70">Member ID</label>
                        <input
                          type="text"
                          name="hmo.memberId"
                          value={formData.hmos[0].memberId}
                          onChange={handleInputChange}
                          placeholder="e.g., 34758H90938"
                          className="w-full input input-bordered"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block mb-1 text-sm text-base-content/70">Plan</label>
                        <input
                          type="text"
                          name="hmo.plan"
                          value={formData.hmos[0].plan}
                          onChange={handleInputChange}
                          placeholder="e.g., Diamond, Premium"
                          className="w-full input input-bordered"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm text-base-content/70">Expiry Date</label>
                        <input
                          type="date"
                          name="hmo.expiresAt"
                          value={formData.hmos[0].expiresAt}
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
                  className="flex justify-between items-center mb-4 w-full text-lg font-semibold text-left text-base-content"
                >
                  Add Dependent
                  {dependentExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                
                {dependentExpanded && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block mb-1 text-sm text-base-content/70">First Name</label>
                        <input
                          type="text"
                          name="dependent.firstName"
                          value={formData.dependent.firstName}
                          onChange={handleInputChange}
                          placeholder="Enter first name"
                          className="w-full input input-bordered"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm text-base-content/70">Last Name</label>
                        <input
                          type="text"
                          name="dependent.lastName"
                          value={formData.dependent.lastName}
                          onChange={handleInputChange}
                          placeholder="Enter last name"
                          className="w-full input input-bordered"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="block mb-1 text-sm text-base-content/70">Relationship</label>
                        <select
                          name="dependent.relationship"
                          value={formData.dependent.relationship}
                          onChange={handleInputChange}
                          className="w-full select select-bordered"
                        >
                          <option value="">Select Relationship</option>
                          <option value="spouse">Spouse</option>
                          <option value="child">Child</option>
                          <option value="parent">Parent</option>
                          <option value="sibling">Sibling</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1 text-sm text-base-content/70">Phone Number</label>
                        <input
                          type="tel"
                          name="dependent.phone"
                          value={formData.dependent.phone}
                          onChange={handleInputChange}
                          placeholder="Enter phone number"
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
              <button 
                type="submit" 
                className="btn btn-primary btn-wide"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Registering...
                  </>
                ) : (
                  'Register Now'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Registration;
