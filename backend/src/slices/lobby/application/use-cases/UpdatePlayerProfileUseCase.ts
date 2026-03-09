import type { PlayerId } from '@domain/interfaces'
import type { LobbyGameSetupPort } from '../ports/LobbyGameSetupPort.js'
import type { LobbyRealtimePublisherPort } from '../ports/LobbyRealtimePublisherPort.js'

interface UpdatePlayerProfileInput {
  gameId: string
  playerId: PlayerId
  userId: string
  name?: string
  color?: string
}

interface UpdatePlayerProfileOutput {
  responseData: {
    gameId: string
    updatedPlayer: import('@domain/interfaces').ActivePlayer
    activePlayers: import('@domain/interfaces').ActivePlayer[]
  }
}

export class UpdatePlayerProfileUseCase {
  constructor(
    private readonly gameSetupPort: LobbyGameSetupPort,
    private readonly realtimePublisher: LobbyRealtimePublisherPort
  ) {}

  async execute(input: UpdatePlayerProfileInput): Promise<UpdatePlayerProfileOutput> {
    if (!input.userId) {
      throw new Error('userId is required')
    }

    const assignedPlayerId = await this.gameSetupPort.getAssignedPlayerId(input.gameId, input.userId)
    if (assignedPlayerId !== input.playerId) {
      throw new Error('Cannot update another player profile')
    }

    await this.gameSetupPort.updatePlayerProfile(input.gameId, input.playerId, {
      name: input.name,
      color: input.color
    })

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

    const updatedPlayer = updatedGame.activePlayers.find(player => player.id === input.playerId)
    if (!updatedPlayer) {
      throw new Error('Player is not in this game')
    }

    return {
      responseData: {
        gameId: input.gameId,
        updatedPlayer,
        activePlayers: updatedGame.activePlayers
      }
    }
  }
}
