import React from "react";
import { Header } from "@/components/common";
import SideBar from "@/components/admin/dashboard/Sidebar";
import { LuDownload } from "react-icons/lu";
import { FiUser } from "react-icons/fi";
import { LuPlus } from "react-icons/lu";
import { FaCalendarAlt, FaChevronDown } from "react-icons/fa";
import doctorIcon from "../../../assets/images/doctorIcon.png";
import { staffList } from "../../../../data";

const Schedule = () => {
  const staffMAnagement = [
    {
      id: 1,
      icon: <LuDownload size={24} />,
      action: "Export Schedule",
    },
    {
      id: 2,
      icon: <FiUser size={24} />,
      action: "Manage Staff",
    },
    {
      id: 3,
      icon: <LuPlus size={24} />,
      action: "Add New Shift",
    },
  ];
  return (
    <div className="flex h-screen bg-base-200">
      <SideBar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto">
          <section className="p-8">
            <div className="w-[798px]">
              <h1 className="text-[32px]">Staff Schedules</h1>
              <p className="text-[12px]">
                Manage and view all staff shifts and work schedules across
                departments. Add new shifts, modify existing ones, and assign
                personnel.
              </p>

              <div className="flex gap-8 mt-3">
                {staffMAnagement.map((schedule, index) => {
                  const lastButton = index === staffMAnagement.length - 1; // check last button
                  return (
                    <button
                      key={index}
                      className={`w-[199px] h-[56px] border border-primary flex justify-center items-center gap-3 text-[16px] font-[400] rounded-[4px] ${
                        lastButton ? "bg-primary text-primary-content" : "bg-base-100"
                      }`}
                    >
                      {schedule.icon} {schedule.action}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <div className="w-[525px]">
                <h1 className="text-primary text-[32px]">Add New Shift</h1>
                <p className="text-[12px]">
                  Assign roles to your staffs, they would get notification to
                  wherever you assign them to.
                </p>
              </div>

              {/* i wanted to use the select dropdown input tag but its not coming out very well */}

              {/* <div className="flex gap-4 mt-4">
                <div className="flex bg-[#F1F2F1] gap-4 items-center justify-center">
                  <FaUser className="" />
                  <select className=" w-[105px] h-[32px]">
                    <option>All Staff</option>
                  </select>
                </div>
              </div> */}

              <div className="flex gap-4 mt-5">
                {/* All Staff Filter */}
                <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md bg-base-200 border-base-300 text-base-content/70 ">
                  <FiUser className="text-base-content/70" />
                  <p>All Staff</p>
                  <FaChevronDown className="ml-auto text-base-content/70" />
                </button>

                {/* Doctors Filter */}
                <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md bg-base-200 border-base-300 text-base-content/70">
                  <img src={doctorIcon} alt="" />

                  <p>Doctors</p>
                  <FaChevronDown className="ml-auto text-gray-500" />
                </button>

                {/* Date Filter */}
                <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md bg-base-200 border-base-300 text-base-content/70 ">
                  <FaCalendarAlt className="text-base-content/70" />
                  <p>11th Sep 2025</p>
                </button>
              </div>
            </div>

            {/* staff list data table... data coming from data.js */}

            <div>
              <div className="mt-6 overflow-x-auto rounded-lg shadow">
                <table className="w-full bg-base-100 text-[16px]">
                  {/* Table header */}
                  <thead className="text-left bg-base-200 text-base-content/70">
                    <tr>
                      <th className="px-4 py-2">S/n</th>
                      <th className="px-4 py-2">Staff Names</th>
                      <th className="px-4 py-2">Role</th>
                      <th className="px-4 py-2">Assign Time</th>
                      <th className="px-4 py-2">Day</th>
                    </tr>
                  </thead>

                  {/* Table */}
                  <tbody>
                    {staffList.map((staff, index) => (
                      <tr key={staff.id}>
                        <td className="px-5 py-2">
                          {String(index + 1).padStart(2, "0")}
                        </td>
                        <td className="px-4 py-4">{staff.name}</td>
                        <td className="px-4 py-4">{staff.role}</td>

                        {/* <td className="px-4 py-2">{staff.time}</td> */}
                        <select className="border border-base-300 rounded-[6px] py-1 w-[271px] mt-3">
                          <td>
                            <option key={index} value="">
                              {staff.time}
                            </option>
                          </td>
                        </select>

                        <td className="px-4 py-2">{staff.day}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center gap-4 mt-6">
                <button className="bg-base-100 text-base-content/70 w-[203px] px-6 py-2 rounded-full shadow ">
                  Review Shift
                </button>
                <button className="bg-primary text-primary-content  w-[203px] px-6 py-2 rounded-full shadow ">
                  Add Shift
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
