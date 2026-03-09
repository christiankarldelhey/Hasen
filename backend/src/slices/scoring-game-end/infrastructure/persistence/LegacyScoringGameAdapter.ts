import type { PlayerId } from '@domain/interfaces'
import { GameService } from '@/services/GameService.js'
import type { EndedGameSnapshot, ScoringGamePort } from '../../application/ports/ScoringGamePort.js'

export class LegacyScoringGameAdapter implements ScoringGamePort {
  async endGame(gameId: string, winnerId?: PlayerId): Promise<{ game: EndedGameSnapshot; winnerId: PlayerId | null }> {
    const result = await GameService.endGame(gameId, winnerId)

    return {
      winnerId: result.winnerId,
      game: {
        gameId: result.game.gameId,
        gamePhase: result.game.gamePhase,
        playerScores: result.game.playerScores,
        activePlayers: result.game.activePlayers
      }
    }
  }
}
