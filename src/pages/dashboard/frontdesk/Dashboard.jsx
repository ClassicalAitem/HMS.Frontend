import React from 'react';
import { 
  Sidebar, 
  Header, 
  UpcomingSurgeries, 
  OverallDischarge, 
  RecentlyAddedPatients 
} from '@/components/dashboard/frontdesk';

const FrontdeskDashboard = () => {
  return (
    <div className="flex h-screen bg-base-200">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Upcoming Surgeries */}
            <UpcomingSurgeries />
            
            {/* Overall Discharge Chart */}
            <OverallDischarge />
          </div>
          
          {/* Recently Added Patients Table */}
          <RecentlyAddedPatients />
        </div>
      </div>
    </div>
  );
};

export default FrontdeskDashboard;
