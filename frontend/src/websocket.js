import io from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

let socket = null;

export const initializeWebSocket = (userId) => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
    if (userId) {
      socket.emit('authenticate', { user_id: userId });
      socket.emit('subscribe_sensors', { user_id: userId });
    }
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  socket.on('connection_established', (data) => {
    console.log('Connection established:', data);
  });

  return socket;
};

export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export default { initializeWebSocket, disconnectWebSocket, getSocket };