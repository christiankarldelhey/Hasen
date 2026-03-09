import type { PlayerId } from '@domain/interfaces'

export interface ConnectionPublicStateSnapshot {
  publicState: unknown
  privateState?: unknown
}

export interface ConnectionGameContextSnapshot {
  gamePhase: 'setup' | 'playing' | 'ended'
  reconnectionTimeoutMinutes: number
}

export interface ConnectionGamePort {
  getGameContext(gameId: string): Promise<ConnectionGameContextSnapshot | null>

  leaveGame(gameId: string, playerId: PlayerId, userId: string): Promise<{ currentPlayers: number }>

  markPlayerDisconnected(gameId: string, playerId: PlayerId): Promise<{ shouldPause: boolean }>

  markPlayerReconnected(gameId: string, playerId: PlayerId): Promise<{ shouldResume: boolean }>

  checkDisconnectionTimeouts(gameId: string): Promise<{ timedOutPlayers: PlayerId[] }>

  interruptGame(
    gameId: string,
    reason: 'player_left_game' | 'player_disconnect_timeout',
    affectedPlayerId: PlayerId
  ): Promise<{ interrupted: boolean }>

  getPlayerGameState(gameId: string, userId?: string): Promise<ConnectionPublicStateSnapshot>
}
