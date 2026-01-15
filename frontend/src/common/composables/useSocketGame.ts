import { useSocket } from './useSocket';
import type { GameEvent } from '@domain/events/GameEvents';

export interface RoundStartPayload {
  gameId: string;
}

export function useSocketGame() {
  const socket = useSocket();

  return {
    // Round management
    startRound: (payload: RoundStartPayload) => {
      socket.emit('round:start', payload);
    },

    // Game events
    onGameEvent: (callback: (event: GameEvent) => void) => {
      socket.on('game:event', callback);
    },

    offGameEvent: () => {
      socket.off('game:event');
    },

    // Player actions
    emitPlayerAction: (action: any) => {
      socket.emit('player:action', action);
    },

    // Card replacement
    skipCardReplacement: (gameId: string) => {
      socket.emit('player:skipCardReplacement', { gameId });
    },

    replaceCard: (gameId: string, cardId: string, position: number) => {
      socket.emit('player:replaceCard', { gameId, cardId, position });
    },

    // Play card in trick
    playCard: (gameId: string, cardId: string) => {
      socket.emit('player:playCard', { gameId, cardId });
    },

    // Make bid
    makeBid: (gameId: string, bidType: 'points' | 'set_collection' | 'trick', trickNumber: 1 | 2 | 3 | 4 | 5) => {
      socket.emit('player:makeBid', { gameId, bidType, trickNumber });
    },

    // Finish turn
    finishTurn: (gameId: string) => {
      socket.emit('player:finishTurn', { gameId });
    },

    onGameStateUpdate: (callback: (data: any) => void) => {
      socket.on('game:stateUpdate', callback);
    },

    offGameStateUpdate: () => {
      socket.off('game:stateUpdate');
    },

    onPrivateStateUpdate: (callback: (data: any) => void) => {
      socket.on('game:privateStateUpdate', callback);
    },

    offPrivateStateUpdate: () => {
      socket.off('game:privateStateUpdate');
    },

    // Acceso directo al socket si es necesario para casos edge
    raw: socket
  };
}
