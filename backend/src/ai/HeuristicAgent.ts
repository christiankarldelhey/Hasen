import type { AgentDecisionContext, AgentPolicy, BotAction } from './AgentPolicy.js'
import type { Bid, PointsBidCondition, SetCollectionBidCondition, TrickBidCondition } from '@domain/interfaces/Bid'
import type { PlayingCard, Suit } from '@domain/interfaces/Card'
import { TOTAL_TRICKS } from '@domain/interfaces/Trick'
import { compareCards, getEffectiveRank } from '@domain/rules/CardRules'
import { getCollectionNetScore } from '@domain/rules/BidRules'
import { POINTS_BID_OPEN_MAX } from '@domain/data/bidDefinitions'

const SUITS: Suit[] = ['acorns', 'leaves', 'berries', 'flowers']

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
      return 55
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

function getBotHand(context: AgentDecisionContext): PlayingCard[] {
  return context.game.deck.filter(
    card =>
      card.owner === context.playerId &&
      (card.state === 'in_hand_hidden' || card.state === 'in_hand_visible')
  )
}

function getBotRoundScore(context: AgentDecisionContext) {
  return context.game.round.roundScore.find(score => score.playerId === context.playerId)
}

function getActiveBidEntries(context: AgentDecisionContext) {
  const playerBidEntries = context.game.round.roundBids.playerBids[context.playerId] || []
  return playerBidEntries
    .map(entry => ({
      entry,
      bid: context.game.round.roundBids.bids.find(bid => bid.bid_id === entry.bidId)
    }))
    .filter((candidate): candidate is { entry: typeof candidate.entry; bid: Bid } => Boolean(candidate.bid))
}

function estimateExpectedTricks(context: AgentDecisionContext): number {
  const hand = getBotHand(context)
  const flowers = hand.filter(card => card.suit === 'flowers').length
  const majorColors = hand.filter(card => (card.rank.onSuit ?? 0) >= 20).length
  const highCards = hand.filter(card => card.suit !== 'flowers' && (card.rank.base >= 11 || card.rank.base === 0)).length

  return Math.max(0, Math.min(TOTAL_TRICKS, flowers * 0.9 + majorColors * 0.35 + highCards * 0.45))
}

function scorePointsBid(bid: Bid, context: AgentDecisionContext): number {
  const condition = bid.win_condition as PointsBidCondition
  const roundScore = getBotRoundScore(context)
  const currentPoints = roundScore?.points ?? 0
  const expectedTricks = estimateExpectedTricks(context)
  const handPoints = getBotHand(context).reduce((total, card) => total + card.points, 0)
  const projectedPoints = currentPoints + expectedTricks * 6 + handPoints * 0.35

  if (condition.max_points >= POINTS_BID_OPEN_MAX) {
    const margin = projectedPoints - condition.min_points
    return margin < -2 ? 25 + margin * 4 : 55 + Math.min(35, margin * 4) + bid.bid_score / 12
  }

  const rangeCenter = (condition.min_points + condition.max_points) / 2
  const halfRange = Math.max(1, (condition.max_points - condition.min_points) / 2)
  const distance = Math.abs(projectedPoints - rangeCenter)
  const rangeFit = Math.max(0, 1 - distance / (halfRange + 7))
  return 25 + rangeFit * 55 + bid.bid_score / 12
}

function scoreCollectionBid(bid: Bid, context: AgentDecisionContext): number {
  const condition = bid.win_condition as SetCollectionBidCondition
  const hand = getBotHand(context)
  const roundScore = getBotRoundScore(context)
  const trickNumber = context.game.round.currentTrick?.trick_number ?? 1
  const penaltyPerOtherCard = trickNumber * 2

  const targetInHand = hand.filter(card => card.suit === condition.win_suit).length
  const targetStrength = hand
    .filter(card => card.suit === condition.win_suit)
    .reduce((total, card) => total + (card.suit === 'flowers' ? 30 : card.rank.base + (card.rank.onSuit ?? 0)), 0)

  const expectedFutureTargetCards = Math.min(targetInHand, Math.ceil(estimateExpectedTricks(context))) * 0.75
  const expectedWonTricks = Math.max(1, estimateExpectedTricks(context))
  const expectedOtherCards = expectedWonTricks * Math.max(0, context.game.activePlayers.length - 1.25)
  const projectedNet =
    (roundScore ? getCollectionNetScore(bid, roundScore, { trickNumber }) : 0) +
    expectedFutureTargetCards * bid.bid_score -
    expectedOtherCards * penaltyPerOtherCard

  const floorMargin = projectedNet - condition.floor
  const suitBonus = condition.win_suit === 'flowers' ? targetStrength * 0.25 : targetInHand * 7
  return 35 + floorMargin * 4 + suitBonus
}

function scoreTrickBid(bid: Bid, context: AgentDecisionContext): number {
  const condition = bid.win_condition as TrickBidCondition
  const expectedTricks = estimateExpectedTricks(context)
  const roundScore = getBotRoundScore(context)
  const wonSoFar = roundScore?.tricksWon.length ?? 0
  const tricksPlayed = (context.game.round.currentTrick?.trick_number ?? 1) - 1
  const expectedFinal = wonSoFar + Math.max(0, expectedTricks * ((TOTAL_TRICKS - tricksPlayed) / TOTAL_TRICKS))

  let score = 35 + bid.bid_score / 10

  if (condition.win_min_tricks !== undefined || condition.win_max_tricks !== undefined) {
    const min = condition.win_min_tricks ?? 0
    const max = condition.win_max_tricks ?? TOTAL_TRICKS
    const distance = expectedFinal < min
      ? min - expectedFinal
      : expectedFinal > max
        ? expectedFinal - max
        : 0
    score += 35 - distance * 25
  }

  const required = condition.win_trick_position ?? []
  const forbidden = condition.lose_trick_position ?? []
  const currentTrick = context.game.round.currentTrick?.trick_number ?? 1

  for (const position of required) {
    if (position <= 3 && expectedTricks < position * 0.35) score -= 15
    if (position >= 4) score += expectedTricks * 5
  }

  for (const position of forbidden) {
    if (position <= currentTrick && expectedTricks > 1.2) score -= 18
  }

  if (condition.may_win_trick_position?.some(position => position >= 4)) {
    score += Math.min(15, expectedTricks * 4)
  }

  return score
}

function scoreBidAction(action: Extract<BotAction, { type: 'make_bid' }>, context: AgentDecisionContext): number {
  const bid = context.game.round.roundBids.bids.find(candidate => candidate.bid_id === action.bidId)
  if (!bid) return -100

  switch (bid.bid_type) {
    case 'points':
      return scorePointsBid(bid, context)
    case 'set_collection':
      return scoreCollectionBid(bid, context)
    case 'trick':
      return scoreTrickBid(bid, context)
    default:
      return 40
  }
}

type TrickGoal = 'win' | 'lose' | 'neutral'

function combineGoals(current: TrickGoal, next: TrickGoal): TrickGoal {
  if (current === next) return current
  if (current === 'neutral') return next
  if (next === 'neutral') return current
  return 'neutral'
}

function getTrickGoalFromBids(context: AgentDecisionContext): TrickGoal {
  const trick = context.game.round.currentTrick
  const roundScore = getBotRoundScore(context)
  if (!trick) return 'neutral'

  let goal: TrickGoal = 'neutral'

  for (const { bid } of getActiveBidEntries(context)) {
    let bidGoal: TrickGoal = 'neutral'

    if (bid.bid_type === 'trick') {
      const condition = bid.win_condition as TrickBidCondition
      if (condition.win_trick_position?.includes(trick.trick_number)) bidGoal = 'win'
      if (condition.lose_trick_position?.includes(trick.trick_number)) bidGoal = 'lose'

      if (condition.win_min_tricks !== undefined || condition.win_max_tricks !== undefined) {
        const won = roundScore?.tricksWon.length ?? 0
        const min = condition.win_min_tricks ?? 0
        const max = condition.win_max_tricks ?? TOTAL_TRICKS
        if (won >= max) bidGoal = 'lose'
        else if (won < min) bidGoal = 'win'
      }
    }

    if (bid.bid_type === 'points' && roundScore) {
      const condition = bid.win_condition as PointsBidCondition
      const trickPoints = trick.score?.trick_points ?? 0
      if (roundScore.points > condition.max_points) bidGoal = 'lose'
      else if (roundScore.points + trickPoints <= condition.max_points && roundScore.points < condition.min_points) bidGoal = 'win'
      else if (roundScore.points + trickPoints > condition.max_points) bidGoal = 'lose'
    }

    if (bid.bid_type === 'set_collection' && roundScore) {
      const condition = bid.win_condition as SetCollectionBidCondition
      const trickCards = trick.cards
        .map(cardId => context.game.deck.find(card => card.id === cardId))
        .filter((card): card is PlayingCard => Boolean(card))
      const targetCards = trickCards.filter(card => card.suit === condition.win_suit).length
      const otherCards = trickCards.length - targetCards
      const projectedValue = targetCards * bid.bid_score - otherCards * trick.trick_number * 2
      if (projectedValue >= bid.bid_score / 2) bidGoal = 'win'
      else if (targetCards === 0 && otherCards >= 2) bidGoal = 'lose'
    }

    goal = combineGoals(goal, bidGoal)
  }

  return goal
}

function scorePlayCardAction(action: Extract<BotAction, { type: 'play_card' }>, context: AgentDecisionContext): number {
  const trick = context.game.round.currentTrick
  if (!trick) return -100

  const card = context.game.deck.find(candidate => candidate.id === action.cardId)
  if (!card) return -100

  const leadSuit = trick.lead_suit
  const trickNumber = trick.trick_number
  const cardRank = getEffectiveRank(card, leadSuit, trickNumber, leadSuit === null)
  const currentWinningCard = trick.winning_card
    ? context.game.deck.find(candidate => candidate.id === trick.winning_card)
    : null
  const winsCurrentState = currentWinningCard
    ? compareCards(currentWinningCard, card, trickNumber, leadSuit).id === card.id
    : true

  const goal = getTrickGoalFromBids(context)
  const trickValue = trick.score?.trick_points ?? 0

  if (goal === 'win') {
    return winsCurrentState
      ? 120 - cardRank * 1.5 - card.points * 0.4
      : 25 - cardRank - card.points * 0.5
  }

  if (goal === 'lose') {
    return winsCurrentState
      ? -40 - cardRank
      : 80 - cardRank * 0.7 - card.points * 0.35
  }

  const shouldContestValue = trickValue >= 8 || !currentWinningCard
  if (winsCurrentState && shouldContestValue) {
    return 70 - cardRank * 0.8 + trickValue * 0.5
  }

  return 45 - cardRank * 0.6 - card.points * 0.25
}

function scoreStealAction(action: Extract<BotAction, { type: 'select_card_to_steal' }>, context: AgentDecisionContext): number {
  const card = context.game.deck.find(candidate => candidate.id === action.selectedCardId)
  if (!card) return 0

  const collectionBid = getActiveBidEntries(context).find(({ bid }) => bid.bid_type === 'set_collection')?.bid
  if (collectionBid) {
    const condition = collectionBid.win_condition as SetCollectionBidCondition
    return card.suit === condition.win_suit ? 120 + card.points : 20 - card.points
  }

  return 60 + card.points
}

function scoreNextLeadAction(action: Extract<BotAction, { type: 'select_next_lead' }>, context: AgentDecisionContext): number {
  if (action.selectedLeadPlayer === context.playerId) {
    return estimateExpectedTricks(context) >= 1 ? 90 : 20
  }

  return 60
}

function scoreReplacementAction(action: Extract<BotAction, { type: 'replace_card' }>, context: AgentDecisionContext): number {
  const card = context.game.deck.find(candidate => candidate.id === action.cardId)
  if (!card) return 0

  const collectionSuits = context.game.round.roundBids.bids
    .filter(bid => bid.bid_type === 'set_collection')
    .map(bid => (bid.win_condition as SetCollectionBidCondition).win_suit)
  const usefulSuits = new Set<Suit>(collectionSuits.length > 0 ? collectionSuits : SUITS)
  const isWeak = card.rank.base < 11 && card.suit !== 'flowers' && !usefulSuits.has(card.suit)
  return isWeak ? 75 : 35
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
        const minBidConfidence = trickNumber === 1 ? 68 : trickNumber === 2 ? 62 : 56
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

    const scoredActions = context.legalActions.map(action => {
      let score = scoreAction(action)
      if (action.type === 'select_card_to_steal') score = scoreStealAction(action, context)
      if (action.type === 'select_next_lead') score = scoreNextLeadAction(action, context)
      if (action.type === 'replace_card') score = scoreReplacementAction(action, context)
      return { action, score }
    }).sort((a, b) => b.score - a.score)

    return scoredActions[0]?.action ?? null
  }
}
