import React from 'react';

const ActionButtons = ({ 
  onSendToCashier, 
  onSendToNurse, 
  onSendToHmo, 
  onSendToPharmacy, 
  onSendToLab, 
  onSendToDoctor 
}) => (
  <div className="flex flex-wrap justify-center mt-6 gap-3">
    <button className="btn btn-outline" onClick={onSendToCashier}>Send to Cashier</button>
    {/* <button className="btn btn-primary" onClick={onSendToNurse}>Send to Nurse</button> */}
    <button className="btn btn-outline" onClick={onSendToHmo}>Send to HMO</button>
    {/* <button className="btn btn-outline" onClick={onSendToPharmacy}>Send to Pharmacy</button> */}
    {/* <button className="btn btn-outline" onClick={onSendToLab}>Send to Lab</button> */}
    {/* <button className="btn btn-outline" onClick={onSendToDoctor}>Send to Doctor</button> */}
  </div>
);

export default ActionButtons;