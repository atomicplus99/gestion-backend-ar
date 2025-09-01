const { io } = require('socket.io-client');

console.log('🔌 Conectando al WebSocket...');

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  autoConnect: true
});

socket.on('connect', () => {
  console.log('✅ Conectado al WebSocket:', socket.id);
  
  // Suscribirse a notificaciones globales
  socket.emit('subscribe_global');
  console.log('📢 Suscrito a notificaciones globales');
});

socket.on('connected', (data) => {
  console.log('🎉 Mensaje de bienvenida:', data);
});

socket.on('subscribed_global', (data) => {
  console.log('🌐 Suscrito a notificaciones globales:', data);
});

socket.on('new_notification', (data) => {
  console.log('🔔 NUEVA NOTIFICACIÓN:', data);
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado del WebSocket');
});

socket.on('error', (error) => {
  console.error('❌ Error:', error);
});

// Mantener el script corriendo
console.log('⏰ Script corriendo... Presiona Ctrl+C para salir');
