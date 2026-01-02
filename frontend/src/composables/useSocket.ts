import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket() {
  if (!socket) {
    socket = io('http://localhost:3001');
    
    socket.on('connect', () => {
      console.log('✅ Conectado al servidor');
    });
    
    socket.on('disconnect', () => {
      console.log('❌ Desconectado del servidor');
    });
  }
  
  return socket;
}