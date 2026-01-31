import type { Game, PlayerId } from '../interfaces'

export interface GameEndResult {
  hasEnded: boolean
  winner: PlayerId | null
}

export function hasGameEnded(game: Game): GameEndResult {
  const pointsToWin = game.gameSettings.pointsToWin
  
  for (const playerScore of game.playerScores) {
    if (playerScore.score >= pointsToWin) {
      return {
        hasEnded: true,
        winner: playerScore.playerId
      }
    }
  }
  
  return {
    hasEnded: false,
    winner: null
  }
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
