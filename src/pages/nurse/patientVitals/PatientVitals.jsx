import React from "react";
import { Header } from "@/components/common";
import Sidebar from "@/components/nurse/dashboard/Sidebar";
import { useState, useMemo } from "react";
import { PiUsersThree } from "react-icons/pi";
import { patients } from "../../../../data";

const PatientVitals = () => {
  const bgChange = (status) => {
    if (status === "Active") {
      return "#8AD3A8";
    }
    if (status === "Not Active") {
      return "#605D66";
    }
    if (status === "Passaway") {
      return "#8D8890";
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
// pagination
  // const [page, setPage] = useState(1);
  // const perPage = 8;

  // // total pages
  // const total = patients.length;
  // const pages = Math.ceil(total / perPage);

  // // slice data for current page
  // const shown = useMemo(() => {
  //   const start = (page - 1) * perPage;
  //   return patients.slice(start, start + perPage);
  // }, [page]);

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
                  <h1 className="text-[32px] text-[#00943C] ">All Patients</h1>
                  <PiUsersThree size={25} />
                </div>
                <p className="text-[12px]">View the list of all Patients.</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg shadow mt-6">
              <table className="w-full text-[16px] rounded-lg overflow-hidden">
                <thead className="bg-[#EAFFF3] ">
                  <tr>
                    <th className="p-3 ">S/n</th>
                    <th className="p-3">Patient Name</th>
                    <th className="p-3">Gender</th>
                    <th className="p-3">Age</th>
                    <th className="p-3">Blood/Gp</th>
                    <th className="p-3">Diagnosis</th>
                    <th className="p-3">Phone Number</th>
                    <th className="p-3">Address</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>

                <tbody className="bg-[#FFFFFF]">
                  {patients.map((p, index) => (
                    <tr key={index} className="border-b last:border-b-0">
                      <td className="px-4 py-4 ">
                        {String(index + 1).padStart(2, "0")}
                      </td>
                      <td className="text-center">{p.name}</td>
                      <td className="text-center">{p.gender}</td>
                      <td className="text-center">{p.age}</td>
                      <td className="text-center ">{p.blood}</td>
                      <td className="text-center  ">{p.diagnosis}</td>
                      <td className="text-center">{p.phone}</td>
                      <td className="p-3 text-[12px] text-center max-w-[220px]">
                        {p.address}
                      </td>
                      <td className="text-center ">
                        <span
                          className="w-[102px] h-[24px] rounded-full text-[12px] text-[#FFFFFF] font-medium flex items-center justify-center text-center"
                          style={{ backgroundColor: bgChange(p.status) }}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PatientVitals;
