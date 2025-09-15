import React from "react";
import { IoAddOutline } from "react-icons/io5";
import { BsClock } from "react-icons/bs";

const MedicationSchedule = () => {
  const medications = [
    {
      drugsTypes: "Pain Reliever (500mg)",
      patientName: "John Doe",
      status: "Administered",
      time: "08:00 AM",
    },
    {
      drugsTypes: "Insulin (10 units)",
      patientName: "John Cena",
      status: "Due",
      time: "08:00 AM",
    },
    {
      drugsTypes: "Blood Pressure Med (10mg)",
      patientName: "John Doe",
      status: "Administered",
      time: "08:00 AM",
    },
    {
      drugsTypes: "Antihistamine (10mg)",
      patientName: "John Doe",
      status: "Missed",
      time: "08:00 AM",
    },
  ];

  const bgChange = (medications) => {
    if (medications === "Administered") {
      return "bg-[#D0EEA6] text-[#467206] w-[140px] h-[30px] rounded-[20px]";
    }
    if (medications === "Due") {
      return "bg-[#D6EDFE] text-[#106AA6] w-[79px] h-[34px] rounded-[100px]";
    }
    if (medications === "Missed") {
      return "bg-[#F2DFD5] text-[#B50D05] w-[119px] h-[33px] rounded-[20px]";
    }
  };
  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-[40px]">Medication Schedule</h1>
        <button className="flex justify-center items-center h-[60px] w-[80px] bg-[#FFFFFF]">
          {<IoAddOutline size={42} />}
        </button>
      </div>

      <div className="flex  flex-col mt-4 gap-[24px]">
        {medications.map((medication, index) => {
          return (
            <div
              key={index}
              className="mt-4 py-[16px] px-[24px] h-[97px]  bg-[#FFFFFF] rounded-[6px]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-[400] text-[16px]">
                    {medication.drugsTypes}
                  </p>
                  <p className="font-[400] text-[12px]">
                    Patient: {medication.patientName}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-[8px]">
                  <button
                    className={` ${bgChange(
                      medication.status
                    )} text-[16px] font-[400]`}
                  >
                    {medication.status}
                  </button>
                  <div className="flex items-center gap-2">
                    <BsClock />
                    {medication.time}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MedicationSchedule;
