import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { connectSocket, disconnectSocket, getSocket } from '@/services/socket';
import { getQueueCount } from '@/services/api/notificationAPI';
import { getPatients } from '@/services/api/patientsAPI';
import { getDependants } from '@/services/api/dependantAPI';
import { showErrorToast } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [incomingCount, setIncomingCount] = useState(0);
  const [labReadyCount, setLabReadyCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const roleRef = useRef(null);

  const refreshQueueCount = useCallback(() => {
    const role = roleRef.current;
    if (!role) return;
    getQueueCount(role)
      .then((res) => setIncomingCount(res?.data?.count ?? 0))
      .catch((err) => showErrorToast(err, 'Unable to refresh the queue count.'));
  }, []);

  const refreshLabReadyCount = useCallback(async () => {
    try {
      const [patientsRes, dependantsRes] = await Promise.allSettled([
        getPatients(),
        getDependants(),
      ]);
      const patients = patientsRes.status === 'fulfilled'
        ? (Array.isArray(patientsRes.value?.data) ? patientsRes.value.data : [])
        : [];
      const dependants = dependantsRes.status === 'fulfilled'
        ? (() => {
            const raw = dependantsRes.value?.data?.data ?? dependantsRes.value?.data ?? [];
            return Array.isArray(raw) ? raw : (raw?.dependants ?? []);
          })()
        : [];
      const readyStatuses = new Set(['lab_completed', 'sonography_completed']);
      const isReady = (status) => (Array.isArray(status) ? status : [status])
        .some((value) => readyStatuses.has(String(value).toLowerCase()));

      setLabReadyCount(
        patients.filter((patient) => isReady(patient?.status)).length +
        dependants.filter((dependant) => isReady(dependant?.status)).length,
      );
    } catch (error) {
      console.error('Failed to refresh lab results count:', error);
    }
  }, []);

  useEffect(() => {
    const role = user?.role || user?.accountType;
    roleRef.current = role || null;

    if (!isAuthenticated || !user || !role) {
      disconnectSocket();
      setIncomingCount(0);
      setLabReadyCount(0);
      return;
    }

    const userId = user.id || user._id;
    connectSocket({ userId, role });

    refreshQueueCount();
    refreshLabReadyCount();

    const socket = getSocket();

    const playChime = () => {
      try {
        const sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
        sound.play().catch((err) => console.error("Audio play failed:", err));
      } catch (error) {
        console.error("Audio initialization failed:", error);
      }
    };

    const handleIncoming = (payload) => {
      setLastUpdate(Date.now());
      refreshQueueCount();

      const name = payload?.subjectName || "Unknown Patient";
      const status = payload?.status || "Unknown Status";

      playChime();

      toast.success(
        <div className="flex flex-col gap-1 w-full">
          <span className="font-bold text-sm border-b border-gray-500 pb-1 mb-1">
            New Incoming {payload?.subjectType === 'dependant' ? 'Dependant' : 'Patient'}
          </span>
          <span className="text-sm"><strong>Name:</strong> {name}</span>
          <span className="text-sm capitalize"><strong>Status:</strong> {status.replace(/_/g, ' ')}</span>
          {(payload?.senderName || payload?.fromRole) && (
            <span className="text-xs italic text-gray-300 mt-1">
              {payload?.senderName || "From: Staff"} {payload?.fromRole ? `(${payload.fromRole})` : ""}
            </span>
          )}
        </div>,
        { duration: 7000 }
      );
    };

    // Fires when a lab or sonography result is ready for doctor/medical-director review
    const handleLabReady = (payload) => {
      setLastUpdate(Date.now());
      refreshLabReadyCount();

      const name = payload?.subjectName || "Unknown Patient";
      const status = payload?.status || "lab_completed";

      playChime();

      toast.success(
        <div className="flex flex-col gap-1 w-full">
          <span className="font-bold text-sm border-b border-gray-500 pb-1 mb-1">
            🧪 Lab Result Ready — {payload?.subjectType === 'dependant' ? 'Dependant' : 'Patient'}
          </span>
          <span className="text-sm"><strong>Name:</strong> {name}</span>
          <span className="text-sm capitalize"><strong>Status:</strong> {status.replace(/_/g, ' ')}</span>
          {(payload?.senderName || payload?.fromRole) && (
            <span className="text-xs italic text-gray-300 mt-1">
              {payload?.senderName || "From: Staff"} {payload?.fromRole ? `(${payload.fromRole})` : ""}
            </span>
          )}
        </div>,
        { duration: 7000 }
      );
    };

    socket.on('patient:incoming', handleIncoming);
    socket.on('patient:labResultReady', handleLabReady);

    return () => {
      socket.off('patient:incoming', handleIncoming);
      socket.off('patient:labResultReady', handleLabReady);
    };
  }, [isAuthenticated, user, refreshLabReadyCount, refreshQueueCount]);

  const clearLabReadyCount = useCallback(() => setLabReadyCount(0), []);

  return (
    <NotificationContext.Provider
      value={{ incomingCount, labReadyCount, refreshQueueCount, refreshLabReadyCount, clearLabReadyCount, lastUpdate }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// This context intentionally exports both its provider and consumer hook.
// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
};