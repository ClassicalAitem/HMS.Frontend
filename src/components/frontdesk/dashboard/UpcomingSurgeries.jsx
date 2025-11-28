import React, { useState, useEffect } from 'react';
import { IoMdMore, IoMdAlarm } from 'react-icons/io';
import { BsInbox } from "react-icons/bs";
import { GiFirstAidKit } from "react-icons/gi";
import { getAllSurgeries } from '@/services/api/surgeryAPI';
import { getPatientById } from '@/services/api/patientsAPI';
import { useNavigate } from 'react-router-dom';

const UpcomingSurgeries = () => {
  const [surgeries, setSurgeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUpcomingSurgeries();
  }, []);

  const fetchUpcomingSurgeries = async () => {
    try {
      setLoading(true);
      console.log('🏥 UpcomingSurgeries: Fetching surgery data...');
      
      // Fetch all surgeries
      const surgeryResponse = await getAllSurgeries();
      const surgeryData = surgeryResponse?.data || [];
      console.log('🏥 UpcomingSurgeries: Raw surgery data:', surgeryData);

      // Filter for upcoming surgeries only (future dates)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of today
      
      const upcomingSurgeries = surgeryData.filter(surgery => {
        const surgeryDate = new Date(surgery.scheduledDate);
        return surgeryDate >= today;
      });

      console.log('🏥 UpcomingSurgeries: Filtered upcoming surgeries:', upcomingSurgeries);

      // Sort by scheduled date (closest first)
      upcomingSurgeries.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

      // Take only first 10
      const top10Surgeries = upcomingSurgeries.slice(0, 10);

      // Resolve patient names for each surgery
      const surgeriesWithPatientNames = await Promise.all(
        top10Surgeries.map(async (surgery) => {
          try {
            const patientResponse = await getPatientById(surgery.patientId);
            const patientData = patientResponse?.data || {};
            const patientName = `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim() || 'Unknown Patient';
            
            return {
              ...surgery,
              patientName,
              formattedDate: formatDate(surgery.scheduledDate)
            };
          } catch (patientError) {
            console.error(`🏥 UpcomingSurgeries: Error fetching patient ${surgery.patientId}:`, patientError);
            return {
              ...surgery,
              patientName: 'Unknown Patient',
              formattedDate: formatDate(surgery.scheduledDate)
            };
          }
        })
      );

      console.log('🏥 UpcomingSurgeries: Final surgeries with patient names:', surgeriesWithPatientNames);
      setSurgeries(surgeriesWithPatientNames);
    } catch (error) {
      console.error('🏥 UpcomingSurgeries: Error fetching surgeries:', error);
      setError('Failed to load upcoming surgeries');
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
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const handleViewAllSurgeries = () => {
    navigate('/frontdesk/surgeries');
  };

  if (loading) {
    return (
      <div className="shadow-xl shadow-secondary/10 card bg-base-100">
        <div className="py-2 2xl:py-4 card-body">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center 2xl:mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex justify-center items-center p-1 rounded-full 2xl:p-2 bg-secondary/70">
                <div className="flex justify-center items-center p-1 rounded-2xl 2xl:p-2 bg-base-200">
                  <div className="w-4 h-auto 2xl:w-6 skeleton bg-base-300"></div>
                </div>
              </div>
              <div className="w-32 h-4 skeleton bg-base-300"></div>
            </div>
            <div className="w-4 h-4 skeleton bg-base-300"></div>
          </div>

          {/* Surgery List Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center p-1 px-2 rounded-lg 2xl:p-2 2xl:px-4 bg-secondary/50">
                <div className="flex items-center space-x-3">
                  <div className="2xl:w-2 w-1 2xl:h-2 h-1 rounded-full skeleton bg-base-300"></div>
                  <div className="w-24 h-3 skeleton bg-base-300"></div>
                </div>
                <div className="w-16 h-3 skeleton bg-base-300"></div>
              </div>
            ))}
          </div>

          {/* Footer Skeleton */}
          <div className="pt-2 border-t 2xl:pt-4 2xl:mt-6 border-base-300">
            <div className="w-20 h-3 skeleton bg-base-300"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shadow-xl shadow-secondary/10 card bg-base-100">
        <div className="py-2 2xl:py-4 card-body">
          <div className="text-center text-error">
            <p>{error}</p>
            <button 
              onClick={fetchUpcomingSurgeries}
              className="mt-2 btn btn-sm btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shadow-xl shadow-secondary/10 card bg-base-100">
      <div className="py-2 2xl:py-4 card-body">
        {/* Header */}
        <div className="flex justify-between items-center 2xl:mb-6">
          <div className="flex items-center space-x-4">      
            <div className="flex justify-center items-center p-1 rounded-full 2xl:p-2 bg-secondary/70">
              <div className="flex justify-center items-center p-1 rounded-2xl 2xl:p-2 bg-base-200">
                <GiFirstAidKit className="w-4 h-auto 2xl:w-6 text-primary" />
              </div>
            </div>
            <h3 className="text-base 2xl:text-xl font-regular text-base-content">Upcoming Surgeries</h3>
          </div>
          <button className="p-2 transition-colors text-base-content/40 hover:text-base-content/60">
            <IoMdMore className="w-4 h-4 font-bold text-base-content" />
          </button>
        </div>

        {/* Surgery List */}
        <div className="space-y-4">
          {surgeries.length === 0 ? (
            <div className="text-center text-base-content/60 bg-secondary/20 rounded-lg py-6">
              <div className="w-full flex justify-center items-center">
                <BsInbox className="w-16 h-16 text-primary" />
              </div>
              <p className="mt-2">No upcoming surgeries scheduled</p>
            </div>
          ) : (
            surgeries.map((surgery) => (
              <div key={surgery._id} className="flex justify-between items-center p-1 px-2 rounded-lg 2xl:p-2 2xl:px-4 bg-secondary/50">
                <div className="flex items-center space-x-3">
                  {/* Status Indicator */}
                  <div className={`2xl:w-2 w-1 2xl:h-2 h-1 rounded-full bg-red-500`}></div>
                  
                  {/* Patient Info */}
                  <div>
                    <p className="text-xs font-medium 2xl:text-base text-base-content">{surgery.patientName}</p>
                    <p className="text-xs text-base-content/60">{surgery.procedureName}</p>
                  </div>
                </div>
                
                {/* Date */}
                <span className="text-sm 2xl:text-base text-base-content/60">{surgery.formattedDate}</span>
              </div>
            ))
          )}
        </div>

        {/* View All Link */}
        <div className="pt-2 border-t 2xl:pt-4 2xl:mt-6 border-base-300">
          <button 
            onClick={handleViewAllSurgeries}
            className="text-xs font-medium transition-colors 2xl:text-base text-primary hover:text-primary/80"
          >
            View All Surgeries
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpcomingSurgeries;
