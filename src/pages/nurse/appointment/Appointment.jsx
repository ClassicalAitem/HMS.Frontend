import React from "react";
import { useState } from "react";
import { Header } from "@/components/common";
import Sidebar from "@/components/nurse/dashboard/Sidebar";
import { LuPlus } from "react-icons/lu";
import { VscSettings } from "react-icons/vsc";
import { Appointments } from "../../../../data";
import BookAppointmentModal from "../../../components/nurse/bookAppointment/BookAppointmentModal";

const Appointment = () => {
  const bgChange = (status) => {
    if (status === "Active") {
      return "#8AD3A8";
    }
    if (status === "Not Urgent") {
      return "#8AD3A8";
    }
  };

  const [showModal, setShowModal] = useState(false);
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
            <div className="flex justify-between">
              <div>
                <h5 className="text-[24px] font-[400]">Appointments</h5>
                <p className="text-[12px]">Tuesday, September 9, 2025</p>
              </div>
              <div className="flex items-center">
                <button
                  className="bg-[#00943C] w-[301px] h-[56px] text-[#FFFFFF] flex justify-center items-center gap-2 rounded-[6px]"
                  onClick={() => setShowModal(true)}
                >
                  <LuPlus /> Book Appointment
                </button>
              </div>
              {showModal && (
                <BookAppointmentModal setShowModal={setShowModal} />
              )}
            </div>

            {/* filter section */}
            <div className="flex justify-between mt-7">
              <div className="flex items-center">
                <VscSettings />
                <p>Filter</p>
              </div>
              <div>
                <input
                  type="date"
                  className="border border-[#AEAAAE] text-[#AEAAAE] w-[213px] h-[34px] rounded-[4px]"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg shadow mt-6">
              <table className="w-full text-[16px] rounded-lg overflow-hidden border-collapse ">
                <thead className="bg-[#EAFFF3]">
                  <tr>
                    <th className="p-3 py-5">S/n</th>
                    <th className="">Patient Name</th>
                    <th className="">Date</th>
                    <th className="">Time</th>
                    <th className="">Appointment Type</th>
                    <th className="">Status</th>
                  </tr>
                </thead>

                <tbody className="bg-[#FFFFFF] py-5 ">
                  {Appointments.map((appt, index) => (
                    <tr key={index} className="">
                      <td className="p-3  text-center">
                        {String(index + 1).padStart(2, "0")}
                      </td>
                      <td className="flex justify-center py-5">
                        {appt.patientName}
                      </td>
                      <td className="text-center">{appt.date}</td>
                      <td className="text-center">{appt.time}</td>
                      <td className="text-center">{appt.type}</td>
                      <td className="text-center">
                        {" "}
                        <span>{appt.status}</span>
                        {/* <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${statusClasses(
                            appt.status
                          )}`}
                        >
                          {appt.status}
                        </span> */}
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

export default Appointment;
