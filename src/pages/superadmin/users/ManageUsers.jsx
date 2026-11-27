import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common';
import { Sidebar, FilterUsers } from '@/components/superadmin';
import { DataTable } from '@/components/common';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUserShield,
  FaUserMd,
  FaUserNurse,
  FaUserTie,
  FaUsers,
  FaUserClock,
  FaBan,
  FaCheckCircle,
  FaToggleOn,
  FaToggleOff,
  FaKey,
  FaEye,
  FaSignOutAlt,
} from 'react-icons/fa';
import { usersAPI } from '../../../services/api/usersAPI';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchUsers,
  deleteUser,
  toggleUserStatus,
  toggleUserLeaveStatus,
  clearUsersError,
} from '../../../store/slices/usersSlice';
import { AddUserModal, EditUserModal, ResetPasswordModal, StaffProfileModal } from '../../../components/modals';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHandler';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';

const ManageUsers = () => {
  const dispatch = useAppDispatch();
  const { users, isLoading, error } = useAppSelector((state) => state.users);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Full Staff Profile Modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);

  const handleOpenProfile = (user) => {
    setProfileUser(user);
    setIsProfileModalOpen(true);
  };

  const handleForceLogoutUser = async (targetUser) => {
    const name = `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || targetUser.email;
    if (!window.confirm(`Force log out ${name} from all active browser sessions?`)) return;
    try {
      await usersAPI.forceLogoutUser(targetUser.id);
      toast.success(`${name} has been logged out`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to force logout user'));
    }
  };

  const handleForceLogoutAll = async () => {
    if (!window.confirm('Force log out ALL users (except you) from their browsers immediately?')) return;
    try {
      await usersAPI.forceLogoutAll();
      toast.success('All other users have been logged out');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to force logout all users'));
    }
  };

  // Leave toggle confirmation modal state
  const [leaveModalData, setLeaveModalData] = useState({
    isOpen: false,
    user: null,
    targetStatus: false,
  });
  const [togglingLeaveId, setTogglingLeaveId] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error));
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

  // Leave toggle handler
  const handleLeaveCheckboxClick = (user, currentLeaveStatus) => {
    setLeaveModalData({
      isOpen: true,
      user,
      targetStatus: !currentLeaveStatus,
    });
  };

  const confirmLeaveStatusChange = async () => {
    const { user, targetStatus } = leaveModalData;
    if (!user) return;

    setTogglingLeaveId(user.id);
    setLeaveModalData({ isOpen: false, user: null, targetStatus: false });

    try {
      const result = await dispatch(
        toggleUserLeaveStatus({ userId: user.id, isOnLeave: targetStatus })
      );

      if (toggleUserLeaveStatus.fulfilled.match(result)) {
        toast.success(
          targetStatus
            ? `${user.firstName} ${user.lastName} is now ON LEAVE. System login has been locked.`
            : `${user.firstName} ${user.lastName} returned from leave. System login is restored.`
        );
        dispatch(fetchUsers());
      } else {
        toast.error(result.payload || 'Failed to update leave status');
      }
    } catch (err) {
      toast.error('Failed to update leave status');
    } finally {
      setTogglingLeaveId(null);
    }
  };

  // Filter users based on search term, role, and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.shift?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === 'all' ||
      user.accountType === selectedRole ||
      (selectedRole === 'human-resource' && (user.accountType === 'human-resource' || user.accountType === 'hr')) ||
      (selectedRole === 'medical-laboratory' && user.accountType === 'lab-technician');

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
      case 'human-resource':
      case 'hr':
        return <FaUsers className="w-4 h-4" />;
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
      case 'medical-director':
        return 'badge badge-primary';
      case 'nurse':
        return 'badge badge-success';
      case 'front-desk':
        return 'badge badge-primary';
      case 'cashier':
        return 'badge badge-secondary';
      case 'medical-laboratory':
      case 'lab-technician':
        return 'badge badge-outline badge-accent';
      case 'surgeon':
        return 'badge badge-outline badge-ghost';
      case 'pharmacist':
        return 'badge badge-outline badge-primary';
      case 'sonographer':
        return 'badge badge-outline badge-info';
      case 'human-resource':
      case 'hr':
        return 'badge badge-primary font-semibold';
      case 'hmo':
        return 'badge badge-accent';
      default:
        return 'badge badge-neutral';
    }
  };

  const formatRole = (accountType) => {
    if (!accountType) return 'Unknown';
    if (accountType === 'human-resource' || accountType === 'hr') return 'Human Resources';
    return accountType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const processedUsers = filteredUsers.map(user => ({
    ...user,
    name: `${user.firstName} ${user.lastName}`,
    roleDisplay: formatRole(user.accountType),
    isOnLeave: Boolean(user.isOnLeave),
    lastLoginFormatted: user.lastLogin ? formatNigeriaDate(user.lastLogin) : 'Never',
    createdAtFormatted: formatNigeriaDate(user.createdAt),
  }));

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const result = await dispatch(deleteUser(userId));

      if (deleteUser.fulfilled.match(result)) {
        toast.success('User deleted successfully');
        // Refresh the list to reflect changes
        dispatch(fetchUsers());
      } else {
        toast.error(result.payload || 'Failed to delete user');
      }
    }
  };

const handleToggleUserStatus = async (userId, currentIsDisabled) => {
  const result = await dispatch(toggleUserStatus({ userId, isDisabled: !currentIsDisabled }));

  if (toggleUserStatus.fulfilled.match(result)) {
    toast.success(`User ${!currentIsDisabled ? 'disabled' : 'enabled'} successfully`);
    dispatch(fetchUsers());
  } else {
    const errorMessage = result.payload || 'Failed to update user status';
    toast.error(typeof errorMessage === 'string' ? errorMessage : 'Failed to update user status');
  }
};

  const handleUserAdded = () => {
    dispatch(fetchUsers());
  };

  const handleUserUpdated = () => {
    dispatch(fetchUsers());
  };

  const columns = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      className: 'text-base-content font-medium',
      render: (value, row) => (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleOpenProfile(row);
          }}
          className="flex items-center gap-2.5 cursor-pointer group py-1"
          title="Click to view full staff profile details"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs group-hover:bg-primary group-hover:text-primary-content transition-colors shrink-0">
            {row.firstName?.[0]?.toUpperCase()}{row.lastName?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-primary group-hover:underline block truncate">
              {value}
            </span>
            <span className="text-[11px] text-base-content/50 block truncate">
              ID: {row.id?.slice(0, 8)}...
            </span>
          </div>
        </div>
      )
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
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <span className={`badge badge-sm ${value ? 'badge-success text-white' : 'badge-error text-white'}`}>
            {value ? 'Active' : 'Disabled'}
          </span>
          <span className={`badge badge-xs ${row.isLoggedIn ? 'badge-info text-white' : 'badge-ghost text-base-content/60'}`}>
            {row.isLoggedIn ? 'On Duty' : 'Off Duty'}
          </span>
        </div>
      )
    },
    {
      key: 'isOnLeave',
      title: 'On Leave (Lock Login)',
      sortable: true,
      className: 'text-center',
      render: (value, row) => {
        const isOnLeave = Boolean(row.isOnLeave);
        const isToggling = togglingLeaveId === row.id;

        return (
          <div className="inline-flex flex-col items-center gap-1">
            {isToggling ? (
              <span className="loading loading-spinner loading-xs text-warning" />
            ) : (
              <label
                className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all ${
                  isOnLeave
                    ? 'bg-warning/15 border-warning/40 text-warning-content font-bold shadow-xs'
                    : 'bg-base-200/40 border-base-300 hover:border-warning/50 text-base-content/70'
                }`}
                title={isOnLeave ? 'Staff is currently on leave (login blocked)' : 'Not on leave'}
              >
                <input
                  type="checkbox"
                  checked={isOnLeave}
                  onChange={() => handleLeaveCheckboxClick(row, isOnLeave)}
                  className="checkbox checkbox-xs checkbox-warning"
                />
                <span className="text-xs">
                  {isOnLeave ? 'On Leave' : 'Available'}
                </span>
              </label>
            )}

            {isOnLeave && (
              <span className="text-[10px] text-error font-medium flex items-center gap-0.5">
                <FaBan className="w-2.5 h-2.5" /> Login Blocked
              </span>
            )}
          </div>
        );
      },
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
      key: 'shift',
      title: 'Shift',
      sortable: true,
      className: 'text-base-content/70',
      render: (value) => {
        if (!value) return <span className="text-gray-400 text-sm italic">None</span>;
        return (
          <span className={`badge badge-sm ${value === 'morning' ? 'badge-primary' : 'badge-neutral'}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      className: 'text-base-content/70',
      render: (value, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleOpenProfile(row)}
            className="btn btn-ghost btn-xs text-primary"
            title="View Full Staff Profile"
          >
            <FaEye className="w-3 h-3" />
          </button>
          <button
  onClick={() => handleToggleUserStatus(row.id, row.isDisabled)}
  className={`btn btn-ghost btn-xs ${row.isDisabled ? 'text-success' : 'text-warning'}`}
  title={row.isDisabled ? 'Enable User' : 'Disable User'}
>
  {row.isDisabled ? <FaToggleOn className="w-3 h-3" /> : <FaToggleOff className="w-3 h-3" />}
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
              onClick={() => {
                setSelectedUser(row);
                setIsResetPasswordModalOpen(true);
              }}
              className="btn btn-ghost btn-xs"
              title="Change Password"
            >
              <FaKey className="w-3 h-3" />
            </button>
          <button
            onClick={() => handleForceLogoutUser(row)}
            className="btn btn-ghost btn-xs text-warning"
            title="Force Logout User"
          >
            <FaSignOutAlt className="w-3 h-3" />
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
          className="fixed inset-0 z-40 bg-opacity-50 lg:hidden"
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
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleForceLogoutAll}
                className="btn btn-outline btn-error"
                title="Log out all other users immediately"
              >
                <FaSignOutAlt className="mr-2 w-4 h-4" />
                Logout All Users
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn btn-primary"
              >
                <FaPlus className="mr-2 w-4 h-4" />
                Add User
              </button>
            </div>
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

      {/* Staff Profile Modal */}
      <StaffProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setProfileUser(null);
        }}
        user={profileUser}
        onUserUpdated={() => dispatch(fetchUsers())}
        onToggleLeave={handleLeaveCheckboxClick}
        onEdit={(u) => {
          setSelectedUser(u);
          setIsEditModalOpen(true);
        }}
        onResetPassword={(u) => {
          setSelectedUser(u);
          setIsResetPasswordModalOpen(true);
        }}
      />

      {/* Change Password Modal */}
        <ResetPasswordModal
          isOpen={isResetPasswordModalOpen}
          onClose={() => setIsResetPasswordModalOpen(false)}
          user={selectedUser}
        />

      {/* Leave Status Confirmation Modal */}
      {leaveModalData.isOpen && leaveModalData.user && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg text-base-content flex items-center gap-2">
              <FaUserClock className="text-warning w-5 h-5" />
              <span>
                {leaveModalData.targetStatus
                  ? 'Confirm Place on Leave'
                  : 'Confirm Return from Leave'}
              </span>
            </h3>

            <p className="py-4 text-sm text-base-content/80 leading-relaxed">
              Are you sure you want to mark{' '}
              <strong className="text-base-content">
                {leaveModalData.user.firstName} {leaveModalData.user.lastName}
              </strong>{' '}
              ({leaveModalData.user.accountType}) as{' '}
              <span
                className={`badge badge-sm font-bold ${
                  leaveModalData.targetStatus
                    ? 'badge-warning'
                    : 'badge-success text-white'
                }`}
              >
                {leaveModalData.targetStatus ? 'ON LEAVE' : 'ON DUTY'}
              </span>
              ?
            </p>

            {leaveModalData.targetStatus ? (
              <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-xs text-error font-medium flex items-start gap-2.5 mb-4">
                <FaBan className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Important:</strong> When placed on leave, this staff
                  member will be strictly <strong>blocked from logging into the HMS</strong>{' '}
                  until returned from leave.
                </span>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-success/10 border border-success/20 text-xs text-success font-medium flex items-start gap-2.5 mb-4">
                <FaCheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  System login access will be immediately restored for this staff
                  member.
                </span>
              </div>
            )}

            <div className="modal-action">
              <button
                type="button"
                onClick={() =>
                  setLeaveModalData({
                    isOpen: false,
                    user: null,
                    targetStatus: false,
                  })
                }
                className="btn btn-sm btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLeaveStatusChange}
                className={`btn btn-sm ${
                  leaveModalData.targetStatus
                    ? 'btn-warning text-warning-content font-bold'
                    : 'btn-success text-white'
                }`}
              >
                {leaveModalData.targetStatus
                  ? 'Yes, Place On Leave'
                  : 'Yes, Return to Duty'}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() =>
              setLeaveModalData({
                isOpen: false,
                user: null,
                targetStatus: false,
              })
            }
          />
        </div>
      )}

      {/* Debug Component - Remove in production */}
      {/* <div className="hidden fixed right-4 bottom-4 z-50">
        <UsersDebug />
      </div> */}
    </div>
  );
};

export default ManageUsers;
