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
    <div className="flex h-screen bg-neutral/10">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex overflow-hidden flex-col flex-1">
        {/* Header */}
        <Header />
        
        {/* Dashboard Content */}
        <div className="overflow-y-auto flex-1 p-4 py-2">
          <div className="grid grid-cols-1 gap-6 mb-2 lg:grid-cols-2">
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
