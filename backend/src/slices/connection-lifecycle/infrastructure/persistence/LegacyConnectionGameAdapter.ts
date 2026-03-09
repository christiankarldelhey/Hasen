import type { PlayerId } from '@domain/interfaces'
import { GameModel } from '@/models/Game.js'
import { GameService } from '@/services/GameService.js'
import type {
  ConnectionGamePort,
  ConnectionGameContextSnapshot,
  ConnectionPublicStateSnapshot
} from '../../application/ports/ConnectionGamePort.js'

export class LegacyConnectionGameAdapter implements ConnectionGamePort {
  async getGameContext(gameId: string): Promise<ConnectionGameContextSnapshot | null> {
    const game = await GameModel.findOne({ gameId }).select('gamePhase gameSettings.reconnectionTimeoutMinutes')
    if (!game) {
      return null
    }

    return {
      gamePhase: game.gamePhase,
      reconnectionTimeoutMinutes: game.gameSettings.reconnectionTimeoutMinutes
    }
  }

  async leaveGame(gameId: string, playerId: PlayerId, userId: string): Promise<{ currentPlayers: number }> {
    const result = await GameService.leaveGame(gameId, playerId, userId)
    return { currentPlayers: result.game?.activePlayers.length || 0 }
  }

  async markPlayerDisconnected(gameId: string, playerId: PlayerId): Promise<{ shouldPause: boolean }> {
    const result = await GameService.markPlayerDisconnected(gameId, playerId)
    return { shouldPause: result.shouldPause }
  }

  async markPlayerReconnected(gameId: string, playerId: PlayerId): Promise<{ shouldResume: boolean }> {
    const result = await GameService.markPlayerReconnected(gameId, playerId)
    return { shouldResume: result.shouldResume }
  }

  async checkDisconnectionTimeouts(gameId: string): Promise<{ timedOutPlayers: PlayerId[] }> {
    return GameService.checkDisconnectionTimeouts(gameId)
  }

  async interruptGame(
    gameId: string,
    reason: 'player_left_game' | 'player_disconnect_timeout',
    affectedPlayerId: PlayerId
  ): Promise<{ interrupted: boolean }> {
    const result = await GameService.interruptGame(gameId, reason, affectedPlayerId)
    return { interrupted: result.interrupted }
  }

  async getPlayerGameState(gameId: string, userId?: string): Promise<ConnectionPublicStateSnapshot> {
    const updatedState = await GameService.getPlayerGameState(gameId, userId)
    return {
      publicState: updatedState.publicState,
      privateState: updatedState.privateState || undefined
    }
  }
}
