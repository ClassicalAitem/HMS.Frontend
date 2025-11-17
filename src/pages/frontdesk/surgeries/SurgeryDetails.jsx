import React, { useState, useEffect } from 'react';
import { FrontdeskLayout } from '@/layouts/frontdesk';
import { useParams, useNavigate } from 'react-router-dom';
import { getSurgeryById } from '@/services/api/surgeryAPI';
import { getPatientById } from '@/services/api/patientsAPI';
import { GiFirstAidKit } from "react-icons/gi";
import { FaUserMd, FaCalendarAlt, FaMapMarkerAlt, FaClipboardList, FaUser, FaPhone, FaEnvelope, FaArrowLeft } from 'react-icons/fa';

const SurgeryDetails = () => {
  const { surgeryId } = useParams();
  const navigate = useNavigate();
  const [surgery, setSurgery] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (surgeryId) {
      fetchSurgeryDetails();
    }
  }, [surgeryId]);

  const fetchSurgeryDetails = async () => {
    try {
      setLoading(true);
      console.log('🏥 SurgeryDetails: Fetching surgery details for ID:', surgeryId);
      
      // Fetch surgery details
      const surgeryResponse = await getSurgeryById(surgeryId);
      const surgeryData = surgeryResponse?.data || {};
      console.log('🏥 SurgeryDetails: Surgery data:', surgeryData);

      // Fetch patient details
      if (surgeryData.patientId) {
        try {
          const patientResponse = await getPatientById(surgeryData.patientId);
          const patientData = patientResponse?.data || {};
          console.log('🏥 SurgeryDetails: Patient data:', patientData);
          setPatient(patientData);
        } catch (patientError) {
          console.error('🏥 SurgeryDetails: Error fetching patient:', patientError);
          setPatient(null);
        }
      }

      setSurgery(surgeryData);
    } catch (error) {
      console.error('🏥 SurgeryDetails: Error fetching surgery details:', error);
      setError('Failed to load surgery details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return '📅';
      case 'in-progress':
        return '⏳';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <FrontdeskLayout>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header Skeleton */}
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 skeleton bg-base-300 mr-3"></div>
              <div className="w-48 h-8 skeleton bg-base-300"></div>
            </div>

            {/* Main Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="w-32 h-6 skeleton bg-base-300 mb-4"></div>
                  <div className="space-y-3">
                    <div className="w-full h-4 skeleton bg-base-300"></div>
                    <div className="w-3/4 h-4 skeleton bg-base-300"></div>
                    <div className="w-1/2 h-4 skeleton bg-base-300"></div>
                  </div>
                </div>
              </div>
              
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="w-32 h-6 skeleton bg-base-300 mb-4"></div>
                  <div className="space-y-3">
                    <div className="w-full h-4 skeleton bg-base-300"></div>
                    <div className="w-3/4 h-4 skeleton bg-base-300"></div>
                    <div className="w-1/2 h-4 skeleton bg-base-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FrontdeskLayout>
    );
  }

  if (error) {
    return (
      <FrontdeskLayout>
        <div className="p-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-error mb-4">
              <h2 className="text-2xl font-bold mb-2">Error Loading Surgery Details</h2>
              <p>{error}</p>
            </div>
            <div className="space-x-4">
              <button 
                onClick={fetchSurgeryDetails}
                className="btn btn-primary"
              >
                Retry
              </button>
              <button 
                onClick={() => navigate('/frontdesk/surgeries')}
                className="btn btn-ghost"
              >
                Back to Surgeries
              </button>
            </div>
          </div>
        </div>
      </FrontdeskLayout>
    );
  }

  if (!surgery) {
    return (
      <FrontdeskLayout>
        <div className="p-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-error mb-4">Surgery Not Found</h2>
            <button 
              onClick={() => navigate('/frontdesk/surgeries')}
              className="btn btn-primary"
            >
              Back to Surgeries
            </button>
          </div>
        </div>
      </FrontdeskLayout>
    );
  }

  return (
    <FrontdeskLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6">
            <button 
              onClick={() => navigate('/frontdesk/surgeries')}
              className="btn btn-ghost btn-sm mr-3"
            >
              <FaArrowLeft />
            </button>
            <div className="flex items-center space-x-3">
              <GiFirstAidKit className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-base-content">Surgery Details</h1>
                <p className="text-base-content/60">{surgery.procedureName}</p>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-6">
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border-2 ${getStatusColor(surgery.status)}`}>
              <span className="text-lg">{getStatusIcon(surgery.status)}</span>
              <span className="font-medium capitalize">{surgery.status || 'Scheduled'}</span>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Surgery Information */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">
                  <FaClipboardList className="w-5 h-5 text-primary" />
                  Surgery Information
                </h2>
                
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base-content/70">Procedure Code:</span>
                    <span className="font-mono font-medium">{surgery.procedureCode || 'Not specified'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-base-content/70">Procedure Name:</span>
                    <span className="font-medium">{surgery.procedureName || 'Not specified'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-base-content/70">Operation Room:</span>
                    <span className="font-medium">{surgery.operationRoom || 'Not specified'}</span>
                  </div>
                  
                  {surgery.investigationRequestId && (
                    <div className="flex items-center justify-between">
                      <span className="text-base-content/70">Investigation ID:</span>
                      <span className="font-mono text-sm">{surgery.investigationRequestId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule Information */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">
                  <FaCalendarAlt className="w-5 h-5 text-primary" />
                  Schedule Information
                </h2>
                
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base-content/70">Scheduled Date:</span>
                    <span className="font-medium">{formatDate(surgery.scheduledDate)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-base-content/70">Scheduled Time:</span>
                    <span className="font-medium">{formatTime(surgery.scheduledDate)}</span>
                  </div>
                  
                  {surgery.surgeonId && (
                    <div className="flex items-center justify-between">
                      <span className="text-base-content/70">Surgeon ID:</span>
                      <span className="font-mono text-sm">{surgery.surgeonId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Patient Information */}
          {patient && (
            <div className="card bg-base-100 shadow-xl mt-6">
              <div className="card-body">
                <h2 className="card-title">
                  <FaUser className="w-5 h-5 text-primary" />
                  Patient Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="label">
                      <span className="label-text text-base-content/70">Full Name</span>
                    </label>
                    <p className="font-medium text-lg">
                      {[patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="label">
                      <span className="label-text text-base-content/70">Patient ID</span>
                    </label>
                    <p className="font-mono text-sm">{patient._id}</p>
                  </div>
                  
                  {patient.phone && (
                    <div>
                      <label className="label">
                        <span className="label-text text-base-content/70">Phone</span>
                      </label>
                      <div className="flex items-center space-x-2">
                        <FaPhone className="w-4 h-4 text-primary" />
                        <p className="font-medium">{patient.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {patient.email && (
                    <div>
                      <label className="label">
                        <span className="label-text text-base-content/70">Email</span>
                      </label>
                      <div className="flex items-center space-x-2">
                        <FaEnvelope className="w-4 h-4 text-primary" />
                        <p className="font-medium">{patient.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-6">
            <button 
              onClick={() => navigate('/frontdesk/surgeries')}
              className="btn btn-ghost"
            >
              Back to Surgeries
            </button>
            <button 
              onClick={() => navigate(`/frontdesk/patients/${surgery.patientId}`)}
              className="btn btn-primary"
              disabled={!surgery.patientId}
            >
              View Patient Details
            </button>
          </div>
        </div>
      </div>
    </FrontdeskLayout>
  );
};

export default SurgeryDetails;