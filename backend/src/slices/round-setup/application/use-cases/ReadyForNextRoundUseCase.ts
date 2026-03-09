import type { PlayerId } from '@domain/interfaces'
import type { RoundSetupPort } from '../ports/RoundSetupPort.js'

interface ReadyForNextRoundInput {
  gameId: string
  playerId: PlayerId
}

export class ReadyForNextRoundUseCase {
  constructor(private readonly roundSetupPort: RoundSetupPort) {}

  async execute(input: ReadyForNextRoundInput): Promise<{
    roundNumber: number
    readyPlayers: PlayerId[]
    totalPlayers: number
    allPlayersReady: boolean
  }> {
    const result = await this.roundSetupPort.markPlayerReadyForNextRound(input.gameId, input.playerId)
    return {
      roundNumber: result.roundNumber,
      readyPlayers: result.readyPlayers,
      totalPlayers: result.totalPlayers,
      allPlayersReady: result.allPlayersReady
    }
  }
}
