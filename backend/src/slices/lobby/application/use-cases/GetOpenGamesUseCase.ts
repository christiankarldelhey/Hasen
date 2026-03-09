import type { LobbyGameSetupPort } from '../ports/LobbyGameSetupPort.js'

interface GetOpenGamesOutput {
  responseData: {
    gameId: string
    gameName: string
    hostPlayer: string
    activePlayers: import('@domain/interfaces').ActivePlayer[]
    currentPlayers: number
    maxPlayers: number
    minPlayers: number
    hasSpace: boolean
    pointsToWin: number
    createdAt: Date
  }[]
}

export class GetOpenGamesUseCase {
  constructor(private readonly gameSetupPort: LobbyGameSetupPort) {}

  async execute(): Promise<GetOpenGamesOutput> {
    const games = await this.gameSetupPort.listOpenGames()

    return {
      responseData: games.map(game => ({
        gameId: game.gameId,
        gameName: game.gameName,
        hostPlayer: game.hostPlayer,
        activePlayers: game.activePlayers,
        currentPlayers: game.activePlayers.length,
        maxPlayers: game.gameSettings.maxPlayers,
        minPlayers: game.gameSettings.minPlayers,
        hasSpace: game.activePlayers.length < game.gameSettings.maxPlayers,
        pointsToWin: game.gameSettings.pointsToWin,
        createdAt: game.createdAt
      }))
    }
  }
}
