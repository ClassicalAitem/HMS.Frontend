import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { getAllWards } from '@/services/api/wardAPI';
import { getAdmissions } from '@/services/api/admissionApi';
import { PacStatusBadge } from '@/components/common';
import { FaBed, FaUserInjured, FaCheckCircle, FaUserMd, FaSearch, FaSync, FaShieldAlt } from 'react-icons/fa';

const WardBedBoard = ({ onSelectAdmission, userRole = 'nurse' }) => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const normalizedRole = userRole || (user?.role || '').toLowerCase().trim().replace(/_/g, '-');

  const [wards, setWards] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWardId, setSelectedWardId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [wardsRes, admissionsRes] = await Promise.allSettled([
        getAllWards(),
        getAdmissions(),
      ]);

      const wardsList = wardsRes.status === 'fulfilled' ? (wardsRes.value?.data || wardsRes.value || []) : [];
      const admRaw = admissionsRes.status === 'fulfilled' ? (admissionsRes.value?.data || admissionsRes.value || []) : [];
      const admList = Array.isArray(admRaw) ? admRaw : [];

      setWards(Array.isArray(wardsList) ? wardsList : []);
      // Filter for active (not discharged) admissions with a confirmed bed
      const activeConfirmed = admList.filter(
        (a) => a.status !== 'discharged' && !a.dischargedAt && (a.confirmedAt || a.bedNumber)
      );
      setAdmissions(activeConfirmed);
    } catch (err) {
      console.error('WardBedBoard: Failed to load bed data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => loadData();
    window.addEventListener('fast-refresh-table', handleRefresh);
    return () => window.removeEventListener('fast-refresh-table', handleRefresh);
  }, []);

  const openPatientChart = (admission) => {
    if (onSelectAdmission) {
      onSelectAdmission(admission);
      return;
    }
    const patientId = admission.patientId || admission.patient?.id;
    if (!patientId) return;

    if (normalizedRole === 'doctor') {
      navigate(`/dashboard/doctor/admitted/${patientId}`);
    } else {
      navigate(`/dashboard/nurse/admitted/${patientId}`);
    }
  };

  // Map active admissions by ward and bed number
  const wardBedMap = useMemo(() => {
    const map = {};
    admissions.forEach((adm) => {
      const wId = adm.wardId || (adm.ward?.id ?? 'unassigned');
      if (!map[wId]) map[wId] = {};
      const rawBed = String(adm.bedNumber || '').trim();
      const normBed = rawBed.toLowerCase().replace(/^bed\s*/i, '');
      map[wId][normBed] = adm;
      if (rawBed) map[wId][rawBed] = adm;
    });
    return map;
  }, [admissions]);

  // Overall Occupancy Stats
  const totalCapacity = useMemo(() => {
    return wards.reduce((sum, w) => sum + (Number(w.occupancy) || 0), 0);
  }, [wards]);

  const totalOccupied = admissions.length;
  const totalDischargeReady = useMemo(() => {
    return admissions.filter((a) => a.dischargeReady).length;
  }, [admissions]);

  const filteredWards = useMemo(() => {
    if (selectedWardId === 'all') return wards;
    return wards.filter((w) => w.id === selectedWardId);
  }, [wards, selectedWardId]);

  if (loading) {
    return (
      <div className="card bg-base-100 border border-base-200 p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-base-content/60 font-medium">Loading ward bed board...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Stats & Legend */}
      <div className="bg-base-100 rounded-2xl p-4 sm:p-5 border border-base-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg text-base-content flex items-center gap-2">
            <FaBed className="text-primary w-5 h-5" />
            Ward Bed Floor Map
            <span className="badge badge-primary badge-sm">Live Status</span>
          </h3>
          <p className="text-xs text-base-content/70 mt-0.5">
            Real-time visual map of all hospital beds, occupancy levels, and discharge clearances.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-success/80 border border-success" />
            <span className="text-base-content/80">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-error/80 border border-error" />
            <span className="text-base-content/80">Occupied ({totalOccupied})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-info/80 border border-info" />
            <span className="text-base-content/80">Discharge Ready ({totalDischargeReady})</span>
          </div>
          <button 
            onClick={loadData} 
            className="btn btn-ghost btn-circle btn-xs text-base-content/70"
            title="Refresh bed occupancy"
          >
            <FaSync className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Ward Filter Pills & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedWardId('all')}
            className={`btn btn-sm rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedWardId === 'all'
                ? 'bg-primary text-primary-content shadow-xs'
                : 'btn-ghost text-base-content/70 hover:text-base-content'
            }`}
          >
            All Wards ({totalOccupied}/{totalCapacity})
          </button>
          {wards.map((ward) => {
            const wardAdmissions = admissions.filter((a) => (a.wardId || a.ward?.id) === ward.id);
            return (
              <button
                key={ward.id}
                onClick={() => setSelectedWardId(ward.id)}
                className={`btn btn-sm rounded-lg text-xs font-semibold whitespace-nowrap capitalize transition-all ${
                  selectedWardId === ward.id
                    ? 'bg-primary text-primary-content shadow-xs'
                    : 'btn-ghost text-base-content/70 hover:text-base-content'
                }`}
              >
                {ward.name} ({wardAdmissions.length}/{ward.occupancy || '—'})
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-base-content/40" />
          <input
            type="text"
            placeholder="Search patient or bed..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-sm input-bordered w-full pl-8 text-xs bg-base-100"
          />
        </div>
      </div>

      {/* Ward Cards & Bed Grids */}
      <div className="space-y-6">
        {filteredWards.map((ward) => {
          const capacity = Number(ward.occupancy) || 10;
          const wardAdms = wardBedMap[ward.id] || {};
          const occupiedCount = Object.keys(wardAdms).length;
          const pct = Math.min(100, Math.round((occupiedCount / Math.max(1, capacity)) * 100));

          // Generate bed slots from 1 to capacity
          const bedSlots = Array.from({ length: capacity }, (_, i) => {
            const bedNumStr = String(i + 1);
            const admission = wardAdms[bedNumStr] || wardAdms[`bed ${bedNumStr}`] || wardAdms[`Bed ${bedNumStr}`] || null;
            return {
              bedNumber: `Bed ${bedNumStr}`,
              rawIndex: i + 1,
              admission,
            };
          });

          // Filter by search query if present
          const displayedSlots = bedSlots.filter((slot) => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase().trim();
            if (slot.bedNumber.toLowerCase().includes(q)) return true;
            if (slot.admission) {
              const name = `${slot.admission.patient?.firstName || ''} ${slot.admission.patient?.lastName || ''}`.toLowerCase();
              const hospId = (slot.admission.patient?.hospitalId || '').toLowerCase();
              return name.includes(q) || hospId.includes(q);
            }
            return false;
          });

          return (
            <div key={ward.id} className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-4 sm:p-5 space-y-4">
              {/* Ward Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <FaBed className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-base-content capitalize flex items-center gap-2">
                      {ward.name}
                      {ward.floorLocation && (
                        <span className="text-xs font-normal text-base-content/60">
                          • {ward.floorLocation}
                        </span>
                      )}
                    </h4>
                    <span className="text-xs text-base-content/70">
                      Capacity: {capacity} Beds • {occupiedCount} Occupied • {Math.max(0, capacity - occupiedCount)} Available
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:w-48">
                  <progress 
                    className={`progress w-full ${pct >= 85 ? 'progress-error' : pct >= 60 ? 'progress-warning' : 'progress-primary'}`} 
                    value={pct} 
                    max="100" 
                  />
                  <span className="text-xs font-semibold text-base-content/70 shrink-0">{pct}%</span>
                </div>
              </div>

              {/* Grid of Beds */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {displayedSlots.map((slot) => {
                  const isOccupied = Boolean(slot.admission);
                  const adm = slot.admission;
                  const patient = adm?.patient;
                  const fullName = patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : 'Patient Admitted';
                  const daysAdmitted = adm?.admittedAt
                    ? Math.max(1, Math.ceil((new Date() - new Date(adm.admittedAt)) / (1000 * 60 * 60 * 24)))
                    : 1;

                  return (
                    <div
                      key={slot.bedNumber}
                      onClick={() => isOccupied && openPatientChart(adm)}
                      className={`relative p-3 rounded-xl border transition-all flex flex-col justify-between min-h-[135px] ${
                        isOccupied
                          ? adm?.dischargeReady
                            ? 'bg-info/5 border-info/40 hover:border-info hover:shadow-md cursor-pointer'
                            : 'bg-error/5 border-error/30 hover:border-error hover:shadow-md cursor-pointer'
                          : 'bg-base-200/30 border-dashed border-base-300 hover:border-success/50 hover:bg-success/5'
                      }`}
                    >
                      {/* Bed Top Bar */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="font-bold text-xs text-base-content flex items-center gap-1.5">
                          <FaBed className={`w-3.5 h-3.5 ${isOccupied ? (adm?.dischargeReady ? 'text-info' : 'text-error') : 'text-success/70'}`} />
                          {slot.bedNumber}
                        </span>
                        {isOccupied ? (
                          adm?.dischargeReady ? (
                            <span className="badge badge-info badge-xs text-[10px] text-white">Discharge Ready</span>
                          ) : (
                            <span className="badge badge-error badge-xs text-white">Occupied</span>
                          )
                        ) : (
                          <span className="badge badge-success badge-xs text-white">Available</span>
                        )}
                      </div>

                      {/* Bed Body */}
                      {isOccupied ? (
                        <div className="space-y-1.5 flex-1">
                          <div className="font-semibold text-xs text-base-content line-clamp-1" title={fullName}>
                            {fullName}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-base-content/70">
                            <span>{patient?.hospitalId || 'ID: —'}</span>
                            <span>• Day {daysAdmitted}</span>
                          </div>
                          {adm?.doctorId && (
                            <div className="flex items-center gap-1 text-[10px] text-base-content/60 truncate">
                              <FaUserMd className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{adm.doctorName || 'Attending Doctor'}</span>
                            </div>
                          )}
                          {adm?.pacCode && (
                            <div className="mt-1">
                              <PacStatusBadge admission={adm} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-2 text-base-content/40">
                          <FaCheckCircle className="w-5 h-5 text-success/40 mb-1" />
                          <span className="text-[11px]">Ready for patient</span>
                        </div>
                      )}

                      {/* Bed Footer Action */}
                      {isOccupied && (
                        <div className="pt-2 border-t border-base-200/50 mt-2 flex items-center justify-between text-[11px] text-primary font-medium">
                          <span>View Chart</span>
                          <span>→</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WardBedBoard;

