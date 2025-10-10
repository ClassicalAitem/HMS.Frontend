import React from "react";
import { Header } from "@/components/common";
import Sidebar from "../../../components/doctor/dashboard/Sidebar";
import { LuPlus } from "react-icons/lu";
import { appointmentsWithDoctor } from "../../../../data";
import Patient from "./Patient";

const Appointment = () => {
  return (
    <div className="flex h-screen ">
      <Sidebar />

      <div className="flex overflow-hidden flex-col flex-1 ">
        <Header />

        <div className="overflow-y-auto flex-1">
          <section className="p-7">
            <div className="flex justify-between">
              <div>
                <h1 className="text-[24px]">Appointments</h1>
                <p className="text-[16px]">Tuesday, September 9, 2025</p>
              </div>
              <div className="flex items-center">
                <button
                  className="bg-[#00943C] w-[301px] h-[56px] text-[#FFFFFF] flex justify-center items-center gap-2 rounded-[6px]"
                  onClick={() => setShowModal(true)}
                >
                  <LuPlus /> Book Appointment
                </button>
              </div>
            </div>

            <div  className="flex justify-between mt-10">
              {appointmentsWithDoctor.map((meetings, index) => {
                return (
                  <div
                    key={index}
                    className="w-[300px] h-[150px] bg-[#FFFFFF] shadow p-5"
                  >
                    <h1 className="text-[16px] text-[#605D66]">
                      {meetings.header}
                    </h1>
                    <p className="py-2 text-[30px]">{meetings.value}</p>
                    <p className="text-[#605D66] text-[12px]">{meetings.status}</p>
                  </div>
                );
              })}
            </div>



            <div>
              <Patient/>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Appointment;
