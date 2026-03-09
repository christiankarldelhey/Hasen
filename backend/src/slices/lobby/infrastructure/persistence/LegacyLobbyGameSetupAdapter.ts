import type { PlayerId } from '@domain/interfaces'
import { GameModel } from '@/models/Game.js'
import { GameService } from '@/services/GameService.js'
import { RoundService } from '@/services/RoundService.js'
import type {
  LobbyGameSetupPort,
  LobbyGameSnapshot,
  LobbyOpenGameSnapshot
} from '../../application/ports/LobbyGameSetupPort.js'

export class LegacyLobbyGameSetupAdapter implements LobbyGameSetupPort {
  async createGame(
    gameName: string | undefined,
    hostPlayerId: PlayerId,
    userId: string,
    maxPlayers?: number,
    pointsToWin?: number
  ): Promise<{ gameId: string }> {
    const newGame = await GameService.createGame(gameName, hostPlayerId, userId, maxPlayers, pointsToWin)

    return { gameId: newGame.gameId }
  }

  async updatePlayerProfile(
    gameId: string,
    playerId: PlayerId,
    updates: { name?: string; color?: string }
  ): Promise<void> {
    await GameService.updatePlayerProfile(gameId, playerId, updates)
  }

  async updatePointsToWin(gameId: string, hostPlayerId: PlayerId, pointsToWin: number): Promise<void> {
    await GameService.updatePointsToWin(gameId, hostPlayerId, pointsToWin)
  }

  async getAssignedPlayerId(gameId: string, userId: string): Promise<PlayerId | null> {
    const game = await GameModel.findOne({ gameId }).select('playerSessions')
    if (!game) {
      return null
    }

    return (game.playerSessions?.get(userId) || null) as PlayerId | null
  }

  async findGameById(gameId: string): Promise<LobbyGameSnapshot | null> {
    const game = await GameModel.findOne({ gameId })
    if (!game) {
      return null
    }

    return {
      gameId: game.gameId,
      gameName: game.gameName,
      hostPlayer: game.hostPlayer,
      activePlayers: game.activePlayers,
      gamePhase: game.gamePhase,
      deckSize: game.deck.length,
      bidDecks: {
        setCollectionBidDeck: game.bidDecks.setCollectionBidDeck,
        pointsBidDeck: game.bidDecks.pointsBidDeck,
        tricksBidDeck: game.bidDecks.tricksBidDeck
      },
      gameSettings: {
        minPlayers: game.gameSettings.minPlayers,
        maxPlayers: game.gameSettings.maxPlayers,
        pointsToWin: game.gameSettings.pointsToWin
      },
      createdAt: game.createdAt
    }
  }

  async listOpenGames(): Promise<LobbyOpenGameSnapshot[]> {
    const games = await GameModel.find({ gamePhase: 'setup' })
      .select('gameId gameName hostPlayer activePlayers gameSettings.maxPlayers gameSettings.minPlayers gameSettings.pointsToWin createdAt')
      .sort({ createdAt: -1 })
      .lean()

    return games.map(game => ({
      gameId: game.gameId,
      gameName: game.gameName,
      hostPlayer: game.hostPlayer,
      activePlayers: game.activePlayers,
      gameSettings: {
        minPlayers: game.gameSettings.minPlayers,
        maxPlayers: game.gameSettings.maxPlayers,
        pointsToWin: game.gameSettings.pointsToWin
      },
      createdAt: game.createdAt
    }))
  }

  async joinGame(gameId: string, userId: string): Promise<{ game: { gameId: string; activePlayers: import('@domain/interfaces').ActivePlayer[]; gameSettings: { minPlayers: number; maxPlayers: number; pointsToWin: number } }; assignedPlayerId: PlayerId }> {
    const { game, assignedPlayerId } = await GameService.joinGame(gameId, userId)

    if (!assignedPlayerId) {
      throw new Error('No player could be assigned to this game')
    }

    return {
      assignedPlayerId,
      game: {
        gameId: game.gameId,
        activePlayers: game.activePlayers,
        gameSettings: {
          minPlayers: game.gameSettings.minPlayers,
          maxPlayers: game.gameSettings.maxPlayers,
          pointsToWin: game.gameSettings.pointsToWin
        }
      }
    }
  }

  async leaveGame(gameId: string, playerId: PlayerId, userId: string): Promise<{ currentPlayers: number }> {
    const result = await GameService.leaveGame(gameId, playerId, userId)
    return { currentPlayers: result.game?.activePlayers.length || 0 }
  }

  async deleteGame(gameId: string): Promise<void> {
    await GameService.deleteGame(gameId)
  }

  async startGame(gameId: string): Promise<{ game: { gameId: string; gamePhase: string; activePlayers: import('@domain/interfaces').ActivePlayer[]; playerTurnOrder: PlayerId[] }; event: unknown }> {
    const { game, event } = await GameService.startGame(gameId)

    return {
      game: {
        gameId: game.gameId,
        gamePhase: game.gamePhase,
        activePlayers: game.activePlayers,
        playerTurnOrder: game.playerTurnOrder
      },
      event
    }
  }

  async startNewRound(gameId: string): Promise<{ setupEvent: unknown; firstCardsEvent: unknown; privateCards: Map<PlayerId, unknown[]> }> {
    const { setupEvent, firstCardsEvent, privateCards } = await RoundService.startNewRound(gameId)

    return {
      setupEvent,
      firstCardsEvent,
      privateCards: privateCards as Map<PlayerId, unknown[]>
    }
  }
}
