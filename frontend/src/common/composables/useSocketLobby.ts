import { useSocket } from './useSocket';
import { useRouter } from 'vue-router';
import type { PlayerId } from '@domain/interfaces/Player';

export interface LobbyJoinPayload {
  gameId: string;
  playerId: PlayerId;
  userId: string;
}

export interface LobbyLeavePayload {
  gameId: string;
  playerId: PlayerId;
  userId: string;
}

export interface GameDeletedPayload {
  gameId: string;
  message?: string;
}

export interface GameStartedPayload {
  gameId: string;
  gamePhase: string;
  activePlayers: PlayerId[];
}

export function useSocketLobby() {
  const socket = useSocket();
  const router = useRouter();

  return {
    // Lobby list management
    joinLobbyList: () => {
      socket.emit('lobby-list:join');
    },

    leaveLobbyList: () => {
      socket.emit('lobby-list:leave');
    },

    // Game room management
    joinLobby: (payload: LobbyJoinPayload) => {
      socket.emit('lobby:join', payload);
    },

    leaveLobby: (payload: LobbyLeavePayload) => {
      socket.emit('lobby:leave', payload);
    },

    // Game session management (for active game)
    registerPlayer: (payload: LobbyJoinPayload) => {
      socket.emit('game:register-player', payload);
    },

    unregisterPlayer: (payload: LobbyLeavePayload) => {
      socket.emit('game:unregister-player', payload);
    },

    // Game lifecycle
    onGameStarted: (callback: (payload: GameStartedPayload) => void) => {
      socket.on('game:started', (payload: GameStartedPayload) => {
        callback(payload);
      });
    },

    offGameStarted: () => {
      socket.off('game:started');
    },

    onGameDeleted: (callback: (payload: GameDeletedPayload) => void) => {
      socket.on('game:deleted', callback);
    },

    offGameDeleted: () => {
      socket.off('game:deleted');
    },

    deleteGameByHost: (gameId: string) => {
      socket.emit('game:deleted-by-host', { gameId });
    },

    // Navegación integrada
    startGameAndNavigate: (gameId: string) => {
      socket.on('game:started', (_payload: GameStartedPayload) => {
        router.push(`/game/${gameId}`);
      });
    },

    cleanupGameStartedListener: () => {
      socket.off('game:started');
    }
  };
}
