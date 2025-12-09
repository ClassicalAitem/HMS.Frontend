import React from "react";
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import { FiDownload } from "react-icons/fi";
import { GoChevronDown } from "react-icons/go";
import { laboratoryReports } from "../../../../data";
import { useState } from "react";
import CompletedReport from "./CompletedReport";
import Analytics from "./Analytics";
import OverView from "./OverView";

const LaboratoryReports = () => {
  const [activeButton, setActiveButton] = useState("Overview");
  return (
    <div className="flex h-screen bg-base-200">
      <LaboratorySidebar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1 ">
          <section className="p-7">
            <div className="flex justify-between">
              <div>
                <h5 className="text-[32px] text-[#00943C] font-[500]">
                  Inventory & Stocks
                </h5>
                <p className="text-[12px]">
                  Manage laboratory supplies and equipment
                </p>
              </div>
              <div className="flex gap-5">
                <button className="flex items-center gap-3 justify-center bg-[#F7F7F7]  w-[160px] h-[56px] text-black border border-[#AEAAAE] cursor-pointer">
                  <p>This Week</p> <GoChevronDown />
                </button>

                <button className="flex items-center justify-center bg-[#00943C] text-[#FFFFFF] w-[130px] h-[56px] cursor-pointer">
                  <FiDownload /> <p>Export</p>
                </button>
              </div>
            </div>

            <div className="flex gap-[20px] justify-between mt-10">
              {laboratoryReports.map((reports, index) => {
                return (
                  <div
                    key={index}
                    className="w-[300px] h-[150px] bg-[#FFFFFF] shadow p-5 text-[12px] rounded-[8px]"
                  >
                    <h1 className="text-[16px] text-[#605D66]">
                      {reports.header}
                    </h1>
                    <p className="text-[#000000] text-[40px] font-semibold">
                      {reports.value}
                    </p>
                    <p className="text-[16px] text-[#605D66]">
                      {reports.status}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className=" bg-[#E9E8EA] rounded-[6px] w-[458px] h-[54px] flex justify-center items-center px-2 mt-10">
              <button
                onClick={() => setActiveButton("Overview")}
                className={`w-[108px] h-[36px] text-[#000000] rounded-[6px] transition-colors duration-200 cursor-pointer
          ${
            activeButton === "Overview"
              ? "bg-[#00943C] text-[#FFFFFF]"
              : "text-[]"
          }`}
              >
                Overview
              </button>

              <button
                onClick={() => setActiveButton("Completed Reports")}
                className={`w-[211px] h-[36px] text-[#000000] rounded-[6px] transition-colors duration-200 cursor-pointer
          ${
            activeButton === "Completed Reports"
              ? "bg-[#00943C] text-[#FFFFFF]"
              : ""
          }`}
              >
                Completed Reports
              </button>

              <button
                onClick={() => setActiveButton("Analytics")}
                className={`w-[107px] h-[36px] text-[#000000] rounded-[6px] transition-colors duration-200 cursor-pointer
          ${activeButton === "Analytics" ? "bg-[#00943C] text-[#FFFFFF]" : ""}`}
              >
                Analytics
              </button>
            </div>

            {activeButton === "Overview" && (
              <div>
                <OverView />
              </div>
            )}

            {activeButton === "Completed Reports" && (
              <div>
                <CompletedReport />
              </div>
            )}

            {activeButton === "Analytics" && (
              <div>
                <Analytics />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default LaboratoryReports;
