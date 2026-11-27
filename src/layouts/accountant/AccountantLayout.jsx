import React from 'react';
import BaseRoleLayout from '@/layouts/common/BaseRoleLayout';
import Sidebar from '@/components/accountant/Sidebar';

const AccountantLayout = ({ children }) => {
  return <BaseRoleLayout Sidebar={Sidebar}>{children}</BaseRoleLayout>;
};

export default AccountantLayout;
