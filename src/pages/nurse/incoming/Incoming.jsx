import React from "react";
import { useState } from "react";
import { Header } from "@/components/common";
import Sidebar from "@/components/nurse/dashboard/Sidebar";
import { RiArrowLeftRightFill } from "react-icons/ri";
import womanLogo from "../../../assets/images/incomingLogo.jpg";
import { incomingData } from "../../../../data";

const Incoming = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };
  return (
    <div className="flex h-screen">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          <section>
            <div>
              <div>
                <div className="flex items-center gap-5 ">
                  <RiArrowLeftRightFill size={25} color="#00943C" />
                  <h1 className="text-[32px] text-[#00943C] ">incoming</h1>
                </div>
                <p className="text-[12px]">
                  Check out the patient sent to you.
                </p>
              </div>
            </div>
            <div className="bg-[#FFFFFF] mt-10 grid grid-cols-2 gap-5 p-5 rounded-[6px]">
              {incomingData.map((data, index) => {
                return (
                  <div
                    key={index}
                    className="w-[600px] h-[216px] bg-[#EFF9F3] ml-5 mt-2 text-[#000000] font-[500]"
                  >
                    <div className="flex gap-8 ml-5 items-center p-5">
                      <div>
                        <img
                          src={womanLogo}
                          alt=""
                          className="w-[52px] h-[52px] bg-fit rounded-full"
                        />
                      </div>

                      <div className="flex flex-col justify-center  w-[200px] h-[112px] text-[13px] ">
                        <span>Name: {data.name} </span>
                        <span className="py-2">
                          Patient ID: {data.PatientID}
                        </span>
                        <span>Reason: {data.illness}</span>
                      </div>
                      <div className="flex flex-col justify-center w-[200px] h-[112px] text-[13px]">
                        <span>Insurance: {data.insurance}</span>
                        <span className="py-2">
                          Registered: {data.registered}
                        </span>
                        <span>Alert: {data.Alert}</span>
                      </div>
                    </div>

                    <div className="flex justify-between px-7">
                      <button>{data.medicalOption1}</button>
                      <button className="text-[#605D66]">
                        {data.medicalOption2}
                      </button>
                      <button className="text-[#605D66]">
                        {data.medicalOption3}
                      </button>
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

export default Incoming;
