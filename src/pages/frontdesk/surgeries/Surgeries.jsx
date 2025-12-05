import React, { useState, useEffect } from 'react';
import { FrontdeskLayout } from '@/layouts/frontdesk';
import { getAllSurgeries } from '@/services/api/surgeryAPI';
import { getPatientById } from '@/services/api/patientsAPI';
import { useNavigate } from 'react-router-dom';
import { GiFirstAidKit } from "react-icons/gi";
import { FaUserMd, FaCalendarAlt, FaMapMarkerAlt, FaClipboardList } from 'react-icons/fa';

const Surgeries = () => {
  const [surgeries, setSurgeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, upcoming, completed
  const navigate = useNavigate();

  useEffect(() => {
    fetchSurgeries();
  }, []);

  const fetchSurgeries = async () => {
    try {
      setLoading(true);
      console.log('🏥 Surgeries Page: Fetching all surgery data...');
      
      // Fetch all surgeries
      const surgeryResponse = await getAllSurgeries();
      const surgeryData = surgeryResponse?.data || [];
      console.log('🏥 Surgeries Page: Raw surgery data:', surgeryData);

      // Resolve patient names for all surgeries
      const surgeriesWithPatientNames = await Promise.all(
        surgeryData.map(async (surgery) => {
          try {
            const patientResponse = await getPatientById(surgery.patientId);
            const patientData = patientResponse?.data || {};
            const patientName = `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim() || 'Unknown Patient';
            
            return {
              ...surgery,
              patientName,
              formattedDate: formatDate(surgery.scheduledDate),
              isUpcoming: new Date(surgery.scheduledDate) >= new Date()
            };
          } catch (patientError) {
            console.error(`🏥 Surgeries Page: Error fetching patient ${surgery.patientId}:`, patientError);
            return {
              ...surgery,
              patientName: 'Unknown Patient',
              formattedDate: formatDate(surgery.scheduledDate),
              isUpcoming: new Date(surgery.scheduledDate) >= new Date()
            };
          }
        })
      );

      console.log('🏥 Surgeries Page: Final surgeries with patient names:', surgeriesWithPatientNames);
      setSurgeries(surgeriesWithPatientNames);
    } catch (error) {
      console.error('🏥 Surgeries Page: Error fetching surgeries:', error);
      setError('Failed to load surgeries');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reset time to compare dates only
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSurgeries = surgeries.filter(surgery => {
    switch (filter) {
      case 'upcoming':
        return surgery.isUpcoming;
      case 'completed':
        return !surgery.isUpcoming;
      default:
        return true;
    }
  });

  const handleSurgeryClick = (surgeryId) => {
    navigate(`/frontdesk/surgeries/${surgeryId}`);
  };

  if (loading) {
    return (
      <FrontdeskLayout>
        <div className="p-6">
          <div className="mb-6">
            <div className="w-48 h-8 skeleton bg-base-300 mb-2"></div>
            <div className="w-64 h-4 skeleton bg-base-300"></div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-32 h-4 skeleton bg-base-300"></div>
                    <div className="w-16 h-4 skeleton bg-base-300"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-3 skeleton bg-base-300"></div>
                    <div className="w-3/4 h-3 skeleton bg-base-300"></div>
                    <div className="w-1/2 h-3 skeleton bg-base-300"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FrontdeskLayout>
    );
  }

  if (error) {
    return (
      <FrontdeskLayout>
        <div className="p-6">
          <div className="text-center text-error">
            <h2 className="text-2xl font-bold mb-2">Error Loading Surgeries</h2>
            <p className="mb-4">{error}</p>
            <button 
              onClick={fetchSurgeries}
              className="btn btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </FrontdeskLayout>
    );
  }

  return (
    <FrontdeskLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-base-content mb-2">Surgery Management</h1>
          <p className="text-base-content/60">View and manage all scheduled surgeries</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="tabs tabs-boxed">
            <button 
              className={`tab ${filter === 'all' ? 'tab-active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Surgeries ({surgeries.length})
            </button>
            <button 
              className={`tab ${filter === 'upcoming' ? 'tab-active' : ''}`}
              onClick={() => setFilter('upcoming')}
            >
              Upcoming ({surgeries.filter(s => s.isUpcoming).length})
            </button>
            <button 
              className={`tab ${filter === 'completed' ? 'tab-active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Past ({surgeries.filter(s => !s.isUpcoming).length})
            </button>
          </div>
        </div>

        {/* Surgeries Grid */}
        {filteredSurgeries.length === 0 ? (
          <div className="text-center py-12">
            <GiFirstAidKit className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
            <h3 className="text-lg font-medium text-base-content mb-2">No Surgeries Found</h3>
            <p className="text-base-content/60">
              {filter === 'upcoming' ? 'No upcoming surgeries scheduled.' : 
               filter === 'completed' ? 'No past surgeries found.' : 
               'No surgeries found in the system.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSurgeries.map((surgery) => (
              <div 
                key={surgery._id} 
                className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
                onClick={() => handleSurgeryClick(surgery._id)}
              >
                <div className="card-body">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <FaUserMd className="w-4 h-4 text-primary" />
                      <h3 className="card-title text-sm">{surgery.procedureName}</h3>
                    </div>
                    <span className={`badge ${getStatusColor(surgery.status)}`}>
                      {surgery.status || 'Scheduled'}
                    </span>
                  </div>

                  {/* Patient Info */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-sm font-medium">{surgery.patientName}</span>
                    </div>

                    {/* Date and Time */}
                    <div className="flex items-center space-x-2 text-sm text-base-content/70">
                      <FaCalendarAlt className="w-3 h-3" />
                      <span>{surgery.formattedDate}</span>
                      {surgery.scheduledDate && (
                        <>
                          <span>•</span>
                          <span>{formatTime(surgery.scheduledDate)}</span>
                        </>
                      )}
                    </div>

                    {/* Operation Room */}
                    {surgery.operationRoom && (
                      <div className="flex items-center space-x-2 text-sm text-base-content/70">
                        <FaMapMarkerAlt className="w-3 h-3" />
                        <span>Room {surgery.operationRoom}</span>
                      </div>
                    )}

                    {/* Procedure Code */}
                    {surgery.procedureCode && (
                      <div className="flex items-center space-x-2 text-sm text-base-content/70">
                        <FaClipboardList className="w-3 h-3" />
                        <span>Code: {surgery.procedureCode}</span>
                      </div>
                    )}
                  </div>

                  {/* Click Indicator */}
                  <div className="card-actions justify-end mt-4">
                    <button className="btn btn-sm btn-ghost">
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FrontdeskLayout>
  );
};

export default Surgeries;