import type { Game, PlayerId } from '../interfaces'

export interface GameEndResult {
  hasEnded: boolean
  winner: PlayerId | null
}

export const GAME_END_MAX_SCORE = 100
export const GAME_END_MIN_SCORE = -85

export function hasGameEnded(game: Game): GameEndResult {
  if (game.playerScores.length === 0) {
    return { hasEnded: false, winner: null }
  }

  const ended = game.playerScores.some(
    ps => ps.score >= GAME_END_MAX_SCORE || ps.score <= GAME_END_MIN_SCORE
  )
  if (!ended) {
    return { hasEnded: false, winner: null }
  }

  // Gana el mayor puntaje; en empate, el más cercano al mano
  // (playerTurnOrder[0] es el mano de la ronda que terminó)
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
