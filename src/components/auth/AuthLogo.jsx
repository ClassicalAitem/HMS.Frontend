import React from 'react';
import HospitalLogo from "../../assets/images/HospitalLogo.png"

const AuthLogo = ({ className = "" }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center">
        <div className=" rounded-full flex items-center justify-center mr-3">
          <img src={HospitalLogo} alt="" />
        </div>
        <div>
          <span className="text-3xl font-bold text-base-content">Kolak</span>
          <div className="text-sm text-base-content/70 -mt-1 tracking-widest">Hospital</div>
        </div>
      </div>
    </div>
  );
};

export default AuthLogo;
