/* eslint-disable no-unused-vars */
import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const LogoutModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    console.log('🚪 LogoutModal: Starting logout process');
    
    // Use toast promise for better UX
    const logoutPromise = new Promise((resolve) => {
      const performLogout = async () => {
        try {
          // Dispatch logout action to clear Redux state
          console.log('🔄 LogoutModal: Dispatching logoutUser action');
          await dispatch(logoutUser());
          
          // Clear any additional localStorage items
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('persist:root');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          
          console.log('✅ LogoutModal: Logout successful');
          
          // Close modal first
          onClose();
          
          // Small delay to allow modal to close smoothly
          setTimeout(() => {
            // Navigate to login page
            navigate('/login', { replace: true });
            resolve('Logged out successfully');
          }, 300);
          
        } catch (error) {
          console.error('❌ LogoutModal: Logout error:', error);
          // Even if logout fails, we should still clear local state and redirect
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('persist:root');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          
          // Close modal
          onClose();
          
          // Small delay to allow modal to close smoothly
          setTimeout(() => {
            // Navigate to login page
            navigate('/login', { replace: true });
            resolve('Logout completed (some cleanup may have failed)');
          }, 300);
        }
      };
      
      performLogout();
    });

    // Show toast promise
    toast.promise(logoutPromise, {
      loading: 'Logging you out...',
      success: (message) => message,
      error: (error) => `Logout failed: ${error}`,
    });
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