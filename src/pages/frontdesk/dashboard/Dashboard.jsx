import React, { useState } from 'react';
import { Header } from '@/components/common';
import { 
  Sidebar, 
  UpcomingSurgeries, 
  OverallDischarge, 
  RecentlyAddedPatients 
} from '@/components/frontdesk';

const FrontdeskDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>
      
      {/* Main Content */}
      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/30">
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />
        
        {/* Dashboard Content */}
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-4 sm:py-2">
          {/* Cards Grid - Responsive */}
          <div className="grid grid-cols-1 gap-3 mb-3 sm:gap-4 sm:mb-4 lg:grid-cols-2 2xl:gap-6">
            {/* Upcoming Surgeries */}
            <div className="order-1">
              <UpcomingSurgeries />
            </div>
            
            {/* Overall Discharge Chart */}
            <div className="order-2">
              <OverallDischarge />
            </div>
          </div>
          
          {/* Recently Added Patients Table */}
          <div className="flex flex-1 w-full min-h-0">   
            <RecentlyAddedPatients />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrontdeskDashboard;
