import type { Bid, PlayingCard, PlayerId } from "../interfaces";
// DECK SHUFFLED EVENT
/**
 * Event emitted when the deck is shuffled
 */
export interface DeckShuffledEvent {
  type: 'DECK_SHUFFLED'
  payload: {
    round: number
    deckSize: number  // Cantidad de cartas en el mazo
  }
}
export function createDeckShuffledEvent(
  round: number,
  deckSize: number
): DeckShuffledEvent {
  return {
    type: 'DECK_SHUFFLED',
    payload: { round, deckSize }
  }
}

export interface RoundSetupCompletedEvent {
  type: 'ROUND_SETUP_COMPLETED'
  payload: {
    round: number
    deckSize: number
    roundBids: {
      points: Bid | null
      set_collection: Bid | null
      trick: Bid | null
    }
  }
}
export function createRoundSetupCompletedEvent(
  round: number,
  deckSize: number,
  roundBids: {
    points: Bid | null
    set_collection: Bid | null
    trick: Bid | null
  }
): RoundSetupCompletedEvent {
  return {
    type: 'ROUND_SETUP_COMPLETED',
    payload: { round, deckSize, roundBids }
  }
}

// FIRST CARD DEALT EVENT
/**
 * Event emitted when first cards are dealt (visible to all players)
 */
export interface FirstCardDealtEvent {
  type: 'FIRST_CARD_DEALT'
  payload: {
    round: number
    firstCards: {
      playerId: PlayerId
      card: PlayingCard
    }[]
  }
}
export function createFirstCardDealtEvent(
  round: number,
  firstCards: { playerId: PlayerId; card: PlayingCard }[]
): FirstCardDealtEvent {
  return {
    type: 'FIRST_CARD_DEALT',
    payload: { round, firstCards }
  }
}

// REMAINING CARDS DEALT EVENT
/**
 * Event emitted when remaining 4 cards are dealt to a specific player (private)
 */
export interface RemainingCardsDealtEvent {
  type: 'REMAINING_CARDS_DEALT_PRIVATE'
  payload: {
    playerId: PlayerId
    cards: PlayingCard[]  // 4 cartas privadas
  }
}
export function createRemainingCardsDealtEvent(
  playerId: PlayerId,
  cards: PlayingCard[]
): RemainingCardsDealtEvent {
  return {
    type: 'REMAINING_CARDS_DEALT_PRIVATE',
    payload: { playerId, cards }
  }
}
// CARD REPLACED PUBLIC EVENT
/**
 * Event emitted to all players when someone replaces a card (public info)
 */
export interface CardReplacedPublicEvent {
  type: 'CARD_REPLACED_PUBLIC'
  payload: {
    playerId: PlayerId
    round: number
  }
}
export function createCardReplacedPublicEvent(
  playerId: PlayerId,
  round: number
): CardReplacedPublicEvent {
  return {
    type: 'CARD_REPLACED_PUBLIC',
    payload: { playerId, round }
  }
}
// FIRST CARD HIDDEN EVENT
/**
 * Event emitted when first cards are hidden (back to hand)
 */
export interface FirstCardHiddenEvent {
  type: 'FIRST_CARD_HIDDEN'
  payload: {
    round: number
    playerIds: PlayerId[]
  }
}
export function createFirstCardHiddenEvent(
  round: number,
  playerIds: PlayerId[]
): FirstCardHiddenEvent {
  return {
    type: 'FIRST_CARD_HIDDEN',
    payload: { round, playerIds }
  }
}
// TRICK STARTED EVENT
/**
 * Event emitted when a new trick begins
 */
export interface TrickStartedEvent {
  type: 'TRICK_STARTED'
  payload: {
    trick_id: string
    trickNumber: 1 | 2 | 3 | 4 | 5
    leadPlayer: PlayerId
  }
}
export function createTrickStartedEvent(
  trick_id: string,
  trickNumber: 1 | 2 | 3 | 4 | 5,
  leadPlayer: PlayerId
): TrickStartedEvent {
  return {
    type: 'TRICK_STARTED',
    payload: { trick_id, trickNumber, leadPlayer }
  }
}
// TRICK COMPLETED EVENT
/**
 * Event emitted when a trick is completed
 */
export interface TrickCompletedEvent {
  type: 'TRICK_COMPLETED'
  payload: {
    trickNumber: 1 | 2 | 3 | 4 | 5
    winner: PlayerId
    points: number
    cards: PlayingCard[]
  }
}
export function createTrickCompletedEvent(
  trickNumber: 1 | 2 | 3 | 4 | 5,
  winner: PlayerId,
  points: number,
  cards: PlayingCard[]
): TrickCompletedEvent {
  return {
    type: 'TRICK_COMPLETED',
    payload: { trickNumber, winner, points, cards }
  }
}
// ROUND ENDED EVENT
/**
 * Event emitted when a round ends
 */
export interface RoundEndedEvent {
  type: 'ROUND_ENDED'
  payload: {
    round: number
    scores: Record<PlayerId, number>
  }
}
export function createRoundEndedEvent(
  round: number,
  scores: Record<PlayerId, number>
): RoundEndedEvent {
  return {
    type: 'ROUND_ENDED',
    payload: { round, scores }
  }
}
// UNION TYPE
export type GameEvent = 
  | DeckShuffledEvent
  | FirstCardDealtEvent
  | RemainingCardsDealtEvent
  | CardReplacedPublicEvent
  | FirstCardHiddenEvent
  | TrickStartedEvent
  | TrickCompletedEvent
  | RoundEndedEvent
  | RoundSetupCompletedEvent