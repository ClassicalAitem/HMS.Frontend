import useAuthStore from '@/store/authStore';
import { LoggedInUserPath } from '@/utils/helpers';
import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

const AdminLayoutProtection = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    if (isAuthenticated && user?.role && user.role !== 'Admin') {
      const pathhd = LoggedInUserPath(user);
      navigate(pathhd);
    }
  }, [user, isAuthenticated, navigate]);

  return <Outlet />;
};

export default AdminLayoutProtection;
