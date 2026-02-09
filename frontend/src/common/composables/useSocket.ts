import { io, Socket } from 'socket.io-client';
import { useLobbyStore } from '../../stores/lobbyStore';
import { useGameStore } from '../../stores/gameStore';

class SocketManager {
  private socket: Socket | null = null;
  private listenersRegistered = false;
  private eventHandlers = new Map<string, Function>();

  getSocket(): Socket {
    if (!this.socket) {
      const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
      this.socket = io(SOCKET_URL);
      this.setupConnectionHandlers();
    }
    return this.socket;
  }

  private setupConnectionHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });
  }

  registerGameListeners() {
    if (this.listenersRegistered) {
      return;
    }
    
    const socket = this.getSocket();
    const lobbyStore = useLobbyStore();
    const gameStore = useGameStore();

    const handlers = {
      'lobby:player-count-changed': ({ gameId, currentPlayers }: any) => {
        lobbyStore.updateRoomPlayers(gameId, currentPlayers);
      },
      
      'game:deleted': ({ gameId }: any) => {
        console.log(`🗑️ GAME_DELETED: ${gameId}`);
        lobbyStore.setRooms(lobbyStore.rooms.filter(r => r.gameId !== gameId));
        if (lobbyStore.currentRoomId === gameId) {
          lobbyStore.clearCurrentRoom();
        }
      },
      
      'game:event': (event: any) => {
        gameStore.handleGameEvent(event);
      }
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      this.eventHandlers.set(event, handler);
      socket.on(event, handler as any);
    });

    this.listenersRegistered = true;
  }

  unregisterGameListeners() {
    if (!this.listenersRegistered || !this.socket) return;

    this.eventHandlers.forEach((handler, event) => {
      this.socket!.off(event, handler as any);
    });

    this.eventHandlers.clear();
    this.listenersRegistered = false;
  }

  disconnect() {
    this.unregisterGameListeners();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

const socketManager = new SocketManager();

export function useSocket() {
  return socketManager.getSocket();
}

export function initializeSocketListeners() {
  socketManager.registerGameListeners();
}

export function cleanupSocketListeners() {
  socketManager.unregisterGameListeners();
}