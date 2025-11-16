import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaCalendarAlt, FaClock, FaStethoscope, FaNotesMedical, FaIdBadge } from 'react-icons/fa';
import { getAppointmentById } from '@/services/api/appointmentsAPI';
import { toast } from 'react-hot-toast';

const AppointmentDetailsModal = ({ isOpen, onClose, appointmentId }) => {
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('AppointmentDetailsModal props:', { isOpen, appointmentId });

  useEffect(() => {
    console.log('Modal useEffect triggered:', { isOpen, appointmentId });
    if (isOpen && appointmentId) {
      fetchAppointmentDetails();
    }
  }, [isOpen, appointmentId]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching appointment details for ID:', appointmentId);
      const response = await getAppointmentById(appointmentId);
      console.log('Appointment details response:', response);
      console.log('Response data:', response?.data);
      
      if (response?.data) {
        setAppointment(response.data);
      } else {
        console.error('No data in response');
        setAppointment(null);
        toast.error('No appointment data found');
      }
    } catch (error) {
      toast.error('Failed to load appointment details');
      console.error('Error fetching appointment:', error);
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'emergency':
        return 'bg-red-100 text-red-800';
      case 'surgery':
        return 'bg-purple-100 text-purple-800';
      case 'consultation':
        return 'bg-blue-100 text-blue-800';
      case 'follow_up':
        return 'bg-green-100 text-green-800';
      case 'lab_test':
        return 'bg-yellow-100 text-yellow-800';
      case 'vaccination':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) {
    console.log('Modal not rendering - isOpen is false');
    return null;
  }

  console.log('Rendering modal with isOpen:', isOpen, 'appointmentId:', appointmentId);
  console.log('Modal should be visible now!');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }} onClick={onClose} />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-4 shadow-xl card bg-base-100" style={{ zIndex: 10000 }}>
        <div className="p-6 card-body">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-primary">Appointment Details</h2>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : appointment ? (
            <div className="space-y-6">
              {/* Patient Information */}
              <div className="bg-base-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FaUser className="text-primary" />
                  Patient Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-base-content/70">Patient ID</label>
                    <p className="text-base font-medium flex items-center gap-2">
                      <FaIdBadge className="text-base-content/50" />
                      {appointment.patientId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-base-content/70">Patient Name</label>
                    <p className="text-base font-medium">{appointment.patientName || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Appointment Schedule */}
              <div className="bg-base-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FaCalendarAlt className="text-primary" />
                  Appointment Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-base-content/70">Date</label>
                    <p className="text-base font-medium flex items-center gap-2">
                      <FaCalendarAlt className="text-base-content/50" />
                      {formatDate(appointment.appointmentDate)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-base-content/70">Time</label>
                    <p className="text-base font-medium flex items-center gap-2">
                      <FaClock className="text-base-content/50" />
                      {formatTime(appointment.appointmentTime)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="bg-base-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FaStethoscope className="text-primary" />
                  Appointment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-base-content/70">Department/Doctor</label>
                    <p className="text-base font-medium">{appointment.department || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-base-content/70">Type</label>
                    <span className={`badge ${getAppointmentTypeColor(appointment.appointmentType)}`}>
                      {appointment.appointmentType || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-base-content/70">Status</label>
                    <span className={`badge ${getStatusColor(appointment.status)}`}>
                      {appointment.status || 'Pending'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-base-content/70">Created</label>
                    <p className="text-sm text-base-content/70">
                      {appointment.createdAt ? formatDate(appointment.createdAt) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {appointment.notes && (
                <div className="bg-base-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FaNotesMedical className="text-primary" />
                    Notes
                  </h3>
                  <div className="bg-base-100 rounded-lg p-3">
                    <p className="text-base text-base-content leading-relaxed">
                      {appointment.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-outline"
                >
                  Close
                </button>
                {appointment.id && (
                  <button
                    type="button"
                    onClick={() => {
                      // Add edit functionality here if needed
                      toast.success('Edit functionality can be added here');
                    }}
                    className="btn btn-primary"
                  >
                    Edit Appointment
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-base-content/70">No appointment details available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;