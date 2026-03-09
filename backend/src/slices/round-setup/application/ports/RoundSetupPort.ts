import type { PlayerId } from '@domain/interfaces'

export interface RoundStartSnapshot {
  roundNumber: number
  setupEvent: unknown
  firstCardsEvent: unknown
  privateCards: Map<PlayerId, unknown[]>
}

export interface ReadyForNextRoundSnapshot {
  roundNumber: number
  readyPlayers: PlayerId[]
  totalPlayers: number
  allPlayersReady: boolean
}

export interface RoundSetupPort {
  startNewRound(gameId: string): Promise<RoundStartSnapshot>
  markPlayerReadyForNextRound(gameId: string, playerId: PlayerId): Promise<ReadyForNextRoundSnapshot>
}
