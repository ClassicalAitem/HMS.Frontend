import React from "react";
import Sidebar from "../../../components/dashboard/nurse/Sidebar";
import Header from "../../../components/dashboard/nurse/Topbar";
import TaskAssigned from "@/components/dashboard/nurse/TaskAssigned";
import MeditationSchedule from "@/components/dashboard/nurse/MedicationSchedule";

const NurseDashboard = () => {
  return (
    <div className="flex h-screen bg-base-200">
      <Sidebar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1">
          <TaskAssigned />
          <MeditationSchedule />
        </div>
      </div>
    </div>
  );
};

export default NurseDashboard;
