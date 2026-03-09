import type { ConnectionGamePort } from '../ports/ConnectionGamePort.js'

interface GetPlayerGameStateInput {
  gameId: string
  userId?: string
}

interface GetPlayerGameStateOutput {
  responseData: {
    publicState: unknown
    privateState?: unknown
  }
}

export class GetPlayerGameStateUseCase {
  constructor(private readonly connectionGamePort: ConnectionGamePort) {}

  async execute(input: GetPlayerGameStateInput): Promise<GetPlayerGameStateOutput> {
    const gameState = await this.connectionGamePort.getPlayerGameState(input.gameId, input.userId)

    return {
      responseData: {
        publicState: gameState.publicState,
        privateState: gameState.privateState
      }
    }
  }
}
