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
      return "bg-success/20 text-success border border-success/30 px-4 py-1 rounded-full text-sm font-medium";
    }
    if (medications === "Due") {
      return "bg-info/20 text-info border border-info/30 px-4 py-1 rounded-full text-sm font-medium";
    }
    if (medications === "Missed") {
      return "bg-error/20 text-error border border-error/30 px-4 py-1 rounded-full text-sm font-medium";
    }
  };
  return (
    <div className="p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-base-content">Medication Schedule</h1>
        <button className="btn btn-primary btn-circle btn-lg">
          <IoAddOutline size={24} />
        </button>
      </div>

      <div className="flex flex-col gap-6 mt-4">
        {medications.map((medication, index) => {
          return (
            <div
              key={index}
              className="p-6 border shadow-sm card bg-base-100 border-base-300"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-base font-medium text-base-content">
                    {medication.drugsTypes}
                  </p>
                  <p className="text-sm text-base-content/70">
                    Patient: {medication.patientName}
                  </p>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  <span
                    className={bgChange(medication.status)}
                  >
                    {medication.status}
                  </span>
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
