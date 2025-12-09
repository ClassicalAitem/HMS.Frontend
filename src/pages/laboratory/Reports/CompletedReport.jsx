import React from "react";
import { CiSearch } from "react-icons/ci";
import { useState } from "react";
import { RiFilter3Fill } from "react-icons/ri";
import { testReports } from "../../../../data";
import { FiDownload } from "react-icons/fi";

const CompletedReport = () => {
  const resultBgChange = (result) => {
    if (result === "Normal") return "#DBFCE7";

    if (result === "Positive") return "#FFE2E2";
  };

  // badge text colors to improve contrast
  const resultTextColor = (result) => {
    if (result === "Normal") return "#11AD4B";
    if (result === "Positive") return "#E7000B";

    return "#374151";
  };

  const statusBgChange = (status) => {
    if (status === "Approved") return "#DBFCE7";

    if (status === "Pending Review") return "#FFEDD4";
  };

  // badge text colors to improve contrast
  const statusTextColor = (status) => {
    if (status === "Approved") return "#11AD4B";
    if (status === "Pending Review") return "#E7000B";

    return "#374151";
  };
  const [searchTerm, setSearchTerm] = useState("");
  return (
    <div>
      <div className="flex justify-between mt-5">
        <div className="relative flex items-center pt-4 lg:pt-0  ">
          <input
            type="search "
            name="search"
            id="search"
            value={searchTerm}
            className="border border-[#AEAAAE] lg:w-[1250px] w-full rounded-[10px] pl-10 p-3 "
            placeholder="Search reports by patient's name or patient’s ID"
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // reset to page 1 when searching
            }}
          />
          <CiSearch className="absolute  pl-3 items-center " size={30} />
        </div>
        <div className="">
          <button className="w-[138px] p-3 border border-[#AEAAAE] flex gap-2 justify-center items-center text-[16px] font-[400] rounded-[10px] cursor-pointer">
            {" "}
            <RiFilter3Fill /> Filter
          </button>
        </div>
      </div>

      {/* table */}
      <section>
        <div className="flex justify-between items-center mt-10">
          <div className="flex flex-col">
            <h1 className="text-[24px] font-[400]">Completed Test Reports</h1>
            <p className="text-[16px] text-[#605D66]">
              All finalized laboratory test reports
            </p>
          </div>
          <div>
            <button className="w-[125px] h-[52px]">
              <p className="text-[#3498DB] text-[18px] font-semibold cursor-pointer">
                See All
              </p>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg shadow mt-6">
          <table className="w-full text-[16px] rounded-lg overflow-hidden">
            <thead className="bg-[#EAFFF3]">
              <tr>
                <th class="p-2">Report ID</th>
                <th class="p-2">Patient Name</th>
                <th class="p-2">Test Type</th>
                <th class="p-2">Date</th>
                <th class="p-2">Result</th>
                <th class="p-2">Status</th>
                <th class="p-2">Action</th>
              </tr>
            </thead>

            <tbody className="bg-[#FFFFFF]">
              {testReports.map((item, index) => {
                return (
                  <tr key={index} className="last:border-b-0 text-center ">
                    <td class="border-b py-7">{item.reportId}</td>
                    <td class="border-b p-2">{item.patientName}</td>
                    <td class="border-b p-2">{item.testType}</td>
                    <td class="border-b p-2">{item.date}</td>
                    <td class="border-b p-2">
                      <span
                        className="min-w-[94px] h-[27px] px-3 rounded-[6px] text-sm font-medium inline-flex items-center justify-center"
                        style={{
                          backgroundColor: resultBgChange(item.result),
                          color: resultTextColor(item.result),
                        }}
                      >
                        {item.result}
                      </span>
                    </td>
                    <td class="border-b p-2">
                      <span
                        className="min-w-[94px] h-[27px] px-3 rounded-[6px] text-sm font-medium inline-flex items-center justify-center"
                        style={{
                          backgroundColor: statusBgChange(item.status),
                          color: statusTextColor(item.status),
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td class="border-b p-2">
                      <tobi className="flex items-center justify-center gap-2  ">
                        <button className="w-[41px] h-[28px] border text-[12px] rounded-[6px] `">
                          View
                        </button>{" "}
                        <FiDownload size={24} color="#000000" />
                      </tobi>
                    </td>
                    {/* <td class="border-b p-2 text-[12px]">{item.action}</td> */}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default CompletedReport;
