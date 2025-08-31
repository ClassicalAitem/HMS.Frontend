'use client';

import Spinner from '@/components/spinner/page';
import useAuthStore from '@/store/redux/authStore';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

const AuthCheck = ({ children }) => {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth(router);
      setLoading(false);
    };

    verifyAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login'); // Redirect if not authenticated
      }
    }
  }, [loading, isAuthenticated, router]);

  // Show the spinner while loading
  if (loading || isLoading) {
    return <Spinner />; // Show spinner while loading
  }
  if (isAuthenticated) {
    return <div className="">{children}</div>;
  }
  return <Spinner />;
};

export default AuthCheck;
