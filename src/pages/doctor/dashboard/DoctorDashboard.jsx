import React from "react";
import { Header } from "@/components/common";
import Sidebar from "../../../components/doctor/dashboard/Sidebar";
import { incomingUpdate } from "../../../../data";
import UpcomingAppointments from "./UpcomingAppointments";

const DoctorDashboard = () => {
  return (
    <div className="flex h-screen ">
      <Sidebar />

      <div className="flex overflow-hidden flex-col flex-1 ">
        <Header />

        <div className="overflow-y-auto flex-1">
          <section className="p-7">
            <div className="w-[687px]">
              <h1 className="text-[32px] font-[500]">Welcome, Doctor John</h1>
              <p className="text-[12px]">
                Your dashboard provides a comprehensive overview of your daily
                tasks and patient information.
              </p>
            </div>

            <div className="flex justify-evenly mt-5">
              {incomingUpdate.map((update, index) => {
                return (
                  <div className="w-[350px] h-[152px] bg-[#FFFFFF] shadow p-5 rounded-[10px] ">
                    <div className="flex justify-between">
                      <p className="text-[12px]">{update.notifications}</p>
                      <img src={update.img} alt="..." />
                    </div>
                    <h1 className="text-[32px] font-[500]">{update.data}</h1>
                  </div>
                );
              })}
            </div>

            <div>
              <UpcomingAppointments/>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
