import type { AgentDecisionContext, AgentPolicy, BotAction } from './AgentPolicy.js'
import { compareCards, getEffectiveRank } from '@domain/rules/CardRules'

function scoreAction(action: BotAction): number {
  switch (action.type) {
    case 'finish_trick':
      return 100
    case 'select_card_to_steal':
      return 90
    case 'select_next_lead':
      return 85
    case 'ready_next_round':
      return 80
    case 'skip_replacement':
      return 70
    case 'make_bid':
      return 65
    case 'play_card':
      return 60
    case 'replace_card':
      return 50
    default:
      return 0
  }
}

function getBotHand(context: AgentDecisionContext) {
  return context.game.deck.filter(
    card =>
      card.owner === context.playerId &&
      (card.state === 'in_hand_hidden' || card.state === 'in_hand_visible')
  )
}

function scoreBidAction(action: Extract<BotAction, { type: 'make_bid' }>, context: AgentDecisionContext): number {
  const bid = context.game.round.roundBids.bids.find(candidate => candidate.bid_id === action.bidId)
  if (!bid) return -100

  const hand = getBotHand(context)
  const handPoints = hand.reduce((acc, card) => acc + card.points, 0)
  const suitCounts = hand.reduce<Record<string, number>>((acc, card) => {
    acc[card.suit] = (acc[card.suit] ?? 0) + 1
    return acc
  }, {})
  const highCards = hand.filter(card => card.rank.base >= 11 || (card.rank.onSuit ?? 0) >= 20).length

  if (bid.bid_type === 'points' && 'min_points' in bid.win_condition && 'max_points' in bid.win_condition) {
    const { min_points, max_points } = bid.win_condition
    if (handPoints >= min_points && handPoints <= max_points) {
      return 90 + bid.bid_score / 10
    }

    const distance = Math.min(
      Math.abs(handPoints - min_points),
      Math.abs(handPoints - max_points)
    )
    return 45 - distance
  }

  if (bid.bid_type === 'set_collection' && 'win_suit' in bid.win_condition && 'avoid_suit' in bid.win_condition) {
    const winSuitCount = suitCounts[bid.win_condition.win_suit] ?? 0
    const avoidSuitCount = suitCounts[bid.win_condition.avoid_suit] ?? 0
    return 55 + winSuitCount * 8 - avoidSuitCount * 10
  }

  if (bid.bid_type === 'trick') {
    const estimatedTricks = Math.max(0, Math.min(5, Math.round(highCards / 2)))
    const condition = bid.win_condition
    let score = 50 + highCards * 3

    if ('win_min_tricks' in condition && condition.win_min_tricks !== undefined) {
      score -= Math.abs(estimatedTricks - condition.win_min_tricks) * 8
    }

    if ('win_max_tricks' in condition && condition.win_max_tricks !== undefined) {
      if (estimatedTricks > condition.win_max_tricks) score -= 18
    }

    if ('win_trick_position' in condition && condition.win_trick_position) {
      score += condition.win_trick_position.includes(1) ? Math.max(0, highCards - 1) * 2 : 0
    }

    if ('lose_trick_position' in condition && condition.lose_trick_position) {
      score -= highCards * 2
    }

    return score
  }

  return 40
}

function getActiveTrickBids(context: AgentDecisionContext) {
  const playerBidEntries = context.game.round.roundBids.playerBids[context.playerId] || []
  return playerBidEntries
    .map(entry => context.game.round.roundBids.bids.find(bid => bid.bid_id === entry.bidId))
    .filter((bid): bid is NonNullable<typeof bid> => Boolean(bid && bid.bid_type === 'trick'))
}

function shouldTargetWinningCurrentTrick(context: AgentDecisionContext): boolean {
  const trick = context.game.round.currentTrick
  if (!trick) return false

  const trickBids = getActiveTrickBids(context)
  return trickBids.some(bid => {
    const condition = bid.win_condition
    if ('win_trick_position' in condition && condition.win_trick_position) {
      return condition.win_trick_position.includes(trick.trick_number)
    }
    return false
  })
}

function shouldAvoidWinningCurrentTrick(context: AgentDecisionContext): boolean {
  const trick = context.game.round.currentTrick
  if (!trick) return false

  const trickBids = getActiveTrickBids(context)
  return trickBids.some(bid => {
    const condition = bid.win_condition
    if ('lose_trick_position' in condition && condition.lose_trick_position) {
      return condition.lose_trick_position.includes(trick.trick_number)
    }
    return false
  })
}

function scorePlayCardAction(action: Extract<BotAction, { type: 'play_card' }>, context: AgentDecisionContext): number {
  const trick = context.game.round.currentTrick
  if (!trick) return -100

  const card = context.game.deck.find(candidate => candidate.id === action.cardId)
  if (!card) return -100

  const leadSuit = trick.lead_suit
  const trickNumber = trick.trick_number
  const cardRank = getEffectiveRank(card, leadSuit, trickNumber)
  const cardPoints = card.points

  const currentWinningCard = trick.winning_card
    ? context.game.deck.find(candidate => candidate.id === trick.winning_card)
    : null

  const winsCurrentState = currentWinningCard
    ? compareCards(currentWinningCard, card, trickNumber, leadSuit).id === card.id
    : true

  const wantsToWin = shouldTargetWinningCurrentTrick(context)
  const wantsToLose = shouldAvoidWinningCurrentTrick(context)

  if (wantsToWin) {
    return cardRank * 4 + (winsCurrentState ? 40 : 0) + cardPoints
  }

  if (wantsToLose) {
    return 120 - cardRank * 3 - (winsCurrentState ? 35 : 0) - cardPoints
  }

  return cardRank * 2 + (winsCurrentState ? 12 : 0) + cardPoints * 0.5
}

export class HeuristicAgent implements AgentPolicy {
  async decide(context: AgentDecisionContext): Promise<BotAction | null> {
    if (context.legalActions.length === 0) {
      return null
    }

    const trick = context.game.round.currentTrick

    if (trick?.trick_state === 'in_progress') {
      const bidActions = context.legalActions.filter(
        (action): action is Extract<BotAction, { type: 'make_bid' }> => action.type === 'make_bid'
      )
      if (bidActions.length > 0) {
        const trickNumber = trick.trick_number
        const minBidConfidence = trickNumber === 1 ? 65 : trickNumber === 2 ? 60 : 55
        const scoredBids = bidActions
          .map(action => ({ action, score: scoreBidAction(action, context) }))
          .sort((a, b) => b.score - a.score)

        if ((scoredBids[0]?.score ?? -100) >= minBidConfidence) {
          return scoredBids[0]!.action
        }
      }

      const playCardActions = context.legalActions.filter(
        (action): action is Extract<BotAction, { type: 'play_card' }> => action.type === 'play_card'
      )
      if (playCardActions.length > 0) {
        const scoredPlayCards = playCardActions
          .map(action => ({ action, score: scorePlayCardAction(action, context) }))
          .sort((a, b) => b.score - a.score)

        return scoredPlayCards[0]?.action ?? null
      }
    }

    const prioritized = [...context.legalActions].sort((a, b) => scoreAction(b) - scoreAction(a))
    return prioritized[0] ?? null
  }
}
