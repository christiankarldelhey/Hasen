import type { Game } from '../interfaces/Game'
import type { PlayerId } from '../interfaces/Player'
import type {
  Bid,
  BidType,
  PlayerBidEntry,
  PlayerCount,
  PointsBidCondition,
  SetCollectionBidCondition,
  TrickBidCondition
} from '../interfaces/Bid'
import type { PlayerRoundScore } from '../interfaces/Round'
import type { TrickNumber } from '../interfaces/Trick'
import { TOTAL_TRICKS } from '../interfaces/Trick'
import { POINTS_BID_OPEN_MAX } from '../data/bidDefinitions'

export interface CanMakeBidResult {
  canMakeBid: boolean
  reason?: string
}

export interface BidEvaluationOptions {
  bidEntry?: PlayerBidEntry
  currentTrickNumber?: TrickNumber
}

export interface PlayerBidOutcome {
  bid: Bid
  bidEntry: PlayerBidEntry
  isWinning: boolean | null
  score: number
  collectionNet?: number
}

export const BID_DUEL_SCORE = 5
export const COLLECTION_OTHER_SUIT_PENALTY_PER_WINDOW = 2

function getOtherSuitCount(
  setCollection: PlayerRoundScore['setCollection'],
  winSuit: SetCollectionBidCondition['win_suit']
): number {
  return Object.entries(setCollection).reduce(
    (total, [suit, count]) => total + (suit === winSuit ? 0 : count),
    0
  )
}

function isTrickBidStillPossible(
  condition: TrickBidCondition,
  playerRoundScore: PlayerRoundScore,
  currentTrickNumber: TrickNumber
): boolean {
  const tricksWon = playerRoundScore.tricksWon
  const tricksWonSoFar = new Set(tricksWon).size
  const tricksRemaining = TOTAL_TRICKS - currentTrickNumber + 1
  const maxPossibleTricks = tricksWonSoFar + tricksRemaining

  const requiredTricks = condition.win_trick_position ?? []
  const optionalTricks = condition.may_win_trick_position ?? []
  const hasPositionConstraints = requiredTricks.length > 0 || optionalTricks.length > 0
  const allowedWonTricks = new Set([...requiredTricks, ...optionalTricks])

  if (hasPositionConstraints && tricksWon.some(trick => !allowedWonTricks.has(trick))) {
    return false
  }

  if (requiredTricks.some(
    trick => trick < currentTrickNumber && !tricksWon.includes(trick)
  )) {
    return false
  }

  if (condition.lose_trick_position?.some(trick => tricksWon.includes(trick))) {
    return false
  }

  if (condition.win_min_tricks !== undefined && maxPossibleTricks < condition.win_min_tricks) {
    return false
  }

  if (condition.win_max_tricks !== undefined && tricksWonSoFar > condition.win_max_tricks) {
    return false
  }

  return true
}

export function isPointsBidStillPossible(
  condition: PointsBidCondition,
  playerRoundScore: PlayerRoundScore
): boolean {
  if (playerRoundScore.points > condition.max_points) {
    return false
  }

  // Una apuesta abierta ya cumplida no puede ganarse dos veces ni hacerse gratis.
  if (
    condition.max_points >= POINTS_BID_OPEN_MAX &&
    playerRoundScore.points >= condition.min_points
  ) {
    return false
  }

  return true
}

export function isBidStillPossible(
  bid: Bid,
  playerRoundScore: PlayerRoundScore,
  currentTrickNumber: TrickNumber
): boolean {
  if (bid.bid_type === 'trick') {
    return isTrickBidStillPossible(
      bid.win_condition as TrickBidCondition,
      playerRoundScore,
      currentTrickNumber
    )
  }

  if (bid.bid_type === 'points') {
    return isPointsBidStillPossible(
      bid.win_condition as PointsBidCondition,
      playerRoundScore
    )
  }

  return true
}

function getBidderCount(game: Game, bidId: string): number {
  return Object.values(game.round.roundBids.playerBids)
    .flat()
    .filter(playerBid => playerBid.bidId === bidId)
    .length
}

/**
 * Valida si un bid específico puede ser hecho por el jugador
 */
export function canMakeSpecificBid(
  game: Game,
  playerId: PlayerId,
  bid: Bid,
  trickNumber: TrickNumber
): CanMakeBidResult {
  const generalValidation = canMakeBid(game, playerId, bid.bid_type, trickNumber)
  if (!generalValidation.canMakeBid) {
    return generalValidation
  }

  if (getBidderCount(game, bid.bid_id) >= 2) {
    return {
      canMakeBid: false,
      reason: 'This bid already has the maximum of 2 players'
    }
  }

  const playerRoundScore = game.round.roundScore.find(score => score.playerId === playerId)
  if (playerRoundScore && !isBidStillPossible(bid, playerRoundScore, trickNumber)) {
    return {
      canMakeBid: false,
      reason: 'This bid is no longer possible given your current progress'
    }
  }

  return { canMakeBid: true }
}

export function canMakeBid(
  game: Game,
  playerId: PlayerId,
  bidType: BidType,
  trickNumber: TrickNumber
): CanMakeBidResult {
  if (game.round.playerTurn !== playerId) {
    return {
      canMakeBid: false,
      reason: 'Not your turn'
    }
  }

  if (trickNumber > 3) {
    return {
      canMakeBid: false,
      reason: 'You can only make bids in the first 3 tricks'
    }
  }

  const trickState = game.round.currentTrick?.trick_state
  const isBidWindowOpen = trickState === 'in_progress'

  if (!game.round.currentTrick || !isBidWindowOpen) {
    return {
      canMakeBid: false,
      reason: 'Trick must be active to make a bid'
    }
  }

  const availableBids = game.round.roundBids.bids.filter(bid => bid.bid_type === bidType)

  if (availableBids.length === 0) {
    return {
      canMakeBid: false,
      reason: 'No bids available of this type'
    }
  }

  const playerBids = game.round.roundBids.playerBids[playerId] || []

  if (playerBids.some(playerBid => playerBid.trickNumber === trickNumber)) {
    return {
      canMakeBid: false,
      reason: 'You can only make one bid per trick'
    }
  }

  const hasBidTypeInRound = playerBids.some(playerBid => {
    const bid = game.round.roundBids.bids.find(candidate => candidate.bid_id === playerBid.bidId)
    return bid?.bid_type === bidType
  })

  if (hasBidTypeInRound) {
    return {
      canMakeBid: false,
      reason: 'You already have a bid of this type in this round'
    }
  }

  if (playerBids.length >= 3) {
    return {
      canMakeBid: false,
      reason: 'You already have the maximum of 3 bids in this round'
    }
  }

  const selectableBids = availableBids.filter(bid => getBidderCount(game, bid.bid_id) < 2)

  if (selectableBids.length === 0) {
    return {
      canMakeBid: false,
      reason: 'All bids of this type already have the maximum of 2 players'
    }
  }

  const playerRoundScore = game.round.roundScore.find(score => score.playerId === playerId)
  if (
    playerRoundScore &&
    !selectableBids.some(bid => isBidStillPossible(bid, playerRoundScore, trickNumber))
  ) {
    return {
      canMakeBid: false,
      reason: `No ${bidType} bids are possible given your current progress`
    }
  }

  return { canMakeBid: true }
}

/**
 * Multa fija por fallar una apuesta, según la ventana y la cantidad de jugadores.
 */
export function calculateBidOnLose(
  bidType: BidType,
  trickNumber: TrickNumber,
  playerCount: PlayerCount = 4
): number {
  if (trickNumber < 1 || trickNumber > 3) return 0

  if (bidType === 'set_collection') {
    if (playerCount === 2) {
      return [-15, -20, -25][trickNumber - 1] ?? 0
    }
    return [-10, -15, -20][trickNumber - 1] ?? 0
  }

  return [-20, -25, -30][trickNumber - 1] ?? 0
}

export function getCollectionNetScore(
  bid: Bid,
  playerRoundScore: PlayerRoundScore,
  bidEntry: Pick<PlayerBidEntry, 'trickNumber'>
): number {
  const condition = bid.win_condition as SetCollectionBidCondition
  const winSuitCount = playerRoundScore.setCollection[condition.win_suit] ?? 0
  const otherSuitCount = getOtherSuitCount(playerRoundScore.setCollection, condition.win_suit)
  const otherSuitPenalty = bidEntry.trickNumber * COLLECTION_OTHER_SUIT_PENALTY_PER_WINDOW

  return winSuitCount * bid.bid_score - otherSuitCount * otherSuitPenalty
}

/**
 * Determina si un bid está siendo ganado actualmente (parcial o final).
 * true = la condición se cumple ahora, false = ya es imposible o falló,
 * null = todavía depende de las bazas restantes.
 */
export function isWinningBid(
  bid: Bid,
  playerRoundScore: PlayerRoundScore,
  isRoundComplete: boolean = false,
  options: BidEvaluationOptions = {}
): boolean | null {
  if (bid.bid_type === 'trick') {
    const condition = bid.win_condition as TrickBidCondition
    const tricksWon = playerRoundScore.tricksWon
    const tricksWonCount = new Set(tricksWon).size
    const currentTrickNumber = options.currentTrickNumber
    const tricksPlayed = currentTrickNumber === undefined
      ? Math.max(0, ...tricksWon)
      : Math.max(0, currentTrickNumber - 1)

    const requiredTricks = condition.win_trick_position ?? []
    const optionalTricks = condition.may_win_trick_position ?? []
    const hasPositionConstraints = requiredTricks.length > 0 || optionalTricks.length > 0
    const allowedWonTricks = new Set([...requiredTricks, ...optionalTricks])

    if (hasPositionConstraints && tricksWon.some(trick => !allowedWonTricks.has(trick))) {
      return false
    }

    if (condition.lose_trick_position?.some(trick => tricksWon.includes(trick))) {
      return false
    }

    if (requiredTricks.some(trick => trick <= tricksPlayed && !tricksWon.includes(trick))) {
      return false
    }

    if (requiredTricks.length > 0) {
      return isRoundComplete
        ? requiredTricks.every(trick => tricksWon.includes(trick))
        : null
    }

    if (condition.win_min_tricks !== undefined || condition.win_max_tricks !== undefined) {
      const minTricks = condition.win_min_tricks ?? 0
      const maxTricks = condition.win_max_tricks ?? TOTAL_TRICKS
      const tricksRemaining = TOTAL_TRICKS - tricksPlayed

      if (tricksWonCount > maxTricks) return false
      if (tricksWonCount + tricksRemaining < minTricks) return false
      if (isRoundComplete) return tricksWonCount >= minTricks && tricksWonCount <= maxTricks
      return tricksWonCount >= minTricks && tricksWonCount <= maxTricks ? true : null
    }

    return null
  }

  if (bid.bid_type === 'points') {
    const condition = bid.win_condition as PointsBidCondition
    const points = playerRoundScore.points

    if (points > condition.max_points) return false
    if (isRoundComplete) return points >= condition.min_points && points <= condition.max_points
    return points >= condition.min_points && points <= condition.max_points ? true : null
  }

  if (bid.bid_type === 'set_collection') {
    const condition = bid.win_condition as SetCollectionBidCondition
    const bidEntry = options.bidEntry ?? { trickNumber: 1 as TrickNumber, bidId: bid.bid_id, onLose: 0, isPlayerWinning: null }
    const netScore = getCollectionNetScore(bid, playerRoundScore, bidEntry)
    const meetsFloor = netScore >= condition.floor

    return isRoundComplete ? meetsFloor : (meetsFloor ? true : null)
  }

  return null
}

export function getPlayerBidOutcome(
  bid: Bid,
  bidEntry: PlayerBidEntry,
  playerRoundScore: PlayerRoundScore
): PlayerBidOutcome {
  const isWinning = isWinningBid(bid, playerRoundScore, true, { bidEntry })

  if (bid.bid_type === 'set_collection') {
    const collectionNet = getCollectionNetScore(bid, playerRoundScore, bidEntry)
    return {
      bid,
      bidEntry,
      isWinning,
      score: isWinning ? collectionNet : bidEntry.onLose,
      collectionNet
    }
  }

  return {
    bid,
    bidEntry,
    isWinning,
    score: isWinning ? bid.bid_score : bidEntry.onLose
  }
}

export function getBidDuelAdjustment(
  game: Game,
  playerId: PlayerId,
  bidEntry: PlayerBidEntry,
  isWinning: boolean | null
): number {
  const sharedEntries = Object.entries(game.round.roundBids.playerBids)
    .flatMap(([bidderId, entries]) =>
      (entries ?? [])
        .filter((entry: PlayerBidEntry) => entry.bidId === bidEntry.bidId)
        .map((entry: PlayerBidEntry) => ({ bidderId: bidderId as PlayerId, entry }))
    )

  if (sharedEntries.length !== 2) return 0

  const other = sharedEntries.find(shared => shared.bidderId !== playerId)
  if (!other) return 0

  const bid = game.round.roundBids.bids.find(candidate => candidate.bid_id === bidEntry.bidId)
  const otherRoundScore = game.round.roundScore.find(score => score.playerId === other.bidderId)
  if (!bid || !otherRoundScore) return 0

  const otherIsWinning = isWinningBid(bid, otherRoundScore, true, { bidEntry: other.entry })
  if (isWinning === otherIsWinning) return 0

  return isWinning ? BID_DUEL_SCORE : -BID_DUEL_SCORE
}

/**
 * Calcula el score que obtiene un jugador al final del round.
 * Sin apuestas, cobra los puntos de sus cartas. Con apuestas, solo se resuelven
 * esas apuestas; si dos jugadores comparten una apuesta y solo uno la cumple,
 * hay un ajuste de duelo de ±5.
 */
export function getPlayerScoreFromRound(
  game: Game,
  playerId: PlayerId
): number {
  const playerRoundScore = game.round.roundScore.find(score => score.playerId === playerId) || {
    playerId,
    points: 0,
    tricksWon: [],
    setCollection: { acorns: 0, leaves: 0, berries: 0, flowers: 0 }
  }

  const playerBids = game.round.roundBids.playerBids[playerId] || []
  let totalScore = playerBids.length === 0 ? playerRoundScore.points : 0

  for (const bidEntry of playerBids) {
    const bid = game.round.roundBids.bids.find(candidate => candidate.bid_id === bidEntry.bidId)
    if (!bid) continue

    const outcome = getPlayerBidOutcome(bid, bidEntry, playerRoundScore)
    totalScore += outcome.score
    totalScore += getBidDuelAdjustment(game, playerId, bidEntry, outcome.isWinning)
  }

  return totalScore
}
