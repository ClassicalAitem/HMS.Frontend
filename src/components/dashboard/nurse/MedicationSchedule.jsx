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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-base-content">Medication Schedule</h1>
        <button className="btn btn-primary btn-circle btn-lg">
          <IoAddOutline size={24} />
        </button>
      </div>

      <div className="flex flex-col mt-4 gap-6">
        {medications.map((medication, index) => {
          return (
            <div
              key={index}
              className="card bg-base-100 shadow-sm border border-base-300 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-base text-base-content">
                    {medication.drugsTypes}
                  </p>
                  <p className="text-sm text-base-content/70">
                    Patient: {medication.patientName}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={bgChange(medication.status)}
                  >
                    {medication.status}
                  </span>
                  <div className="flex items-center gap-2 text-base-content/60 text-sm">
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
