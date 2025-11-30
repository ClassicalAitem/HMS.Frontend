import React from 'react';

const ActionButtons = ({ onSendToNurse, onSendToPharmacy }) => (
  <div className="flex justify-center mt-6 space-x-4">
    <button className="btn btn-outline" onClick={onSendToNurse}>Send to Nurse</button>
    <button className="btn btn-primary" onClick={onSendToPharmacy}>Send to Pharmacy</button>
  </div>
);

export default ActionButtons;