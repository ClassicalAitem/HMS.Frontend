import React, { useState } from 'react';
import { IoIosCloseCircleOutline } from 'react-icons/io';
import { FaUserMd, FaNotesMedical, FaSyringe, FaAllergies, FaHistory, FaUsers, FaCalendarAlt, FaFileMedical, FaFlask, FaPrescriptionBottleAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { updatePatientStatus } from '@/services/api/patientsAPI';
import { PATIENT_STATUS } from '@/constants/patientStatus';

const SendToNurseModal = ({
  isOpen,
  onClose,
  prescriptions,
  labRequests,
  additionalNotes,
  patientName,
  doctorName,
  consultationDate,
  complaints,
  notes,
  visitReason,
  diagnosis,
  patientId,
  onSentSuccessfully
}) => {
  const [isSending, setIsSending] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(PATIENT_STATUS.AWAITING_VITALS);

  if (!isOpen) return null;

  const handleSend = async () => {
    try {
      setIsSending(true);
      const statusPromise = updatePatientStatus(patientId, selectedStatus);
      
      toast.promise(statusPromise, {
        loading: 'Sending patient to nurse...',
        success: 'Patient sent to nurse successfully! Nurse will fetch consultation data.',
        error: (err) => err?.response?.data?.message || 'Failed to send patient to nurse'
      });
      
      await statusPromise;
      
      // Call the callback if provided
      if (onSentSuccessfully) {
        onSentSuccessfully();
      }
      
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to send to nurse');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-base-100 rounded-xl shadow-2xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-base-200 flex justify-between items-center bg-base-100">
          <div className="flex items-center gap-3">
            <div className="bg-info/10 p-2 rounded-full text-info">
              <FaUserMd className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-base-content">Send to Nurse - Consultation Summary</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:bg-base-200">
            <IoIosCloseCircleOutline className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Consultation Overview */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-4">
              <div className="flex items-center gap-2 mb-4 text-base-content">
                <FaNotesMedical className="w-5 h-5" />
                <h3 className="font-bold text-lg">Consultation Overview</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm font-medium text-base-content/70">Patient:</span>
                  <p className="font-medium">{patientName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-base-content/70">Doctor:</span>
                  <p className="font-medium">Dr. {doctorName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-base-content/70">Date:</span>
                  <p className="font-medium">{consultationDate}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-base-content/70">Visit Reason:</span>
                  <p className="font-medium">{visitReason}</p>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-sm font-medium text-base-content/70">Diagnosis:</span>
                <p className="font-medium mt-1">{diagnosis}</p>
              </div>

              {complaints.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-base-content/70">Complaints:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {complaints.map((item, idx) => (
                      <span key={idx} className="badge badge-outline">{item.symptom}</span>
                    ))}
                  </div>
                </div>
              )}

              {notes && (
                <div className="mt-4">
                  <span className="text-sm font-medium text-base-content/70">Clinical Notes:</span>
                  <p className="mt-1 text-sm">{notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Treatment Plan & Orders */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-4">
              <div className="flex items-center gap-2 mb-4 text-base-content">
                <FaPrescriptionBottleAlt className="w-5 h-5" />
                <h3 className="font-bold text-lg">Treatment Plan & Orders</h3>
              </div>

              {/* Lab Requests */}
              {labRequests.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-base-content mb-2">Lab Investigations:</h4>
                  <div className="space-y-2">
                    {labRequests.map((lab, idx) => (
                      <div key={idx} className="border border-base-200 rounded p-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`badge ${lab.status === 'in_progress' ? 'badge-info' : 'badge-success'} badge-sm`}>
                            {lab.status.replace('_', ' ')}
                          </span>
                          {lab.priority === 'urgent' && <span className="badge badge-error badge-xs">Urgent</span>}
                        </div>
                        <div className="text-sm">
                          {lab.tests?.map((test, tIdx) => (
                            <span key={tIdx}>{test.name}{tIdx < lab.tests.length - 1 ? ', ' : ''}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prescriptions */}
              {prescriptions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-base-content mb-2">Prescriptions:</h4>
                  <div className="space-y-2">
                    {prescriptions.map((pres, idx) => (
                      <div key={idx} className="border border-base-200 rounded p-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`badge ${pres.status === 'pending' ? 'badge-warning' : 'badge-success'} badge-sm`}>
                            {pres.status}
                          </span>
                        </div>
                        <div className="text-sm">
                          {pres.medications?.map((med, mIdx) => (
                            <div key={mIdx}>
                              <span className="font-medium">{med.drugName}</span> - {med.dosage}, {med.frequency}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {additionalNotes && (
                <div>
                  <h4 className="text-sm font-bold text-base-content mb-2">Additional Notes for Nurse:</h4>
                  <div className="bg-warning/10 border border-warning/20 rounded p-3">
                    <p className="text-sm">{additionalNotes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

     

        </div>

        <div className="px-6 pb-4 pt-2">
          <label className="label">
            <span className="label-text">Send status</span>
          </label>
          <div className="space-y-2">
            {[
              PATIENT_STATUS.AWAITING_VITALS,
              PATIENT_STATUS.AWAITING_SAMPLING,
              PATIENT_STATUS.AWAITING_INJECTION,
            ].map((status) => (
              <label key={status} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="sendToNurseStatus"
                  value={status}
                  checked={selectedStatus === status}
                  onChange={() => setSelectedStatus(status)}
                  className="radio radio-primary"
                />
                <span className="capitalize">{status.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-base-200 bg-base-50 flex justify-end gap-3">
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isSending}
          >
            Cancel
          </button>
          <button
            className="btn btn-info px-8"
            onClick={handleSend}
            disabled={isSending}
          >
            {isSending ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendToNurseModal;