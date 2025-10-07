import React from 'react'
import { Header } from "@/components/common";
import Sidebar from "../../../components/doctor/dashboard/Sidebar";

const PatientVitals = () => {
  return (
    <div className="flex h-screen ">
      <Sidebar />

      <div className="flex overflow-hidden flex-col flex-1 ">
        <Header />

        <div className="overflow-y-auto flex-1"></div>
      </div>
    </div>
  );
}

export default PatientVitals
