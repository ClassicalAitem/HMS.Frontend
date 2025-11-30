import React from 'react';
import { FrontdeskLayout } from '@/layouts/frontdesk';
import { 
  UpcomingSurgeries, 
  OverallDischarge, 
  RecentlyAddedPatients 
} from '@/components/frontdesk';

const FrontdeskDashboard = () => {
  return (
    <FrontdeskLayout>
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
    </FrontdeskLayout>
  );
};

export default FrontdeskDashboard;
