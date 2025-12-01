import React from 'react';
import HospitalLogo from "@/assets/images/HospitalLogo.png"

const AuthLogo = ({ className = "" }) => {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className="flex items-center">
        <div className="flex justify-center items-center rounded-full">
          <img src={HospitalLogo} alt="" />
        </div>
        <div>
          <span className="text-3xl font-bold text-base-content">Kolak</span>
          <div className="-mt-1 text-sm tracking-widest text-base-content/70">Hospital</div>
        </div>
      </div>
    </div>
  );
};

export default AuthLogo;
