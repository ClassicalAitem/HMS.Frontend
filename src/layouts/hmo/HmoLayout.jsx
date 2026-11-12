import React from 'react';
import BaseRoleLayout from '@/layouts/common/BaseRoleLayout';
import Sidebar from '@/components/hmo/dashboard/Sidebar';

const HmoLayout = ({ children }) => {
  return <BaseRoleLayout Sidebar={Sidebar}>{children}</BaseRoleLayout>;
};

export default HmoLayout;

