import React from 'react'
import { Header } from "@/components/common";
import Sidebar from "@/components/pharmacist/dashboard/Sidebar";

const Incoming = () => {
  return (
    <div className="flex h-screen bg-base-200">
      <Sidebar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1 ">
          <section className="p-7">
            incoming incoming incoming incoming incoming incoming incoming
            incoming incoming incoming incoming incoming incoming incoming
            incoming incoming incoming incoming incoming incoming incoming
            incoming incoming incoming incoming incoming incoming incoming
            incoming incoming incoming incoming incoming incoming incoming
            incoming incoming incoming incoming incoming incoming incoming
            incoming incoming incoming incoming incoming incoming incoming
            incoming incoming incoming incoming incoming incoming incoming
            incoming incoming incoming incoming incoming incoming incoming
            incoming incoming incoming incoming incoming incoming incoming
            incoming incoming incoming incoming incoming incoming incoming
            incoming incoming incoming incoming incoming incoming incoming
            incoming incoming incoming incoming incoming incoming incoming
            incoming incoming incoming incoming incoming incoming incoming
            incoming incoming incoming incoming incoming incoming incoming
            incoming incoming incoming incoming incoming incoming incoming
            incoming incoming incoming incoming incoming incoming incoming
            incoming incoming incoming incoming incoming incoming incoming
            incoming incoming incoming incoming incoming incoming incoming
            incoming incoming incoming incoming incoming incoming incoming
            incoming incoming incoming incoming
          </section>
        </div>
      </div>
    </div>
  );
}

export default Incoming
