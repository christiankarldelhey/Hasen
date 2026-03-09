import type { PlayerId } from '@domain/interfaces'
import type { ConnectionGamePort } from '../ports/ConnectionGamePort.js'
import type { ConnectionRealtimePublisherPort } from '../ports/ConnectionRealtimePublisherPort.js'

interface HandleDisconnectionTimeoutInput {
  gameId: string
  playerId: PlayerId
}

export class HandleDisconnectionTimeoutUseCase {
  constructor(
    private readonly connectionGamePort: ConnectionGamePort,
    private readonly realtimePublisher: ConnectionRealtimePublisherPort
  ) {}

  async execute(input: HandleDisconnectionTimeoutInput): Promise<void> {
    const { timedOutPlayers } = await this.connectionGamePort.checkDisconnectionTimeouts(input.gameId)
    if (!timedOutPlayers.includes(input.playerId)) {
      return
    }

    const result = await this.connectionGamePort.interruptGame(
      input.gameId,
      'player_disconnect_timeout',
      input.playerId
    )

    if (!result.interrupted) {
      return
    }

    this.realtimePublisher.publishGameInterrupted({
      gameId: input.gameId,
      reason: 'player_disconnect_timeout',
      playerId: input.playerId
    })

    const updatedState = await this.connectionGamePort.getPlayerGameState(input.gameId)
    this.realtimePublisher.publishGameStateUpdate(input.gameId, updatedState.publicState)
  }
}
