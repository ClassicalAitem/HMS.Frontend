import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, needsPasswordChange } = useAppSelector((state) => state.auth);
  const location = useLocation();

  console.log('🔒 ProtectedRoute: Checking access');
  console.log('🔒 ProtectedRoute: isAuthenticated:', isAuthenticated);
  console.log('🔒 ProtectedRoute: user role:', user?.role);
  console.log('🔒 ProtectedRoute: allowedRoles:', allowedRoles);
  console.log('🔒 ProtectedRoute: needsPasswordChange:', needsPasswordChange);

  const token = useAppSelector((state) => state.auth.token);
  const isExpired = useMemo(() => {
    if (!token) return false;
    try {
      const parts = String(token).split('.');
      if (parts.length !== 3) return false;
      const payload = JSON.parse(decodeURIComponent(escape(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))));
      const expMs = Number(payload?.exp || 0) * 1000;
      return expMs > 0 && Date.now() >= expMs;
    } catch {
      return false;
    }
  }, [token]);

  if (isExpired) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('🔒 ProtectedRoute: Not authenticated, redirecting to login');
    console.log('🔒 ProtectedRoute: Intended destination:', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user needs to change password, redirect to change password page
  if (needsPasswordChange) {
    console.log('🔒 ProtectedRoute: User needs to change password, redirecting to change password page');
    return <Navigate to="/change-password" replace />;
  }

  // If no specific roles required, just check authentication
  if (allowedRoles.length === 0) {
    console.log('🔒 ProtectedRoute: No role restrictions, allowing access');
    return children;
  }

  // If authenticated but role not allowed, redirect to appropriate dashboard
  if (!allowedRoles.includes(user?.role)) {
    console.log('🔒 ProtectedRoute: Role not allowed, redirecting to appropriate dashboard');
    // Redirect to user's default dashboard based on role
    const roleRoutes = {
      'frontdesk': '/frontdesk/dashboard',
      'front-desk': '/frontdesk/dashboard', // Handle backend role format
      'nurse': '/dashboard/nurse',
      'doctor': '/dashboard/doctor',
      'medical-director': '/dashboard/medical-director', // Medical director uses doctor dashboard
      'admin': '/dashboard/admin',
      'super-admin': '/dashboard/superadmin',
      'cashier': '/cashier/dashboard',
      'pharmacist': '/dashboard/pharmacist',
      'surgeon': '/dashboard/surgeon',
      'lab-technician': '/dashboard/laboratory',
      'sonographer': '/dashboard/sonographer',
    };
    
    const roleOrType = user?.role || user?.accountType;
    const defaultRoute = roleRoutes[roleOrType] || '/frontdesk/dashboard';
    console.log('🔒 ProtectedRoute: Redirecting to:', defaultRoute);
    return <Navigate to={defaultRoute} replace />;
  }

  console.log('🔒 ProtectedRoute: Access granted');
  return children;
};

export default ProtectedRoute;

