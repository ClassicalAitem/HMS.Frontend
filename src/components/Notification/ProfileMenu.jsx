import React, { useEffect, useRef, useState } from 'react';
import useAuthStore from '@/store/authStore';
import { apiClient } from '@/api/apiClients';
import { endpoints } from '@/api/endpoints';
import { httpErrorCodes } from '@/utils/http';
import { Link, useNavigate } from 'react-router-dom';
import { paths } from '@/routes';

const ProfileMenu = () => {
  const { logout, isLoading, user, checkAuth, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [activeUser, setActiveUser] = useState(user);
  const profileRef = useRef(null);

  const handleShowProfile = () => {
    return setShowProfile(!showProfile);
  };
  const handleCloseProfile = (event) => {
    if (profileRef.current && !profileRef.current.contains(event.target)) {
      setShowProfile(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleCloseProfile);
    document.addEventListener('touchstart', handleCloseProfile);
    return () => {
      document.removeEventListener('mousedown', handleCloseProfile);
      document.removeEventListener('touchstart', handleCloseProfile);
    };
  }, []);

  const handleLogout = async () => {
    await logout(navigate);
  };

  // Call checkAuth when the component mounts
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      checkAuth(navigate); // Trigger auth check
    }
  }, [isAuthenticated, isLoading, checkAuth]);

  // Redirect if authentication check completes and user is not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(paths.login); // Redirect to login page
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const fetchUser = async () => {
      const response = await apiClient.get(`${endpoints.getAUserById}/${user?.id}`);
      if (response.status === httpErrorCodes.OK) {
        setActiveUser(response.data);
      }
    };
    if (user.id && isAuthenticated) fetchUser();
  }, [user]);

  if (!user) return null;

  return (
    <>
      <button
        onClick={handleShowProfile}
        className="group-hover:ring-gray inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-transparent transition-all duration-300 group-hover:ring-offset-4"
        aria-haspopup="menu"
        aria-expanded="false"
      >
        <div className="relative inline-flex h-9 w-9 items-center justify-center rounded-full ">
          <img
            src={activeUser?.images?.[0]?.url || '/assets/avater.png'}
            className="max-w-full h-9 w-9 rounded-full shrink-0 object-cover shadow-sm dark:border-transparent"
            width={36}
            height={36}
            alt="avatar"
          />
        </div>
      </button>
      {showProfile && (
        <div
          ref={profileRef}
          role="menu"
          tabIndex="0"
          className="divide-gray border-gray absolute end-0 mt-2 w-64 origin-top-right divide-y rounded-md border bg-white shadow-lg focus:outline-none z-50"
        >
          <div className="p-6 text-center" role="none">
            <div
              className="relative mx-auto flex size-20 items-center justify-center rounded-full"
              role="none"
            >
              <img
                src={activeUser?.images?.[0]?.url || '/assets/avater.png'}
                className=" rounded-full h-[75px] w-[75px] object-cover shadow-sm dark:border-transparent"
                alt=""
              />
            </div>
            <div className="mt-3" role="none">
              <h6 className="font-heading text-dark text-sm font-medium capitalize" role="none">
                {activeUser?.first_name} {activeUser?.last_name}
              </h6>
              <p className="text-dark-gray mb-4 font-sans text-xs" role="none">
                {activeUser?.email}
              </p>
              <Link
                to={paths.editProfile}
                className="w-full text-xs text-white py-2 px-5 rounded-md border border-gray block bg-light-green hover:bg-green"
                disabled={false}
                role="none"
              >
                Manage Account
              </Link>
            </div>
          </div>

          <div className="p-6" role="none">
            <button
              type="button"
              className="w-full block py-2 px-5 rounded-md border border-gray text-xs hover:bg-light-green hover:text-white"
              role="none"
              onClick={handleLogout}
            >
              {isLoading ? 'Please wait' : 'Logout'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileMenu;
