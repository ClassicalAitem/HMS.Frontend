import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

const RouteDebug = () => {
  const location = useLocation();
  const { isAuthenticated, user, needsPasswordChange } = useAppSelector((state) => state.auth);

  return (
    <div className="hidden p-4 max-w-md bg-blue-100 rounded-lg">
      <h3 className="mb-2 text-lg font-semibold">Route Protection Debug</h3>
      <div className="space-y-2 text-sm">
        <div><strong>Current Route:</strong> {location.pathname}</div>
        <div><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</div>
        <div><strong>User Role:</strong> {user?.role || 'None'}</div>
        <div><strong>Needs Password Change:</strong> {needsPasswordChange ? 'Yes' : 'No'}</div>
        <div><strong>User ID:</strong> {user?.id || 'None'}</div>
        <div><strong>User Name:</strong> {user ? `${user.firstName} ${user.lastName}` : 'None'}</div>
        <div><strong>User Token:</strong> {user?.token || 'None'}</div>
      </div>
    </div>
  );
};

export default RouteDebug;
