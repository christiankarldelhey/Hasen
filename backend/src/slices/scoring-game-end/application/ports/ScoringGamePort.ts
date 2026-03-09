import type { ActivePlayer, PlayerId, PlayerScore } from '@domain/interfaces'

export interface EndedGameSnapshot {
  gameId: string
  gamePhase: string
  playerScores: PlayerScore[]
  activePlayers: ActivePlayer[]
}

export interface ScoringGamePort {
  endGame(gameId: string, winnerId?: PlayerId): Promise<{ game: EndedGameSnapshot; winnerId: PlayerId | null }>
}
