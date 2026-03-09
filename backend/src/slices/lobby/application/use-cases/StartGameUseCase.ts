import type { PlayerId } from '@domain/interfaces'
import type { LobbyGameSetupPort } from '../ports/LobbyGameSetupPort.js'
import type { LobbyRealtimePublisherPort } from '../ports/LobbyRealtimePublisherPort.js'

interface StartGameInput {
  gameId: string
  hostPlayerId: PlayerId
}

interface StartGameOutput {
  responseData: {
    gameId: string
    gamePhase: string
    activePlayers: import('@domain/interfaces').ActivePlayer[]
    playerTurnOrder: PlayerId[]
  }
}

export class StartGameUseCase {
  constructor(
    private readonly gameSetupPort: LobbyGameSetupPort,
    private readonly realtimePublisher: LobbyRealtimePublisherPort
  ) {}

  async execute(input: StartGameInput): Promise<StartGameOutput> {
    const game = await this.gameSetupPort.findGameById(input.gameId)
    if (!game) {
      throw new Error('Game not found')
    }

    if (game.hostPlayer !== input.hostPlayerId) {
      throw new Error('Only the host can start the game')
    }

    if (game.gamePhase !== 'setup') {
      throw new Error('Game already started or ended')
    }

    if (game.activePlayers.length < game.gameSettings.minPlayers) {
      throw new Error(`Need at least ${game.gameSettings.minPlayers} players to start`)
    }

    const { game: startedGame, event } = await this.gameSetupPort.startGame(input.gameId)

    this.realtimePublisher.publishGameStarted({
      gameId: startedGame.gameId,
      gamePhase: startedGame.gamePhase,
      activePlayers: startedGame.activePlayers.map(player => player.id),
      playerTurnOrder: startedGame.playerTurnOrder
    })

    if (event) {
      this.realtimePublisher.publishGameEvent(input.gameId, event)
    }

    const { setupEvent, firstCardsEvent, privateCards } = await this.gameSetupPort.startNewRound(input.gameId)
    this.realtimePublisher.publishRoundSetup(input.gameId, setupEvent, firstCardsEvent, privateCards)
    await this.realtimePublisher.publishGameStateSync(input.gameId)

    return {
      responseData: {
        gameId: startedGame.gameId,
        gamePhase: startedGame.gamePhase,
        activePlayers: startedGame.activePlayers,
        playerTurnOrder: startedGame.playerTurnOrder
      }
    }
  }
}
