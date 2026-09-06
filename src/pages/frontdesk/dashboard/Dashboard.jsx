import React from 'react';
import { FrontdeskLayout } from '@/layouts/frontdesk';
import { 
  UpcomingSurgeries, 
  OverallDischarge, 
  RecentlyAddedPatients 
} from '@/components/frontdesk';
import KolakLoader from '@/components/common/KolakLoader';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { FaUserPlus, FaCalendarPlus } from 'react-icons/fa';

const FrontdeskDashboard = () => {
  const [loading, setLoading] = React.useState(false);
  const { user } = useAppSelector((state) => state.auth);
  return (
    <FrontdeskLayout>
      {loading && <KolakLoader fullscreen />}

      {/* Page Header: actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 2xl:mb-8 gap-4">
        <div className="w-full md:w-2/3">
          <h1 className="text-2xl sm:text-3xl font-regular">
            Welcome, Front Desk <span className="font-bold text-primary">{`${[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User'}`}</span>
          </h1>
          <p className="text-sm mt-1 text-base-content/70">Manage patient registrations, appointments, and hospital operations.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/frontdesk/registration" className="btn btn-primary btn-sm shadow-sm">
            <FaUserPlus className="mr-1" /> New Patient
          </Link>
          <Link to="/frontdesk/appointments" className="btn btn-outline btn-sm bg-base-100">
            <FaCalendarPlus className="mr-1" /> Appointments
          </Link>
        </div>
      </div>

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
