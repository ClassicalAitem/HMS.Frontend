import React from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

const LoginRedirectTest = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const testScenarios = [
    {
      name: 'Try to access Login page',
      description: 'If logged in, should redirect to dashboard',
      action: () => window.location.href = '/login'
    },
    {
      name: 'Try to access Protected Route',
      description: 'If not logged in, should redirect to login, then back to intended route',
      action: () => window.location.href = '/dashboard/superadmin'
    },
    {
      name: 'Direct Navigation Test',
      description: 'Test direct URL navigation',
      action: () => window.open('/login', '_blank')
    }
  ];

  return (
    <div className="p-4 bg-yellow-100 rounded-lg max-w-md">
      <h3 className="text-lg font-semibold mb-2">Login Redirect Test</h3>
      <div className="space-y-3 text-sm">
        <div className="p-2 bg-gray-200 rounded">
          <strong>Current Status:</strong><br/>
          Authenticated: {isAuthenticated ? 'Yes' : 'No'}<br/>
          User: {user ? `${user.firstName} ${user.lastName} (${user.role})` : 'None'}
        </div>
        
        {testScenarios.map((scenario, index) => (
          <div key={index} className="p-2 border rounded">
            <div className="font-medium">{scenario.name}</div>
            <div className="text-xs text-gray-600 mb-2">{scenario.description}</div>
            <button
              onClick={scenario.action}
              className="btn btn-sm btn-outline"
            >
              Test
            </button>
          </div>
        ))}
        
        <div className="p-2 bg-blue-100 rounded text-xs">
          <strong>Expected Behavior:</strong><br/>
          • Logged in users → Auto-redirect to their dashboard<br/>
          • Not logged in → Redirect to login, then back to intended route<br/>
          • Default password users → Redirect to change password page
        </div>
      </div>
    </div>
  );
};

export default LoginRedirectTest;
