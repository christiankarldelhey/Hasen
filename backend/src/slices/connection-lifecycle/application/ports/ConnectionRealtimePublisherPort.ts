import type { PlayerId } from '@domain/interfaces'

export interface ConnectionRealtimePublisherPort {
  publishGameInterrupted(payload: {
    gameId: string
    reason: 'player_left_game' | 'player_disconnect_timeout'
    playerId: PlayerId
    userId?: string
  }): void

  publishGameStateUpdate(gameId: string, publicGameState: unknown): void
}
