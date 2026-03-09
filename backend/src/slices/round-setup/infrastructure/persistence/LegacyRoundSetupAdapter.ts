import type { PlayerId } from '@domain/interfaces'
import { GameModel } from '@/models/Game.js'
import { RoundService } from '@/services/RoundService.js'
import type { ReadyForNextRoundSnapshot, RoundSetupPort, RoundStartSnapshot } from '../../application/ports/RoundSetupPort.js'

export class LegacyRoundSetupAdapter implements RoundSetupPort {
  async startNewRound(gameId: string): Promise<RoundStartSnapshot> {
    const result = await RoundService.startNewRound(gameId)
    return {
      roundNumber: result.game.round.round,
      setupEvent: result.setupEvent,
      firstCardsEvent: result.firstCardsEvent,
      privateCards: result.privateCards as Map<PlayerId, unknown[]>
    }
  }

  async markPlayerReadyForNextRound(gameId: string, playerId: PlayerId): Promise<ReadyForNextRoundSnapshot> {
    const game = await GameModel.findOne({ gameId })
    if (!game) {
      throw new Error('Game not found')
    }

    if (!game.round.playersReadyForNextRound) {
      game.round.playersReadyForNextRound = []
    }

    if (!game.round.playersReadyForNextRound.includes(playerId)) {
      game.round.playersReadyForNextRound.push(playerId)
      await game.save()
    }

    return {
      roundNumber: game.round.round,
      readyPlayers: game.round.playersReadyForNextRound as PlayerId[],
      totalPlayers: game.activePlayers.length,
      allPlayersReady: game.round.playersReadyForNextRound.length === game.activePlayers.length
    }
  }
}
