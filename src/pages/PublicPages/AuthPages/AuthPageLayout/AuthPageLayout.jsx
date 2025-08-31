import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { LoggedInUserPath } from '@/utils/helpers';

const AuthPageLayout = () => {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth(navigate);
    if (isAuthenticated && user) {
      navigate(LoggedInUserPath(user));
    }
  }, [isAuthenticated, navigate, user]);

  return (
    <>
      <Outlet />
    </>
  );
};

export default AuthPageLayout;
