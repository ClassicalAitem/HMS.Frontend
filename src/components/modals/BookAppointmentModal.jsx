/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

const BookAppointmentModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    patientName: '',
    appointmentDate: '',
    appointmentTime: '',
    department: '',
    reason: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
    // Reset form
    setFormData({
      patientName: '',
      appointmentDate: '',
      appointmentTime: '',
      department: '',
      reason: ''
    });
  };

  const handleCancel = () => {
    onClose();
    // Reset form
    setFormData({
      patientName: '',
      appointmentDate: '',
      appointmentTime: '',
      department: '',
      reason: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleCancel} />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 shadow-xl card bg-base-100">
        <div className="p-6 card-body">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-primary">Book Appointment</h2>
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Patient Name */}
            <div>
              <label className="block mb-2 text-sm font-medium text-base-content">
                Patient Name
              </label>
              <input
                type="text"
                name="patientName"
                value={formData.patientName}
                onChange={handleInputChange}
                placeholder="Enter name here"
                className="w-full input input-bordered"
                required
              />
            </div>

            {/* Date and Time Row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-base-content">
                  Appointment Date
                </label>
                <input
                  type="date"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleInputChange}
                  placeholder="MM/DD/YYYY"
                  className="w-full input input-bordered"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-base-content">
                  Appointment Time
                </label>
                <input
                  type="time"
                  name="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleInputChange}
                  placeholder="12:00pm"
                  className="w-full input input-bordered"
                  required
                />
              </div>
            </div>

            {/* Department/Doctor */}
            <div>
              <label className="block mb-2 text-sm font-medium text-base-content">
                Department/Doctor
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full select select-bordered"
                required
              >
                <option value="">Select department/doctor</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Neurology">Neurology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Surgery">Surgery</option>
                <option value="Gynecology">Gynecology</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            {/* Reason for visit */}
            <div>
              <label className="block mb-2 text-sm font-medium text-base-content">
                Reason for visit/ notes
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="Brief description of the reason for visit..."
                className="w-full textarea textarea-bordered"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4">
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
                Save Appointment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookAppointmentModal;
