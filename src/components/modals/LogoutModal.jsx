/* eslint-disable no-unused-vars */
import React from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear any stored auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Navigate to login page
    navigate('/login');
    
    // Close modal
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center w-[100vw]">
      {/* Backdrop */}
      <div className="fixed inset-0 w-[100vw] bg-black/80 bg-opacity-50" onClick={handleCancel} />
      
      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-md shadow-xl card bg-base-100">
        <div className="p-6 card-body">
          {/* Header */}
          <div className="text-center">
            <h2 className="mb-4 text-xl font-semibold text-primary">
              Are you sure you want to log out?
            </h2>
            <p className="mb-6 text-sm text-base-content/70 2xl:font-semibold">
              You will be signed out of your current session and redirected to the login page.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={handleLogout}
              className="text-white bg-red-600 border-red-600 btn btn-error"
            >
              Log out
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-outline"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
