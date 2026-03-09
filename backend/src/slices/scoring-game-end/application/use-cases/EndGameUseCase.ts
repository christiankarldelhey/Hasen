import type { PlayerId } from '@domain/interfaces'
import type { ScoringGamePort } from '../ports/ScoringGamePort.js'

interface EndGameInput {
  gameId: string
  winnerId?: PlayerId
}

interface EndGameOutput {
  responseData: {
    gameId: string
    gamePhase: string
    winnerId: PlayerId | null
    finalScores: import('@domain/interfaces').PlayerScore[]
    activePlayers: Array<{ id: PlayerId; name: string; color: string }>
  }
}

export class EndGameUseCase {
  constructor(private readonly scoringGamePort: ScoringGamePort) {}

  async execute(input: EndGameInput): Promise<EndGameOutput> {
    const { game, winnerId } = await this.scoringGamePort.endGame(input.gameId, input.winnerId)

    return {
      responseData: {
        gameId: game.gameId,
        gamePhase: game.gamePhase,
        winnerId,
        finalScores: game.playerScores,
        activePlayers: game.activePlayers.map(player => ({
          id: player.id,
          name: player.name,
          color: player.color
        }))
      }
    }
  }
}
