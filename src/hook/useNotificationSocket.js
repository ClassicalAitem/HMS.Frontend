// src/hooks/useNotificationSocket.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { connectSocket, disconnectSocket, getSocket } from '@/services/socket';

export const useNotificationSocket = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [incomingCount, setIncomingCount] = useState(0);
  const listenerAttached = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectSocket();
      listenerAttached.current = false;
      return;
    }

    const role = user.role || user.accountType;
    const userId = user.id || user._id;
    if (!role) return;

    connectSocket({ userId, role });

    const socket = getSocket();
    if (!listenerAttached.current) {
      socket.on('patient:incoming', () => {
        setIncomingCount((c) => c + 1);
      });
      listenerAttached.current = true;
    }

    return () => {
      // don't disconnect on every re-render — only on actual logout (handled above)
    };
  }, [isAuthenticated, user]);

  const resetIncomingCount = useCallback(() => setIncomingCount(0), []);

  return { incomingCount, resetIncomingCount };
};