import React from 'react';
import BaseRoleLayout from '@/layouts/common/BaseRoleLayout';
import { Sidebar } from '@/components/cashier/dashboard';

const CashierLayout = ({ children }) => {
  return <BaseRoleLayout Sidebar={Sidebar}>{children}</BaseRoleLayout>;
};

export default CashierLayout;
