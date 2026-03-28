import React from 'react';
import { useAppSelector } from '../../store/hooks';
import { formatNigeriaTime } from '@/utils/formatDateTimeUtils';

const PatientsDebug = () => {
  const { patients, currentPatient, isLoading, error, lastFetch } = useAppSelector((state) => state.patients);

  return (
    <div className="hidden fixed right-4 bottom-4 z-50 max-w-sm">
      <div className="p-3 text-xs rounded-lg border shadow-lg bg-base-100 border-base-300">
        <div className="mb-2 font-bold text-primary">🔍 Patients Debug</div>
        
        <div className="space-y-1">
          <div><strong>Loading:</strong> {isLoading ? '✅' : '❌'}</div>
          <div><strong>Error:</strong> {error || 'None'}</div>
          <div><strong>Patients Count:</strong> {patients?.length || 0}</div>
          <div><strong>Current Patient:</strong> {currentPatient ? '✅' : '❌'}</div>
          <div><strong>Last Fetch:</strong> {lastFetch ? formatNigeriaTime(lastFetch) : 'Never'}</div>
        </div>

        {patients?.length > 0 && (
          <div className="pt-2 mt-2 border-t border-base-300">
            <div className="font-semibold">Sample Patient:</div>
            <div className="text-xs opacity-75">
              <div>ID: {patients[0]?.id}</div>
              <div>Name: {patients[0]?.firstName} {patients[0]?.lastName}</div>
              <div>Hospital ID: {patients[0]?.hospitalId}</div>
              <div>Status: {patients[0]?.status}</div>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            console.log('🔍 PatientsDebug: Full patients state:', { patients, currentPatient, isLoading, error, lastFetch });
            console.log('🔍 PatientsDebug: Sample patient data:', patients?.[0]);
          }}
          className="mt-2 btn btn-xs btn-primary"
        >
          Log to Console
        </button>
      </div>
    </div>
  );
};

export default PatientsDebug;
