import React, { useEffect, useState } from 'react';
import {
  EnhancedTextArea,
  FormWrapper,
  Input,
  SubmitButton
} from '@/components/formManager/FormWrapper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { apiClient } from '@/api/apiClients';
import { endpoints } from '@/api/endpoints';
import { AlertMessage, PopupError } from '@/utils/alertMessage';
import useAuthStore from '@/store/authStore';
import { httpErrorCodes } from '@/utils/http';
import { LoggedInUserPath } from '@/utils/helpers';
import { useNavigate } from 'react-router-dom';

const UpdateProfile = () => {
  const { user } = useAuthStore();
  const [message, setMessage] = useState({ error: null, success: null });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('/assets/avater.png'); // Default avatar image
  const [activeUser, setActiveUser] = useState(user);
  const navigate = useNavigate();

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
    if (user || user.id) fetchUser();
  }, [user]);

  const validationSchema = Yup.object().shape({
    first_name: Yup.string().required('First name is required'),
    last_name: Yup.string().required('Last name is required'),
    email: Yup.string().email('Invalid email format').required('Please enter your email address*'),
    address: Yup.string(),
    phone: Yup.string(),
    state: Yup.string(),
    description: Yup.string(),
    Images: Yup.string()
  });

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // Set the preview URL
    }
  };

  useEffect(() => {
    if (activeUser) {
      setPreviewUrl(activeUser?.images?.[0]?.url);
    }
  }, [activeUser]);

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl('/assets/avater.png');
  };

  return (
    <main>
      {error && <PopupError message={error} />}
      {message && <AlertMessage alert={message} />}
      <Formik
        enableReinitialize
        initialValues={{
          first_name: activeUser?.first_name || '',
          last_name: activeUser?.last_name || '',
          email: activeUser?.email || '',
          address: activeUser?.address || '',
          phone: activeUser?.phone || '',
          state: activeUser?.state || '',
          description: activeUser?.description || '',
          images: activeUser?.images?.[0]?.url || ''
        }}
        validationSchema={validationSchema}
        onSubmit={async (values) => {
          setIsLoading(true);
          try {
            const formData = new FormData();
            Object.keys(values).forEach((key) => {
              if (key !== 'images') {
                formData.append(key, values[key]);
              }
            });

            if (selectedFile) {
              formData.append('images', selectedFile);
            }

            await apiClient.put(`${endpoints.editProfile}/${activeUser?._id}`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });

            setMessage({ error: null, success: 'Profile edited Successfully' });
          } catch (error) {
            setMessage({
              error: `${error.response.data.message || 'Internal Server error'}`,
              success: null
            });
          } finally {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsLoading(false);
            setTimeout(() => {
              navigate(LoggedInUserPath(user));
            }, 2000);
          }
        }}
      >
        {({ handleSubmit, values, handleChange, handleBlur, errors, touched, setFieldValue }) => (
          <FormWrapper onSubmit={handleSubmit}>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="left flex-[2] flex flex-col gap-4 w-full">
                {/* Sections colums*/}

                {/* first Section */}
                <div className="bg-white rounded-md shadow pb-4">
                  <div className="top border-b border-gray p-4 ">
                    <h2 className="inline-block text-dark font-semibold ">Update Your Profile</h2>
                  </div>
                  <div className="p-4">
                    {/* Input details */}
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                      <Input
                        name="first_name"
                        label="First Name"
                        type="text"
                        value={values.first_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.first_name && touched.first_name ? errors.first_name : null}
                      />
                      <Input
                        name="last_name"
                        label="Last Name"
                        type="text"
                        value={values.last_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.last_name && touched.last_name ? errors.last_name : null}
                      />
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 w-full">
                      <Input
                        label="Email"
                        name="email"
                        type="email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.email && touched.email ? errors.email : null}
                      />
                    </div>
                  </div>
                </div>

                {/* Second Section */}
                <div className="bg-white rounded-md shadow">
                  <div className="top border-b border-gray p-4 ">
                    <h2 className="inline-block text-dark font-semibold ">
                      More Details About You
                    </h2>
                  </div>
                  <div className="p-4">
                    <EnhancedTextArea
                      label=""
                      name="description"
                      value={values.description}
                      className="h-auto md:h-[200px] w-full text-xs overflow-y-auto"
                      placeholder="Describe who you are"
                      // onChange={(data) => setFieldValue('description', data)}
                      onChange={(e) => setFieldValue('description', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="right flex-1 flex flex-col gap-4 w-full ">
                {/* Sections colums */}
                {/* first Section */}
                <div className="bg-white rounded-md shadow ">
                  <div className="top border-b border-gray p-4 ">
                    <h2 className="inline-block text-dark font-semibold ">Profile Picture</h2>
                  </div>
                  <div className="p-4">
                    {/* Input details */}
                    <div className="w-full relative">
                      {/* Image Preview */}
                      <div className="mt-2 flex justify-center">
                        <div className="relative">
                          <img
                            src={previewUrl || '/assets/avater.png'}
                            alt="Profile Preview"
                            width={100}
                            height={100}
                            className="border border-light-green w-[150px] h-[150px] rounded-md object-cover cursor-pointer p-1"
                            onClick={() => document.getElementById('profilePictureInput').click()}
                          />

                          <p className="text-sm text-dark-gray italic">
                            {activeUser?.images?.[0]?.url
                              ? 'Update Profile Image'
                              : 'Profile Image'}
                          </p>
                          {/* Remove Icon */}
                          {selectedFile && (
                            <div
                              onClick={removeImage} // Trigger the remove image function
                              className="absolute top-0 right-0 bg-danger text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer"
                              title="Remove"
                            >
                              X
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Hidden File Input */}
                      <input
                        type="file"
                        name="images"
                        onChange={(event) => {
                          handleFileChange(event); // Handle file selection
                          setFieldValue('profilePicture', event.currentTarget.files[0]); // Set Formik value
                        }}
                        className="hidden"
                        id="profilePictureInput"
                      />
                    </div>
                  </div>
                </div>
                {/* Second Section */}
                <div className="bg-white rounded-md shadow ">
                  <div className="top border-b border-gray p-4 ">
                    <h2 className="inline-block text-dark font-semibold ">Contact Details</h2>
                  </div>
                  <div className="p-4">
                    {/* Input details */}
                    <Input
                      label="Address"
                      name="address"
                      type="text"
                      value={values.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.address && touched.address ? errors.address : null}
                    />
                    <Input
                      label="Mobile No"
                      name="phone"
                      type="text"
                      placeholder="+2348034****"
                      value={values.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.phone && touched.phone ? errors.phone : null}
                    />
                    <Input
                      label="State"
                      name="state"
                      type="text"
                      value={values.state}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.state && touched.state ? errors.state : null}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-72  mx-auto mt-4">
              <SubmitButton label="Update Details" isLoading={isLoading} />
            </div>
          </FormWrapper>
        )}
      </Formik>
    </main>
  );
};

export default UpdateProfile;
