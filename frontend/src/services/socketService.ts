import { io, Socket } from 'socket.io-client';
import { ref } from 'vue';

class SocketService {
  private socket: Socket | null = null;
  public connected = ref(false);

  connect() {
    if (this.socket?.connected) return;

    this.socket = io('http://localhost:3000', {
      transports: ['websocket'],
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.connected.value = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected.value = false;
    });

    // Escuchar eventos de game
    this.socket.on('game:event', (event) => {
      console.log('Game event received:', event);
      this.handleGameEvent(event);
    });

    this.socket.on('game:host-left', ({ gameId }) => {
    console.log('🚪 Host left game:', gameId);
    window.dispatchEvent(new CustomEvent('game-host-left', { detail: { gameId } }));
  });
  }


  private handleGameEvent(event: any) {
    switch (event.type) {
      case 'DECK_SHUFFLED':
        console.log(`🃏 Deck shuffled! Round ${event.payload.round}, ${event.payload.deckSize} cards`);
        // Emitir evento Vue o actualizar store
        window.dispatchEvent(new CustomEvent('deck-shuffled', { detail: event.payload }));
        break;
      
      default:
        console.log('Unknown event type:', event.type);
    }
  }

  joinGameRoom(gameId: string) {
    if (this.socket) {
      this.socket.emit('join-game', gameId);
      console.log('🎮 Joining game room:', gameId);
    }
  }

}

export const socketService = new SocketService();