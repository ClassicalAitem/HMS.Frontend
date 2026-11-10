import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { checkDrugAllergyConflict } from '@/utils/allergyUtils';

const DrugAllergyAlertBanner = ({ drugName = '', patientAllergies = [], className = '' }) => {
  const conflict = checkDrugAllergyConflict(drugName, patientAllergies);

  if (!conflict?.hasConflict) return null;

  return (
    <div className={`alert alert-warning shadow-sm border border-warning/40 py-2.5 px-3 rounded-lg flex items-start gap-2.5 my-2 animate-in fade-in duration-150 ${className}`}>
      <FaExclamationTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
      <div className="flex-1 text-xs">
        <span className="font-bold block text-warning-content">
          Potential Allergy Conflict Detected!
        </span>
        <span className="text-warning-content/90">
          {conflict.reason} Please verify patient tolerance or consider an alternative therapy.
        </span>
      </div>
    </div>
  );
};

export default DrugAllergyAlertBanner;

