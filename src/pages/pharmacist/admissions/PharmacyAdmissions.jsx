import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import PharmacistSidebar from '@/components/pharmacist/dashboard/Sidebar';
import api from '@/services/api/apiClient';
import toast from 'react-hot-toast';
import { FaBed, FaUserInjured } from 'react-icons/fa';

const PharmacyAdmissions = () => {
  const navigate = useNavigate();
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarMounted, setSidebarMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const id = requestAnimationFrame(() => setSidebarMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admission?status=active');
      const data = res.data?.data || res.data || [];
      setAdmissions(data);
    } catch (error) {
      console.error('Failed to load admissions:', error);
      toast.error('Failed to load active admissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const SidebarDrawer = () => (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform lg:static lg:translate-x-0 lg:z-auto ${
          sidebarMounted ? 'transition-transform duration-300 ease-in-out' : ''
        } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <PharmacistSidebar onCloseSidebar={() => setIsSidebarOpen(false)} />
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-base-200">
      <SidebarDrawer />
      <div className="flex overflow-hidden flex-col flex-1">
        <Header onToggleSidebar={() => setIsSidebarOpen(true)} />
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
                  <FaBed className="text-primary" /> Active Inpatient Admissions
                </h1>
                <p className="text-base-content/70 text-sm mt-1">
                  View and dispense treatment plans for admitted patients.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center p-12">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center bg-base-100 p-4 rounded-xl border border-base-200 shadow-sm">
                  <input
                    type="text"
                    placeholder="Search by patient name or ID..."
                    className="input input-bordered w-full max-w-md rounded-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {admissions.length === 0 ? (
                  <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-12 text-center">
                    <FaUserInjured className="w-12 h-12 text-base-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-base-content/80">No Active Admissions</h3>
                    <p className="text-sm text-base-content/60 mt-1">There are currently no patients admitted in the wards.</p>
                  </div>
                ) : (
                  <div className="bg-base-100 border border-base-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="table w-full">
                        <thead className="bg-base-200/50">
                          <tr>
                            <th>Patient Name</th>
                            <th>Hospital ID</th>
                            <th>Ward & Bed</th>
                            <th>Date Admitted</th>
                            <th>Status</th>
                            <th className="text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {admissions
                            .filter((a) => {
                              if (!searchQuery) return true;
                              const q = searchQuery.toLowerCase();
                              const name = `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`.toLowerCase();
                              const hospId = (a.patient?.hospitalId || a.patientId || '').toLowerCase();
                              return name.includes(q) || hospId.includes(q);
                            })
                            .map((admission) => (
                              <tr 
                                key={admission._id || admission.id}
                                className="hover:bg-base-200/50 transition-colors cursor-pointer"
                                onClick={() => navigate(`/dashboard/pharmacist/admissions/${admission.patientId}`, { state: { admission } })}
                              >
                                <td>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                      <FaUserInjured />
                                    </div>
                                    <div>
                                      <div className="font-bold text-base-content">
                                        {admission.patient?.firstName} {admission.patient?.lastName}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="font-mono text-sm text-base-content/70">
                                    {admission.patient?.hospitalId || admission.patientId}
                                  </span>
                                </td>
                                <td>
                                  <div className="text-sm">
                                    <span className="font-medium">{admission.ward || admission.wardId || 'General'}</span>
                                    <br />
                                    <span className="text-base-content/60 text-xs">Bed: {admission.bedNumber || 'N/A'}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className="text-sm">{new Date(admission.admittedAt).toLocaleDateString()}</span>
                                </td>
                                <td>
                                  <div className="badge badge-success badge-sm text-white font-medium">Active</div>
                                </td>
                                <td className="text-right">
                                  <button className="btn btn-primary btn-sm rounded-lg">View Plans</button>
                                </td>
                              </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyAdmissions;
