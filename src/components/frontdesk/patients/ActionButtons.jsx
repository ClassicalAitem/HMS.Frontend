import React from 'react';

const ActionButtons = ({ onSendToCashier, onSendToNurse }) => (
  <div className="flex justify-center mt-6 space-x-4">
    <button className="btn btn-outline" onClick={onSendToCashier}>Send to Cashier</button>
    <button className="btn btn-primary" onClick={onSendToNurse}>Send to Nurse</button>
  </div>
);

export default ActionButtons;