import React, { useState } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from "@/components/doctor/dashboard";

const DoctorLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen max-h-screen w-full overflow-hidden bg-base-200">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[280px] transform transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden bg-base-200">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex-1 h-full min-h-0 overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-5">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DoctorLayout;