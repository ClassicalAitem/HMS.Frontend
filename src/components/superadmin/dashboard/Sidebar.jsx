/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { MdOutlineDashboard, MdSupervisorAccount, MdSecurity, MdStorage, MdSettings, MdAnalytics, MdCalendarMonth } from "react-icons/md";
import { FaBed } from "react-icons/fa";
import { Link, useLocation } from 'react-router-dom';
import { LogoutModal } from '@/components/modals';
import { useAppSelector } from '@/store/hooks';
import HospitalFavicon from "@/assets/images/favicon.svg"
import { getAdmissions } from '@/services/api/admissionApi';

const Sidebar = ({ onCloseSidebar }) => {
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [admittedCount, setAdmittedCount] = useState(0);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    let mounted = true;
    const fetchAdmittedCount = async () => {
      try {
        const res = await getAdmissions();
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : [];
        const active = list.filter((a) => a.status !== 'discharged' && !!a.confirmedAt);
        if (mounted) {
          setAdmittedCount(active.length);
        }
      } catch (e) {
        // quiet fallback
      }
    };
    fetchAdmittedCount();
    const interval = setInterval(fetchAdmittedCount, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Function to generate initials from first and last name
  const generateInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return 'U';
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
  };

  // Function to format role for display
  const formatRole = (role) => {
    switch (role) {
      case 'super-admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'doctor':
        return 'Doctor';
      case 'nurse':
        return 'Nurse';
      case 'frontdesk':
      case 'front-desk':
        return 'Front Desk';
      case 'cashier':
        return 'Cashier';
      default:
        return role || 'User';
    }
  };

  const menuItems = [
    {
      icon: MdOutlineDashboard,
      label: 'Dashboard',
      path: '/dashboard/superadmin',
      active: location.pathname === '/dashboard/superadmin'
    },
    {
      icon: MdAnalytics,
      label: 'Generate Reports',
      path: '/superadmin/reports',
      active: location.pathname === '/superadmin/reports'
    },
    {
      icon: MdSupervisorAccount,
      label: 'Manage Users',
      path: '/superadmin/users',
      active: location.pathname === '/superadmin/users'
    },
    {
      icon: MdSupervisorAccount,
      label: 'Patients',
      path: '/superadmin/patients',
      active: location.pathname === '/superadmin/patients' || location.pathname.startsWith('/superadmin/patients/:patientId')
    },
    {
      icon: FaBed,
      label: 'Admitted Patients',
      path: '/superadmin/admitted',
      active: location.pathname.startsWith('/superadmin/admitted'),
      badge: admittedCount > 0 ? admittedCount : null
    },
    {
      icon: MdCalendarMonth,
      label: 'Appointments',
      path: '/superadmin/appointments',
      active: location.pathname.startsWith('/superadmin/appointments')
    },
    {
      icon: MdSecurity,
      label: 'Registration',
      path: '/superadmin/registration',
      active: location.pathname === '/superadmin/registration'
    },
    {
      icon: MdSettings,
      label: 'Settings',
      path: '/superadmin/settings',
      active: location.pathname.startsWith('/superadmin/settings')
    }
  ];

  const MenuItem = ({ icon: Icon, label, path, active, badge }) => (
    <Link
      to={path}
      onClick={onCloseSidebar}
      className={`flex items-center space-x-3 px-4 2xl:py-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-primary text-primary-content'
          : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
      }`}
    >
      <Icon className="w-4 h-4 2xl:w-5 2xl:h-5 shrink-0" />
      <span className="text-xs 2xl:text-sm flex-1">{label}</span>
      {badge ? (
        <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold leading-none text-white bg-error rounded-full shrink-0">
          {badge}
        </span>
      ) : null}
    </Link>
  );

  return (
    <div className="flex flex-col w-64 h-full bg-base-100  2xl:pb-18">
      {/* Logo */}
      <div className="p-3 border-b-4 border-neutral/10 lg:p-1 2xl:p-3">
        <div className="flex justify-center items-center">
          <div className="flex items-center space-x-2">
            <div className="">
              <img src={HospitalFavicon} alt="Kolak logo" className="w-auto h-10 lg:h-8 2xl:h-12" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold lg:text-md 2xl:text-3xl">Kolak</span>
              <span className="text-sm text-base-content/70 lg:text-xs 2xl:text-base">- Hospital -</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2 lg:py-12">
        {menuItems.map((item, index) => (
          <MenuItem
            key={index}
            icon={item.icon}
            label={item.label}
            path={item.path}
            active={item.active}
            badge={item.badge}
          />
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 space-y-2 border-t border-base-300">
        <Link
          to="/change-password"
          onClick={onCloseSidebar}
          className={`flex items-center px-4 py-3 space-x-3 text-sm font-medium rounded-lg transition-colors ${
            location.pathname === '/change-password'
              ? 'bg-primary text-primary-content'
              : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
          }`}
        >
          <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-xs 2xl:text-sm">Change Password</span>
        </Link>

        <button 
          onClick={() => setIsLogoutModalOpen(true)}
          className="flex items-center px-4 py-3 space-x-3 w-full text-sm font-medium text-left rounded-lg transition-colors text-base-content/70 hover:bg-base-200 hover:text-base-content"
        >
          <svg className="w-4 h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-xs 2xl:text-sm">Log Out</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-base-300">
        <div className="flex items-center space-x-3">
          <div className="flex justify-center items-center w-10 h-10 rounded-full bg-primary/10">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={`${user.firstName} ${user.lastName}`}
                className="object-cover w-10 h-10 rounded-full"
              />
            ) : (
              <div className="flex justify-center items-center w-10 h-10 text-sm font-semibold rounded-full bg-primary text-primary-content">
                {generateInitials(user?.firstName, user?.lastName)}
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-base-content">
              {user ? `${user.firstName} ${user.lastName}` : 'User'}
            </p>
            <p className="text-xs text-primary">
              {formatRole(user?.role)}
            </p>
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
};

export default Sidebar;
