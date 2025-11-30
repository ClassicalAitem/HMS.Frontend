import React from 'react'
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";

const LaboratoryReports = () => {
  return (
    <div className="flex h-screen bg-base-200">
      <LaboratorySidebar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1 ">
          <section className="p-7">
            Reports reports Reports reports Reports reports Reports reports
            Reports reports Reports reports Reports reports Reports reports
            Reports reports Reports reports Reports reports Reports reports
            Reports reports Reports reports Reports reports Reports reports
            Reports reports Reports reports Reports reports Reports reports
            Reports reports Reports reports Reports reports
          </section>
        </div>
      </div>
    </div>
  );
}

export default LaboratoryReports
