import React from 'react'
import { Header } from "@/components/common";
import Sidebar from "@/components/pharmacist/dashboard/Sidebar";

const Reports = () => {
  return (
    <div className="flex h-screen bg-base-200">
      <Sidebar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1 ">
          <section className="p-7">
            reports reports reports reports reports reports reports reports
            reports reports reports reports reports reports reports reports
            reports reports reports reports reports reports reports reports
            reports reports reports reports reports reports reports reports
            reports reports reports reports reports reports reports reports
            reports reports reports reports reports reports reports reports
            reports reports reports reports reports reports reports reports
            reports reports reports reports reports reports reports reports
          </section>
        </div>
      </div>
    </div>
  );
}

export default Reports
