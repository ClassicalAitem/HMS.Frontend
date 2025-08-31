import React from 'react';

const Spinner = () => {
  return (
    <div className=" w-screen h-screen flex items-center justify-center bg-white/80 z-[9999]">
      <div className="w-10 h-10 border-4 border-t-4 border-gray border-t-light-green rounded-full animate-spin"></div>
    </div>
  );
};

export default Spinner;
