import type { PlayerId } from '@domain/interfaces'
import type { ConnectionGamePort } from '../ports/ConnectionGamePort.js'
import type { ConnectionRealtimePublisherPort } from '../ports/ConnectionRealtimePublisherPort.js'

interface LeaveMatchInput {
  gameId: string
  playerId: PlayerId
  userId: string
}

export class LeaveMatchUseCase {
  constructor(
    private readonly connectionGamePort: ConnectionGamePort,
    private readonly realtimePublisher: ConnectionRealtimePublisherPort
  ) {}

  async execute(input: LeaveMatchInput): Promise<void> {
    const result = await this.connectionGamePort.interruptGame(
      input.gameId,
      'player_left_game',
      input.playerId
    )

    if (!result.interrupted) {
      return
    }

    this.realtimePublisher.publishGameInterrupted({
      gameId: input.gameId,
      reason: 'player_left_game',
      playerId: input.playerId,
      userId: input.userId
    })

    const updatedState = await this.connectionGamePort.getPlayerGameState(input.gameId)

    this.realtimePublisher.publishGameStateUpdate(input.gameId, updatedState.publicState)
  }
}
