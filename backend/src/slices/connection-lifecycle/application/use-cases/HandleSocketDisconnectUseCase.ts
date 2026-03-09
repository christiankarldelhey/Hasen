import type { PlayerId } from '@domain/interfaces'
import type { ConnectionGamePort } from '../ports/ConnectionGamePort.js'

interface HandleSocketDisconnectInput {
  gameId: string
  playerId: PlayerId
  userId: string
}

type HandleSocketDisconnectOutput =
  | { kind: 'not_found' }
  | { kind: 'setup_left'; currentPlayers: number }
  | { kind: 'playing_disconnected'; shouldPause: boolean; timeoutMs: number; publicState: unknown }

export class HandleSocketDisconnectUseCase {
  constructor(private readonly connectionGamePort: ConnectionGamePort) {}

  async execute(input: HandleSocketDisconnectInput): Promise<HandleSocketDisconnectOutput> {
    const context = await this.connectionGamePort.getGameContext(input.gameId)
    if (!context) {
      return { kind: 'not_found' }
    }

    if (context.gamePhase === 'setup') {
      const result = await this.connectionGamePort.leaveGame(input.gameId, input.playerId, input.userId)
      return { kind: 'setup_left', currentPlayers: result.currentPlayers }
    }

    if (context.gamePhase === 'playing') {
      const result = await this.connectionGamePort.markPlayerDisconnected(input.gameId, input.playerId)
      const updatedState = await this.connectionGamePort.getPlayerGameState(input.gameId)

      return {
        kind: 'playing_disconnected',
        shouldPause: result.shouldPause,
        timeoutMs: context.reconnectionTimeoutMinutes * 60 * 1000,
        publicState: updatedState.publicState
      }
    }

    return { kind: 'not_found' }
  }
}
