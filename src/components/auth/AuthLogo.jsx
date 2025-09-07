import React from 'react';

const AuthLogo = ({ className = "" }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
          <span className="text-white font-bold text-sm">V</span>
          <span className="text-white text-xs">h</span>
        </div>
        <div>
          <span className="text-3xl font-bold text-gray-800">Kolak</span>
          <div className="text-sm text-gray-600 -mt-1">Hospital</div>
        </div>
      </div>
    </div>
  );
};

export default AuthLogo;
