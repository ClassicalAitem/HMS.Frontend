import React from "react";
import { GrTask } from "react-icons/gr";

const TaskAssigned = () => {
  return (
    <div className="w-full p-7 mt-2 ">
      <div className=" grid grid-cols-1 lg:grid-cols-2  gap-5 justify-between  ">
        <div className="bg-[#FFFFFF] w-full rounded-[20px] flex flex-col space-y-2 p-8 pr-3 ">
          <div className="flex items-center gap-3">
            <GrTask className="w-[22px] h-[22px]" />
            <div>
              <h1 className="text-[32px]">Tasks Assigned</h1>
            </div>
          </div>

          <h1 className="text-[60px] font-semibold ">10</h1>
          <p className="text-[20px]">See Your Task</p>
        </div>

        <div className="bg-[#FFFFFF] w-full rounded-[20px] p-8">
          <div className="flex items-center gap-5">
            <span className="w-[9px] h-[9px] rounded-full bg-[#E6908C]"></span>
            <h1 className="text-[32px]">Notifications</h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskAssigned;
