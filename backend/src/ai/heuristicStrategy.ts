import type { AgentDecisionContext, BotAction } from './AgentPolicy.js'
import type { Bid, PlayerBidEntry, PointsBidCondition, SetCollectionBidCondition, TrickBidCondition } from '@domain/interfaces/Bid'
import type { LeadSuit, PlayerId, PlayingCard, Suit, Trick, TrickNumber } from '@domain/interfaces'
import { TOTAL_TRICKS } from '@domain/interfaces/Trick'
import { compareCards } from '@domain/rules/CardRules'
import { determineLeadSuit } from '@domain/rules/TrickRules'
import { calculateBidOnLose, getCollectionNetScore } from '@domain/rules/BidRules'
import { POINTS_BID_OPEN_MAX } from '@domain/data/bidDefinitions'

const LEAD_SUITS: LeadSuit[] = ['acorns', 'leaves', 'berries']
const MIN_BID_SCORE = 50

interface CardEvaluation {
  card: PlayingCard
  leadWinChance: number
  followWinChance: number
  currentWinChance: number
  winChance: number
  keepValue: number
}

interface HandEvaluation {
  cards: CardEvaluation[]
  expectedTricks: number
  trickDistribution: number[]
  expectedPoints: number
  pointsStdDev: number
}

interface ActiveBid {
  bid: Bid
  entry: PlayerBidEntry
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value))
}

function getPlayerCount(context: AgentDecisionContext): number {
  return context.game.activePlayers.length
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

function getActiveBidEntries(context: AgentDecisionContext): ActiveBid[] {
  const playerBidEntries = context.game.round.roundBids.playerBids[context.playerId] || []
  return playerBidEntries
    .map(entry => ({
      entry,
      bid: context.game.round.roundBids.bids.find(bid => bid.bid_id === entry.bidId)
    }))
    .filter((candidate): candidate is ActiveBid => Boolean(candidate.bid))
}

function getTrickCards(context: AgentDecisionContext, trick: Trick, extraCard?: PlayingCard): PlayingCard[] {
  const cards = trick.cards
    .map(cardId => context.game.deck.find(card => card.id === cardId))
    .filter((card): card is PlayingCard => Boolean(card))

  return extraCard ? [...cards, extraCard] : cards
}

function getUnknownCards(context: AgentDecisionContext): PlayingCard[] {
  const ownCardIds = new Set(getBotHand(context).map(card => card.id))
  return context.game.deck.filter(card => {
    if (ownCardIds.has(card.id)) return false
    return card.state === 'in_hand_hidden' || card.state === 'in_deck' || card.state === 'in_discard_pile'
  })
}

function getHandSlotCount(context: AgentDecisionContext, playerId: PlayerId): number {
  return context.game.deck.filter(
    card =>
      card.owner === playerId &&
      card.state === 'in_hand_hidden'
  ).length
}

function getVisibleOpponentCards(context: AgentDecisionContext): PlayingCard[] {
  return context.game.deck.filter(
    card => card.owner !== null && card.owner !== context.playerId && card.state === 'in_hand_visible'
  )
}

function getOpponentHandSlots(context: AgentDecisionContext, playerIds?: PlayerId[]): number {
  const opponents = playerIds ?? context.game.activePlayers
    .map(player => player.id)
    .filter(playerId => playerId !== context.playerId)

  return opponents.reduce((total, playerId) => total + getHandSlotCount(context, playerId), 0)
}

function getRemainingPlayersInTrick(context: AgentDecisionContext, trick: Trick): PlayerId[] {
  const remainingCount = context.game.activePlayers.length - trick.cards.length - 1
  if (remainingCount <= 0) return []

  const turnOrder = context.game.playerTurnOrder.length > 0
    ? context.game.playerTurnOrder
    : context.game.activePlayers.map(player => player.id)
  const botIndex = turnOrder.indexOf(context.playerId)
  if (botIndex === -1) return []

  return Array.from({ length: remainingCount }, (_, index) =>
    turnOrder[(botIndex + index + 1) % turnOrder.length]
  ).filter((playerId): playerId is PlayerId => Boolean(playerId))
}

function probabilityNoHitInSample(universeSize: number, hitCount: number, sampleSize: number): number {
  if (hitCount <= 0) return 1
  if (universeSize <= 0) return 1
  if (sampleSize <= 0) return 1
  if (universeSize - hitCount < sampleSize) return 0

  let probability = 1
  for (let index = 0; index < sampleSize; index++) {
    probability *= (universeSize - hitCount - index) / (universeSize - index)
  }
  return clamp(probability)
}

function countUnknownBeaters(
  context: AgentDecisionContext,
  winningCard: PlayingCard,
  trickNumber: TrickNumber,
  leadSuit: LeadSuit | null
): number {
  return getUnknownCards(context).filter(candidate =>
    compareCards(winningCard, candidate, trickNumber, leadSuit).id === candidate.id
  ).length
}

function estimateLeadWinChance(context: AgentDecisionContext, card: PlayingCard, trickNumber: TrickNumber): number {
  if (card.char === 'S' && card.suit !== 'berries') return 0.01

  const hypotheticalLeadSuit = determineLeadSuit(card)
  const visibleBeaters = getVisibleOpponentCards(context).filter(candidate =>
    compareCards(card, candidate, trickNumber, hypotheticalLeadSuit).id === candidate.id
  ).length
  if (visibleBeaters > 0) return 0

  const beaters = countUnknownBeaters(context, card, trickNumber, hypotheticalLeadSuit)
  const unknownCount = getUnknownCards(context).length
  const opponentSlots = getOpponentHandSlots(context)

  return clamp(probabilityNoHitInSample(unknownCount, beaters, opponentSlots) * 0.97)
}

function estimateCurrentTrickWinChance(context: AgentDecisionContext, card: PlayingCard): number {
  const trick = context.game.round.currentTrick
  if (!trick || trick.trick_state !== 'in_progress') return 0

  const leadSuitAfterCard = trick.lead_suit ?? determineLeadSuit(card)
  const currentWinningCard = trick.winning_card
    ? context.game.deck.find(candidate => candidate.id === trick.winning_card)
    : null

  if (currentWinningCard) {
    const beatsCurrent = compareCards(currentWinningCard, card, trick.trick_number, leadSuitAfterCard).id === card.id
    if (!beatsCurrent) return 0
  }

  const beaters = countUnknownBeaters(context, card, trick.trick_number, leadSuitAfterCard)
  const unknownCount = getUnknownCards(context).length
  const remainingPlayers = getRemainingPlayersInTrick(context, trick)
  const remainingSlots = getOpponentHandSlots(context, remainingPlayers)

  return probabilityNoHitInSample(unknownCount, beaters, remainingSlots)
}

function estimateFollowWinChance(context: AgentDecisionContext, card: PlayingCard, trickNumber: TrickNumber): number {
  if (card.char === 'S') {
    return card.suit === 'berries' ? 0.02 : 0.01
  }

  const unknownCards = getUnknownCards(context)
  const visibleCards = getVisibleOpponentCards(context)
  const opponentSlots = Math.max(1, getOpponentHandSlots(context))

  const suitChances = LEAD_SUITS.map(leadSuit => {
    const visibleBeaters = visibleCards.filter(candidate =>
      compareCards(card, candidate, trickNumber, leadSuit).id === candidate.id
    ).length
    const visibleFactor = visibleBeaters > 0 ? Math.pow(0.35, visibleBeaters) : 1
    const beaters = unknownCards.filter(candidate =>
      compareCards(card, candidate, trickNumber, leadSuit).id === candidate.id
    ).length

    return probabilityNoHitInSample(unknownCards.length, beaters, opponentSlots) * visibleFactor
  })

  const averageSuitChance = suitChances.reduce((total, chance) => total + chance, 0) / LEAD_SUITS.length
  const offSuitFactor = card.suit === 'flowers' ? 1 : 0.72
  return clamp(averageSuitChance * offSuitFactor)
}

function getSpecialCardKeepValue(context: AgentDecisionContext, card: PlayingCard): number {
  if (card.suit === 'berries' && card.char === 'S') {
    return context.game.round.currentTrick?.lead_player === context.playerId ? 18 : 13
  }
  if (card.suit === 'leaves' && card.char === 'S') return 10
  if (card.suit === 'acorns' && card.char === 'S') return 7
  return 0
}

function getCollectionTargets(context: AgentDecisionContext): Set<Suit> {
  const targets = context.game.round.roundBids.bids
    .filter(bid => bid.bid_type === 'set_collection')
    .map(bid => (bid.win_condition as SetCollectionBidCondition).win_suit)

  const activeTargets = getActiveBidEntries(context)
    .filter(({ bid }) => bid.bid_type === 'set_collection')
    .map(({ bid }) => (bid.win_condition as SetCollectionBidCondition).win_suit)

  return new Set([...targets, ...activeTargets])
}

function evaluateCard(context: AgentDecisionContext, card: PlayingCard): CardEvaluation {
  const playerCount = getPlayerCount(context)
  const trickNumber = context.game.round.currentTrick?.trick_number ?? 1
  const leadWinChance = estimateLeadWinChance(context, card, trickNumber)
  const followWinChance = estimateFollowWinChance(context, card, trickNumber)
  const leadShare = context.game.round.currentTrick?.lead_player === context.playerId
    ? 0.55
    : 1 / Math.max(2, playerCount)
  const winChance = clamp(leadShare * leadWinChance + (1 - leadShare) * followWinChance)
  const currentWinChance = estimateCurrentTrickWinChance(context, card)

  const collectionTargets = getCollectionTargets(context)
  const suitCards = getBotHand(context).filter(handCard => handCard.suit === card.suit).length
  const suitConcentrationBonus = suitCards >= 3 ? 2 : suitCards === 2 ? 1 : 0
  const collectionBonus = collectionTargets.has(card.suit) ? 4 : 0
  const specialBonus = getSpecialCardKeepValue(context, card)

  const keepValue =
    winChance * 18 +
    leadWinChance * 7 +
    card.points * 0.7 +
    collectionBonus +
    suitConcentrationBonus +
    specialBonus

  return {
    card,
    leadWinChance,
    followWinChance,
    currentWinChance,
    winChance,
    keepValue
  }
}

function buildTrickDistribution(cardEvaluations: CardEvaluation[]): number[] {
  const distribution = [1]
  for (const evaluation of cardEvaluations) {
    const winChance = clamp(evaluation.winChance, 0.02, 0.98)
    for (let wins = distribution.length - 1; wins >= 0; wins--) {
      distribution[wins + 1] = (distribution[wins + 1] ?? 0) + distribution[wins] * winChance
      distribution[wins] *= 1 - winChance
    }
  }
  return distribution
}

function getAverageUnknownPoints(context: AgentDecisionContext): number {
  const unknownCards = getUnknownCards(context)
  if (unknownCards.length === 0) return 0
  return unknownCards.reduce((total, card) => total + card.points, 0) / unknownCards.length
}

function evaluateHand(context: AgentDecisionContext): HandEvaluation {
  const cards = getBotHand(context).map(card => evaluateCard(context, card))
  const trickDistribution = buildTrickDistribution(cards)
  const expectedTricks = trickDistribution.reduce((total, probability, wins) => total + probability * wins, 0)

  const playerCount = getPlayerCount(context)
  const averageUnknownPoints = getAverageUnknownPoints(context)
  let expectedPoints = getBotRoundScore(context)?.points ?? 0
  let pointsVariance = 0

  for (const evaluation of cards) {
    const captureValue = evaluation.card.points + averageUnknownPoints * Math.max(0, playerCount - 1)
    expectedPoints += evaluation.winChance * captureValue
    pointsVariance += evaluation.winChance * (1 - evaluation.winChance) * captureValue * captureValue
  }

  return {
    cards,
    expectedTricks,
    trickDistribution,
    expectedPoints,
    pointsStdDev: Math.sqrt(pointsVariance) || 1
  }
}

function normalCdf(value: number, mean: number, stdDev: number): number {
  if (stdDev <= 0) return value >= mean ? 1 : 0
  const z = (value - mean) / (stdDev * Math.SQRT2)
  const sign = z < 0 ? -1 : 1
  const absoluteZ = Math.abs(z)
  const t = 1 / (1 + 0.3275911 * absoluteZ)
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-absoluteZ * absoluteZ)
  return clamp(0.5 * (1 + sign * erf))
}

function probabilityBetween(min: number, max: number, mean: number, stdDev: number): number {
  if (max >= POINTS_BID_OPEN_MAX) {
    return 1 - normalCdf(min - 0.5, mean, stdDev)
  }
  return normalCdf(max + 0.5, mean, stdDev) - normalCdf(min - 0.5, mean, stdDev)
}

function getAlreadyWonTricks(context: AgentDecisionContext): Set<TrickNumber> {
  return new Set(getBotRoundScore(context)?.tricksWon ?? [])
}

function getWinChanceForPosition(evaluation: CardEvaluation, position: number, currentTrickNumber: number): number {
  return position === currentTrickNumber ? evaluation.currentWinChance : evaluation.winChance
}

function chooseCardsForPositionGoals(
  cardEvaluations: CardEvaluation[],
  positionsToWin: number[],
  positionsToLose: number[],
  currentTrickNumber: number
): number {
  const remaining = [...cardEvaluations]
  let probability = 1

  for (const position of positionsToWin.sort((a, b) => a - b)) {
    const card = remaining.reduce<CardEvaluation | null>((best, candidate) =>
      !best || getWinChanceForPosition(candidate, position, currentTrickNumber) > getWinChanceForPosition(best, position, currentTrickNumber)
        ? candidate
        : best,
      null
    )
    if (!card) return 0
    probability *= clamp(getWinChanceForPosition(card, position, currentTrickNumber), 0.05, 0.95)
    remaining.splice(remaining.indexOf(card), 1)
  }

  for (const position of positionsToLose.sort((a, b) => a - b)) {
    const card = remaining.reduce<CardEvaluation | null>((worst, candidate) =>
      !worst || getWinChanceForPosition(candidate, position, currentTrickNumber) < getWinChanceForPosition(worst, position, currentTrickNumber)
        ? candidate
        : worst,
      null
    )
    if (!card) return 1
    probability *= clamp(1 - getWinChanceForPosition(card, position, currentTrickNumber), 0.05, 0.98)
    remaining.splice(remaining.indexOf(card), 1)
  }

  return probability
}

function estimatePositionBidSuccess(
  context: AgentDecisionContext,
  condition: TrickBidCondition,
  evaluation: HandEvaluation
): number {
  const currentTrickNumber = context.game.round.currentTrick?.trick_number ?? 1
  const wonTricks = getAlreadyWonTricks(context)
  const required = condition.win_trick_position ?? []
  const optional = condition.may_win_trick_position ?? []
  const forbidden = condition.lose_trick_position ?? []
  const allowedWins = new Set([...required, ...optional])
  const hasPositionConstraints = required.length > 0 || optional.length > 0

  if (forbidden.some(position => wonTricks.has(position))) return 0
  if (required.some(position => position < currentTrickNumber && !wonTricks.has(position))) return 0
  if (hasPositionConstraints && [...wonTricks].some(position => !allowedWins.has(position))) return 0

  const futureRequiredWins = required.filter(position => position >= currentTrickNumber)
  const futureRequiredLosses = forbidden.filter(position => position >= currentTrickNumber)
  const futureDisallowedWins = hasPositionConstraints
    ? Array.from({ length: TOTAL_TRICKS }, (_, index) => (index + 1) as TrickNumber)
      .filter(position => position >= currentTrickNumber && !allowedWins.has(position))
    : []

  return clamp(chooseCardsForPositionGoals(
    evaluation.cards,
    futureRequiredWins,
    [...futureRequiredLosses, ...futureDisallowedWins],
    currentTrickNumber
  ))
}

function estimateCountBidSuccess(
  context: AgentDecisionContext,
  min: number,
  max: number,
  evaluation: HandEvaluation
): number {
  const alreadyWon = getAlreadyWonTricks(context).size
  const trick = context.game.round.currentTrick
  let bestProbability = 0

  for (const [index, cardEvaluation] of evaluation.cards.entries()) {
    const remainingEvaluations = evaluation.cards.filter((_, cardIndex) => cardIndex !== index)
    const futureDistribution = trick?.trick_state === 'in_progress'
      ? buildTrickDistribution(remainingEvaluations)
      : evaluation.trickDistribution

    let cardProbability = 0
    for (const winsCurrent of [true, false]) {
      const currentWins = alreadyWon + (winsCurrent ? 1 : 0)
      let probability = 0
      futureDistribution.forEach((futureWinsProbability, futureWins) => {
        const totalWins = currentWins + futureWins
        if (totalWins >= min && totalWins <= max) {
          probability += futureWinsProbability
        }
      })

      cardProbability += trick?.trick_state === 'in_progress'
        ? winsCurrent
          ? probability * cardEvaluation.currentWinChance
          : probability * (1 - cardEvaluation.currentWinChance)
        : probability
    }

    bestProbability = Math.max(bestProbability, cardProbability)
  }

  return clamp(bestProbability)
}

function estimateTrickBidSuccess(
  context: AgentDecisionContext,
  bid: Bid,
  evaluation: HandEvaluation
): number {
  const condition = bid.win_condition as TrickBidCondition
  const hasPositionCondition = Boolean(
    condition.win_trick_position?.length ||
    condition.lose_trick_position?.length ||
    condition.may_win_trick_position?.length
  )

  if (hasPositionCondition) {
    return estimatePositionBidSuccess(context, condition, evaluation)
  }

  if (condition.win_min_tricks === undefined && condition.win_max_tricks === undefined) {
    return 0
  }

  return estimateCountBidSuccess(
    context,
    condition.win_min_tricks ?? 0,
    condition.win_max_tricks ?? TOTAL_TRICKS,
    evaluation
  )
}

function estimateCollectionProjection(
  context: AgentDecisionContext,
  bid: Bid,
  evaluation: HandEvaluation,
  trickNumber: TrickNumber
): { mean: number; stdDev: number; probability: number } {
  const condition = bid.win_condition as SetCollectionBidCondition
  const roundScore = getBotRoundScore(context)
  const currentNet = roundScore ? getCollectionNetScore(bid, roundScore, { trickNumber }) : 0
  const unknownCards = getUnknownCards(context)
  const targetFraction = unknownCards.length > 0
    ? unknownCards.filter(card => card.suit === condition.win_suit).length / unknownCards.length
    : 0
  const opponentCardsPerTrick = Math.max(0, getPlayerCount(context) - 1)
  const penaltyPerOtherCard = trickNumber * 2

  let mean = currentNet
  let variance = 0

  for (const cardEvaluation of evaluation.cards) {
    const ownTarget = cardEvaluation.card.suit === condition.win_suit ? 1 : 0
    const ownOther = 1 - ownTarget
    const targetCards = ownTarget + opponentCardsPerTrick * targetFraction
    const otherCards = ownOther + opponentCardsPerTrick * (1 - targetFraction)
    const netContribution = targetCards * bid.bid_score - otherCards * penaltyPerOtherCard

    mean += cardEvaluation.winChance * netContribution
    variance += cardEvaluation.winChance * (1 - cardEvaluation.winChance) * netContribution * netContribution
  }

  const stdDev = Math.sqrt(variance) || 1
  return {
    mean,
    stdDev,
    probability: 1 - normalCdf(condition.floor - 0.5, mean, stdDev)
  }
}

function estimateBidConflictPenalty(context: AgentDecisionContext, candidate: Bid): number {
  const candidateCondition = candidate.win_condition as TrickBidCondition
  const candidateIsNoTricks = candidate.bid_type === 'trick' &&
    candidateCondition.win_min_tricks === 0 && candidateCondition.win_max_tricks === 0
  const candidateIsAllTricks = candidate.bid_type === 'trick' &&
    candidateCondition.win_min_tricks === TOTAL_TRICKS && candidateCondition.win_max_tricks === TOTAL_TRICKS

  let penalty = 0
  for (const { bid } of getActiveBidEntries(context)) {
    const condition = bid.win_condition as TrickBidCondition
    const activeIsNoTricks = bid.bid_type === 'trick' &&
      condition.win_min_tricks === 0 && condition.win_max_tricks === 0
    const activeIsAllTricks = bid.bid_type === 'trick' &&
      condition.win_min_tricks === TOTAL_TRICKS && condition.win_max_tricks === TOTAL_TRICKS

    if ((candidateIsNoTricks || activeIsNoTricks) && candidate.bid_id !== bid.bid_id) {
      penalty += candidate.bid_type === 'trick' && bid.bid_type === 'trick' ? 30 : 45
    }
    if (candidateIsAllTricks && activeIsNoTricks) penalty += 50
  }

  return penalty
}

export function scoreBidAction(
  action: Extract<BotAction, { type: 'make_bid' }>,
  context: AgentDecisionContext
): number {
  const bid = context.game.round.roundBids.bids.find(candidate => candidate.bid_id === action.bidId)
  const trickNumber = context.game.round.currentTrick?.trick_number
  if (!bid || !trickNumber) return -100

  const evaluation = evaluateHand(context)
  const playerCount = getPlayerCount(context)
  const fine = Math.abs(calculateBidOnLose(bid.bid_type, trickNumber, playerCount as 2 | 3 | 4))
  let probability = 0
  let expectedPrize = bid.bid_score

  if (bid.bid_type === 'points') {
    const condition = bid.win_condition as PointsBidCondition
    probability = probabilityBetween(
      condition.min_points,
      condition.max_points,
      evaluation.expectedPoints,
      evaluation.pointsStdDev
    )
  } else if (bid.bid_type === 'trick') {
    probability = estimateTrickBidSuccess(context, bid, evaluation)
  } else {
    const projection = estimateCollectionProjection(context, bid, evaluation, trickNumber)
    probability = projection.probability
    expectedPrize = Math.max((bid.win_condition as SetCollectionBidCondition).floor, projection.mean)
  }

  probability = clamp(probability, 0.01, 0.98)
  const expectedValue = probability * expectedPrize - (1 - probability) * fine - estimateBidConflictPenalty(context, bid)
  const activeBidCount = getActiveBidEntries(context).length
  const opportunityCost = activeBidCount === 0
    ? evaluation.expectedPoints * 0.7
    : Math.max(0, 4 - activeBidCount * 2)
  const futureBidOptions = Math.max(0, 3 - trickNumber) * 4
  const adjustedValue = activeBidCount === 0
    ? expectedValue - opportunityCost + futureBidOptions
    : expectedValue - 2

  return MIN_BID_SCORE + adjustedValue
}

function getTrickPoints(cards: PlayingCard[]): number {
  return cards.reduce((total, card) => total + card.points, 0)
}

function getTrickBidPlayUtility(
  context: AgentDecisionContext,
  bid: Bid,
  entry: PlayerBidEntry,
  trick: Trick,
  wins: boolean
): number {
  const condition = bid.win_condition as TrickBidCondition
  const position = trick.trick_number
  const weight = bid.bid_score + Math.abs(entry.onLose)
  const required = condition.win_trick_position ?? []
  const optional = condition.may_win_trick_position ?? []
  const forbidden = condition.lose_trick_position ?? []
  const allowedWins = new Set([...required, ...optional])
  const hasPositionConstraints = required.length > 0 || optional.length > 0
  let utility = 0

  if (required.includes(position)) utility += wins ? weight : -weight
  if (forbidden.includes(position)) utility += wins ? -weight : weight
  if (hasPositionConstraints && wins && !allowedWins.has(position)) utility -= weight

  if (condition.win_min_tricks !== undefined || condition.win_max_tricks !== undefined) {
    const min = condition.win_min_tricks ?? 0
    const max = condition.win_max_tricks ?? TOTAL_TRICKS
    const won = getAlreadyWonTricks(context).size + (wins ? 1 : 0)
    const remainingAfterThis = TOTAL_TRICKS - position

    if (won > max || won + remainingAfterThis < min) {
      utility -= weight
    } else if (wins && won < min) {
      utility += weight * 0.45
    } else if (!wins && won >= min && won <= max) {
      utility += weight * 0.25
    }
  }

  return utility
}

function getPointsBidPlayUtility(
  context: AgentDecisionContext,
  bid: Bid,
  entry: PlayerBidEntry,
  capturedPoints: number,
  playedCard: PlayingCard,
  wins: boolean
): number {
  const condition = bid.win_condition as PointsBidCondition
  const currentPoints = getBotRoundScore(context)?.points ?? 0
  const weight = bid.bid_score + Math.abs(entry.onLose)
  const nextPoints = currentPoints + (wins ? capturedPoints : 0)

  if (!wins) {
    if (currentPoints > condition.max_points) return weight * 0.5
    return -playedCard.points * 1.4
  }

  if (nextPoints > condition.max_points) {
    return -weight - (nextPoints - condition.max_points) * 2
  }

  if (condition.max_points >= POINTS_BID_OPEN_MAX) {
    return nextPoints >= condition.min_points ? weight * 0.7 : capturedPoints * 2
  }

  if (nextPoints < condition.min_points) return capturedPoints * 2.2
  return weight * 0.65
}

function getCollectionBidPlayUtility(
  context: AgentDecisionContext,
  bid: Bid,
  entry: PlayerBidEntry,
  cards: PlayingCard[],
  playedCard: PlayingCard,
  wins: boolean
): number {
  const condition = bid.win_condition as SetCollectionBidCondition
  const targetCards = cards.filter(card => card.suit === condition.win_suit).length
  const otherCards = cards.length - targetCards
  const penaltyPerCard = entry.trickNumber * 2

  if (wins) {
    return (targetCards * bid.bid_score - otherCards * penaltyPerCard) * 1.5
  }

  return playedCard.suit === condition.win_suit
    ? -bid.bid_score * 0.7
    : Math.abs(entry.onLose) * 0.1
}

function getSpecialPlayUtility(
  context: AgentDecisionContext,
  card: PlayingCard,
  trick: Trick
): number {
  if (card.suit === 'leaves' && card.char === 'S') {
    const trickCards = getTrickCards(context, trick)
    const bestSteal = Math.max(0, ...trickCards.map(candidate => candidate.points))
    return 8 + bestSteal * 2
  }

  if (card.suit === 'acorns' && card.char === 'S') {
    return 7
  }

  return 0
}

export function scorePlayCardAction(
  action: Extract<BotAction, { type: 'play_card' }>,
  context: AgentDecisionContext
): number {
  const trick = context.game.round.currentTrick
  const card = context.game.deck.find(candidate => candidate.id === action.cardId)
  if (!trick || !card) return -100

  const cardEvaluation = evaluateCard(context, card)
  const winChance = estimateCurrentTrickWinChance(context, card)
  const cardsIfWon = getTrickCards(context, trick, card)
  const capturedPoints = getTrickPoints(cardsIfWon)
  const activeBids = getActiveBidEntries(context)

  let utilityIfWin = activeBids.length === 0 ? capturedPoints : 0
  let utilityIfLose = activeBids.length === 0 ? -card.points * 0.7 : 0

  for (const { bid, entry } of activeBids) {
    if (bid.bid_type === 'trick') {
      utilityIfWin += getTrickBidPlayUtility(context, bid, entry, trick, true)
      utilityIfLose += getTrickBidPlayUtility(context, bid, entry, trick, false)
    }

    if (bid.bid_type === 'points') {
      utilityIfWin += getPointsBidPlayUtility(context, bid, entry, capturedPoints, card, true)
      utilityIfLose += getPointsBidPlayUtility(context, bid, entry, capturedPoints, card, false)
    }

    if (bid.bid_type === 'set_collection') {
      utilityIfWin += getCollectionBidPlayUtility(context, bid, entry, cardsIfWon, card, true)
      utilityIfLose += getCollectionBidPlayUtility(context, bid, entry, cardsIfWon, card, false)
    }
  }

  utilityIfLose += getSpecialPlayUtility(context, card, trick)

  const expectedUtility = winChance * utilityIfWin + (1 - winChance) * utilityIfLose
  const leadBonus = trick.cards.length === 0 ? cardEvaluation.leadWinChance * 8 : 0
  const score = expectedUtility + leadBonus - cardEvaluation.keepValue * 0.38

  return 50 + score
}

function getStealValue(context: AgentDecisionContext, card: PlayingCard): number {
  let value = card.points * 1.5

  for (const { bid, entry } of getActiveBidEntries(context)) {
    if (bid.bid_type === 'set_collection') {
      const condition = bid.win_condition as SetCollectionBidCondition
      value += card.suit === condition.win_suit
        ? bid.bid_score * 1.5
        : -entry.trickNumber * 2
    }

    if (bid.bid_type === 'points') {
      const condition = bid.win_condition as PointsBidCondition
      const currentPoints = getBotRoundScore(context)?.points ?? 0
      const nextPoints = currentPoints + card.points
      if (nextPoints <= condition.max_points) {
        value += nextPoints < condition.min_points ? card.points * 2 : card.points
      } else {
        value -= (nextPoints - condition.max_points) * 2 + Math.abs(entry.onLose) * 0.4
      }
    }
  }

  return value
}

export function scoreStealAction(
  action: Extract<BotAction, { type: 'select_card_to_steal' }>,
  context: AgentDecisionContext
): number {
  const card = context.game.deck.find(candidate => candidate.id === action.selectedCardId)
  if (!card) return 0
  return 50 + getStealValue(context, card)
}

function wantsNextLead(context: AgentDecisionContext, nextTrickNumber: TrickNumber): boolean {
  const roundScore = getBotRoundScore(context)

  for (const { bid } of getActiveBidEntries(context)) {
    if (bid.bid_type === 'trick') {
      const condition = bid.win_condition as TrickBidCondition
      if (condition.win_trick_position?.includes(nextTrickNumber)) return true
      if (condition.lose_trick_position?.includes(nextTrickNumber)) return false
      const won = roundScore?.tricksWon.length ?? 0
      const min = condition.win_min_tricks ?? 0
      if (won < min) return true
    }

    if (bid.bid_type === 'points' && roundScore) {
      const condition = bid.win_condition as PointsBidCondition
      if (roundScore.points < condition.min_points) return true
    }

    if (bid.bid_type === 'set_collection') return true
  }

  return evaluateHand(context).expectedTricks >= 1.2
}

export function scoreNextLeadAction(
  action: Extract<BotAction, { type: 'select_next_lead' }>,
  context: AgentDecisionContext
): number {
  const nextTrickNumber = Math.min(TOTAL_TRICKS, (context.game.round.currentTrick?.trick_number ?? 1) + 1) as TrickNumber
  const desired = wantsNextLead(context, nextTrickNumber)

  if (action.selectedLeadPlayer === context.playerId) {
    const bestLead = Math.max(0, ...evaluateHand(context).cards.map(card => card.leadWinChance))
    return desired ? 70 + bestLead * 25 : 15
  }

  if (desired) return 20

  const playerScore = context.game.playerScores.find(score => score.playerId === action.selectedLeadPlayer)?.score ?? 0
  const roundScore = context.game.round.roundScore.find(score => score.playerId === action.selectedLeadPlayer)
  return 60 - playerScore * 0.15 - (roundScore?.tricksWon.length ?? 0) * 3
}

export function scoreReplacementAction(
  action: Extract<BotAction, { type: 'replace_card' }>,
  context: AgentDecisionContext
): number {
  const card = context.game.deck.find(candidate => candidate.id === action.cardId)
  if (!card) return 0
  const keepValue = evaluateCard(context, card).keepValue
  return 78 - keepValue
}

export function scoreSkipReplacement(context: AgentDecisionContext): number {
  const hand = getBotHand(context)
  if (hand.length === 0) return 55
  const weakestCardValue = Math.min(...hand.map(card => evaluateCard(context, card).keepValue))
  return 48 + weakestCardValue
}

export function shouldMakeBid(score: number): boolean {
  return score > MIN_BID_SCORE
}
