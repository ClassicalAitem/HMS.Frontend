import React, { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import LogoutModal from '../modals/LogoutModal';

const LogoutTest = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsLogoutModalOpen(false);
  };

  return (
    <div className="p-4 bg-purple-100 rounded-lg max-w-md">
      <h3 className="text-lg font-semibold mb-2">Enhanced Logout Test</h3>
      <div className="space-y-3 text-sm">
        <div className="p-2 bg-gray-200 rounded">
          <strong>Current Status:</strong><br/>
          Authenticated: {isAuthenticated ? 'Yes' : 'No'}<br/>
          User: {user ? `${user.firstName} ${user.lastName} (${user.role})` : 'None'}
        </div>
        
        <div className="p-2 border rounded">
          <div className="font-medium mb-2">Test Enhanced Logout</div>
          <div className="text-xs text-gray-600 mb-2">
            Click to test the enhanced logout flow with confirmation modal and toast promise
          </div>
          <button
            onClick={handleLogoutClick}
            disabled={!isAuthenticated}
            className="btn btn-sm btn-error"
          >
            Test Logout
          </button>
        </div>
        
        <div className="p-2 bg-blue-100 rounded text-xs">
          <strong>Enhanced Features:</strong><br/>
          • Confirmation modal with icon<br/>
          • Toast promise with loading state<br/>
          • Smooth modal close animation<br/>
          • Automatic redirection to login<br/>
          • Proper state cleanup
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={handleCloseModal} 
      />
    </div>
  );
};

export default LogoutTest;
