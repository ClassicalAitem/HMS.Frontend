/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import AdminLayout from "@/layouts/admin/AdminLayout";
import { LuDownload, LuPlus } from "react-icons/lu";
import { FiUser } from "react-icons/fi";
import { FaCalendarAlt, FaChevronDown, FaClock } from "react-icons/fa";
import { staffList } from "../../../../data";

const Schedule = () => {
  const [selectedStaff, setSelectedStaff] = useState("all");

  const staffActions = [
    {
      id: 1,
      icon: <LuDownload className="w-5 h-5" />,
      action: "Export Schedule",
    },
    {
      id: 2,
      icon: <FiUser className="w-5 h-5" />,
      action: "Manage Staff",
    },
    {
      id: 3,
      icon: <LuPlus className="w-5 h-5" />,
      action: "Add New Shift",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary/10 text-primary">
                Staff Rostering
              </span>
              <span className="text-xs text-base-content/60">Shift Schedules</span>
            </div>
            <h1 className="text-2xl font-bold text-base-content mt-1">
              Staff Schedules & Shift Rosters
            </h1>
            <p className="text-sm text-base-content/70 mt-0.5">
              Manage and view staff shifts, departmental rotations, and duty allocations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {staffActions.map((act, index) => {
              const isLast = index === staffActions.length - 1;
              return (
                <button
                  key={index}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-colors ${
                    isLast
                      ? "bg-primary text-primary-content shadow-sm hover:bg-primary/90"
                      : "bg-base-200 text-base-content/80 hover:bg-base-300"
                  }`}
                >
                  {act.icon}
                  <span>{act.action}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Schedule Table Container */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-base-content">
                Weekly Duty Roster
              </h3>
              <p className="text-xs text-base-content/60">
                Staff shifts scheduled across clinical and administrative units
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 bg-base-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-base-content/70 hover:bg-base-300">
                <FiUser className="w-3.5 h-3.5" />
                <span>All Personnel</span>
              </button>
              <button className="flex items-center gap-2 bg-base-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-base-content/70 hover:bg-base-300">
                <FaCalendarAlt className="w-3.5 h-3.5" />
                <span>Active Week</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-left">
              <thead className="bg-base-200/60 text-xs font-bold text-base-content uppercase border-b border-base-200">
                <tr>
                  <th className="py-3 px-4">S/N</th>
                  <th className="px-4">Staff Name</th>
                  <th className="px-4">Designation / Role</th>
                  <th className="px-4">Assigned Shift Time</th>
                  <th className="px-4">Scheduled Duty Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200 text-sm">
                {staffList.map((staff, index) => (
                  <tr key={staff.id || index} className="hover:bg-base-200/40">
                    <td className="px-4 py-3 font-semibold text-base-content/60">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="px-4 py-3 font-medium text-base-content">
                      {staff.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-base-200 text-base-content/80">
                        {staff.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FaClock className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-medium text-base-content/90">
                          {staff.time || "08:00 AM - 04:00 PM"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-xs text-base-content/80">
                      {staff.day || "Monday - Friday"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Schedule;
