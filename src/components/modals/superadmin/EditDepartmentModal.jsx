import React, { useEffect, useState } from 'react';
import { set, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaBuilding } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { updateDepartment } from '@/services/api/departmentAPI';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUsers } from '@/store/slices/usersSlice';


const EditDepartmentModal = ({ isOpen, onClose, onDepartmentUpdate }) => {
  const dispatch = useAppDispatch();
  const {users, error} = useAppSelector((state) => state.users);
  const [isLoading, setIsLoading] = useState(false);

  const updateDepartmentSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Department name must be at least 2 characters')
    .max(50, 'Department name must not exceed 50 characters'),
  headOfDepartmentId: yup
    .string()
    .nullable()
    .test(
      'has-department',
      'This account is not part of any department, Please add a department',
      function (value) {
        if (!value) return true; // allow empty selection

        const selectedUser = users.find((u) => u.id === value);
        return !!selectedUser && !!selectedUser.departmentId;
      }
    ),

  status: yup
    .string(),
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
    if (onDepartmentUpdate && isOpen) {
      setValue('name', onDepartmentUpdate.name || '');
      setValue('headOfDepartmentId', onDepartmentUpdate.headOfDepartmentId || '');
      setValue('status', onDepartmentUpdate.status || 'active');
    }
  }, [onDepartmentUpdate, isOpen, setValue])

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Data to be sent for creation:', data);
      await updateDepartment(onDepartmentUpdate.id, data)
      console.log('Department updated:', data);
      toast.success('Department updated successfully!');
      reset();
      onClose();
    } catch (error) {
      console.error('Error updating department:', error);
      toast.error('Failed to update department');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  console.log('Department', onDepartmentUpdate)
  console.log('Users:', users);



  if (!isOpen) return null;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
      <div className="mx-4 w-full max-w-md rounded-lg shadow-xl bg-base-100">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-base-300">
          <div className="flex items-center">
            <div className="flex justify-center items-center mr-3 w-10 h-10 rounded-full bg-primary/10">
              <FaBuilding className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-base-content">Edit Department</h3>
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
                Department Name
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

            {/* Department Head */}
            <div>
              <label className="block mb-2 text-sm font-medium text-base-content/70">
                Department Head
              </label>
              <select
                {...register('headOfDepartmentId')}
                className={`select select-bordered w-full ${errors.department ? 'select-error' : ''}`}
                disabled={isLoading}
              >
                <option value="">Select HOD</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName } {user.departmentName ? ` (${user.departmentName})` : ''}
                  </option>
                ))}
              </select>
              {errors.headOfDepartmentId && (
                <p className="mt-1 text-xs text-error">{errors.headOfDepartmentId.message}</p>
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
                'Update Department'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDepartmentModal;
