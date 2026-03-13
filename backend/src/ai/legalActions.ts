import type { Game, PlayerId, PlayingCard, Trick } from '@domain/interfaces'
import { canPlayCard } from '@domain/rules/CardRules'
import { canSkipCardReplacement, canReplaceCard } from '@domain/rules/CardReplacementRules'
import { canMakeSpecificBid } from '@domain/rules/BidRules'
import type { BotAction } from './AgentPolicy.js'

function getPlayerHand(game: Game, playerId: PlayerId): PlayingCard[] {
  return game.deck.filter(
    (card): card is PlayingCard =>
      card.owner === playerId &&
      (card.state === 'in_hand_visible' || card.state === 'in_hand_hidden')
  )
}

function buildTrickCardOwners(game: Game, trick: Trick): Map<string, PlayerId> {
  const trickCardOwners = new Map<string, PlayerId>()

  for (const trickCardId of trick.cards) {
    const trickCard = game.deck.find(c => c.id === trickCardId)
    if (trickCard?.owner) {
      trickCardOwners.set(trickCardId, trickCard.owner)
    }
  }

  return trickCardOwners
}

function legalDrawingActions(game: Game, playerId: PlayerId): BotAction[] {
  if (game.round.roundPhase !== 'player_drawing' || game.round.playerTurn !== playerId) {
    return []
  }

  const hand = getPlayerHand(game, playerId)
  const remainingDeckCards = game.deck.filter(card => card.state === 'in_deck').length
  const actions: BotAction[] = []

  if (canSkipCardReplacement(playerId, game.round).valid) {
    actions.push({ type: 'skip_replacement' })
  }

  hand.forEach((card, index) => {
    const position = card.position ?? index
    const validation = canReplaceCard(playerId, card.id, hand, game.round, remainingDeckCards)
    if (validation.valid) {
      actions.push({ type: 'replace_card', cardId: card.id, position })
    }
  })

  return actions
}

function legalPlayingActions(game: Game, playerId: PlayerId): BotAction[] {
  const trick = game.round.currentTrick
  if (!trick) return []

  const actions: BotAction[] = []

  if (trick.trick_state === 'awaiting_special_action' && trick.pendingSpecialAction?.playerId === playerId) {
    if (trick.pendingSpecialAction.type === 'PICK_NEXT_LEAD') {
      const activePlayerIds = game.activePlayers.map(player => player.id)
      activePlayerIds.forEach(activePlayerId => {
        actions.push({ type: 'select_next_lead', selectedLeadPlayer: activePlayerId })
      })
      return actions
    }

    if (trick.pendingSpecialAction.type === 'STEAL_CARD') {
      trick.cards.forEach(cardId => {
        actions.push({ type: 'select_card_to_steal', selectedCardId: cardId })
      })
      return actions
    }
  }

  if (trick.trick_state === 'resolve') {
    if (trick.score.trick_winner === playerId) {
      actions.push({ type: 'finish_trick' })
    }
    return actions
  }

  if (trick.trick_state !== 'in_progress' || game.round.playerTurn !== playerId) {
    return actions
  }

  const hand = getPlayerHand(game, playerId)
  const trickCardOwners = buildTrickCardOwners(game, trick)

  hand.forEach(card => {
    const validation = canPlayCard(card, playerId, game.round.playerTurn!, hand, trick, trickCardOwners)
    if (validation.valid) {
      actions.push({ type: 'play_card', cardId: card.id })
    }
  })

  if (trick.trick_number <= 3) {
    const trickNumber = trick.trick_number
    game.round.roundBids.bids.forEach(bid => {
      const validation = canMakeSpecificBid(game, playerId, bid, trickNumber)
      if (validation.canMakeBid) {
        actions.push({
          type: 'make_bid',
          bidType: bid.bid_type,
          bidId: bid.bid_id
        })
      }
    })
  }

  return actions
}

function legalScoringActions(game: Game, playerId: PlayerId): BotAction[] {
  if (game.round.roundPhase !== 'scoring') return []

  const alreadyReady = (game.round.playersReadyForNextRound || []).includes(playerId)
  if (alreadyReady) return []

  return [{ type: 'ready_next_round' }]
}

export function getLegalActionsForBot(game: Game, playerId: PlayerId): BotAction[] {
  return [
    ...legalDrawingActions(game, playerId),
    ...legalPlayingActions(game, playerId),
    ...legalScoringActions(game, playerId)
  ]
}
