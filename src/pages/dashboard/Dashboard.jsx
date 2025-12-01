import React from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaSignOutAlt, FaHeart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Add logout logic here
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FaHeart className="text-blue-600 text-2xl mr-3" />
              <h1 className="text-xl font-bold text-gray-800">HMS Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FaUser className="text-gray-600" />
                <span className="text-gray-700">Welcome back!</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Welcome to HMS Dashboard
            </h2>
            <p className="text-xl text-gray-600">
              Hospital Management System - Your healthcare management solution
            </p>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Patients', count: '1,234', color: 'from-blue-500 to-blue-600' },
              { title: 'Doctors', count: '56', color: 'from-green-500 to-green-600' },
              { title: 'Appointments', count: '89', color: 'from-purple-500 to-purple-600' },
              { title: 'Departments', count: '12', color: 'from-orange-500 to-orange-600' },
              { title: 'Staff', count: '245', color: 'from-pink-500 to-pink-600' },
              { title: 'Reports', count: '67', color: 'from-indigo-500 to-indigo-600' },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className={`bg-gradient-to-r ${item.color} rounded-lg p-4 mb-4`}>
                  <h3 className="text-white text-lg font-semibold">{item.title}</h3>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-2">{item.count}</div>
                <p className="text-gray-600">Total {item.title.toLowerCase()}</p>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                'Add Patient',
                'Schedule Appointment',
                'View Reports',
                'Manage Staff'
              ].map((action, index) => (
                <button
                  key={action}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  {action}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
