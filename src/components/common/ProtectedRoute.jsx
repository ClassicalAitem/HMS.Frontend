import React from 'react';
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

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('🔒 ProtectedRoute: Not authenticated, redirecting to login');
    console.log('🔒 ProtectedRoute: Intended destination:', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user has default password, redirect to change password page
  if (needsPasswordChange || user?.isDefaultPassword) {
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
      'frontdesk': '/dashboard',
      'nurse': '/dashboard/nurse',
      'doctor': '/dashboard/doctor',
      'admin': '/dashboard/admin',
      'super-admin': '/dashboard/superadmin',
      'cashier': '/dashboard/cashier',
    };
    
    const defaultRoute = roleRoutes[user?.role] || '/dashboard';
    console.log('🔒 ProtectedRoute: Redirecting to:', defaultRoute);
    return <Navigate to={defaultRoute} replace />;
  }

  console.log('🔒 ProtectedRoute: Access granted');
  return children;
};

export default ProtectedRoute;

