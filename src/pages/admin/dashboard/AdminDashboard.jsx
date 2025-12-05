import React from "react";
import { Header } from "@/components/common";
import SideBar from "@/components/admin/dashboard/SideBar";
import AdminDashboardOverview from "@/components/admin/dashboard/AdminDashboardOverview";
import StaffSchedule from "@/components/admin/dashboard/StaffSchedule";
import StockUpdate from "@/components/admin/dashboard/StockUpdate";
import TotalStaff from "@/components/admin/dashboard/TotalStaff";

const AdminDashboard = () => {
  return (
    <div className="flex h-screen ">
      <SideBar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto">
          <AdminDashboardOverview />

          <div className="flex gap-3 px-4 mb-3 sm:gap-4">
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
