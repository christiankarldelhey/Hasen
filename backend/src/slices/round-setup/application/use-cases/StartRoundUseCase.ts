import type { RoundSetupPort } from '../ports/RoundSetupPort.js'

interface StartRoundInput {
  gameId: string
}

export class StartRoundUseCase {
  constructor(private readonly roundSetupPort: RoundSetupPort) {}

  async execute(input: StartRoundInput): Promise<{ roundNumber: number; setupEvent: unknown; firstCardsEvent: unknown; privateCards: Map<string, unknown[]> }> {
    const result = await this.roundSetupPort.startNewRound(input.gameId)
    return {
      roundNumber: result.roundNumber,
      setupEvent: result.setupEvent,
      firstCardsEvent: result.firstCardsEvent,
      privateCards: result.privateCards as Map<string, unknown[]>
    }
  }
}
