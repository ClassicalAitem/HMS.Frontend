import React from 'react';
import { useAppSelector } from '../../store/hooks';

const UsersDebug = () => {
  const { users, isLoading, error } = useAppSelector((state) => state.users);

  return (
    <div className="p-4 bg-gray-100 rounded-lg max-w-md">
      <h3 className="text-lg font-semibold mb-2">Users State Debug</h3>
      <div className="space-y-2 text-sm">
        <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
        <div><strong>Users Count:</strong> {users.length}</div>
        <div><strong>Error:</strong> {error || 'None'}</div>
        {users.length > 0 && (
          <div>
            <strong>Sample User:</strong>
            <div className="ml-2 text-xs">
              <div>ID: {users[0].id}</div>
              <div>Name: {users[0].firstName} {users[0].lastName}</div>
              <div>Email: {users[0].email}</div>
              <div>Role: {users[0].accountType}</div>
              <div>Active: {users[0].isActive ? 'Yes' : 'No'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersDebug;
