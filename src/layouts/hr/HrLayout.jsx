import React from 'react';
import BaseRoleLayout from '@/layouts/common/BaseRoleLayout';
import { Sidebar } from '@/components/hr';

const HrLayout = ({ children }) => {
  return <BaseRoleLayout Sidebar={Sidebar}>{children}</BaseRoleLayout>;
};

export default HrLayout;
