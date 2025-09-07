const { io } = require('socket.io-client');


const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  autoConnect: true
});

socket.on('connect', () => {
  
  // Suscribirse a notificaciones globales
  socket.emit('subscribe_global');
});

socket.on('connected', (data) => {
});

socket.on('subscribed_global', (data) => {
});

socket.on('new_notification', (data) => {
});

socket.on('disconnect', () => {
});

socket.on('error', (error) => {
});

// Mantener el script corriendo
