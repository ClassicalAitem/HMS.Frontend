import React, { useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BaseRoleLayout from '@/layouts/common/BaseRoleLayout';
import { Sidebar } from '@/components/admin/dashboard';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const dialogRef = useRef(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);
  const userRole = String(user?.role || user?.accountType || '').trim().toLowerCase();
  const isAdmin = isAuthenticated && userRole === 'admin';

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!isAdmin || !dialog) return undefined;

    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [isAdmin]);

  const handleLogout = async () => {
    if (isLoggingOut || isLoading) return;

    setIsLoggingOut(true);
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  return (
    <>
      <BaseRoleLayout Sidebar={Sidebar}>{children}</BaseRoleLayout>
      {isAdmin && (
        <dialog
          ref={dialogRef}
          aria-labelledby="admin-access-notice-title"
          aria-describedby="admin-access-notice-description"
          onCancel={(event) => event.preventDefault()}
          className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-base-300 bg-base-100 p-0 text-base-content shadow-2xl backdrop:bg-black/70"
        >
          <div className="p-8 text-center">
            <h2 id="admin-access-notice-title" className="mb-3 text-2xl font-bold">
              Application still in progress
            </h2>
            <p id="admin-access-notice-description" className="mb-8 text-base-content/70">
              The admin role structure is a work in progress, so this area is not available yet.
            </p>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut || isLoading}
              autoFocus
              className="btn btn-error w-full text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut || isLoading ? 'Logging out...' : 'Log out'}
            </button>
          </div>
        </dialog>
      )}
    </>
  );
};

export default AdminLayout;
