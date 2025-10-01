/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import { DataTable } from '@/components/common';
import { FaPlus, FaEdit, FaTrash, FaUserShield, FaUserMd, FaUserNurse, FaUserTie } from 'react-icons/fa';
import usersData from '@/data/users.json';

const ManageUsers = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    setUsers(usersData);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'superAdmin':
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

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'superAdmin':
        return 'badge badge-error';
      case 'admin':
        return 'badge badge-warning';
      case 'doctor':
        return 'badge badge-info';
      case 'nurse':
        return 'badge badge-success';
      case 'frontdesk':
        return 'badge badge-primary';
      case 'cashier':
        return 'badge badge-secondary';
      default:
        return 'badge badge-neutral';
    }
  };

  const processedUsers = users.map(user => ({
    ...user,
    roleDisplay: user.role.charAt(0).toUpperCase() + user.role.slice(1)
  }));

  const columns = [
    {
      key: 'id',
      title: 'ID',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'username',
      title: 'Email',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'role',
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
      key: 'department',
      title: 'Department',
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
            onClick={() => {
              setSelectedUser(row);
              setIsEditModalOpen(true);
            }}
            className="btn btn-ghost btn-xs"
          >
            <FaEdit className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this user?')) {
                setUsers(users.filter(u => u.id !== row.id));
              }
            }}
            className="btn btn-ghost btn-xs text-error"
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
              <h1 className="text-2xl font-bold text-base-content 2xl:text-3xl">Manage Users</h1>
              <p className="text-sm text-base-content/60 2xl:text-base">Manage system users and their permissions</p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary"
            >
              <FaPlus className="w-4 h-4 mr-2" />
              Add User
            </button>
          </div>

          {/* Users Table */}
          <div className="flex flex-1 w-full min-h-0">
            <div className="w-full shadow-xl card bg-base-100">
              <div className="p-4 card-body 2xl:p-6">
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md mx-4 shadow-xl card bg-base-100">
            <div className="p-6 card-body">
              <h2 className="mb-4 text-xl font-bold text-base-content">Add New User</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Full Name" className="input input-bordered w-full" />
                <input type="email" placeholder="Email" className="input input-bordered w-full" />
                <select className="select select-bordered w-full">
                  <option>Select Role</option>
                  <option>Super Admin</option>
                  <option>Admin</option>
                  <option>Doctor</option>
                  <option>Nurse</option>
                  <option>Frontdesk</option>
                  <option>Cashier</option>
                </select>
                <input type="text" placeholder="Department" className="input input-bordered w-full" />
                <input type="password" placeholder="Password" className="input input-bordered w-full" />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-primary flex-1"
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md mx-4 shadow-xl card bg-base-100">
            <div className="p-6 card-body">
              <h2 className="mb-4 text-xl font-bold text-base-content">Edit User</h2>
              <div className="space-y-4">
                <input 
                  type="text" 
                  defaultValue={selectedUser.name}
                  className="input input-bordered w-full" 
                />
                <input 
                  type="email" 
                  defaultValue={selectedUser.username}
                  className="input input-bordered w-full" 
                />
                <select className="select select-bordered w-full" defaultValue={selectedUser.role}>
                  <option>Select Role</option>
                  <option>Super Admin</option>
                  <option>Admin</option>
                  <option>Doctor</option>
                  <option>Nurse</option>
                  <option>Frontdesk</option>
                  <option>Cashier</option>
                </select>
                <input 
                  type="text" 
                  defaultValue={selectedUser.department}
                  className="input input-bordered w-full" 
                />
                <input type="password" placeholder="New Password (optional)" className="input input-bordered w-full" />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-primary flex-1"
                >
                  Update User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
