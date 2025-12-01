import React from "react";
import { IoAddOutline } from "react-icons/io5";
import { medicalHistory } from "../../../../data";
//  routing page to Patient Daignosis
import { Link } from "react-router-dom";

const MedicalHistory = () => {
  return (
    <div className="mt-5">
      <div className="flex justify-between">
        <h1 className="text-[24px]">Medical History</h1>

        <Link to={"/dashboard/doctor/incoming/patientdiagnosis"}>
          <button className="flex justify-center gap-2 text-[#FFFFFF] items-center w-[181px] h-[40px] text-[12px] bg-[#00943C] rounded-[4px]">
            <span>
              <IoAddOutline size={12} />
            </span>{" "}
            Add New Diagnosis{" "}
          </button>
        </Link>
      </div>

      {/* medical History table data */}
      <div className="overflow-x-auto rounded-lg shadow mt-6">
        <table className="w-full  border-[#605D66] rounded-md">
          <thead className=" ">
            <tr className=" border-[#AEAAAE]  border-b ">
              <th className="p-3 border-r border-[#AEAAAE] ">Type</th>
              <th className="p-3 border-r border-[#AEAAAE] ">Diagnosis</th>
              <th className="p-3 border-r border-[#AEAAAE] ">Time</th>
              <th className="p-3 border-r border-[#AEAAAE] ">Date</th>
              <th className="p-3">Notes</th>
            </tr>
          </thead>

          <tbody className="bg-[#FFFFFF]">
            {medicalHistory.map((record, index) => {
              return (
                <tr key={index}>
                  <td className="text-center py-5 border-r border-[#AEAAAE] ">
                    {record.type}
                  </td>
                  <td className="text-center border-r border-[#AEAAAE] ">
                    {record.diagnosis}
                  </td>
                  <td className="text-center border-r border-[#AEAAAE] ">
                    {record.time}
                  </td>
                  <td className="text-center border-r border-[#AEAAAE] ">
                    {record.date}
                  </td>
                  <td className="text-center">{record.notes}</td>
                  <td className="">
                    <a
                      href={record.detailsLink}
                      className="text-[#3498DB] hover:text-blue-500 "
                    >
                      View Details
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MedicalHistory;
