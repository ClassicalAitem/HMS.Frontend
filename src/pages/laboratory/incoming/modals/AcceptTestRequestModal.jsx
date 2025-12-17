import React, { useState } from "react";

const AcceptTestRequestModal = ({ setShowModal }) => {
    const [completionTime, setCompletionTime] = useState()
  return (
    <div className="fixed inset-0 z-50 p-3  bg-black/10 backdrop-blur-sm bg-opacity-40 flex items-center justify-center">
      <div className="bg-[#FFFFFF] shadow-lg p-6 max-w-[588px] h-[686px] w-full">
        <p className="text-[#00943C] text-[24px]">Accept Test Request</p>
        <p className="mt-5 text-[#605D66] text-[12px]">
          Confirm acceptance and provide initial details for processing
        </p>

        <form>
          <div className="mt-5">
            <label className="block font-semibold">Patient Name</label>
            <input
              type="text"
              placeholder="Enter full name"
              className="input w-full py-7 mt-3"
            />
          </div>
          <div className="mt-5">
            <label className="block font-semibold">Test Type</label>
            <input
              type="text"
              placeholder="Enter test here"
              className="input py-7 w-[467px] mt-3"
            />
          </div>

          <div className="mt-5">
            <label className="block font-semibold">
              Estimated Completion Time
            </label>
            <select
              id="completionTIme"
              value={completionTime}
              onChange={(e) => setCompletionTime(e.target.value)}
              className="h-[56px] border border-[#AEAAAE] rounded-[6px] bg-[#F7F7F7] px-3 w-full appearance-auto text-black"
            >
              <option value="">-- Select an option --</option>
              <option value="urgent">1 hour</option>
              <option value="normal">2 hours</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="mt-5">
            <label className="block font-semibold">Note (Optional)</label>
            <input
              type="text"
              placeholder="Add any relevant note about this test"
              className="input py-7 w-full mt-3"
            />
          </div>
        </form>

        <div className="flex gap-5 mt-10 ">
          <button
            onClick={() => setShowModal(false)}
            className="w-[254px] h-[54px] border rounded-[6px] cursor-pointer"
          >
            Cancel
          </button>
          <button className="w-[254px] h-[52px] text-[#FFFFFF] bg-[#00943C] rounded-[6px] cursor-pointer">
            Confirm & Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcceptTestRequestModal;
