import React from "react";
import { Header } from "@/components/common";
import {
  Sidebar,
  TaskAssigned, 
  MedicationSchedule
} from "@/components/nurse";

const NurseDashboard = () => {
  return (
    <div className="flex h-screen bg-base-200">
      <Sidebar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1">
          <TaskAssigned />
          <MedicationSchedule />
        </div>
      </div>
    </div>
  );
};

export default NurseDashboard;
