import React from 'react';
import BaseRoleLayout from '@/layouts/common/BaseRoleLayout';
import LaboratorySidebar from '@/components/laboratory/dashboard/LaboratorySidebar';

const LaboratoryLayout = ({ children }) => {
  return <BaseRoleLayout Sidebar={LaboratorySidebar}>{children}</BaseRoleLayout>;
};

export default LaboratoryLayout;

