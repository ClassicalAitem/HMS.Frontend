import React, { useEffect, useState } from 'react';
import { FormWrapper, Input, SubmitButton } from '@/components/formManager/FormWrapper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { AlertMessage, PopupError } from '@/utils/alertMessage';
import { apiClient } from '@/api/apiClients';
import { endpoints } from '@/api/endpoints';
import { useParams } from 'react-router-dom';

const EditPackage = () => {
  const { packageId } = useParams();

  const [error, setError] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(true); // Set initial loading state to true
  const [message, setMessage] = useState({ error: null, success: null });
  const [singlePackage, setSinglePackage] = useState({
    _id: '',
    name: '',
    description: '',
    amount: 0,
    feature_1: '',
    feature_2: '',
    feature_3: '',
    feature_4: '',
    popular: false
  });

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const response = await apiClient.get(`${endpoints.fetchAPackage}/${packageId}`);
        const packageData = response.data.data;
        setSinglePackage(packageData);
        setIsChecked(packageData.popular);
      } catch (error) {
        setError(error?.response?.data?.message || 'An error occurred');
      } finally {
        setLoading(false); // Set loading to false after fetching data
      }
    };

    if (packageId) fetchPackage();
  }, [packageId]);

  const validationSchema = Yup.object().shape({
    name: Yup.string().trim().required('Company name is required*'),
    amount: Yup.number().required('Amount is required*'),
    description: Yup.string(),
    feature_1: Yup.string().trim().required('Feature 1 is required*'),
    feature_2: Yup.string().trim().required('Feature 2 is required*'),
    feature_3: Yup.string().trim().required('Feature 3 is required*'),
    feature_4: Yup.string().trim().required('Feature 4 is required*')
  });

  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);
  };

  return (
    <main>
      {error && <PopupError message={error} />}
      {loading ? (
        <div>Loading...</div> // Show a loading state
      ) : (
        <Formik
          enableReinitialize={true}
          initialValues={{
            name: singlePackage.name || '', // Default to an empty string if undefined
            description: singlePackage.description || '',
            amount: singlePackage.amount || 0,
            feature_1: singlePackage.feature_1 || '',
            feature_2: singlePackage.feature_2 || '',
            feature_3: singlePackage.feature_3 || '',
            feature_4: singlePackage.feature_4 || '',
            popular: isChecked
          }}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting, setValues }) => {
            setLoading(true);
            setSubmitting(true);
            try {
              const response = await apiClient.put(`${endpoints.editPackage}/${packageId}`, {
                ...values,
                popular: isChecked
              });
              setSinglePackage(response.data.package);
              setValues(response.data.package);
              setMessage({ error: null, success: 'Package updated successfully' });
              setError(null);
            } catch (error) {
              setError('Error updating package');
            } finally {
              setSubmitting(false);
              setLoading(false);
            }
          }}
        >
          {({ handleSubmit, values, handleChange, handleBlur, errors, touched }) => (
            <FormWrapper onSubmit={handleSubmit}>
              <div className="w-50">
                <AlertMessage alert={message} />
              </div>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="bg-white rounded-md shadow flex-1">
                  <div className="top border-b border-gray p-4">
                    <h2 className="inline-block text-dark font-semibold">
                      Edit Subscription Plans
                    </h2>
                  </div>
                  <div className="p-4">
                    <Input
                      name="name"
                      label="Name"
                      placeholder="Eg: Platinum Member"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.name && touched.name ? errors.name : null}
                    />
                    <Input
                      name="amount"
                      label="Amount"
                      placeholder="Enter amount"
                      value={values.amount}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.amount && touched.amount ? errors.amount : null}
                    />
                    <Input
                      name="description"
                      label="Description"
                      placeholder="Enter description"
                      value={values.description}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.description && touched.description ? errors.description : null}
                    />
                    <div className="relative cursor-pointer mt-6">
                      <label>
                        <span className="mr-4 text-sm">Is this a popular choice?</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={handleCheckboxChange}
                          className="w-6 h-6 checked:bg-light-green"
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-md shadow flex-1">
                  <div className="top border-b border-gray p-4">
                    <h2 className="inline-block text-dark font-semibold">Features</h2>
                  </div>
                  <div className="p-4">
                    <Input
                      name="feature_1"
                      label="Feature 1"
                      placeholder="Feature 1"
                      value={values.feature_1}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.feature_1 && touched.feature_1 ? errors.feature_1 : null}
                    />
                    <Input
                      name="feature_2"
                      label="Feature 2"
                      placeholder="Feature 2"
                      value={values.feature_2}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.feature_2 && touched.feature_2 ? errors.feature_2 : null}
                    />
                    <Input
                      name="feature_3"
                      label="Feature 3"
                      placeholder="Feature 3"
                      value={values.feature_3}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.feature_3 && touched.feature_3 ? errors.feature_3 : null}
                    />
                    <Input
                      name="feature_4"
                      label="Feature 4"
                      placeholder="Feature 4"
                      value={values.feature_4}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={errors.feature_4 && touched.feature_4 ? errors.feature_4 : null}
                    />
                  </div>
                </div>
              </div>
              <div className="w-full md:w-72 mx-auto mt-4">
                <SubmitButton label="Update Package" isLoading={loading} />
              </div>
            </FormWrapper>
          )}
        </Formik>
      )}
    </main>
  );
};

export default EditPackage;
