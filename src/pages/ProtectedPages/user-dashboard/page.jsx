import React, { useEffect, useState } from 'react';
import useAuthStore from '@/store/authStore';
import { FaUser } from 'react-icons/fa';
import { IoIosStar } from 'react-icons/io';
import { PiBuildingOfficeBold } from 'react-icons/pi';
import { endpoints } from '@/api/endpoints';
import { PopupError } from '@/utils/alertMessage';
import { httpErrorCodes } from '@/utils/http';
import { apiClient } from '@/api/apiClients';
import { Link, useNavigate } from 'react-router-dom';
import { paths } from '@/routes';
import { LoggedInUserPath } from '@/utils/helpers';

const CustomerDashboard = () => {
  const { user } = useAuthStore();

  const [activeUser, setActiveUser] = useState(user);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'Customer') {
      const loggedInUserPath = LoggedInUserPath(user);
      navigate(loggedInUserPath);
    }
  }, [user, user?.role]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiClient.get(`${endpoints.getAUserById}/${user?.id}`);
        if (response.status === httpErrorCodes.OK) {
          setActiveUser(response.data);
        }
      } catch (error) {
        setError(error.response?.data?.message || 'An error occured fetching data');
      }
    };
    if (user?.id) fetchUser();
  }, [user?.id]);

  return (
    <main className="">
      {error && <PopupError message={error} />}
      <p className="hidden lg:block -mt-[30px] text-sm pl-10 mb-14">
        Your journey to an amazing global positioning of your brand
      </p>

      <p className="my-4 text-sm font-semibold">Things to try out</p>

      <div className="flex flex-col lg:flex-row gap-10">
        {activeUser.first_name === undefined && (
          <div className=" bg-white flex-1 border border-gray p-4 rounded-lg shadow-sm flex flex-col">
            <div className=" bg-light-gray flex items-center gap-4 p-4 rounded-l-md rounded-r-md">
              <div className=" bg-white h-16 w-16 flex items-center justify-center rounded-full shadow-xl cursor-pointer">
                <FaUser className="text-light-green text-2xl" />
              </div>
              <div className="">
                <p className="text-xs lg:text-sm">
                  Full Name: <span className="text-dark-gray text-sm ml-2">***********</span>
                </p>
                <p className="text-xs lg:text-sm">
                  Email:
                  <span className="text-dark-gray text-2xs lg:text-sm ml-2">{user?.email}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-col">
              <p className="bg-light-gray text-2xs flex items-center gap-2 px-2 max-w-fit py-2 mt-2">
                <IoIosStar />
                <span>1 Min, non technical process</span>
              </p>
              <div className="flex flex-col">
                <p className="text-md font-semibold my-2">Set up Your Profile</p>
                <span className="text-sm text-dark mb-2">
                  set up your profile with relevant information such as full names, profile picture,
                  phone numbers etc.
                </span>
              </div>
            </div>
            <hr className=" text-gray my-2" />
            <div className="flex items-center justify-center my-3">
              <Link
                to={paths.editProfile}
                className="bg-light-green text-white border-none rounded-md text-sm max-w-fit py-2 px-4 hover:bg-green transition-all duration-300 ease-in-out"
              >
                Update Profile{' '}
              </Link>
            </div>
          </div>
        )}

        <div className=" bg-white flex-1 border border-gray p-4 rounded-lg shadow-sm flex flex-col">
          <div className=" bg-light-gray flex items-center gap-4 p-4 rounded-l-md rounded-r-md">
            <div className=" bg-white h-16 w-16 flex items-center justify-center rounded-full shadow-xl cursor-pointer">
              <PiBuildingOfficeBold className="text-light-green text-2xl" />
            </div>
            <div className="">
              <p className="text-xs lg:text-sm">
                Company Name: <span className="text-dark-gray text-sm ml-2">************</span>
              </p>
              <p className="text-xs lg:text-sm">
                Company Email:
                <span className="text-dark-gray text-2xs lg:text-sm ml-2">
                  info@yourcompany.com
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-col">
            <p className="bg-light-gray text-2xs flex items-center gap-2 px-2 max-w-fit py-2 mt-2">
              <IoIosStar />
              <span>1 Min, non technical process</span>
            </p>
            <div className="flex flex-col">
              <p className="text-md font-semibold my-2">Set up Your Company</p>
              <span className="text-sm text-dark mb-2">
                set up your company to unlock amazing features of this portal, provide all relevant
                information that will help prospective buyers relate well with your business.
              </span>
            </div>
          </div>
          <hr className=" text-gray my-2" />
          <div className="flex items-center justify-center my-3">
            <Link
              to={paths.createCompany}
              className="bg-light-green text-white border-none rounded-md text-sm max-w-fit py-2 px-4 hover:bg-green transition-all duration-300 ease-in-out"
            >
              Create Your Company
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CustomerDashboard;
