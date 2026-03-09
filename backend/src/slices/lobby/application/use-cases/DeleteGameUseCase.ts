import type { PlayerId } from '@domain/interfaces'
import type { LobbyGameSetupPort } from '../ports/LobbyGameSetupPort.js'

interface DeleteGameInput {
  gameId: string
  hostPlayerId: PlayerId
}

interface DeleteGameOutput {
  message: string
}

export class DeleteGameUseCase {
  constructor(private readonly gameSetupPort: LobbyGameSetupPort) {}

  async execute(input: DeleteGameInput): Promise<DeleteGameOutput> {
    const game = await this.gameSetupPort.findGameById(input.gameId)
    if (!game) {
      throw new Error('Game not found')
    }

    if (game.hostPlayer !== input.hostPlayerId) {
      throw new Error('Only the host can delete the game')
    }

    await this.gameSetupPort.deleteGame(input.gameId)

    return { message: 'Game deleted successfully' }
  }
}
