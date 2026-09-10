import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { connectSocket, disconnectSocket, getSocket } from '@/services/socket';
import { getQueueCount } from '@/services/api/notificationAPI';
import { showErrorToast } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [incomingCount, setIncomingCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const listenerAttached = useRef(false);
  const roleRef = useRef(null);

  const refreshQueueCount = useCallback(() => {
    const role = roleRef.current;
    if (!role) return;
    getQueueCount(role)
      .then((res) => setIncomingCount(res?.data?.count ?? 0))
      .catch((err) => showErrorToast(err, 'Unable to refresh the queue count.'));
  }, []);

  useEffect(() => {
    const role = user?.role || user?.accountType;
    roleRef.current = role || null;

    if (!isAuthenticated || !user || !role) {
      disconnectSocket();
      listenerAttached.current = false;
      setIncomingCount(0);
      return;
    }

    const userId = user.id || user._id;
    connectSocket({ userId, role });

    refreshQueueCount();

    const socket = getSocket();
    
    const handleIncoming = (payload) => {
      console.log("Socket received patient:incoming", payload);
      setLastUpdate(Date.now());
      refreshQueueCount(); // re-fetch real count, not a blind increment
      
      const name = payload?.subjectName || "Unknown Patient";
      const status = payload?.status || "Unknown Status";

      try {
        const sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
        sound.play().catch(err => console.error("Audio play failed:", err));
      } catch(e) {}
      
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
        {
          duration: 7000,
        }
      );
    };

    socket.on('patient:incoming', handleIncoming);

    return () => {
      socket.off('patient:incoming', handleIncoming);
    };
  }, [isAuthenticated, user, refreshQueueCount]);

  return (
    <NotificationContext.Provider value={{ incomingCount, refreshQueueCount, lastUpdate }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
};