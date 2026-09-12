import React from "react";
import { useNavigate } from "react-router-dom";

const PatientHeaderActions = ({ title, subtitle }) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center mb-4">
      <div>
        <h1 className="text-2xl font-bold text-base-content">{title}</h1>
        <p className="text-sm text-base-content/70">
          {subtitle} <span className="text-error">*</span>
        </p>
      </div>

      <button
        className="btn btn-outline btn-sm"
        onClick={() => navigate(-1)}
      >
        Back
      </button>
    </div>
  );
};

export default PatientHeaderActions;