import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { Header } from '@/components/common';
import AdminLayout from './admin/AdminLayout';
import SuperAdminLayout from './superadmin/SuperAdminLayout';
import DoctorLayout from './doctor/DoctorLayout';
import MedicalDirectorLayout from './medical-director/MedicalDirectorLayout';
import NurseLayout from './nurse/NurseLayout';
import CashierLayout from './cashier/CashierLayout';
import FrontdeskLayout from './frontdesk/FrontdeskLayout';
import SurgeonLayout from './surgeon/SurgeonLayout';
import DeveloperLayout from './developer/DeveloperLayout';
import PharmacistLayout from './pharmacist/PharmacistLayout';

const RoleBasedLayout = ({ children }) => {
  const { user } = useAppSelector((state) => state.auth);
  const normalizedRole = (user?.role || user?.accountType || '')
    .toLowerCase()
    .trim()
    .replace(/_/g, '-');

  if (normalizedRole === 'developer' || normalizedRole === 'it-support') {
    return <DeveloperLayout>{children}</DeveloperLayout>;
  }
  if (normalizedRole === 'super-admin') return <SuperAdminLayout>{children}</SuperAdminLayout>;
  if (normalizedRole === 'admin') return <AdminLayout>{children}</AdminLayout>;
  if (normalizedRole === 'medical-director') return <MedicalDirectorLayout>{children}</MedicalDirectorLayout>;
  if (normalizedRole === 'doctor') return <DoctorLayout>{children}</DoctorLayout>;
  if (normalizedRole === 'nurse') return <NurseLayout>{children}</NurseLayout>;
  if (normalizedRole === 'cashier' || normalizedRole === 'account-officer') return <CashierLayout>{children}</CashierLayout>;
  if (normalizedRole === 'front-desk') return <FrontdeskLayout>{children}</FrontdeskLayout>;
  if (normalizedRole === 'surgeon') return <SurgeonLayout>{children}</SurgeonLayout>;
  if (normalizedRole === 'pharmacist') return <PharmacistLayout>{children}</PharmacistLayout>;

  // Default clean layout for other roles (lab-technician, sonographer, etc.)
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
