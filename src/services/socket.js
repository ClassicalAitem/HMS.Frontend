// src/services/socket.js
import config from '@/config/env';
import { io } from 'socket.io-client';
// import { config } from '@/'; // adjust path to wherever `config` above lives

// Socket.io connects to the raw server host, not a REST path —
// strip the trailing /api/v1 (or whatever) off API_BASE_URL.
const SOCKET_URL = config.API_BASE_URL.replace(/\/api(\/v\d+)?\/?$/, '');

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const connectSocket = ({ userId, role }) => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  // register (re-)fires on every connect, including reconnects after a drop
  s.off('connect'); // avoid stacking listeners on repeated calls
  s.on('connect', () => {
    s.emit('register', { userId, role });
  });
  // if already connected when this is called, register immediately too
  if (s.connected) {
    s.emit('register', { userId, role });
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};