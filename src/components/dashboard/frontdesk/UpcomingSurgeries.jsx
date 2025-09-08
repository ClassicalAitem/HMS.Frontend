import React from 'react';
import { IoMdMore } from 'react-icons/io';
import { GiFirstAidKit } from "react-icons/gi";

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
    <div className="shadow-xl shadow-secondary/10 card bg-base-100">
      <div className="card-body">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">      
          <div className="flex justify-center items-center p-2 rounded-full bg-secondary/70">
            <div className="flex justify-center items-center p-2 rounded-2xl bg-base-200">
              <GiFirstAidKit className="w-6 h-auto text-primary" />
            </div>
          </div>
          <h3 className="text-xl font-regular text-base-content">Upcoming Surgeries</h3>
        </div>
        <button className="p-2 transition-colors text-base-content/40 hover:text-base-content/60">
          <IoMdMore className="w-4 h-4 font-bold text-base-content" />
        </button>
      </div>

      {/* Surgery List */}
      <div className="space-y-4">
        {surgeries.map((surgery) => (
          <div key={surgery.id} className="flex justify-between items-center p-2 px-4 rounded-lg bg-secondary/50">
            <div className="flex items-center space-x-3">
              {/* Status Indicator */}
              <div className={`w-2 h-2 rounded-full ${surgery.color}`}></div>
              
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
      <div className="pt-4 mt-6 border-t border-base-300">
        <button className="text-sm font-medium transition-colors text-primary hover:text-primary/80">
          View All Surgeries
        </button>
        </div>
      </div>
    </div>
  );
};

export default UpcomingSurgeries;
