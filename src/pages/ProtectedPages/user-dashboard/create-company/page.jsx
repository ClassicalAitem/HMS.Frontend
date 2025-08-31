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
import { AlertMessage } from '@/utils/alertMessage';
import useAuthStore from '@/store/authStore';
import { paths } from '@/routes/paths';
import { LoggedInUserPath } from '@/utils/helpers';
import { useNavigate } from 'react-router-dom';

const CreateCompany = () => {
  const navigate = useNavigate();
  const { user, updateUserRole } = useAuthStore();
  const [message, setMessage] = useState({ error: null, success: null });
  const [loading, setLoading] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('/assets/companyLogo.png');

  useEffect(() => {
    if (user && user.role !== 'Customer') {
      const pathhd = LoggedInUserPath(user);
      navigate(pathhd);
    }
  }, [user, navigate]);

  const validationSchema = Yup.object().shape({
    name: Yup.string().trim().required('Company name is required*'),
    companyEmail: Yup.string().email().trim().required('Email is required*'),
    companyPhoneNumber: Yup.string(),
    companyAddress: Yup.string().trim().required('Address is required*'),
    state: Yup.string().trim().required('State is required*')
  });

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl('/assets/companyLogo.png');
  };

  return (
    <main>
      {message && <AlertMessage alert={message} />}
      <Formik
        enableReinitialize
        initialValues={{
          name: '',
          certificationNo: '',
          companyEmail: '',
          companyAddress: '',
          companyPhoneNumber: '',
          mobilePhone: '',
          state: '',
          description: '',
          images: ''
        }}
        validationSchema={validationSchema}
        onSubmit={async (values) => {
          try {
            setLoading(true);

            const formData = new FormData();
            Object.keys(values).forEach((key) => {
              formData.append(key, values[key]);
            });

            if (selectedFile) {
              formData.append('images', selectedFile);
            }

            await apiClient.post(endpoints.createCompany, formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
            // Update User Role in Zustand
            updateUserRole('Seller');
            setMessage({ error: null, success: 'Company registration successful' });
            navigate(paths.sellerDashboard);
          } catch (error) {
            console.log(error);
            setMessage({
              error: `${error?.response?.data?.message || 'Internal Server error'}`,
              success: null
            });
          } finally {
            setLoading(false);
          }
        }}
      >
        {({ handleChange, handleBlur, touched, setFieldValue, handleSubmit, values, errors }) => (
          <FormWrapper onSubmit={handleSubmit}>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="left flex-[2] flex flex-col gap-4 w-full">
                {/* Sections colums*/}

                {/* first Section */}
                <div className="bg-white rounded-md shadow pb-4">
                  <div className="top border-b border-gray p-4 ">
                    <h2 className="inline-block text-dark font-semibold ">Basic Company Details</h2>
                  </div>
                  <div className="p-4">
                    {/* Input details */}
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                      <Input
                        name="name"
                        label="Company Name *"
                        type="text"
                        value={values.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.name && touched.name ? errors.name : null}
                      />
                      <Input
                        name="companyEmail"
                        label="Company Email *"
                        type="email"
                        value={values.companyEmail}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          errors.companyEmail && touched.companyEmail ? errors.companyEmail : null
                        }
                      />
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 w-full">
                      <Input
                        label="CAC Reg. No (Note: We will verify) *"
                        name="certificationNo"
                        type="text"
                        placeholder=""
                        value={values.certificationNo}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          errors.certificationNo && touched.certificationNo
                            ? errors.certificationNo
                            : null
                        }
                      />
                      <Input
                        label="Company Address *"
                        name="companyAddress"
                        type="text"
                        value={values.companyAddress}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={
                          errors.companyAddress && touched.companyAddress
                            ? errors.companyAddress
                            : null
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Second Section */}
                <div className="bg-white rounded-md shadow">
                  <div className="top border-b border-gray p-4 ">
                    <h2 className="inline-block text-dark font-semibold ">
                      More Details (optional)
                    </h2>
                  </div>
                  <div className="p-4">
                    <EnhancedTextArea
                      label=""
                      name="description"
                      value={values.description}
                      className="h-auto md:h-[200px] w-full text-xs overflow-y-auto"
                      placeholder="Tell us more about you company (optional)"
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
                    <h2 className="inline-block text-dark font-semibold ">
                      Company Logo (optional)
                    </h2>
                  </div>
                  <div className="p-4">
                    {/* Input details */}
                    <div className="w-full relative">
                      {/* Image Preview */}
                      <div className="mt-2 flex justify-center">
                        <div className="relative">
                          <img
                            src={previewUrl || '/assets/companyLogo.png'}
                            alt="Profile Preview"
                            width={100}
                            height={100}
                            className="border border-gray w-[150px] h-[150px] rounded-md object-cover cursor-pointer p-1"
                            onClick={() => document.getElementById('PictureInput').click()}
                          />

                          <p className="text-sm text-dark-gray italic">Company Logo</p>
                          {/* Remove Icon */}
                          {selectedFile && (
                            <div
                              onClick={removeImage}
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
                          handleFileChange(event);
                          setFieldValue('images', event.currentTarget.files[0]);
                        }}
                        className="hidden"
                        id="PictureInput"
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
                      label="Company Phone No *"
                      name="companyPhoneNumber"
                      type="text"
                      value={values.companyPhoneNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        errors.companyPhoneNumber && touched.companyPhoneNumber
                          ? errors.companyPhoneNumber
                          : null
                      }
                    />
                    <Input
                      label="Mobile No"
                      name="mobilePhone"
                      type="text"
                      placeholder=""
                      value={values.mobilePhone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.mobilePhone && touched.mobilePhone ? errors.mobilePhone : null}
                    />
                    <Input
                      label="State *"
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
              <SubmitButton label="Create Company" isLoading={loading} />
            </div>
          </FormWrapper>
        )}
      </Formik>
    </main>
  );
};

export default CreateCompany;
