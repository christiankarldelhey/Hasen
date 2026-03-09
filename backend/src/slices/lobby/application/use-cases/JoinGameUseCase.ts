import type { LobbyGameSetupPort } from '../ports/LobbyGameSetupPort.js'
import type { LobbyRealtimePublisherPort } from '../ports/LobbyRealtimePublisherPort.js'

interface JoinGameInput {
  gameId: string
  userId: string
}

interface JoinGameOutput {
  responseData: {
    gameId: string
    assignedPlayerId: string
    activePlayers: import('@domain/interfaces').ActivePlayer[]
    currentPlayers: number
    maxPlayers: number
  }
}

export class JoinGameUseCase {
  constructor(
    private readonly gameSetupPort: LobbyGameSetupPort,
    private readonly realtimePublisher: LobbyRealtimePublisherPort
  ) {}

  async execute(input: JoinGameInput): Promise<JoinGameOutput> {
    if (!input.userId) {
      throw new Error('userId is required')
    }

    const { game, assignedPlayerId } = await this.gameSetupPort.joinGame(input.gameId, input.userId)

    this.realtimePublisher.publishLobbyPlayerCountChanged(input.gameId, game.activePlayers.length)

    return {
      responseData: {
        gameId: game.gameId,
        assignedPlayerId,
        activePlayers: game.activePlayers,
        currentPlayers: game.activePlayers.length,
        maxPlayers: game.gameSettings.maxPlayers
      }
    }
  }
}
