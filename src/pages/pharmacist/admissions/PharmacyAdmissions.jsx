import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import PharmacistSidebar from '@/components/pharmacist/dashboard/Sidebar';
import api from '@/services/api/apiClient';
import { getAllWards } from '@/services/api/wardAPI';
import { getPatientById } from '@/services/api/patientsAPI';
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
      const [res, wardsRes] = await Promise.allSettled([
        api.get('/admission?status=active'),
        getAllWards(),
      ]);

      const rawWards = wardsRes.status === 'fulfilled' ? (wardsRes.value?.data ?? wardsRes.value ?? []) : [];
      const wardList = Array.isArray(rawWards) ? rawWards : (rawWards?.wards ?? []);
      const wardMap = new Map(wardList.map(w => [String(w._id || w.id), w.name]));

      const rawData = res.status === 'fulfilled' ? (res.value?.data?.data || res.value?.data || []) : [];
      const data = Array.isArray(rawData) ? rawData : [];

      // Filter to only truly admitted patients with an assigned bed
      const activeList = data.filter((a) => {
        const b = String(a.bedNumber || '').trim().replace(/^bed\s*/i, '');
        return a.status !== 'discharged' && !!a.confirmedAt && !!b && !b.toLowerCase().includes('unassigned');
      });

      // Resolve missing parent patients for dependants
      const missingPatientIds = Array.from(new Set(
        activeList
          .filter(a => a.dependantId && (!a.patient?.hospitalId && !a.dependant?.patient?.hospitalId))
          .map(a => a.patientId)
          .filter(Boolean)
      ));
      const patientMap = new Map();
      if (missingPatientIds.length > 0) {
        const fetched = await Promise.allSettled(missingPatientIds.map(id => getPatientById(id)));
        fetched.forEach(r => {
          if (r.status === 'fulfilled') {
            const p = r.value?.data?.data ?? r.value?.data;
            if (p && (p.id || p._id)) patientMap.set(String(p.id || p._id), p);
          }
        });
      }

      const formatted = activeList.map((admission) => {
        const isDep = !!admission.dependantId;
        const source = isDep ? admission.dependant : admission.patient;
        const parentPatient = isDep ? (admission.patient || admission.dependant?.patient || patientMap.get(String(admission.patientId))) : null;
        const parentHospitalId = isDep
          ? (parentPatient?.hospitalId || admission.patient?.hospitalId || admission.dependant?.patient?.hospitalId || patientMap.get(String(admission.patientId))?.hospitalId)
          : (source?.hospitalId || admission.patient?.hospitalId || patientMap.get(String(admission.patientId))?.hospitalId);
        const displayId = parentHospitalId || '—';

        const rawWardKey = String(admission.wardId || admission.ward || '');
        const resolvedWard = wardMap.get(rawWardKey) || admission.wardName || (rawWardKey && !rawWardKey.includes('-') ? rawWardKey : null) || 'General Ward';
        const cleanBed = String(admission.bedNumber || '').trim().replace(/^bed\s*/i, '');

        return {
          ...admission,
          source,
          parentPatient,
          displayId,
          resolvedWard,
          cleanBed,
        };
      });

      setAdmissions(formatted);
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
                              const name = `${a.source?.firstName || ''} ${a.source?.lastName || ''}`.toLowerCase();
                              const hospId = (a.displayId || '').toLowerCase();
                              const ward = (a.resolvedWard || '').toLowerCase();
                              const bed = (a.cleanBed || '').toLowerCase();
                              return name.includes(q) || hospId.includes(q) || ward.includes(q) || bed.includes(q);
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
                                        {admission.source?.firstName} {admission.source?.lastName}
                                      </div>
                                      {admission.parentPatient && (
                                        <div className="text-xs text-base-content/50">
                                          Beneficiary of {admission.parentPatient.firstName} {admission.parentPatient.lastName}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="font-mono text-sm text-base-content/70">
                                    {admission.displayId}
                                  </span>
                                </td>
                                <td>
                                  <div className="text-sm">
                                    <span className="font-medium">{admission.resolvedWard}</span>
                                    <br />
                                    <span className="text-base-content/60 text-xs">
                                      {admission.cleanBed ? `Bed: ${admission.cleanBed}` : 'Bed: N/A'}
                                    </span>
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
