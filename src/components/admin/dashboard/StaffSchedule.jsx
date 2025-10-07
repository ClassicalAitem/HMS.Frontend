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

  // function to return the right badge style
  const bgChange = (status) => {
    if (status === "On Duty") {
      return "#D0EEA6";
    }
    if (status === "On Schedule") {
      return "#D6EDFE";
    }
    if (status === "Off Duty") {
      return "#D9D9D9";
    }
  };

  return (
    <div className="px-5 overflow-x-auto">
      <div className="flex justify-between text-[#00943C]">
        <h1 className="text-[32px] ">Staff Schedule</h1>
        <button>View All</button>
      </div>

      <table className="w-full  text-left min-w-[600px] mb-10">
        {/* T-Head */}
        <thead className="bg-[#EAFFF3] rounded-[20px]">
          <tr>
            <th className="p-3">S/n</th>
            <th className="p-3">Staff Name</th>
            <th className="p-3">Role</th>
            <th className="p-3">Time</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>

        {/* T-Body */}
        <tbody>
          {staffData.map((staff, index) => (
            <tr key={staff.id} className="border">
              <td className="p-3 py-5">{String(index + 1).padStart(2, "0")}</td>
              <td className="p-3">{staff.name}</td>
              <td className="p-3">{staff.role}</td>
              <td className="p-3">{staff.time}</td>
              <td className="p-3">
                <span
                  className="w-[102px] h-[24px] rounded-full text-sm font-medium flex items-center justify-center"
                  style={{ backgroundColor: bgChange(staff.status) }}
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
