/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const LogoutModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // const handleLogout = () => {
  //   // Prevent double-clicking
  //   if (isLoggingOut || isLoading) {
  //     console.log('🚪 LogoutModal: Logout already in progress, ignoring click');
  //     return;
  //   }

  //   console.log('🚪 LogoutModal: Starting logout process');
  //   setIsLoggingOut(true);
    
  //   // Use toast promise for better UX
  //   const logoutPromise = new Promise((resolve, reject) => {
  //     const performLogout = async () => {
  //       try {
  //         // Step 1: Send logout request to backend API first
  //         console.log('🔄 LogoutModal: Sending logout request to backend');
  //         await dispatch(logoutUser());
          
  //         // Step 2: Only after API call succeeds, clear localStorage
  //         console.log('🧹 LogoutModal: API logout successful, clearing local storage');
  //         localStorage.removeItem('token');
  //         localStorage.removeItem('refreshToken');
  //         localStorage.removeItem('persist:root');
  //         localStorage.removeItem('authToken');
  //         localStorage.removeItem('user');
  //         localStorage.removeItem('changePasswordUserId');
          
  //         console.log('✅ LogoutModal: Logout process completed successfully');
          
  //         // Step 3: Close modal and navigate
  //         onClose();
          
  //         // Small delay to allow modal to close smoothly
  //         setTimeout(() => {
  //           navigate('/login', { replace: true });
  //           resolve('Logged out successfully');
  //         }, 300);
          
  //       } catch (error) {
  //         console.error('❌ LogoutModal: Logout API call failed:', error);
          
  //         // If API call fails, we still need to clear local state for security
  //         // But we'll show a different message to the user
  //         console.log('🧹 LogoutModal: API failed, clearing local storage anyway for security');
  //         localStorage.removeItem('token');
  //         localStorage.removeItem('refreshToken');
  //         localStorage.removeItem('persist:root');
  //         localStorage.removeItem('authToken');
  //         localStorage.removeItem('user');
  //         localStorage.removeItem('changePasswordUserId');
          
  //         // Close modal
  //         onClose();
          
  //         // Small delay to allow modal to close smoothly
  //         setTimeout(() => {
  //           navigate('/login', { replace: true });
  //           resolve('Logged out (connection issue, but session cleared locally)');
  //         }, 300);
  //       } finally {
  //         setIsLoggingOut(false);
  //       }
  //     };
      
  //     performLogout();
  //   });

  //   // Show toast promise
  //   toast.promise(logoutPromise, {
  //     loading: 'Logging you out...',
  //     success: (message) => message,
  //     error: (error) => `Logout failed: ${error}`,
  //   });
  // };

   const handleLogout = () => {

    console.log('🚪 LogoutModal: Starting logout process');
    setIsLoggingOut(true);
    
    // Use toast promise for better UX
    const logoutPromise = new Promise((resolve, reject) => {
      const performLogout = async () => {
        try {
          // Step 1: Send logout request to backend API first
          console.log('🔄 LogoutModal: Sending logout request to backend');
          await dispatch(logoutUser());
          
          // Step 2: Only after API call succeeds, clear localStorage
          console.log('🧹 LogoutModal: API logout successful, clearing local storage');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('persist:root');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('changePasswordUserId');
          
          console.log('✅ LogoutModal: Logout process completed successfully');
          
          // Step 3: Close modal and navigate
          onClose();
          setIsLoggingOut(false);
          
          // Small delay to allow modal to close smoothly
          setTimeout(() => {
            navigate('/login', { replace: true });
            resolve('Logged out successfully');
          }, 300);
          
        } catch (error) {
          console.error('❌ LogoutModal: Logout API call failed:', error);
          
          // If API call fails, we still need to clear local state for security
          // But we'll show a different message to the user
          console.log('🧹 LogoutModal: API failed, clearing local storage anyway for security');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('persist:root');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('changePasswordUserId');
          
          // Close modal
          onClose();
          setIsLoggingOut(false);
          
          // Small delay to allow modal to close smoothly
          setTimeout(() => {
            navigate('/login', { replace: true });
            resolve('Logged out (connection issue, but session cleared locally)');
          }, 300);
        } finally {
          setIsLoggingOut(false);
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
      <div className="fixed inset-0 w-[100vw] bg-black/70 backdrop-blur-sm" onClick={handleCancel} />
      
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
          {/* <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut || isLoading}
              className="text-white bg-red-600 border-red-600 btn btn-error disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut || isLoading ? (
                <div className="flex items-center">
                  <div className="mr-2 w-4 h-4 rounded-full border-b-2 border-white animate-spin"></div>
                  Logging out...
                </div>
              ) : (
                'Log out'
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoggingOut || isLoading}
              className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div> */}


          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={handleLogout}
              className="text-white bg-red-600 border-red-600 btn btn-error disabled:opacity-50 disabled:cursor-not-allowed"
            >Log out </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
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