import React from "react";
import { TbCalendarPlus } from "react-icons/tb";
import { IoIosArrowRoundForward } from "react-icons/io";
import { upComingAppointments } from "../../../../data";

const UpcomingAppointments = () => {
  return (
    <section className="mt-10">
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <TbCalendarPlus size={29} color="#00943C" />
          <p className="text-[24px]">Up coming Appointments</p>
        </div>

        <div className="flex items-center text-[20px] text-[#00943C] gap-2">
          View All
          <button>
            <IoIosArrowRoundForward size={32} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow mt-6">
        <table className="w-full text-[16px] rounded-lg overflow-hidden">
          <thead className="bg-[#EAFFF3] ">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Patient Name</th>
              <th className="p-3">Appointment Type</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>

          <tbody className="bg-[#FFFFFF] ">
            {upComingAppointments.map((schedules, index) => {
              return (
                <tr
                  key={index}
                  className="border-b last:border-b-0 text-center "
                >
                  <td className="py-7">{schedules.time}</td>
                  <td>{schedules.patientName}</td>
                  <td>{schedules.AppointmentsType}</td>
                  <td>
                    <span className="inline-block w-[150px] rounded-[6px] bg-[#8AD3A8]  h-[24px]">
                      {schedules.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default UpcomingAppointments;
