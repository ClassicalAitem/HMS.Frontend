import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const TokenExpirationHandler = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleTokenExpiration = (event) => {
      console.log('🚨 TokenExpirationHandler: Token expiration event received');
      console.log('🚨 TokenExpirationHandler: Event detail:', event.detail);
      
      const message = event.detail?.message || 'Your session has expired. Please log in again.';
      
      // Show user-friendly error message
      toast.error(message, {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#ef4444',
          color: '#fff',
          fontSize: '16px',
          padding: '16px',
        },
      });
      
      // Dispatch logout action to clear Redux state
      dispatch(logoutUser());
      
      // Navigate to login page
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    };

    // Listen for token expiration events
    window.addEventListener('auth:token-expired', handleTokenExpiration);

    // Cleanup event listener
    return () => {
      window.removeEventListener('auth:token-expired', handleTokenExpiration);
    };
  }, [navigate, dispatch]);

  // This component doesn't render anything
  return null;
};

export default TokenExpirationHandler;
