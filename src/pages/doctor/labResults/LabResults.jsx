import React from "react";
import { Header } from "@/components/common";
import Sidebar from "../../../components/doctor/dashboard/Sidebar";
import { MdOutlineFileDownload } from "react-icons/md";
import { CiSearch } from "react-icons/ci";
import { resultLab } from "../../../../data";
import { useState, useMemo } from "react";

const LabResults = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;

  const filteredData = useMemo(() => {
    return resultLab.filter((item) =>
      `${item.patientName} ${item.testType} ${item.status}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const bgChange = (status) => {
    if (status === "Completed") {
      return "#F7FEED";
    }
    if (status === "Processing") {
      return "#D6EDFE";
    }
  };
  return (
    <div className="flex h-screen ">
      <Sidebar />

      <div className="flex overflow-hidden flex-col flex-1 ">
        <Header />

        <div className="overflow-y-auto flex-1">
          <section className="p-7">
            <div className="w-[234px]">
              <h1 className="text-[#00943C] text-[32px]">Lab Results</h1>
              <p className="text-[]">View and manage lab results</p>
            </div>

            <div className="flex justify-between mt-5">
              <div className="relative flex items-center pt-4 lg:pt-0  ">
                <input
                  type="search "
                  name="search"
                  id="search"
                  value={searchTerm}
                  className="border border-[#AEAAAE] lg:w-[574px] w-full rounded-[10px] pl-10 p-3 "
                  placeholder="Search by Patient or Test"
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // reset to page 1 when searching
                  }}
                />
                <CiSearch className="absolute  pl-3 items-center " size={30} />
              </div>
              <div className="">
                <button className="w-[138px] h-[56px] border border-[#AEAAAE] flex justify-center items-center text-[18px] font-[600] rounded-[10px]">
                  {" "}
                  <MdOutlineFileDownload size={24} /> Exports
                </button>
              </div>
            </div>

            <section>
              <div className="overflow-x-auto rounded-lg shadow mt-6">
                <table className="w-full text-[16px] rounded-lg overflow-hidden">
                  <thead className="bg-[#EAFFF3] ">
                    <tr>
                      <th class="p-2">Lab ID</th>
                      <th class="p-2">Patient Name</th>
                      <th class="p-2">Patient ID</th>
                      <th class="p-2">Test Type</th>
                      <th class="p-2">Date</th>
                      <th class="p-2">Time</th>
                      <th class="p-2">Doctor</th>
                      <th class="p-2">Status</th>
                    </tr>
                  </thead>

                  <tbody className="bg-[#FFFFFF] ">
                    {resultLab.map((item, index) => {
                      return (
                        <tr
                          key={index}
                          className="last:border-b-0 text-center "
                        >
                          <td class="border-b py-7">{item.labId}</td>
                          <td class="border-b p-2">{item.patientName}</td>
                          <td class="border-b p-2">{item.patientId}</td>
                          <td class="border-b p-2">{item.testType}</td>
                          <td class="border-b p-2">{item.date}</td>
                          <td class="border-b p-2">{item.time}</td>
                          <td class="border-b p-2">{item.doctor}</td>
                          <td className="border-b p-2">
                            <span
                              className="w-[102px] h-[24px] rounded-full text-sm font-medium flex items-center justify-center"
                              style={{
                                backgroundColor: bgChange(item.status),
                              }}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className=" w-[652px] flex mx-auto mt-10">
                <div className="flex items-center gap-10">
                  {/* Page Info */}
                  <p className="text-sm text-gray-500 ">
                    Showing result for{" "}
                    <span className="font-medium text-gray-700">
                      {paginatedData.length} Patients
                    </span>{" "}
                    ({filteredData.length} Total)
                  </p>

                  {/* Pagination Buttons */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={handlePrev}
                      disabled={currentPage === 1}
                      className={`h-[23px] w-[23px] rounded-full border border-[#CAE3F4] ${
                        currentPage === 1
                          ? "text-gray-400 cursor-not-allowed bg-gray-100"
                          : "hover:bg-[#CAE3F4]"
                      }`}
                    >
                      &lt;
                    </button>

                    {[...Array(totalPages)].map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handlePageClick(index + 1)}
                        className={`h-[23px] w-[23px] rounded-full border border-gray-300 ${
                          currentPage === index + 1
                            ? "bg-[#00943C] text-white"
                            : "hover:bg-gray-200 text-gray-700"
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}

                    <button
                      onClick={handleNext}
                      disabled={currentPage === totalPages}
                      className={`h-[23px] w-[23px] rounded-full border border-gray-300 ${
                        currentPage === totalPages
                          ? "text-gray-400 cursor-not-allowed bg-gray-100"
                          : "hover:bg-gray-200"
                      }`}
                    >
                      &gt;
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

export default LabResults;
