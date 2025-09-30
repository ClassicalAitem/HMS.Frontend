import React from "react";
import { GrTask } from "react-icons/gr";
import { RiArrowLeftRightFill } from "react-icons/ri";

const TaskAssigned = () => {
  const incoming = [
    {
      patientName: "Cameron Williamson",
      administeredBy: "front desk",
      time: "09:00 AM",
    },

    {
      patientName: "Cameron Williamson",
      administeredBy: "Doctor",
      time: "09:00 AM",
    },

    {
      patientName: "Cameron Williamson",
      administeredBy: "front desk",
      time: "09:00 AM",
    },

    {
      patientName: "Cameron Williamson",
      administeredBy: "front desk",
      time: "09:00 AM",
    },
  ];
  return (
    <div className="w-full p-7 mt-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 justify-between">
        <div className="card bg-base-100 shadow-xl w-full rounded-[20px] flex flex-col space-y-2 p-8 pr-3">
          <div className="flex items-center gap-3">
            <GrTask className="w-[22px] h-[22px] text-primary" />
            <div>
              <h1 className="text-[32px] text-[#00943C] ">Tasks Assigned</h1>
            </div>
          </div>

          <h1 className="text-[60px] font-semibold ">10</h1>
          <p className="text-[20px] text-base-content/70">See Your Tasks</p>
        </div>

        <div className="card bg-base-100 shadow-xl w-full rounded-[20px] p-8">
          <div className="flex items-center gap-5 ">
            <RiArrowLeftRightFill size={25} color="#00943C" />
            <h1 className="text-[32px] text-[#00943C] ">incoming</h1>
          </div>

          <div className="mt-3">
            {
              incoming.map((appointment, index) => {
                return <div className="flex items-center justify-between">
                  <div className="flex gap-3 py-1">incoming: {appointment.patientName} <span>sent by {appointment.administeredBy}</span></div>


                  <div>{appointment.time}</div>

                </div>
              })
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskAssigned;
