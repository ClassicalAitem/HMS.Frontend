import React from 'react';
import { useAppSelector } from '../../store/hooks';

const AuthTest = () => {
  const { isAuthenticated, user, isLoading, error, needsPasswordChange } = useAppSelector((state) => state.auth);

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Authentication State Debug</h3>
      <div className="space-y-2 text-sm">
        <div><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</div>
        <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
        <div><strong>Needs Password Change:</strong> {needsPasswordChange ? 'Yes' : 'No'}</div>
        {user && (
          <>
            <div><strong>User ID:</strong> {user.id}</div>
            <div><strong>Name:</strong> {user.firstName} {user.lastName}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Role:</strong> {user.role}</div>
            <div><strong>Default Password:</strong> {user.isDefaultPassword ? 'Yes' : 'No'}</div>
          </>
        )}
        {error && (
          <div className="text-red-600"><strong>Error:</strong> {error}</div>
        )}
      </div>
    </div>
  );
};

export default AuthTest;
