import React from "react";

const PatientHeaderActions = ({ title, subtitle, fromIncoming, onBack }) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div>
        <h1 className="text-2xl font-bold text-base-content">{title}</h1>
        <p className="text-sm text-base-content/70">{subtitle}</p>
      </div>
      <button className="btn btn-outline btn-sm" onClick={onBack}>
        {fromIncoming ? "Back to Incoming" : "Back to Patients"}
      </button>
    </div>
  );
};

export default PatientHeaderActions;