import React from "react";
import { Header } from "@/components/common";
import SideBar from "../../../components/admin/dashboard/SideBar";
import AdminDashboardOverview from "@/components/admin/dashboard/AdminDashboardOverview";
import StaffSchedule from "@/components/admin/dashboard/StaffSchedule";
import StockUpdate from "@/components/admin/dashboard/StockUpdate";
import TotalStaff from "@/components/admin/dashboard/TotalStaff";

const AdminDashboard = () => {
  return (
    <div className="flex h-screen bg-base-200">
      <SideBar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1">
          <AdminDashboardOverview />

          <div className="grid grid-cols-1 gap-3 mb-3 sm:gap-4  lg:grid-cols-2 ">
            <TotalStaff />
            <StockUpdate />
          </div>

          <StaffSchedule />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
