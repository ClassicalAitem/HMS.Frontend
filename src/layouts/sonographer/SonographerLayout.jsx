import React from 'react';
import BaseRoleLayout from '@/layouts/common/BaseRoleLayout';
import Sidebar from '@/components/sonographer/dashboard/Sidebar';

const SonographerLayout = ({ children }) => {
  return <BaseRoleLayout Sidebar={Sidebar}>{children}</BaseRoleLayout>;
};

export default SonographerLayout;

