import React from "react";
import { IoAddOutline } from "react-icons/io5";
import { BsClock } from "react-icons/bs";

const MedicationSchedule = () => {
  const medicationsActivity = [
    {
      headingTag: "New Vitals Recorded",
      name: "John Doe",
      patientId: " pd-88999",
      time: "08:00 AM",
    },

    {
      headingTag: "New Vitals Recorded",
      name: "John Doe",
      patientId: " pd-88999",
      time: "08:00 AM",
    },
    {
      headingTag: "New Vitals Recorded",
      name: "John Doe",
      patientId: " pd-88999",
      time: "08:00 AM",
    },
    {
      headingTag: "New Vitals Recorded",
      name: "John Doe",
      patientId: " pd-88999",
      time: "08:00 AM",
    },
  ];

  return (
    <div className="p-8">
      <div>
        <h1 className="text-2xl font-semibold text-base-content">
          Recent Activity
        </h1>
      </div>

      <div className="flex flex-col gap-6 mt-4">
        {medicationsActivity.map((medication, index) => {
          return (
            <div
              key={index}
              className="p-6 border shadow-sm card bg-base-100 border-base-300"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-base font-medium text-base-content">
                    {medication.headingTag}
                  </p>
                  <p className="text-sm  text-base-content/70">
                    Patient: {medication.name}
                  </p>

                  <p className="text-sm  text-base-content/70">
                    Patient ID:{medication.patientId}
                  </p>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  <div>
                    <button className="w-[140px] h-[30px] rounded-[20px] text-[#FFFFFF] bg-[#3498DB]">
                      Active
                    </button>
                  </div>
                  <div className="flex gap-2 items-center text-sm text-base-content/60">
                    <BsClock className="w-4 h-4" />
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
