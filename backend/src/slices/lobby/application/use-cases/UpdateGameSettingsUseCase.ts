import type { LobbyGameSetupPort } from '../ports/LobbyGameSetupPort.js'
import type { LobbyRealtimePublisherPort } from '../ports/LobbyRealtimePublisherPort.js'

interface UpdateGameSettingsInput {
  gameId: string
  userId: string
  pointsToWin: number
}

interface UpdateGameSettingsOutput {
  responseData: {
    gameId: string
    pointsToWin: number
  }
}

export class UpdateGameSettingsUseCase {
  constructor(
    private readonly gameSetupPort: LobbyGameSetupPort,
    private readonly realtimePublisher: LobbyRealtimePublisherPort
  ) {}

  async execute(input: UpdateGameSettingsInput): Promise<UpdateGameSettingsOutput> {
    if (!input.userId) {
      throw new Error('userId is required')
    }

    if (typeof input.pointsToWin !== 'number') {
      throw new Error('pointsToWin must be a number')
    }

    const assignedPlayerId = await this.gameSetupPort.getAssignedPlayerId(input.gameId, input.userId)
    if (!assignedPlayerId) {
      throw new Error('User is not assigned to this game')
    }

    await this.gameSetupPort.updatePointsToWin(input.gameId, assignedPlayerId, input.pointsToWin)

    const updatedGame = await this.gameSetupPort.findGameById(input.gameId)
    if (!updatedGame) {
      throw new Error('Game not found')
    }

    this.realtimePublisher.publishLobbyRoomCreated({
      gameId: updatedGame.gameId,
      gameName: updatedGame.gameName,
      hostPlayer: updatedGame.hostPlayer,
      activePlayers: updatedGame.activePlayers,
      currentPlayers: updatedGame.activePlayers.length,
      maxPlayers: updatedGame.gameSettings.maxPlayers,
      minPlayers: updatedGame.gameSettings.minPlayers,
      hasSpace: updatedGame.activePlayers.length < updatedGame.gameSettings.maxPlayers,
      pointsToWin: updatedGame.gameSettings.pointsToWin,
      createdAt: updatedGame.createdAt
    })

    return {
      responseData: {
        gameId: updatedGame.gameId,
        pointsToWin: updatedGame.gameSettings.pointsToWin
      }
    }
  }
}
