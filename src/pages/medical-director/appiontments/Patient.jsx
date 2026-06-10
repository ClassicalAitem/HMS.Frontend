import React from "react";
import { doctorsAppointmentsPatients } from "../../../../data";

const Patient = () => {

   const bgChange = (status) => {
     if (status === "Not Urgent") {
       return "#8AD3A8";
     }
     if (status === "Emergency") {
       return "#DC362E";
     }
    
   };

  return (
    <section>
      <div className="flex justify-between mt-10">
        <h1>Patients</h1>
        <p className="text-blue-400">See All</p>
      </div>

      <div className="overflow-x-auto rounded-lg shadow mt-6">
        <table className="w-full text-[16px] rounded-lg overflow-hidden">
          <thead className="bg-[#EAFFF3] ">
            <tr>
              <th className="p-3 ">S/n</th>
              <th className="p-3">Patient Name</th>
              <th className="p-3">Date</th>
              <th className="p-3">Time</th>
              <th className="p-3">Purpose</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>

<tbody className="bg-[#FFFFFF]">
    {
        doctorsAppointmentsPatients.map((patients, index) => {
return (
  <tr key={index} className=" text-center">
    <td className="py-5">{String(index + 1).padStart(2, "0")}</td>
    <td className="">{patients.name}</td>
    <td>{patients.date}</td>
    <td>{patients.Time}</td>
    <td>{patients.purpose}</td>
    <td className="text-center ">
      <span
className="w-[204px] h-[24px] rounded-full text-[12px] text-[#FFFFFF] font-medium flex mx-auto items-center justify-center text-center"
        style={{ backgroundColor: bgChange(patients.status) }}
      >
        {patients.status}
      </span>
    </td>
  </tr>
);
        })
    }



</tbody>

        </table>
      </div>
    </section>
  );
};

export default Patient;
