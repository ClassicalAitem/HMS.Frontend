import React from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

const RouteProtectionTest = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const testRoutes = [
    { path: '/frontdesk/dashboard', name: 'Frontdesk Dashboard', roles: ['frontdesk'] },
    { path: '/dashboard/nurse', name: 'Nurse Dashboard', roles: ['nurse'] },
    { path: '/dashboard/doctor', name: 'Doctor Dashboard', roles: ['doctor'] },
    { path: '/dashboard/admin', name: 'Admin Dashboard', roles: ['admin'] },
    { path: '/dashboard/superadmin', name: 'Super Admin Dashboard', roles: ['super-admin'] },
    { path: '/cashier/dashboard', name: 'Cashier Dashboard', roles: ['cashier'] },
    { path: '/superadmin/users', name: 'Manage Users', roles: ['super-admin'] },
    { path: '/change-password', name: 'Change Password', roles: [] },
  ];

  const canAccess = (allowedRoles) => {
    if (!isAuthenticated) return false;
    if (allowedRoles.length === 0) return true; // No role restrictions
    return allowedRoles.includes(user?.role);
  };

  return (
    <div className="p-4 max-w-md bg-green-100 rounded-lg">
      <h3 className="mb-2 text-lg font-semibold">Route Protection Test</h3>
      <div className="space-y-2 text-sm">
        {testRoutes.map((route) => (
          <div key={route.path} className="flex justify-between items-center">
            <Link 
              to={route.path}
              className={`underline ${canAccess(route.roles) ? 'text-green-600' : 'text-red-600'}`}
            >
              {route.name}
            </Link>
            <span className={`badge ${canAccess(route.roles) ? 'badge-success' : 'badge-error'}`}>
              {canAccess(route.roles) ? 'Access' : 'Denied'}
            </span>
          </div>
        ))}
      </div>
      <div className="p-2 mt-4 text-xs bg-gray-200 rounded">
        <strong>Current User:</strong> {user ? `${user.firstName} ${user.lastName} (${user.role})` : 'Not logged in'}
      </div>
    </div>
  );
};

export default RouteProtectionTest;
