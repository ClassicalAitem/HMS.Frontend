import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const TokenExpirationHandler = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);

  useEffect(() => {
    let notified = false;
    const handleTokenExpiration = (event) => {
      if (notified) return;
      notified = true;
      console.log('🚨 TokenExpirationHandler: Token expiration event received');
      console.log('🚨 TokenExpirationHandler: Event detail:', event.detail);
      
      const message = event.detail?.message || 'Your session has expired. Please log in again.';
      
      // Show user-friendly error message
      toast.dismiss();
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

    const checkToken = () => {
      if (!token) return;
      try {
        const parts = String(token).split('.');
        if (parts.length !== 3) return;
        const payload = JSON.parse(decodeURIComponent(escape(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))));
        const expMs = Number(payload?.exp || 0) * 1000;
        if (expMs > 0 && Date.now() >= expMs && !notified) {
          window.dispatchEvent(new CustomEvent('auth:token-expired', { detail: { message: 'Your session has expired. Please log in again.' } }));
        }
      } catch {}
    };

    const intervalId = setInterval(checkToken, 60000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkToken();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Cleanup event listener
    return () => {
      window.removeEventListener('auth:token-expired', handleTokenExpiration);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [navigate, dispatch, token]);

  // This component doesn't render anything
  return null;
};

export default TokenExpirationHandler;
