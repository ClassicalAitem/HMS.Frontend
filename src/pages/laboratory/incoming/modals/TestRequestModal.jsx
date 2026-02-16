import React from "react";

const TestRequestModal = ({ data, setShowModal2, onAcceptFromDetails }) => {
  const getPriorityBgColor = (status) => {
    if (status === "Urgent") return "#FFE2E2";
    if (status === "Normal") return "#DBEAFE";
    return "#F2F2F3";
  };

  const getPriorityTextColor = (status) => {
    if (status === "Urgent") return "#E7000B";
    if (status === "Normal") return "#4680FC";
    return "#111215";
  };

  const handleAcceptClick = () => {
    setShowModal2(false);
    // Call the parent callback to open AcceptTestRequestModal with the correct data
    if (onAcceptFromDetails) {
      onAcceptFromDetails(data);
    }
  };

  return (
    <div className="fixed inset-0 z-50 p-3 bg-black/10 backdrop-blur-sm bg-opacity-40 flex justify-center items-start overflow-y-auto min-h-screen">
      <div className="bg-[#FFFFFF] shadow-lg p-6 max-w-[413px] h-[917px]  w-full">
        <div className="w-[349px] h-[785px] mx-auto">
          <div className="w-full h-[70px] flex flex-col gap-3 font-[400]">
            <h5 className="text-[#00943C] text-[24px] font-[400] ">
              Test Request Details
            </h5>
            <p className="text-[#605D66] text-[15px] font-[400] ">
              Complete information about the test request
            </p>
          </div>

          <div className="w-full h-[684px] mt-[16px]">
            {/* // Patient Information */}
            <div className="w-full">
              <h6 className="text-[20px] text-[#111215] font-[400]">
                Patient Information
              </h6>
              <div className="w-full h-[72px] bg-[#f2f2f3] rounded-[6px] p-[12px]  mt-3 flex justify-between">
                <div className="h-[48px]">
                  <p className="text-[#aeaaae] text-[12px]">Patient Name</p>
                  <p className="text-[16px] text-[#111215] font-[400]">
                    {data?.name || "Unknown Patient"}
                  </p>
                </div>
                <div className="h-[48px]">
                  <p className="text-[#aeaaae] text-[12px]">Patient ID</p>
                  <p className="text-[16px] text-[#111215] font-[400]">
                    {data?.userId || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            {/* // Test Information */}
            <div className="w-full mt-3">
              <h6 className="text-[20px] text-[#111215] font-[400]">
                Test Information
              </h6>
              <div className="w-full bg-[#f2f2f3] p-[12px] rounded-[6px] mt-3 flex flex-col gap-[12px]">
                <div className="max-w-[320px] flex justify-between items-center">
                  <div className="w-[133px] flex flex-col gap-[8px]">
                    <p className="text-[#AEAAAE] text-[12px] font-[400]">
                      Test Type
                    </p>
                    <p className="text-[#111215] text-[16px] font-[400]">
                      {data?.test || "N/A"}
                    </p>
                  </div>
                  <div className="w-[106px] flex flex-col gap-[8px]">
                    <p className="text-[#111215] text-[16px]">Priority Level</p>
                    <p
                      style={{
                        backgroundColor: getPriorityBgColor(data?.status),
                        color: getPriorityTextColor(data?.status),
                      }}
                      className="w-[62px] h-[24px] rounded-[6px] px-[6px] py-[4px] text-[12px] font-[400] flex items-center justify-center"
                    >
                      {data?.status || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="max-w-[320px] flex justify-between items-center">
                  <div className="w-[92px] flex flex-col gap-[8px]">
                    <p className="text-[#AEAAAE] text-[12px] font-[400]">
                      Request Date
                    </p>
                    <p className="text-[#111215] text-[16px] font-[400]">
                      {data?.date || "N/A"}
                    </p>
                  </div>
                  <div className="w-[106px] flex flex-col gap-[8px]">
                    <p className="text-[#AEAAAE] text-[12px] font-[400]">
                      Request Time
                    </p>
                    <p className="text-[#111215] text-[16px] font-[400]">
                      {data?.time || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Requesting Doctor */}
            <div className="w-full mt-3">
              <h6 className="text-[#111215] text-[20px] font-[400]">
                Requesting Doctor
              </h6>
              <div className="bg-[#F2F2F3] flex justify-between items-center p-[12px] rounded-[6px] mt-3">
                <div className="h-[48px] flex flex-col gap-[8px]">
                  <p className="text-[#AEAAAE] text-[12px] font-[400]">
                    Doctor Name
                  </p>
                  <p className="text-[#111215] text-[16px] font-[400]">
                    {data?.requestedBy || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            {/* Clinical Information */}
            <div className="w-full mt-3">
              <h6 className="text-[#111215] text-[20px] font-[400]">
                Clinical Information
              </h6>
              <div className="bg-[#F2F2F3] p-[12px] rounded-[6px] flex flex-col gap-[6px] justify-between mt-3">
                <p className="text-[12px] text-[#aeaaae] font-[400]">
                  Symptoms/Clinical Notes
                </p>
                <p className="text-[#111215] text-[16px] font-[400]">
                  {data?.symptoms || "No notes provided"}
                </p>
              </div>
            </div>
            {/* Request Status */}
            <div className="w-full mt-3">
              <h6 className="text-[#111215] text-[20px] font-[400]">
                Request Status
              </h6>
              <div className="bg-[#F2F2F3] w-full h-[48px] p-[12px] rounded-[6px] mt-3">
                <p className="w-[39px] h-[24px] bg-[#ffe2e2] px-[6px] py-[4px] text-[#E7000B] text-[12px] font-[400] rounded-[6px]">
                  NEW
                </p>
              </div>
            </div>
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
          <button 
            onClick={handleAcceptClick}
            className="bg-[#00943C] w-[207px] h-[52px] px-[24px] py-[16px] rounded-[6px] text-[#FAFAFA] text-[18px] font-[600] flex justify-center items-center cursor-pointer "
          >
            Accept & Process
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestRequestModal;
