import { Server } from 'socket.io'
import type { Game, PlayerId } from '@domain/interfaces'
import {
  createTrickStartedEvent,
  createTrickFinishedEvent,
  createNextLeadPlayerSelectedEvent,
  createCardStolenFromTrickEvent
} from '@domain/events/GameEvents.js'
import { GameModel } from '@/models/Game.js'
import { GameService } from '@/services/GameService.js'
import { BidService } from '@/services/BidService.js'
import { TrickService } from '@/services/TrickService.js'
import { RoundService } from '@/services/RoundService.js'
import { emitPrivateCards } from '@/socket/handlers/roundHandlers.helpers.js'
import { HeuristicAgent } from './HeuristicAgent.js'
import type { AgentPolicy, BotAction } from './AgentPolicy.js'
import { getLegalActionsForBot } from './legalActions.js'

const BOT_DELAY_MS = 850
const MAX_CHAINED_BOT_ACTIONS = 10

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isBotPlayer(game: Game, playerId: PlayerId): boolean {
  return game.activePlayers.some(player => player.id === playerId && player.isBot)
}

export function getBotToAct(game: Game): PlayerId | null {
  if (game.round.roundPhase === 'player_drawing' && game.round.playerTurn && isBotPlayer(game, game.round.playerTurn)) {
    return game.round.playerTurn
  }

  const trick = game.round.currentTrick
  if (trick?.trick_state === 'awaiting_special_action' && trick.pendingSpecialAction?.playerId) {
    return isBotPlayer(game, trick.pendingSpecialAction.playerId) ? trick.pendingSpecialAction.playerId : null
  }

  if (trick?.trick_state === 'resolve') {
    const trickWinner = trick.score?.trick_winner
    if (trickWinner && isBotPlayer(game, trickWinner)) {
      return trickWinner
    }
    return null
  }

  if (game.round.roundPhase === 'playing' && game.round.playerTurn && isBotPlayer(game, game.round.playerTurn)) {
    return game.round.playerTurn
  }

  if (game.round.roundPhase === 'scoring') {
    const readyPlayers = game.round.playersReadyForNextRound || []
    const botWaiting = game.activePlayers.find(player => player.isBot && !readyPlayers.includes(player.id))
    return botWaiting?.id ?? null
  }

  return null
}

export class BotTurnCoordinator {
  private static readonly agent: AgentPolicy = new HeuristicAgent()

  static async run(io: Server, gameId: string): Promise<void> {
    for (let step = 0; step < MAX_CHAINED_BOT_ACTIONS; step++) {
      const gameDoc = await GameModel.findOne({ gameId })
      if (!gameDoc || gameDoc.gamePhase !== 'playing' || gameDoc.isPaused) {
        return
      }

      const game = gameDoc.toObject() as Game
      const botPlayerId = getBotToAct(game)
      if (!botPlayerId) {
        return
      }

      const legalActions = getLegalActionsForBot(game, botPlayerId)
      if (legalActions.length === 0) {
        return
      }

      const action = await this.agent.decide({ game, playerId: botPlayerId, legalActions })
      if (!action) {
        return
      }

      console.log(`🤖 Bot ${botPlayerId} action: ${action.type}`)
      await sleep(BOT_DELAY_MS)
      await this.applyAction(io, gameId, botPlayerId, action)
    }
  }

  private static async applyAction(io: Server, gameId: string, playerId: PlayerId, action: BotAction): Promise<void> {
    switch (action.type) {
      case 'skip_replacement': {
        const result = await GameService.skipCardReplacement(gameId, playerId)
        io.to(gameId).emit('game:event', result.event)
        if (result.trickEvent) {
          io.to(gameId).emit('game:event', result.trickEvent)
        }
        return
      }
      case 'replace_card': {
        const result = await GameService.replaceCard(gameId, playerId, action.cardId, action.position)
        io.to(gameId).emit('game:event', result.publicEvent)
        if (result.trickEvent) {
          io.to(gameId).emit('game:event', result.trickEvent)
        }
        return
      }
      case 'make_bid': {
        const currentGame = await GameModel.findOne({ gameId })
        const trickNumber = currentGame?.round.currentTrick?.trick_number
        if (!trickNumber) return

        const { event } = await BidService.makeBid(gameId, playerId, action.bidType, trickNumber, action.bidId)
        io.to(gameId).emit('game:event', event)
        return
      }
      case 'play_card': {
        const { game, event, trickCompletedEvent } = await TrickService.playCard(gameId, playerId, action.cardId)
        io.to(gameId).emit('game:event', event)

        if (trickCompletedEvent) {
          io.to(gameId).emit('game:event', trickCompletedEvent)
        }

        const currentTrick = game.round.currentTrick
        if (currentTrick) {
          const specialCardEvent = TrickService.getSpecialCardEvents(game, currentTrick)
          if (specialCardEvent) {
            io.to(gameId).emit('game:event', specialCardEvent)
          }
        }
        return
      }
      case 'finish_trick': {
        const result = await TrickService.finishTrick(gameId)
        const game = result.game

        if (result.trickCompletedEvent) {
          io.to(gameId).emit('game:event', result.trickCompletedEvent)
        }

        const currentTrickNumber = game.round.currentTrick?.trick_number || null
        const previousTrickNumber = currentTrickNumber ? (currentTrickNumber - 1) as 1 | 2 | 3 | 4 | 5 : 5

        const trickFinishedEvent = createTrickFinishedEvent(previousTrickNumber, currentTrickNumber)
        io.to(gameId).emit('game:event', trickFinishedEvent)

        if (game.round.currentTrick) {
          const trickStartedEvent = createTrickStartedEvent(
            game.round.currentTrick.trick_id,
            game.round.currentTrick.trick_number,
            game.round.currentTrick.lead_player
          )
          io.to(gameId).emit('game:event', trickStartedEvent)
        }

        if (game.round.roundPhase === 'scoring') {
          const { roundEndedEvent, gameEndedEvent } = await RoundService.finishRound(gameId)

          if (gameEndedEvent) {
            io.to(gameId).emit('game:event', gameEndedEvent)
            return
          }

          io.to(gameId).emit('game:event', roundEndedEvent)
        }

        return
      }
      case 'select_next_lead': {
        const { game, trickCompletedEvent } = await TrickService.saveSpecialCardSelection(gameId, playerId, { nextLead: action.selectedLeadPlayer })
        const trickNumber = game.round.currentTrick?.trick_number ?? 1
        const nextLeadSelectedEvent = createNextLeadPlayerSelectedEvent(
          playerId,
          action.selectedLeadPlayer,
          trickNumber
        )
        io.to(gameId).emit('game:event', nextLeadSelectedEvent)
        if (trickCompletedEvent) {
          io.to(gameId).emit('game:event', trickCompletedEvent)
        }
        return
      }
      case 'select_card_to_steal': {
        const { game, trickCompletedEvent } = await TrickService.saveSpecialCardSelection(gameId, playerId, { cardToSteal: action.selectedCardId })
        const trickNumber = game.round.currentTrick?.trick_number ?? 1
        const cardStolenEvent = createCardStolenFromTrickEvent(
          playerId,
          action.selectedCardId,
          trickNumber
        )
        io.to(gameId).emit('game:event', cardStolenEvent)
        if (trickCompletedEvent) {
          io.to(gameId).emit('game:event', trickCompletedEvent)
        }
        return
      }
      case 'ready_next_round': {
        const result = await RoundService.markPlayerReadyForNextRound(gameId, playerId)
        io.to(gameId).emit('game:event', result.statusEvent)

        if (result.allReady && result.setupResult) {
          io.to(gameId).emit('game:event', result.setupResult.setupEvent)
          io.to(gameId).emit('game:event', result.setupResult.firstCardsEvent)
          emitPrivateCards(io, gameId, result.setupResult.privateCards)
        }
        return
      }
      default:
        return
    }
  }
}
