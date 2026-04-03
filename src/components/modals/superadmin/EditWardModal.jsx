import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaBed } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { updateWard } from '@/services/api/wardAPI';
import { useAppDispatch } from '@/store/hooks';
import { fetchUsers } from '@/store/slices/usersSlice';
import { getAllDepartments } from '@/services/api/departmentAPI';

const EditWardModal = ({ isOpen, onClose, onWardUpdate }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
      const fetchDepartment = async() => {
        try {
          const res = await getAllDepartments()
          setDepartments(res.data)

          console.log(res.data);
        } catch(error) {
          console.error(error);
        }

      }

      fetchDepartment()
    }, []);

  const updateDepartmentSchema =
  yup.object({
    name: yup
      .string()
      .min(2, 'Ward name must be at least 2 characters')
      .max(50, 'Ward name must not exceed 50 characters'),
    departmentId: yup
      .string(),
    floorLocation: yup
      .string()
      .min(1, 'Floor must be at least 1 character'),
    status: yup
      .string(),
    occupancy: yup
      .string()
      .min(2, 'Occupancy must be at least 2 characters')
      .max(10, 'Occupancy must not exceed 10 characters')
  });

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(updateDepartmentSchema),
    defaultValues: {
      name: '',
      headOfDepartmentId: '',
      status: 'active',
    }
  });

  useEffect(() => {
    if (onWardUpdate && isOpen) {
      setValue('name', onWardUpdate.name || '');
      setValue('departmentId', onWardUpdate.departmentId || '');
      setValue('floorLocation', onWardUpdate.floorLocation || '');
      setValue('occupancy', onWardUpdate.occupancy || '');
      setValue('status', onWardUpdate.status || 'active');
    }
  }, [onWardUpdate, isOpen, setValue])

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Data to be sent for creation:', data);
      await updateWard(onWardUpdate.id, data)
      console.log('Ward updated:', data);
      toast.success('Ward updated successfully!');
      reset();
      onClose();
    } catch (error) {
      console.error('Error updating ward:', error);
      toast.error('Failed to update ward');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  console.log('Department', departments)


  if (!isOpen) return null;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
      <div className="mx-4 w-full max-w-md rounded-lg shadow-xl bg-base-100">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-base-300">
          <div className="flex items-center">
            <div className="flex justify-center items-center mr-3 w-10 h-10 rounded-full bg-primary/10">
              <FaBed className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-base-content">Edit Ward</h3>
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
            {/* Department Name */}
            <div>
              <label className="block mb-2 text-sm font-medium text-base-content/70">
                Ward Name
              </label>
              <input
                type="text"
                {...register('name')}
                className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                placeholder="Enter department name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-error">{errors.name.message}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block mb-2 text-sm font-medium text-base-content/70">
                Department
              </label>
              <select
                {...register('departmentId')}
                className={`select select-bordered w-full ${errors.department ? 'select-error' : ''}`}
                disabled={isLoading}
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.department && (
                <p className="mt-1 text-xs text-error">{errors.department.message}</p>
              )}
            </div>

            {/* Floor */}
            <div>
              <label className="block mb-2 text-sm font-medium text-base-content/70">
                Floor
              </label>
              <input
                type="text"
                {...register('floorLocation')}
                className={`input input-bordered w-full ${errors.floor ? 'input-error' : ''}`}
                disabled={isLoading}
              />
              {errors.floor && (
                <p className="mt-1 text-xs text-error">{errors.floor.message}</p>
              )}
            </div>.

            {/* Occupancy */}
            <div>
              <label className="block mb-2 text-sm font-medium text-base-content/70">
                Occupancy
              </label>
              <input
                type="text"
                {...register('occupancy')}
                className={`input input-bordered w-full ${errors.occupancy ? 'input-error' : ''}`}
                disabled={isLoading}
              />
              {errors.occupancy && (
                <p className="mt-1 text-xs text-error">{errors.occupancy.message}</p>
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
          <div className="flex justify-end pt-4 mt-6 space-x-3 border-t border-base-300">
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
                  updating...
                </>
              ) : (
                'Update Ward'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditWardModal;
