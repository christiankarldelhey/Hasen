import { io, Socket } from 'socket.io-client';
import { useLobbyStore } from '../../stores/lobbyStore';
import { useGameStore } from '../../stores/gameStore';

class SocketManager {
  private socket: Socket | null = null;
  private listenersRegistered = false;
  private eventHandlers = new Map<string, Function>();

  getSocket(): Socket {
    if (!this.socket) {
      this.socket = io('http://localhost:3001');
      this.setupConnectionHandlers();
    }
    return this.socket;
  }

  private setupConnectionHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Conectado al servidor');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Desconectado del servidor');
    });
  }

  registerGameListeners() {
    if (this.listenersRegistered) {
      console.log('⚠️ Listeners already registered, skipping...');
      return;
    }
    
    const socket = this.getSocket();
    const lobbyStore = useLobbyStore();
    const gameStore = useGameStore();

    const handlers = {
      'lobby:player-count-changed': ({ gameId, currentPlayers }: any) => {
        console.log(`🔄 Player count changed for ${gameId}: ${currentPlayers}`);
        lobbyStore.updateRoomPlayers(gameId, currentPlayers);
      },
      
      'game:deleted': ({ gameId }: any) => {
        console.log(`🗑️ Game ${gameId} deleted`);
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
    console.log('✅ Socket listeners registered');
  }

  unregisterGameListeners() {
    if (!this.listenersRegistered || !this.socket) return;

    this.eventHandlers.forEach((handler, event) => {
      this.socket!.off(event, handler as any);
    });

    this.eventHandlers.clear();
    this.listenersRegistered = false;
    console.log('🧹 Socket listeners unregistered');
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