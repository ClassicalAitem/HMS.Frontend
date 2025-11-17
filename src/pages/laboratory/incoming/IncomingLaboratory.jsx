import React from "react";
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import { incomingTestResult } from "../../../../data";
import { patientTestResults } from "../../../../data";
import AcceptTestRequestModal from "./modals/AcceptTestRequestModal";
import TestRequestModal from "./modals/TestRequestModal";
import { useState } from "react";

const IncomingLaboratory = () => {
  const bgChange = (status) => {
    if (status === "Urgent") {
      return "#FFE2E2";
    }
    if (status === "Normal") {
      return "#DBEAFE";
    }
  };
  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null); //multiple patients are listed, every patient card can open a with a selectedCard 
  return (
    <div className="flex h-screen bg-base-200">
      <LaboratorySidebar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1 ">
          <section className="p-7">
            <h4 className="text-[32px] text-[#00943C]">
              Incoming Test Results
            </h4>
            <p className="text-[12px]">
              Review and process new test requests from doctors
            </p>

            <div className="flex gap-10 justify-between mt-10">
              {incomingTestResult.map((test, index) => {
                return (
                  <div
                    key={index}
                    className={`w-[300px] h-[150px] bg-[#FFFFFF] shadow p-5 text-[12px] rounded-[8px] ${
                      index === 1 ? "text-[#DC362E] " : ""
                    }`}
                  >
                    <h1 className="text-[16px] text-[#605D66]">
                      {test.header}
                    </h1>
                    <p className="py-2 text-[30px] mt-5">{test.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between mt-5">
              <h4 className="text-[24px] font-normal">Patients Test Results</h4>
              <button className="text-[#3498DB] font-semibold cursor-pointer">
                See All
              </button>
            </div>

            <div className="flex flex-col gap-5 mt-5">
              {patientTestResults.map((testCard, index) => {
                return (
                  <div
                    key={index}
                    className="w-full h-[280px] border border-[#605D66] rounded-[6px]"
                  >
                    <div className="flex flex-col gap-8 p-5">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex gap-5 items-center">
                            <p className="font-semibold">{testCard.name}</p>
                            <p className="text-[12px]">{testCard.userId}</p>
                            <p
                              style={{
                                backgroundColor: bgChange(testCard.status),
                              }}
                              className={`w-[62px] h-[32px] flex justify-center items-center text ${
                                testCard.status === "Urgent"
                                  ? "text-[#E7000B]"
                                  : "text-[#4680FC]"
                              }`}
                            >
                              {testCard.status}
                            </p>
                          </div>

                          <div>
                            <p className="text-[12px] text-[#605D66]">
                              Test: {testCard.test}
                            </p>
                            <p className="text-[12px] text-[#605D66]">
                              Date: {testCard.date}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="font-semibold">
                            Requested by: {testCard.requestedBy}
                          </p>
                          <p className="text-[12px] text-[#605D66]">
                            Date: {testCard.date}
                          </p>
                          <p className="text-[12px] text-[#605D66]">
                            Time: {testCard.time}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-col">


                          <button
                            onClick={() => {
                              setSelectedCard(testCard), setShowModal(true);
                            }}
                            className="w-[258px] h-[56px] bg-[#00943C] text-[#FFFFFF]"
                          >
                            Accept & Process
                          </button>

                          {showModal && (
                            <AcceptTestRequestModal
                              data={selectedCard}
                              setShowModal={setShowModal}
                            />
                          )}

                          <button
                            onClick={() => {
                              setSelectedCard(testCard), setShowModal2(true);
                            }}
                            className="w-[258px] h-[56px] border border-[#AEAAAE]"
                          >
                            View Details
                          </button>

                          {showModal2 && (
                            <TestRequestModal
                              data={selectedCard}
                              setShowModal2={setShowModal2}
                            />
                          )}
                        </div>
                      </div>

                      <div className="w-full h-[76px] bg-[#EFEFEF] p-4">
                        <p className="text-[16px] text-[#605D66]">
                          Symptoms/Notes:
                        </p>
                        <p className="font-semibold">{testCard.symptoms}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default IncomingLaboratory;
