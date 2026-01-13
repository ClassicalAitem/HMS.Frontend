import React from 'react';

const ActionButtons = ({ destination, onSendToNurse, onSendToDoctor, onSendToPharmacy, onSendToLab, onSendToFrontDesk }) => {
  // Map destinations to button label + handler
  const destinationConfig = {
    nursing: { label: "Send to Nurse", action: onSendToNurse, style: "btn btn-outline text-white" },
    admission: { label: "Send to Nurse", action: onSendToNurse, style: "btn btn-outline text-white" },
    consultation: { label: "Send to Doctor", action: onSendToDoctor, style: "btn btn-warning text-white" },
    surgery: { label: "Send to Doctor", action: onSendToDoctor, style: "btn btn-warning text-white" },
    radiology: { label: "Send to Doctor", action: onSendToDoctor, style: "btn btn-warning text-white" },
    pharmacy: { label: "Send to Pharmacy", action: onSendToPharmacy, style: "btn btn-primary text-white" },
    lab_test: { label: "Send to Lab", action: onSendToLab, style: "btn btn-secondary text-white" },
    laboratory: { label: "Send to Lab", action: onSendToLab, style: "btn btn-secondary text-white" },
    form: { label: "Send to Front Desk", action: onSendToFrontDesk, style: "btn btn-accent text-white" },
  };

  const config = destinationConfig[destination];

  return (
    <div className="flex justify-center mt-6 space-x-4">
      {config ? (
        <button className={config.style} onClick={config.action}>
          {config.label}
        </button>
      ) : (
        <p className="text-gray-500">No action available for this destination</p>
      )}
    </div>
  );
};

export default ActionButtons;