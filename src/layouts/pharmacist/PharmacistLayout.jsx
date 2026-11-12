import React from 'react';
import BaseRoleLayout from '@/layouts/common/BaseRoleLayout';
import { Sidebar } from '@/components/pharmacist/dashboard';

const PharmacistLayout = ({ children }) => {
  return <BaseRoleLayout Sidebar={Sidebar}>{children}</BaseRoleLayout>;
};

export default PharmacistLayout;
