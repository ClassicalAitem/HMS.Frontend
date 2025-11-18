import React from "react";

const StaffSchedule = () => {
  const staffData = [
    {
      id: 1,
      name: "Jane Cooper",
      role: "Doctor",
      time: "08:00AM - 16:00PM",
      status: "On Duty",
    },
    {
      id: 2,
      name: "Esther Howard",
      role: "Doctor",
      time: "08:00AM - 16:00PM",
      status: "On Schedule",
    },
    {
      id: 3,
      name: "Cody Fisher",
      role: "Front Desk",
      time: "08:00AM - 16:00PM",
      status: "Off Duty",
    },
    {
      id: 4,
      name: "Jenny Wilson",
      role: "Doctor",
      time: "08:00AM - 16:00PM",
      status: "On Duty",
    },
    {
      id: 5,
      name: "Robert Fox",
      role: "Lead Nurse",
      time: "08:00AM - 16:00PM",
      status: "On Schedule",
    },
    {
      id: 6,
      name: "Kristin Watson",
      role: "Doctor",
      time: "08:00AM - 16:00PM",
      status: "Off Duty",
    },
  ];

  // badge background colors (match screenshot palette)
  const bgChange = (status) => {
    if (status === "On Duty") {
      return "#D0EEA6"; // light green
    }
    if (status === "On Schedule") {
      return "#D6EDFE"; // light blue
    }
    if (status === "Off Duty") {
      return "#D9D9D9"; // light gray
    }
    return "#E5E7EB";
  };

  // badge text colors to improve contrast
  const textColor = (status) => {
    if (status === "On Duty") return "#1F6D2E";
    if (status === "On Schedule") return "#1F5C99";
    if (status === "Off Duty") return "#4B5563";
    return "#374151";
  };

  return (
    <div className="px-5 overflow-x-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[32px] font-medium">Staff Schedule</h1>
        <button className="px-5 py-2 rounded-full border border-[#0A843E] text-[#0A843E] hover:bg-primary hover:text-base-content">
          View All
        </button>
      </div>

      {/* Table */}
      <table className="w-full text-left min-w-[600px] mb-10">
        {/* T-Head */}
        <thead className="bg-base-100">
          <tr className="text-sm">
            <th className="p-4">S/n</th>
            <th className="p-4">Staff Name</th>
            <th className="p-4">Role</th>
            <th className="p-4">Time</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>

        {/* T-Body */}
        <tbody>
          {staffData.map((staff, index) => (
            <tr key={staff.id} className="border-b">
              <td className="p-4 py-5 w-20">{String(index + 1).padStart(2, "0")}</td>
              <td className="p-4">{staff.name}</td>
              <td className="p-4">{staff.role}</td>
              <td className="p-4">{staff.time}</td>
              <td className="p-4">
                <span
                  className="min-w-[110px] h-[28px] px-3 rounded-full text-sm font-medium inline-flex items-center justify-center"
                  style={{ backgroundColor: bgChange(staff.status), color: textColor(staff.status) }}
                >
                  {staff.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StaffSchedule;
