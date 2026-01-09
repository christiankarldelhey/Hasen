import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../../stores/gameStore';

let socket: Socket | null = null;
let listenersInitialized = false;

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
  
  if (!listenersInitialized) {
    initializeGlobalListeners(socket);
    listenersInitialized = true;
  }
  
  return socket;
}

function initializeGlobalListeners(socket: Socket) {
  const gameStore = useGameStore();
  
  // Remove all existing listeners for these events to prevent duplicates
  const events = ['lobby:player-count-changed', 'game:deleted', 'game:event', 'round:phase-changed'];
  events.forEach(event => socket.off(event));
  
  // Evento global para cambios en el contador de jugadores (desde lobby-list room)
  socket.on('lobby:player-count-changed', ({ gameId, currentPlayers }) => {
    console.log(`🔄 Player count changed for ${gameId}: ${currentPlayers}`);
    gameStore.updateGamePlayers(gameId, currentPlayers);
  });
  
  // Evento para cuando un juego es eliminado
  socket.on('game:deleted', ({ gameId }) => {
    console.log(`🗑️ Game ${gameId} deleted`);
    gameStore.games = gameStore.games.filter(g => g.gameId !== gameId);
    
    if (gameStore.currentGameId === gameId) {
      gameStore.clearCurrentGame();
    }
  });
  
  socket.on('game:event', (event) => {
    console.log('🎮 Game event received:', event)
    gameStore.handleGameEvent(event)
  })
  
  socket.on('round:phase-changed', ({ phase }) => {
    console.log('📍 Phase changed to:', phase)
    gameStore.setCurrentPhase(phase)
  })
}