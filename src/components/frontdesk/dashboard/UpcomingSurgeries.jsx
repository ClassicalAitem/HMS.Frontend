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
        {surgeries.map((surgery) => (
          <div key={surgery.id} className="flex justify-between items-center p-1 px-2 rounded-lg 2xl:p-2 2xl:px-4 bg-secondary/50">
            <div className="flex items-center space-x-3">
              {/* Status Indicator */}
              <div className={`2xl:w-2 w-1 2xl:h-2 h-1 rounded-full ${surgery.color}`}></div>
              
              {/* Patient Info */}
              <div>
                <p className="text-xs font-medium 2xl:text-base text-base-content">{surgery.patientName}</p>
              </div>
            </div>
            
            {/* Date */}
            <span className="text-sm 2xl:text-base text-base-content/60">{surgery.date}</span>
          </div>
        ))}
      </div>

      {/* View All Link */}
      <div className="pt-2 border-t 2xl:pt-4 2xl:mt-6 border-base-300">
        <button className="text-xs font-medium transition-colors 2xl:text-base text-primary hover:text-primary/80">
          View All Surgeries
        </button>
        </div>
      </div>
    </div>
  );
};

export default UpcomingSurgeries;
