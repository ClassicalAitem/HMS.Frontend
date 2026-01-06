import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common';
import { Sidebar, FilterUsers } from '@/components/superadmin';
import { DataTable } from '@/components/common';
import { FaPlus, FaEdit, FaTrash, FaUserShield, FaUserMd, FaUserNurse, FaUserTie, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchUsers, deleteUser, toggleUserStatus, clearUsersError } from '../../../store/slices/usersSlice';
import { AddUserModal, EditUserModal } from '../../../components/modals';
import toast from 'react-hot-toast';
import UsersDebug from '../../../components/common/UsersDebug';

const ManageUsers = () => {
  const dispatch = useAppDispatch();
  const { users, isLoading, error } = useAppSelector((state) => state.users);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    console.log('🔄 ManageUsers: Component mounted, fetching users');
    dispatch(fetchUsers());
  }, [dispatch]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearUsersError());
    }
  }, [error, dispatch]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Filter functions
  const handleRefresh = () => {
    console.log('🔄 ManageUsers: Refreshing users data');
    dispatch(fetchUsers());
    toast.success('Users data refreshed');
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  // Filter users based on search term, role, and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === 'all' || user.accountType === selectedRole;
    const matchesStatus = selectedStatus === 'all' ||
      (selectedStatus === 'active' && user.isActive) ||
      (selectedStatus === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (accountType) => {
    switch (accountType) {
      case 'super-admin':
        return <FaUserShield className="w-4 h-4" />;
      case 'admin':
        return <FaUserTie className="w-4 h-4" />;
      case 'doctor':
        return <FaUserMd className="w-4 h-4" />;
      case 'nurse':
        return <FaUserNurse className="w-4 h-4" />;
      default:
        return <FaUserShield className="w-4 h-4" />;
    }
  };

  const getRoleBadgeClass = (accountType) => {
    switch (accountType) {
      case 'super-admin':
        return 'badge badge-error';
      case 'admin':
        return 'badge badge-warning';
      case 'doctor':
        return 'badge badge-info';
      case 'nurse':
        return 'badge badge-success';
      case 'front-desk':
        return 'badge badge-primary';
      case 'cashier':
        return 'badge badge-secondary';
      case 'lab-technician':
        return 'badge badge-outline badge-accen';
      case 'lab-technician':
        return 'badge badge-accent';
      case 'surgeon':
        return 'badge badge-ghost';
      case 'pharmacist':
        return 'badge badge-outline';
      default:
        return 'badge badge-neutral';
    }
  };

  const formatRole = (accountType) => {
    return accountType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const processedUsers = filteredUsers.map(user => ({
    ...user,
    name: `${user.firstName} ${user.lastName}`,
    roleDisplay: formatRole(user.accountType),
    lastLoginFormatted: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
    createdAtFormatted: new Date(user.createdAt).toLocaleDateString(),
  }));

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      console.log('🗑️ ManageUsers: Deleting user:', userId);
      const result = await dispatch(deleteUser(userId));

      if (deleteUser.fulfilled.match(result)) {
        toast.success('User deleted successfully');
      } else {
        toast.error('Failed to delete user');
      }
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    console.log('🔄 ManageUsers: Toggling user status:', userId, 'to', !currentStatus);
    const result = await dispatch(toggleUserStatus({ userId, isActive: !currentStatus }));

    if (toggleUserStatus.fulfilled.match(result)) {
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } else {
      toast.error('Failed to update user status');

      // Determine the action based on current status (if active, we want to disable, so isActive should be false)
      const newStatus = !currentStatus;

      // For disabling/enabling account, the API expects isActive boolean
      // When disabling (newStatus is false), we might also want to send isDisabled: true depending on backend logic
      // But based on usersAPI.disableUserAccount, it accepts userData object

      try {
        const result = await dispatch(toggleUserStatus({ userId, isActive: newStatus }));

        if (toggleUserStatus.fulfilled.match(result)) {
          toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
          // Refresh the list to reflect changes
          dispatch(fetchUsers());
        } else {
          // Handle error from the thunk
          const errorMessage = result.payload || 'Failed to update user status';
          toast.error(typeof errorMessage === 'string' ? errorMessage : 'Failed to update user status');
        }
      } catch (error) {
        console.error('❌ ManageUsers: Error toggling status:', error);
        toast.error('An unexpected error occurred');
      }
    }
  };

  const handleUserAdded = () => {
    console.log('🔄 ManageUsers: User added, refreshing users list');
    dispatch(fetchUsers());
  };

  const handleUserUpdated = () => {
    console.log('🔄 ManageUsers: User updated, refreshing users list');
    dispatch(fetchUsers());
  };

  const columns = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'email',
      title: 'Email',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'accountType',
      title: 'Role',
      sortable: true,
      className: 'text-base-content/70',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          {getRoleIcon(value)}
          <span className={`badge ${getRoleBadgeClass(value)}`}>
            {row.roleDisplay}
          </span>
        </div>
      )
    },
    {
      key: 'isActive',
      title: 'Status',
      sortable: true,
      className: 'text-base-content/70',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <span className={`badge ${value ? 'badge-success' : 'badge-error'}`}>
            {value ? 'Active' : 'Inactive'}
          </span>
        </div>
      )
    },
    {
      key: 'isDefaultPassword',
      title: 'Password',
      sortable: true,
      className: 'text-base-content/70',
      render: (value) => (
        <span className={`badge badge-sm ${value ? 'badge-warning' : 'badge-success'}`}>
          {value ? 'Default' : 'Changed'}
        </span>
      )
    },
    {
      key: 'lastLoginFormatted',
      title: 'Last Login',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'createdAtFormatted',
      title: 'Created',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'actions',
      title: 'Actions',
      className: 'text-base-content/70',
      render: (value, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleToggleUserStatus(row.id, row.isActive)}
            className={`btn btn-ghost btn-xs ${row.isActive ? 'text-warning' : 'text-success'}`}
            title={row.isActive ? 'Deactivate User' : 'Activate User'}
          >
            {row.isActive ? <FaToggleOff className="w-3 h-3" /> : <FaToggleOn className="w-3 h-3" />}
          </button>
          <button
            onClick={() => {
              setSelectedUser(row);
              setIsEditModalOpen(true);
            }}
            className="btn btn-ghost btn-xs"
            title="Edit User"
          >
            <FaEdit className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleDeleteUser(row.id)}
            className="btn btn-ghost btn-xs text-error"
            title="Delete User"
          >
            <FaTrash className="w-3 h-3" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex h-screen">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      {/* Main Content */}
      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />

        {/* Page Content */}
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-normal text-primary 2xl:text-3xl">Manage Users</h1>
              <p className="text-sm text-base-content/60 2xl:text-base">Manage system users and their permissions</p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary"
            >
              <FaPlus className="mr-2 w-4 h-4" />
              Add User
            </button>
          </div>

          {/* Filter Users Section */}
          <FilterUsers
            searchTerm={searchTerm}
            selectedRole={selectedRole}
            selectedStatus={selectedStatus}
            isLoading={isLoading}
            onSearchChange={handleSearchChange}
            onRoleChange={handleRoleChange}
            onStatusChange={handleStatusChange}
            onRefresh={handleRefresh}
          />

          {/* Users Table */}
          <div className="flex flex-1 w-full min-h-0">
            <div className="w-full shadow-xl card bg-base-100">
              <div className="p-4 card-body 2xl:p-6">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="flex flex-col items-center space-y-4">
                      <span className="loading loading-spinner loading-lg"></span>
                      <p className="text-base-content/70">Loading users...</p>
                    </div>
                  </div>
                ) : (
                  <DataTable
                    data={processedUsers}
                    columns={columns}
                    searchable={true}
                    sortable={true}
                    paginated={true}
                    initialEntriesPerPage={10}
                    maxHeight="max-h-96 sm:max-h-80 md:max-h-96 lg:max-h-80 2xl:max-h-96"
                    showEntries={true}
                    searchPlaceholder="Search users..."
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserAdded={handleUserAdded}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={selectedUser}
        onUserUpdated={handleUserUpdated}
      />

      {/* Debug Component - Remove in production */}
      {/* <div className="hidden fixed right-4 bottom-4 z-50">
        <UsersDebug />
      </div> */}
    </div>
  );
};

export default ManageUsers;
