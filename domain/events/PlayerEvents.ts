import type { PlayerId, PlayingCard, TrickNumber, BidType } from '../interfaces'

// CARD PLAYED EVENT

/**
 * Event emitted when a player plays a valid card
 */
export interface CardPlayedEvent {
  type: 'CARD_PLAYED'
  payload: {
    playerId: PlayerId
    card: PlayingCard
    trickNumber: TrickNumber
    positionInTrick: 1 | 2 | 3 | 4
    nextPlayerId: PlayerId | null
  }
}

export function createCardPlayedEvent(
  playerId: PlayerId,
  card: PlayingCard,
  trickNumber: TrickNumber,
  positionInTrick: 1 | 2 | 3 | 4,
  nextPlayerId: PlayerId | null
): CardPlayedEvent {
  return {
    type: 'CARD_PLAYED',
    payload: {
      playerId,
      card,
      trickNumber,
      positionInTrick,
      nextPlayerId
    }
  }
}

// CARD REPLACED PRIVATE EVENT

/**
 * Event emitted to the player who replaced a card (private info)
 */
export interface CardReplacedPrivateEvent {
  type: 'CARD_REPLACED_PRIVATE'
  payload: {
    playerId: PlayerId
    cardToReplace: PlayingCard
    replacementCard: PlayingCard
  }
}

export function createCardReplacedPrivateEvent(
  playerId: PlayerId,
  cardToReplace: PlayingCard,
  replacementCard: PlayingCard
): CardReplacedPrivateEvent {
  return {
    type: 'CARD_REPLACED_PRIVATE',
    payload: { playerId, cardToReplace, replacementCard }
  }
}

// BID PLACED EVENT

/**
 * Event emitted when a player places a bid
 */
export interface BidPlacedEvent {
  type: 'BID_PLACED'
  payload: {
    playerId: PlayerId
    bidId: number
    bidType: BidType
    trickNumber: TrickNumber
  }
}

export function createBidPlacedEvent(
  playerId: PlayerId,
  bidId: number,
  bidType: BidType,
  trickNumber: TrickNumber
): BidPlacedEvent {
  return {
    type: 'BID_PLACED',
    payload: { playerId, bidId, bidType, trickNumber }
  }
}

// CARD REPLACEMENT SKIPPED EVENT

export interface CardReplacementSkippedEvent {
  type: 'CARD_REPLACEMENT_SKIPPED'
  payload: {
    playerId: PlayerId
    round: number
    nextPlayerId: PlayerId
  }
}

export function createCardReplacementSkippedEvent(
  playerId: PlayerId,
  round: number,
  nextPlayerId: PlayerId
): CardReplacementSkippedEvent {
  return {
    type: 'CARD_REPLACEMENT_SKIPPED',
    payload: { playerId, round, nextPlayerId }
  }
}

// CARD REPLACEMENT COMPLETED EVENT

export interface CardReplacementCompletedEvent {
  type: 'CARD_REPLACEMENT_COMPLETED'
  payload: {
    playerId: PlayerId
    round: number
    nextPlayerId: PlayerId
  }
}

export function createCardReplacementCompletedEvent(
  playerId: PlayerId,
  round: number,
  nextPlayerId: PlayerId
): CardReplacementCompletedEvent {
  return {
    type: 'CARD_REPLACEMENT_COMPLETED',
    payload: { playerId, round, nextPlayerId }
  }
}

// UNION TYPE

export type PlayerEvent = 
  | CardPlayedEvent
  | CardReplacedPrivateEvent
  | BidPlacedEvent
  | CardReplacementSkippedEvent
  | CardReplacementCompletedEvent