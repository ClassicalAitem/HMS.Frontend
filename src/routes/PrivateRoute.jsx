import React, { useEffect, useState } from 'react';
import useAuthStore from '@/store/redux/authStore';
import { Outlet, useNavigate } from 'react-router-dom';
// import AdminContainer from '@/components/container/AdminContainer';
import { paths } from './paths';
import Spinner from '@/components/spinner/page';

export const PrivateRoute = () => {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth(navigate);
      setLoading(false);
    };

    verifyAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate(paths.login);
      }
    }
  }, [loading, isAuthenticated, navigate]);

  //Show the spinner while loading
  if (loading || isLoading) {
    return <Spinner />; // Show spinner while loading
  }
  // if (isAuthenticated) {
  //   return (
  //     <AdminContainer>
  //       <Outlet />
  //     </AdminContainer>
  //   );
  // }
  return <Spinner />;
};
