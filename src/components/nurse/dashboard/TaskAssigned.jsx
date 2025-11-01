import React from "react";
import { GrTask } from "react-icons/gr";
import { RiArrowLeftRightFill } from "react-icons/ri";
import { EmptyState } from "@/components/common";

const TaskAssigned = ({ tasksCount = 0, incoming = [], loading = false, onRefresh }) => {
  return (
    <div className="w-full p-7 mt-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 justify-between">
        <div className="card bg-base-100 shadow-xl w-full rounded-2xl flex flex-col space-y-2 p-8 pr-3">
          <div className="flex items-center gap-3">
            <GrTask className="w-[22px] h-[22px] text-primary" />
            <div>
              <h1 className="text-[32px] text-[#00943C] ">Tasks Assigned</h1>
            </div>
          </div>
          {loading ? (
            <div className="animate-pulse w-24 h-10 rounded bg-base-300" />
          ) : (
            <h1 className="text-[60px] font-semibold ">{tasksCount}</h1>
          )}
          <p className="text-[20px] text-base-content/70">See Your Tasks</p>
        </div>

        <div className="card bg-base-100 shadow-xl w-full rounded-[20px] p-8">
          <div className="flex items-center gap-5 ">
            <RiArrowLeftRightFill size={25} color="#00943C" />
            <h1 className="text-[32px] text-primary ">Incoming</h1>
          </div>

          <div className="mt-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="flex items-center justify-between py-2">
                  <div className="animate-pulse h-4 w-64 rounded bg-base-300" />
                  <div className="animate-pulse h-4 w-16 rounded bg-base-300" />
                </div>
              ))
            ) : incoming.length === 0 ? (
              <EmptyState
                title="No incoming patients"
                description="You're all clear. Patients sent to you will appear here."
                actionLabel="Refresh"
                onAction={onRefresh}
              />
            ) : (
              incoming.map((appointment, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <div className="flex gap-3">incoming: {appointment.patientName} <span>sent by {appointment.administeredBy}</span></div>
                  <div>{appointment.time}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskAssigned;
