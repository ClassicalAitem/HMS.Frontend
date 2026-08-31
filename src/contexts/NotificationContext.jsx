import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { connectSocket, disconnectSocket, getSocket } from '@/services/socket';
import { getQueueCount } from '@/services/api/notificationAPI';
import { showErrorToast } from '@/utils/errorHandler';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [incomingCount, setIncomingCount] = useState(0);
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
    if (!listenerAttached.current) {
      socket.on('patient:incoming', () => {
        refreshQueueCount(); // re-fetch real count, not a blind increment
      });
      listenerAttached.current = true;
    }
  }, [isAuthenticated, user, refreshQueueCount]);

  return (
    <NotificationContext.Provider value={{ incomingCount, refreshQueueCount }}>
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