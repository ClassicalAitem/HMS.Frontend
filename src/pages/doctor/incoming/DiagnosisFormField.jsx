import React from "react";

const DiagnosisFormField = () => {
  const visitDetails = [
    { label: "Visit Date", value: "October 14, 2025" },
    { label: "Visit Time", value: "10:30 AM" },
    { label: "Doctor", value: "Dr. Folake Flakes" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="w-[680px] h-[300px] border border-[#AEAAAE] rounded-[6px]  ">
        <div className=" mt-3 p-3 ">
          <h2 className="text-[20px] font-[500] mb-2">Diagnosis</h2>
          <textarea
            className="bg-[#F0EEF3] w-full border rounded-[6px] p-2 h-[211px] text-[16px]"
            placeholder="Enter diagnosis details..."
          />
        </div>
      </div>

      <div className="w-[680px] h-[300px] border border-[#AEAAAE] rounded-[6px]">
        <div className=" mt-3 p-3 ">
          <h2 className="text-[20px] font-[500] mb-2">Treatment Notes</h2>
          <textarea
            className="bg-[#F0EEF3] w-full border rounded-[6px] p-2 h-[211px] text-[16px]"
            placeholder="Enter treatment notes, prescriptions or special instructions"
          />
        </div>
      </div>
      <div className="w-[680px] h-[176px] border  border-[#AEAAAE] rounded-[6px]">
        <div className=" mt-3 p-3 ">
          <h2 className="text-[20px] font-[500] mb-2">Visit Information</h2>
          <div className="mt-5">
            {visitDetails.map((visit, index) => (
              <div key={index} className="flex justify-between">
                <span>{visit.label}:</span>
                <span
                  className={`${
                    visit.label === "Doctor"
                      ? "font-semibold"
                      : "text-[#111215]"
                  }`}
                >
                  {visit.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
     
    </div>
  );
};

export default DiagnosisFormField;
