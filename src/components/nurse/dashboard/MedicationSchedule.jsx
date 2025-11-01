import React from "react";
import { IoAddOutline } from "react-icons/io5";
import { BsClock } from "react-icons/bs";
import { EmptyState } from "@/components/common";

const MedicationSchedule = ({ recentActivity = [], loading = false, onRefresh }) => {
  return (
    <div className="p-8 h-full">
      <div>
        <h1 className="text-2xl font-regular text-base-content">
          Recent Activity
        </h1>
      </div>

      <div className="flex flex-col gap-6 mt-4 bg-base-100 h-[-webkit-fill-available] rounded-2xl">
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="p-6 border shadow-sm card bg-base-100 border-base-300">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="animate-pulse h-4 w-40 rounded bg-base-300" />
                    <div className="animate-pulse h-3 w-64 rounded bg-base-300" />
                    <div className="animate-pulse h-3 w-48 rounded bg-base-300" />
                  </div>
                  <div className="space-y-2 items-end">
                    <div className="animate-pulse h-7 w-24 rounded bg-base-300" />
                    <div className="flex gap-2 items-center">
                      <div className="animate-pulse h-4 w-24 rounded bg-base-300" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          : recentActivity.length === 0 ? (
              
              <div className="flex justify-center items-center h-full">  
                <EmptyState
                  title="No recent activity"
                  description="Vitals you record will show here."
                  actionLabel="Refresh"
                  onAction={onRefresh}
                />
              </div>
            ) : recentActivity.map((medication, index) => (
              <div key={index} className="p-6 border shadow-sm card bg-base-100 border-base-300">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-base font-medium text-base-content">{medication.headingTag}</p>
                    <p className="text-sm  text-base-content/70">Patient: {medication.name}</p>
                    <p className="text-sm  text-base-content/70">Patient ID: {medication.patientId}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <div>
                      <button className="w-[140px] h-[30px] rounded-[20px] text-[#FFFFFF] bg-[#3498DB]">
                        {medication.status || 'Active'}
                      </button>
                    </div>
                    <div className="flex gap-2 items-center text-sm text-base-content/60">
                      <BsClock className="w-4 h-4" />
                      {medication.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default MedicationSchedule;
