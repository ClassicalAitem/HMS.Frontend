import React from "react";
import Sidebar from "../../../components/dashboard/nurse/Sidebar";
import Header from "../../../components/dashboard/nurse/Topbar";
import TaskAssigned from "@/components/dashboard/nurse/TaskAssigned";
import MeditationSchedule from "@/components/dashboard/nurse/MedicationSchedule";
import { useTheme } from "@/contexts/ThemeContext";
useTheme

const NurseDashboard = () => {
  const {currentTheme} = useTheme()
  return (
    <div className="flex h-screen bg-base-200">
      <Sidebar theme={currentTheme} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto">
          <TaskAssigned />
          <MeditationSchedule />
        </div>
      </div>
    </div>
  );
};

export default NurseDashboard;
