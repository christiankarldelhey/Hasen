import type { Server } from 'socket.io'
import type { ConnectionRealtimePublisherPort } from '../../application/ports/ConnectionRealtimePublisherPort.js'

export class SocketConnectionRealtimePublisher implements ConnectionRealtimePublisherPort {
  constructor(private readonly io: Server) {}

  publishGameInterrupted(payload: {
    gameId: string
    reason: 'player_left_game' | 'player_disconnect_timeout'
    playerId: import('@domain/interfaces').PlayerId
    userId?: string
  }): void {
    this.io.to(payload.gameId).emit('game:interrupted', {
      reason: payload.reason,
      playerId: payload.playerId,
      userId: payload.userId
    })
  }

  publishGameStateUpdate(gameId: string, publicGameState: unknown): void {
    this.io.to(gameId).emit('game:stateUpdate', {
      publicGameState
    })
  }
}
