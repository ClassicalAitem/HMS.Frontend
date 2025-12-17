import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaBed } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getAllDepartments } from '@/services/api/departmentAPI';
import { createWard } from '@/services/api/wardAPI';

const addWardSchema = yup.object({
  name: yup
    .string()
    .required('Ward name is required')
    .min(2, 'Ward name must be at least 2 characters')
    .max(50, 'Ward name must not exceed 50 characters'),
  departmentId: yup
    .string()
    .required('Department is required'),
  floorLocation: yup
    .string()
    .min(1, 'Floor must be at least 1 character'),
  status: yup
    .string(),
  occupancy: yup
    .string()
    .required('Occupancy is required')
    .min(2, 'Occupancy must be at least 2 characters')
    .max(10, 'Occupancy must not exceed 10 characters')
});

const AddWardModal = ({ isOpen, onClose, onWardAdded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([]);


  useEffect(() => {
    if (!isOpen) return;
    const fetchDepartment = async() => {
      try {
        const res = await getAllDepartments();
        const list = res.data || [];
        setDepartments(list);


        console.log({'Get Departments': res});
      } catch(error) {
        console.error(error);
      }

    }
    fetchDepartment();
  }, [isOpen])

  console.log('Departments:', departments);




  // Sample departments for dropdown
  // const departments = [
  //   'General Medicine',
  //   'Cardiology',
  //   'Emergency',
  //   'Pediatrics',
  //   'Surgery',
  //   'Intensive Care',
  //   'Radiology',
  //   'Oncology'
  // ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(addWardSchema)
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      await createWard(data);
      console.log('Ward added:', data);
      toast.success('Ward added successfully!');
      reset();
      onWardAdded();
    } catch (error) {
      console.error('Error adding ward:', error);
      toast.error('Failed to add ward');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-full bg-primary/10">
              <FaBed className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-base-content">Add New Ward</h3>
          </div>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-sm"
            disabled={isLoading}
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-4">
            {/* Ward Name */}
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Ward Name
              </label>
              <input
                type="text"
                {...register('name')}
                className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                placeholder="Enter ward name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-error text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Department
              </label>
              <select
                {...register('departmentId')}
                className={`select select-bordered w-full ${errors.department ? 'select-error' : ''}`}
                disabled={isLoading}
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.department && (
                <p className="text-error text-xs mt-1">{errors.department.message}</p>
              )}
            </div>

            {/* Floor */}
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Floor
              </label>
              <input
                type="text"
                {...register('floorLocation')}
                className={`input input-bordered w-full ${errors.floor ? 'input-error' : ''}`}
                placeholder="e.g., 2nd Floor, Ground Floor"
                disabled={isLoading}
              />
              {errors.floor && (
                <p className="text-error text-xs mt-1">{errors.floor.message}</p>
              )}
            </div>

            {/* Occupancy */}
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Occupancy
              </label>
              <input
                type="text"
                {...register('occupancy')}
                className={`input input-bordered w-full ${errors.occupancy ? 'textarea-error' : ''}`}
                placeholder="Enter ward occupancy details"
                disabled={isLoading}
              />
              {errors.occupancy && (
                <p className="text-error text-xs mt-1">{errors.occupancy.message}</p>
              )}
            </div>

            {/* status */}
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                status
              </label>
              <select
                {...register('status')}
                className={`select select-bordered w-full ${errors.status ? 'select-error' : ''}`}
                disabled={isLoading}
              >
                <option value="active">Active</option>
                <option value="inactive">InActive</option>
              </select>
              {errors.status && (
                <p className="text-error text-xs mt-1">{errors.status.message}</p>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-base-300">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-outline"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Adding...
                </>
              ) : (
                'Add Ward'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWardModal;
