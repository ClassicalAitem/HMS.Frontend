import React from 'react';
import { FaEllipsisH, FaClock } from 'react-icons/fa';

const UpcomingSurgeries = () => {
  const surgeries = [
    {
      id: 1,
      patientName: 'Darlene Robertson',
      date: '10/28/12',
      color: 'bg-red-500'
    },
    {
      id: 2,
      patientName: 'Marvin McKinney',
      date: '8/21/15',
      color: 'bg-red-500'
    },
    {
      id: 3,
      patientName: 'Jerome Bell',
      date: '2/11/12',
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-base-200 rounded-full flex items-center justify-center">
            <FaClock className="w-5 h-5 text-base-content/60" />
          </div>
          <h3 className="text-lg font-semibold text-base-content">Upcoming Surgeries</h3>
        </div>
        <button className="p-2 text-base-content/40 hover:text-base-content/60 transition-colors">
          <FaEllipsisH className="w-4 h-4" />
        </button>
      </div>

      {/* Surgery List */}
      <div className="space-y-4">
        {surgeries.map((surgery) => (
          <div key={surgery.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Status Indicator */}
              <div className={`w-3 h-3 rounded-full ${surgery.color}`}></div>
              
              {/* Patient Info */}
              <div>
                <p className="text-sm font-medium text-base-content">{surgery.patientName}</p>
              </div>
            </div>
            
            {/* Date */}
            <span className="text-sm text-base-content/60">{surgery.date}</span>
          </div>
        ))}
      </div>

      {/* View All Link */}
      <div className="mt-6 pt-4 border-t border-base-300">
        <button className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
          View All Surgeries
        </button>
        </div>
      </div>
    </div>
  );
};

export default UpcomingSurgeries;
