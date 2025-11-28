import React from 'react'

const PharmacyModal = ({ setShowModal }) => {
  let value = 1
  return (
    <div className="fixed inset-0 z-50 p-3 bg-[#00000080] bg-opacity-40 flex items-center justify-center">
      <div className="bg-[#FFFFFF] shadow-lg p-6 max-w-[625px] h-[382px] w-full">
        <div className="text-[#000000] text-[24px]">
          Confirm Send to Pharmacy
        </div>

        <p className="mt-5 text-[#605D66]">
          Are you sure you want to send this prescription to the pharmacy? This
          action will notify the pharmacy to prepare medications for Leslie
          Alexander (P-2025-002).
        </p>

        <div className="bg-[#F0EEF3] w-[561px] h-[104px] p-3 mt-5 rounded-[6px]">
          <div className="flex justify-between ">
            <p className="">Total Medications</p>
            <p>{value}</p>
          </div>
          <p className="font-[500] mt-3">Medications</p>
          <p>1.Emzor Paracetamol</p>
        </div>

        <div className="flex justify-end gap-5 mt-5 ">
          <button
            onClick={() => setShowModal(false)}
            className="w-[149px] h-[54px] border rounded-[6px] cursor-pointer"
          >
            Cancel
          </button>
          <button className="w-[228px] h-[52px] text-[#FFFFFF] bg-[#00943C] rounded-[6px] cursor-pointer">
            Confirm & Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default PharmacyModal
