import { useSocket } from './useSocket';
import type { GameEvent } from '@domain/events/GameEvents';

export interface RoundStartPayload {
  gameId: string;
}

export interface PhaseChangedPayload {
  phase: string;
}

export function useSocketGame() {
  const socket = useSocket();

  return {
    // Round management
    startRound: (payload: RoundStartPayload) => {
      socket.emit('round:start', payload);
    },

    onPhaseChanged: (callback: (payload: PhaseChangedPayload) => void) => {
      socket.on('round:phase-changed', callback);
    },

    offPhaseChanged: () => {
      socket.off('round:phase-changed');
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

    // Acceso directo al socket si es necesario para casos edge
    raw: socket
  };
}
