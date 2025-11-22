import React from 'react'

const InjectionModals = ({setShowModal2}) => {
  return (
    <div className="fixed inset-0 z-50 p-3 bg-black/10 backdrop-blur-sm bg-opacity-40 flex justify-center items-start overflow-y-auto">
      <div className="bg-[#FFFFFF] shadow-lg p-6 max-w-[413px] w-full">
        <div className="w-[349px] h-[600px] mx-auto">
          <div className="w-full h-[70px] flex flex-col gap-3 font-[400]">
            <h5 className="text-[#00943C] text-[24px] font-[400] ">
              injection Modal
            </h5>
            <p className="text-[#605D66] text-[15px] font-[400] ">
              injection Modal
            </p>
          </div>
        </div>
        {/* Buttons */}
        <div className="w-[349px] mx-auto justify-center items-center flex gap-[16px] mt-3">
          <button
            onClick={() => setShowModal2(false)}
            className="w-[100px] h-[52px] rounded-[6px] border-[1px] border-[#AEAAAE] px-[24px] py-[16px] text-[#111215] text-[18px] font-[600] flex justify-center items-center cursor-pointer"
          >
            Close
          </button>
          <button className="bg-[#00943C] w-[207px] h-[52px] px-[24px] py-[16px] rounded-[6px] text-[#FAFAFA] text-[18px] font-[600] flex justify-center items-center cursor-pointer ">
            Accept & Process
          </button>
        </div>
      </div>
    </div>
  );
}

export default InjectionModals
