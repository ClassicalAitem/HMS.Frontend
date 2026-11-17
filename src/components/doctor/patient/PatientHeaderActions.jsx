import React from "react";
import { useNavigate } from "react-router-dom";

const PatientHeaderActions = ({
  title,
  subtitle,
  onBack,
  onBackToIncoming,
  onBackToLabResults,
  
  showBack = true,
  children,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
      <div>
        <h1 className="text-2xl font-bold text-base-content">{title}</h1>
        <p className="text-sm text-base-content/70">
          {subtitle} <span className="text-error">*</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onBackToIncoming && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onBackToIncoming}
          >
            Back to Incoming
          </button>
        )}
        {onBackToLabResults && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onBackToLabResults}
          >
            Back to Lab Results
          </button>
        )}
        {children}
        {showBack && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                navigate(-1);
              }
            }}
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
};

export default PatientHeaderActions;