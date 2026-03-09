import type { PlayerId } from '@domain/interfaces'
import type { ConnectionGamePort } from '../ports/ConnectionGamePort.js'

interface HandlePlayerReconnectedInput {
  gameId: string
  playerId: PlayerId
  userId: string
}

interface HandlePlayerReconnectedOutput {
  shouldResume: boolean
  publicState: unknown
  privateState?: unknown
}

export class HandlePlayerReconnectedUseCase {
  constructor(private readonly connectionGamePort: ConnectionGamePort) {}

  async execute(input: HandlePlayerReconnectedInput): Promise<HandlePlayerReconnectedOutput> {
    const reconnectResult = await this.connectionGamePort.markPlayerReconnected(input.gameId, input.playerId)
    const updatedState = await this.connectionGamePort.getPlayerGameState(input.gameId, input.userId)

    return {
      shouldResume: reconnectResult.shouldResume,
      publicState: updatedState.publicState,
      privateState: updatedState.privateState
    }
  }
}
