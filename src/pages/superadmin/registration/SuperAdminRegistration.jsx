/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import { FaUserPlus, FaSave, FaTimes } from 'react-icons/fa';

const SuperAdminRegistration = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    password: '',
    confirmPassword: ''
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Registration data:', formData);
    // Handle registration logic here
  };

  const handleReset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      department: '',
      password: '',
      confirmPassword: ''
    });
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary 2xl:text-4xl">User Registration</h1>
            <p className="text-sm text-base-content/70 2xl:text-base">Register new users to the hospital management system</p>
          </div>

          {/* Registration Form */}
          <div className="max-w-4xl">
            <div className="p-6 rounded-lg shadow-lg bg-base-100">
              <div className="flex items-center mb-6 space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <FaUserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-base-content">New User Registration</h2>
                  <p className="text-sm text-base-content/70">Fill in the details below to register a new user</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>

                {/* Role and Department */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">Role</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="select select-bordered w-full"
                      required
                    >
                      <option value="">Select a role</option>
                      <option value="superAdmin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="doctor">Doctor</option>
                      <option value="nurse">Nurse</option>
                      <option value="frontdesk">Front Desk</option>
                      <option value="cashier">Cashier</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">Department</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      placeholder="Enter department"
                      required
                    />
                  </div>
                </div>

                {/* Password Information */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      placeholder="Confirm password"
                      required
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn btn-outline flex-1"
                  >
                    <FaTimes className="w-4 h-4 mr-2" />
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                  >
                    <FaSave className="w-4 h-4 mr-2" />
                    Register User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminRegistration;
