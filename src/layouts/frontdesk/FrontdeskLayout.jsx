import React from 'react';
import BaseRoleLayout from '@/layouts/common/BaseRoleLayout';
import { Sidebar } from '@/components/frontdesk/dashboard';

const FrontdeskLayout = ({ children }) => {
  return <BaseRoleLayout Sidebar={Sidebar}>{children}</BaseRoleLayout>;
};

export default FrontdeskLayout;
