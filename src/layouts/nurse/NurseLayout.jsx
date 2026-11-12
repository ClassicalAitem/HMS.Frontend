import React from 'react';
import BaseRoleLayout from '@/layouts/common/BaseRoleLayout';
import { Sidebar } from '@/components/nurse/dashboard';

const NurseLayout = ({ children }) => {
  return <BaseRoleLayout Sidebar={Sidebar}>{children}</BaseRoleLayout>;
};

export default NurseLayout;
