import type { PlayerId } from '@domain/interfaces'
import type { LobbyGameSetupPort } from '../ports/LobbyGameSetupPort.js'
import type { LobbyRealtimePublisherPort } from '../ports/LobbyRealtimePublisherPort.js'

interface CreateGameInput {
  gameName?: string
  hostPlayerId?: PlayerId
  userId: string
  maxPlayers?: number
  pointsToWin?: number
  hostName?: string
  hostColor?: string
}

interface CreateGameOutput {
  responseData: {
    gameId: string
    gameName: string
    assignedPlayerId: PlayerId
    activePlayers: import('@domain/interfaces').ActivePlayer[]
    gamePhase: string
    deckSize: number
    bidDecks: {
      setCollection: number
      points: number
      tricks: number
    }
  }
}

export class CreateGameUseCase {
  constructor(
    private readonly gameSetupPort: LobbyGameSetupPort,
    private readonly realtimePublisher: LobbyRealtimePublisherPort
  ) {}

  async execute(input: CreateGameInput): Promise<CreateGameOutput> {
    if (!input.userId) {
      throw new Error('userId is required')
    }

    const resolvedHostPlayerId = (input.hostPlayerId || 'player_1') as PlayerId

    const newGame = await this.gameSetupPort.createGame(
      input.gameName,
      resolvedHostPlayerId,
      input.userId,
      input.maxPlayers,
      input.pointsToWin
    )

    if (input.hostName || input.hostColor) {
      await this.gameSetupPort.updatePlayerProfile(newGame.gameId, resolvedHostPlayerId, {
        name: input.hostName,
        color: input.hostColor
      })
    }

    const createdGame = await this.gameSetupPort.findGameById(newGame.gameId)
    if (!createdGame) {
      throw new Error('Game not found')
    }

    this.realtimePublisher.publishLobbyRoomCreated({
      gameId: createdGame.gameId,
      gameName: createdGame.gameName,
      hostPlayer: createdGame.hostPlayer,
      activePlayers: createdGame.activePlayers,
      currentPlayers: createdGame.activePlayers.length,
      maxPlayers: createdGame.gameSettings.maxPlayers,
      minPlayers: createdGame.gameSettings.minPlayers,
      hasSpace: createdGame.activePlayers.length < createdGame.gameSettings.maxPlayers,
      pointsToWin: createdGame.gameSettings.pointsToWin,
      createdAt: createdGame.createdAt
    })

    return {
      responseData: {
        gameId: createdGame.gameId,
        gameName: createdGame.gameName,
        assignedPlayerId: createdGame.hostPlayer,
        activePlayers: createdGame.activePlayers,
        gamePhase: createdGame.gamePhase,
        deckSize: createdGame.deckSize,
        bidDecks: {
          setCollection: createdGame.bidDecks.setCollectionBidDeck.length,
          points: createdGame.bidDecks.pointsBidDeck.length,
          tricks: createdGame.bidDecks.tricksBidDeck.length
        }
      }
    }
  }
}
