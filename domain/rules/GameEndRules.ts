import type { Game, PlayerId } from '../interfaces'
import { canDrawBidPool } from './BidDeckRules'

export interface GameEndResult {
  hasEnded: boolean
  winner: PlayerId | null
}

/**
 * La partida termina cuando los mazos de apuestas ya no alcanzan para repartir
 * un pool completo. Gana el mayor puntaje; en empate, el jugador más cercano al
 * mano de la última ronda.
 */
export function hasGameEnded(game: Game): GameEndResult {
  if (game.playerScores.length === 0 || canDrawBidPool(game.bidDecks)) {
    return { hasEnded: false, winner: null }
  }

  const topScore = Math.max(...game.playerScores.map(ps => ps.score))
  const tied = new Set(
    game.playerScores.filter(ps => ps.score === topScore).map(ps => ps.playerId)
  )
  const winner =
    game.playerTurnOrder.find(id => tied.has(id)) ??
    game.playerScores.find(ps => ps.score === topScore)!.playerId

  return { hasEnded: true, winner }
}

export function getWinnerName(winnerId: PlayerId): string {
  const nameMap: Record<PlayerId, string> = {
    'player_1': 'Lenz',
    'player_2': 'Anna',
    'player_3': 'Hans',
    'player_4': 'Magda'
  }

  return nameMap[winnerId]
}
