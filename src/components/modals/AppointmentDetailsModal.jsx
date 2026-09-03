import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaUser, FaCalendarAlt, FaClock, FaStethoscope, FaNotesMedical, FaIdBadge, FaBarcode } from 'react-icons/fa';
import { getAppointmentById, updateAppointment } from '@/services/api/appointmentsAPI';
import { getPatientById } from '@/services/api/patientsAPI';
import { toast } from 'react-hot-toast';
import PatientCardTypeInfo from '@/components/common/PatientCardTypeInfo';
import { getDependantById } from '@/services/api/dependantAPI';
import { useAppSelector } from '@/store/hooks';

const SectionHeading = ({ icon, children }) => (
  <h3 className="text-sm font-semibold text-base-content flex items-center gap-2 mb-3">
    {icon}
    {children}
  </h3>
);

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-medium text-base-content/50 mb-1">{label}</label>
    <div className="text-sm font-medium text-base-content">{children}</div>
  </div>
);

const AppointmentDetailsModal = ({ isOpen, onClose, appointmentId, onUpdated }) => {
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.user);
  const isSurgeonUser = (currentUser?.role || '').toLowerCase() === 'surgeon';
  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [startingNote, setStartingNote] = useState(false);
  const [updating, setUpdating] = useState(false);

  const isSurgery = (appointment?.appointmentType || '').toLowerCase() === 'surgery';

  useEffect(() => {
    if (isOpen && appointmentId) {
      fetchAppointmentDetails();
    } else if (!isOpen) {
      setAppointment(null);
      setPatient(null);
    }
  }, [isOpen, appointmentId]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const response = await getAppointmentById(appointmentId);

      if (response?.data?.data) {
        const appointmentData = response.data.data;
        setAppointment(appointmentData);

        if (appointmentData.dependantId) {
          try {
            const dr = await getDependantById(appointmentData.dependantId);
            const dependantData = dr?.data?.data?.dependant ?? dr?.data?.dependant ?? dr?.data ?? dr;
            if (dependantData) {
              setPatient({ ...dependantData, isDependant: true });
            } else {
              setPatient(null);
            }
          } catch (dependantError) {
            console.error('Error fetching dependant details:', dependantError);
            setPatient(null);
          }
        } else if (appointmentData.patientId) {
          try {
            const pr = await getPatientById(appointmentData.patientId);
            const patientData = pr?.data ?? pr;
            if (patientData) {
              setPatient({ ...patientData, isDependant: false });
            } else {
              setPatient(null);
            }
          } catch (patientError) {
            console.error('Error fetching patient details:', patientError);
            setPatient(null);
          }
        }
      } else {
        setAppointment(null);
        setPatient(null);
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

  const handleStartSurgicalNote = async () => {
    setStartingNote(true);
    try {
      onClose();
      navigate('/dashboard/surgeon/write-surgical-note', {
        state: { from: 'appointment', appointmentSnapshot: appointment },
      });
    } finally {
      setStartingNote(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
      hour12: true,
    });
  };

  // DaisyUI semantic badge classes instead of raw Tailwind bg-*/text-* pairs,
  // so they render properly sized/colored instead of fighting the `badge` base class.
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'confirmed':
      case 'completed':
        return 'badge-success';
      case 'scheduled':
        return 'badge-info';
      case 'pending':
        return 'badge-warning';
      case 'cancelled':
        return 'badge-error';
      default:
        return 'badge-neutral';
    }
  };

  const getAppointmentTypeBadgeClass = (type) => {
    switch (type?.toLowerCase()) {
      case 'emergency':
        return 'badge-error';
      case 'surgery':
        return 'badge-secondary';
      case 'consultation':
        return 'badge-info';
      case 'follow_up':
        return 'badge-success';
      case 'lab_test':
        return 'badge-warning';
      case 'vaccination':
        return 'badge-accent';
      default:
        return 'badge-neutral';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-base-100 rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-base-100 border-b border-base-200 p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-primary">Appointment Details</h2>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm btn-circle shrink-0">
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : appointment ? (
          <div className="p-4 space-y-4">
            {/* Patient Information */}
            <div className="border border-base-200 rounded-lg p-4">
              <SectionHeading icon={<FaUser className="text-primary" />}>
                {patient?.isDependant ? 'Dependant Information' : 'Patient Information'}
              </SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={patient?.isDependant ? 'Dependant Hospital ID' : 'Patient Hospital ID'}>
                  <span className="flex items-center gap-2">
                    <FaIdBadge className="text-base-content/40 shrink-0" />
                    {patient?.isDependant
                      ? (patient?.patient?.hospitalId || 'N/A')
                      : (patient?.hospitalId || 'N/A')}
                  </span>
                </Field>
                <Field label={patient?.isDependant ? 'Dependant Name' : 'Patient Name'}>
                  {patient
                    ? `${patient.firstName || ''} ${patient.middleName || ''} ${patient.lastName || ''}`.trim() || 'N/A'
                    : 'N/A'}
                </Field>
                {patient?.isDependant && (
                  <>
                    <Field label="Relationship">
                      <span className="capitalize">{patient.relationshipType || 'N/A'}</span>
                    </Field>
                    <Field label="Guardian">
                      {patient.patient
                        ? `${patient.patient.firstName || ''} ${patient.patient.lastName || ''}`.trim()
                        : 'N/A'}
                    </Field>
                  </>
                )}
              </div>
              {(patient?.isDependant ? patient.patient : patient) && (
                <div className="mt-4">
                  <PatientCardTypeInfo
                    cardType={patient?.isDependant ? patient.patient?.cardType : patient?.cardType}
                    familyName={patient?.isDependant ? patient.patient?.familyName : patient?.familyName}
                    companyName={patient?.isDependant ? patient.patient?.companyName : patient?.companyName}
                  />
                </div>
              )}
            </div>

            {/* Appointment Schedule */}
            <div className="border border-base-200 rounded-lg p-4">
              <SectionHeading icon={<FaCalendarAlt className="text-primary" />}>
                Appointment Schedule
              </SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Date">
                  <span className="flex items-center gap-2">
                    <FaCalendarAlt className="text-base-content/40 shrink-0" />
                    {formatDate(appointment.appointmentDate)}
                  </span>
                </Field>
                <Field label="Time">
                  <span className="flex items-center gap-2">
                    <FaClock className="text-base-content/40 shrink-0" />
                    {formatTime(appointment.appointmentTime)}
                  </span>
                </Field>
              </div>
            </div>

            {/* Appointment Procedure */}
            <div className="border border-base-200 rounded-lg p-4">
              <SectionHeading icon={<FaNotesMedical className="text-primary" />}>
                Appointment Procedure
              </SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Procedure Name">
                  <span className="flex items-center gap-2">
                    <FaNotesMedical className="text-base-content/40 shrink-0" />
                    {appointment.procedureName || 'N/A'}
                  </span>
                </Field>
                <Field label="Procedure Code">
                  <span className="flex items-center gap-2">
                    <FaBarcode className="text-base-content/40 shrink-0" />
                    {appointment.procedureCode || 'N/A'}
                  </span>
                </Field>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="border border-base-200 rounded-lg p-4">
              <SectionHeading icon={<FaStethoscope className="text-primary" />}>
                Appointment Details
              </SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Department/Doctor">
                  <span className="capitalize">{appointment.department || 'N/A'}</span>
                </Field>
                <Field label="Type">
                  <span className={`badge badge-sm ${getAppointmentTypeBadgeClass(appointment.appointmentType)}`}>
                    {appointment.appointmentType || 'N/A'}
                  </span>
                </Field>
                <Field label="Status">
                  {isEditing ? (
                    <select
                      value={editStatus || appointment.status || ''}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="select select-bordered select-sm w-full"
                    >
                      <option value="scheduled">scheduled</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  ) : (
                    <span className={`badge badge-sm ${getStatusBadgeClass(appointment.status)}`}>
                      {appointment.status || 'Pending'}
                    </span>
                  )}
                </Field>
                <Field label="Created">
                  <span className="text-base-content/70 font-normal">
                    {appointment.createdAt ? formatDate(appointment.createdAt) : 'N/A'}
                  </span>
                </Field>
              </div>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="border border-base-200 rounded-lg p-4">
                <SectionHeading icon={<FaNotesMedical className="text-primary" />}>
                  Notes
                </SectionHeading>
                <p className="text-sm text-base-content/80 whitespace-pre-wrap break-words">
                  {appointment.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2 border-t border-base-200 mt-2">
              <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
                Close
              </button>
              {isSurgery && !isEditing && (
                <button
                  type="button"
                  onClick={handleStartSurgicalNote}
                  className="btn btn-secondary btn-sm gap-1.5 font-semibold"
                  disabled={startingNote}
                >
                  {startingNote ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Starting...
                    </>
                  ) : (
                    'Write Surgical Note'
                  )}
                </button>
              )}
              {appointment.id && !isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditStatus(appointment.status || 'scheduled');
                    setIsEditing(true);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  Edit Appointment
                </button>
              )}
              {appointment.id && isEditing && (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setUpdating(true);
                        const res = await toast.promise(
                          updateAppointment(appointment.id, { status: editStatus || appointment.status }),
                          {
                            loading: 'Updating appointment...',
                            success: 'Appointment updated',
                            error: 'Failed to update appointment',
                          },
                        );
                        const updated = res?.data?.data ?? appointment;
                        setAppointment(updated);
                        setIsEditing(false);
                        setUpdating(false);
                        if (onUpdated) onUpdated(updated);
                        onClose();
                      } catch (err) {
                        setUpdating(false);
                        console.error('Update appointment failed', err);
                      }
                    }}
                    className="btn btn-primary btn-sm"
                    disabled={updating}
                  >
                    {updating ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditStatus(appointment.status || 'scheduled');
                    }}
                    className="btn btn-ghost btn-sm"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-base-content/70">No appointment details available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;