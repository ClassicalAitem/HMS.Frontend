import React from "react";
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import { TestHistory } from "../../../../data";
import { pendingTestRequest } from "../../../../data";
import { completedToday } from "../../../../data";

const LaboratoryDashboard = () => {
  return (
    <div className="flex h-screen bg-base-200">
      <LaboratorySidebar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1 ">
          <section className="p-7">
            <h4 className="text-[32px] text-[#00943C]">
              Welcome Back, Lab Technician!
            </h4>
            <p className="text-[12px]">
              Here’s what’s happening in your lab today. Thursday 5th October
              2025
            </p>

            <div className="flex gap-[20px] justify-between mt-10">
              {TestHistory.map((test, index) => {
                const isFourthCard = index === 3
                return (
                  <div
                    key={index}
                    className={`w-[300px] h-[150px] bg-[#FFFFFF] shadow p-5 text-[12px] rounded-[8px] ${
                      isFourthCard ? "text-[#DC362E]" : ""
                    }`}
                  >
                    <h1 className={`text-[16px] text-[#605D66] ${isFourthCard ? "text-[#DC362E]" : ""}`}>
                      {test.header}
                    </h1>
                    <p className="py-2 text-[30px] ">{test.value}</p>
                    <p
                      className={`text-[#605D66] text-[12px] ${
                        isFourthCard ? "text-[#DC362E]" : ""
                      }`}
                    >
                      {test.status}
                    </p>
                  </div>
                );
              })}
            </div>
            {/* Pending test results and Completed Today */}

            <section className="mt-10">
              <div className="flex justify-between">
                <div className="w-[670px] h-[458px] rounded-[6px] border border-[#AEAAAE] p-5">
                  <h4 className="text-[24px] text-[#00943C]">
                    Pending Test Requests
                  </h4>
                  <p className="text-[#605D66]">
                    Overview of tests awaiting processing.
                  </p>

                  <div className="mt-5 flex flex-col gap-5 ">
                    {pendingTestRequest.map((result, index) => {
                      return (
                        <div
                          key={index}
                          className="w-full h-[60px] border border-[#AEAAAE] rounded-[6px]"
                        >
                          <div className="flex justify-between items-center px-3 mt-2">
                            <div className="flex gap-3 items-center">
                              <span className="w-[10px] h-[10px] rounded-full bg-[#3498DB] inline-block"></span>
                              <div>
                                <p className="text-[16px] font-[500]">
                                  {result.name}
                                </p>
                                <p className="text-[12px]">{result.issuedBy}</p>
                              </div>
                            </div>
                            <div className="bg-[#3498DB] w-[78px] h-[32px] flex items-center justify-center rounded-[6px]">
                              {result.status}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <button className="text-[#3498DB] underline font-semibold">
                      View All
                    </button>
                  </div>
                </div>

                <div className="w-[670px] h-[458px] rounded-[6px] border border-[#AEAAAE] p-5">
                  <h4 className="text-[24px] text-[#00943C]">
                    Completed Today
                  </h4>
                  <p className="text-[#605D66]">
                    Here is an overview of all your completed request
                  </p>

                  <div className="mt-5 flex flex-col gap-5 ">
                    {completedToday.map((result, index) => {
                      return (
                        <div
                          key={index}
                          className="w-full h-[60px] border border-[#AEAAAE] rounded-[6px]"
                        >
                          <div className="flex justify-between items-center px-3 mt-2">
                            <div className="flex gap-3 items-center">
                              <span className="w-[10px] h-[10px] rounded-full bg-[#71B908] inline-block"></span>
                              <div>
                                <p className="text-[16px] font-[500]">
                                  {result.name}
                                </p>
                                <p className="text-[12px]">{result.testType}</p>
                              </div>
                            </div>
                            <div className=" flex items-center justify-center rounded-[6px]">
                              {result.date}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <button className="text-[#3498DB] underline font-semibold">
                      View All
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LaboratoryDashboard;
