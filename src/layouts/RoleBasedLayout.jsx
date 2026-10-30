import React, { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Header } from '@/components/common';
import AdminLayout from './admin/AdminLayout';
import SuperAdminLayout from './superadmin/SuperAdminLayout';
import DoctorLayout from './doctor/DoctorLayout';
import NurseLayout from './nurse/NurseLayout';
import CashierLayout from './cashier/CashierLayout';
import FrontdeskLayout from './frontdesk/FrontdeskLayout';
import SurgeonLayout from './surgeon/SurgeonLayout';

const RoleBasedLayout = ({ children }) => {
  const { user } = useAppSelector((state) => state.auth);
  const role = user?.role?.toLowerCase() || '';

  if (role === 'admin') return <AdminLayout>{children}</AdminLayout>;
  if (role === 'super-admin') return <SuperAdminLayout>{children}</SuperAdminLayout>;
  if (role === 'doctor' || role === 'medical-director') return <DoctorLayout>{children}</DoctorLayout>;
  if (role === 'nurse') return <NurseLayout>{children}</NurseLayout>;
  if (role === 'cashier' || role === 'account-officer') return <CashierLayout>{children}</CashierLayout>;
  if (role === 'front-desk') return <FrontdeskLayout>{children}</FrontdeskLayout>;
  if (role === 'surgeon') return <SurgeonLayout>{children}</SurgeonLayout>;

  // Default clean layout for other roles (pharmacist, lab-technician, sonographer, etc.)
  return (
    <div className="flex min-h-screen w-full flex-col overflow-hidden bg-base-300/20">
      <Header />
      <main className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-5 lg:p-7">
        {children}
      </main>
    </div>
  );
};

export default RoleBasedLayout;

