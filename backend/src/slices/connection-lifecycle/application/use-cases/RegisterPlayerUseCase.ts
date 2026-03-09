import type { PlayerId } from '@domain/interfaces'
import type { ConnectionGamePort } from '../ports/ConnectionGamePort.js'

interface RegisterPlayerInput {
  gameId: string
  playerId: PlayerId
  userId: string
}

interface RegisterPlayerOutput {
  shouldResume: boolean
  publicState: unknown
}

export class RegisterPlayerUseCase {
  constructor(private readonly connectionGamePort: ConnectionGamePort) {}

  async execute(input: RegisterPlayerInput): Promise<RegisterPlayerOutput> {
    const reconnectResult = await this.connectionGamePort.markPlayerReconnected(input.gameId, input.playerId)
    const updatedState = await this.connectionGamePort.getPlayerGameState(input.gameId, input.userId)

    return {
      shouldResume: reconnectResult.shouldResume,
      publicState: updatedState.publicState
    }
  }
}
