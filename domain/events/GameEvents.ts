import type { Bid, PlayingCard, PlayerId, PlayerBidsMap } from "../interfaces";
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
    roundPhase: 'player_drawing'
    playerTurn: PlayerId
    currentTrick: null
    roundBids: {
      bids: Bid[]
      playerBids: PlayerBidsMap
    }
  }
}
export function createRoundSetupCompletedEvent(
  round: number,
  deckSize: number,
  roundPhase: 'player_drawing',
  playerTurn: PlayerId,
  currentTrick: null,
  roundBids: {
    bids: Bid[]
    playerBids: PlayerBidsMap
  }
): RoundSetupCompletedEvent {
  return {
    type: 'ROUND_SETUP_COMPLETED',
    payload: { round, deckSize, roundPhase, playerTurn, currentTrick, roundBids }
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
// CARD PLAYED EVENT
/**
 * Event emitted when a player plays a card in a trick
 */
export interface CardPlayedEvent {
  type: 'CARD_PLAYED'
  payload: {
    trick_id: string
    playerId: PlayerId
    card: PlayingCard
    trickNumber: 1 | 2 | 3 | 4 | 5
    nextPlayer: PlayerId | null
  }
}
export function createCardPlayedEvent(
  trick_id: string,
  playerId: PlayerId,
  card: PlayingCard,
  trickNumber: 1 | 2 | 3 | 4 | 5,
  nextPlayer: PlayerId | null
): CardPlayedEvent {
  return {
    type: 'CARD_PLAYED',
    payload: { trick_id, playerId, card, trickNumber, nextPlayer }
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
    winningCard: string
    points: number
    cards: PlayingCard[]
    collections: {
      acorns: number
      leaves: number
      berries: number
      flowers: number
    } | null
    stolenCardInfo?: {
      thiefId: PlayerId
      stolenCardId: string
      stolenCard: PlayingCard
      points: number
      collections: {
        acorns: number
        leaves: number
        berries: number
        flowers: number
      }
    }
  }
}
export function createTrickCompletedEvent(
  trickNumber: 1 | 2 | 3 | 4 | 5,
  winner: PlayerId,
  winningCard: string,
  points: number,
  cards: PlayingCard[],
  collections: { acorns: number; leaves: number; berries: number; flowers: number } | null,
  stolenCardInfo?: {
    thiefId: PlayerId
    stolenCardId: string
    stolenCard: PlayingCard
    points: number
    collections: {
      acorns: number
      leaves: number
      berries: number
      flowers: number
    }
  }
): TrickCompletedEvent {
  return {
    type: 'TRICK_COMPLETED',
    payload: { trickNumber, winner, winningCard, points, cards, collections, stolenCardInfo }
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
    playerScores?: Array<{
      playerId: PlayerId
      score: number
    }>
  }
}
export function createRoundEndedEvent(
  round: number,
  scores: Record<PlayerId, number>,
  playerScores?: Array<{ playerId: PlayerId; score: number }>
): RoundEndedEvent {
  return {
    type: 'ROUND_ENDED',
    payload: { round, scores, playerScores }
  }
}

// PLAYER CONFIRMED ROUND END EVENT
/**
 * Event emitted when a player confirms they've seen the round end modal
 */
export interface PlayerConfirmedRoundEndEvent {
  type: 'PLAYER_CONFIRMED_ROUND_END'
  payload: {
    playerId: PlayerId
    round: number
  }
}
export function createPlayerConfirmedRoundEndEvent(
  playerId: PlayerId,
  round: number
): PlayerConfirmedRoundEndEvent {
  return {
    type: 'PLAYER_CONFIRMED_ROUND_END',
    payload: { playerId, round }
  }
}
// BID MADE EVENT
/**
 * Event emitted when a player makes a bid
 */
export interface BidMadeEvent {
  type: 'BID_MADE'
  payload: {
    playerId: PlayerId
    bidId: string
    bidType: 'points' | 'set_collection' | 'trick'
    trickNumber: 1 | 2 | 3
    bidScore: number
    onLose: number
  }
}
export function createBidMadeEvent(
  playerId: PlayerId,
  bidId: string,
  bidType: 'points' | 'set_collection' | 'trick',
  trickNumber: 1 | 2 | 3,
  bidScore: number,
  onLose: number
): BidMadeEvent {
  return {
    type: 'BID_MADE',
    payload: { playerId, bidId, bidType, trickNumber, bidScore, onLose }
  }
}

// TURN FINISHED EVENT
/**
 * Event emitted when a player finishes their turn
 */
export interface TurnFinishedEvent {
  type: 'TURN_FINISHED'
  payload: {
    playerId: PlayerId
    nextPlayer: PlayerId
    trickNumber: 1 | 2 | 3 | 4 | 5
  }
}
export function createTurnFinishedEvent(
  playerId: PlayerId,
  nextPlayer: PlayerId,
  trickNumber: 1 | 2 | 3 | 4 | 5
): TurnFinishedEvent {
  return {
    type: 'TURN_FINISHED',
    payload: { playerId, nextPlayer, trickNumber }
  }
}

// TRICK FINISHED EVENT
/**
 * Event emitted when a trick is finished and moved to history
 */
export interface TrickFinishedEvent {
  type: 'TRICK_FINISHED'
  payload: {
    trickNumber: 1 | 2 | 3 | 4 | 5
    nextTrickNumber: 1 | 2 | 3 | 4 | 5 | null
  }
}
export function createTrickFinishedEvent(
  trickNumber: 1 | 2 | 3 | 4 | 5,
  nextTrickNumber: 1 | 2 | 3 | 4 | 5 | null
): TrickFinishedEvent {
  return {
    type: 'TRICK_FINISHED',
    payload: { trickNumber, nextTrickNumber }
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
    bidType: 'points' | 'set_collection' | 'trick'
    trickNumber: 1 | 2 | 3
  }
}
export function createBidPlacedEvent(
  playerId: PlayerId,
  bidId: number,
  bidType: 'points' | 'set_collection' | 'trick',
  trickNumber: 1 | 2 | 3
): BidPlacedEvent {
  return {
    type: 'BID_PLACED',
    payload: { playerId, bidId, bidType, trickNumber }
  }
}

// CARD REPLACEMENT SKIPPED EVENT
/**
 * Event emitted when a player skips card replacement
 */
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
/**
 * Event emitted when a player completes card replacement
 */
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

// GAME ENDED EVENT
/**
 * Event emitted when the game ends and a winner is determined
 */
export interface GameEndedEvent {
  type: 'GAME_ENDED'
  payload: {
    winnerId: PlayerId
    winnerName: string
    finalScores: Array<{
      playerId: PlayerId
      score: number
    }>
  }
}
export function createGameEndedEvent(
  winnerId: PlayerId,
  winnerName: string,
  finalScores: Array<{ playerId: PlayerId; score: number }>
): GameEndedEvent {
  return {
    type: 'GAME_ENDED',
    payload: { winnerId, winnerName, finalScores }
  }
}

// PICK NEXT LEAD PLAYER EVENT
/**
 * Event emitted when a player needs to select who will be the next lead player
 */
export interface PickNextLeadEvent {
  type: 'PICK_NEXT_LEAD'
  payload: {
    playerId: PlayerId
    trickNumber: 1 | 2 | 3 | 4 | 5
    availablePlayers: PlayerId[]
  }
}
export function createPickNextLeadEvent(
  playerId: PlayerId,
  trickNumber: 1 | 2 | 3 | 4 | 5,
  availablePlayers: PlayerId[]
): PickNextLeadEvent {
  return {
    type: 'PICK_NEXT_LEAD',
    payload: { playerId, trickNumber, availablePlayers }
  }
}

// NEXT LEAD PLAYER SELECTED EVENT
/**
 * Event emitted when a player selects who will be the next lead player
 */
export interface NextLeadPlayerSelectedEvent {
  type: 'NEXT_LEAD_PLAYER_SELECTED'
  payload: {
    playerId: PlayerId
    selectedLeadPlayer: PlayerId
    trickNumber: 1 | 2 | 3 | 4 | 5
  }
}
export function createNextLeadPlayerSelectedEvent(
  playerId: PlayerId,
  selectedLeadPlayer: PlayerId,
  trickNumber: 1 | 2 | 3 | 4 | 5
): NextLeadPlayerSelectedEvent {
  return {
    type: 'NEXT_LEAD_PLAYER_SELECTED',
    payload: { playerId, selectedLeadPlayer, trickNumber }
  }
}

// PICK CARD FROM TRICK EVENT
/**
 * Event emitted when a player needs to select a card from a completed trick to steal
 */
export interface PickCardFromTrickEvent {
  type: 'PICK_CARD_FROM_TRICK'
  payload: {
    playerId: PlayerId
    trickNumber: 1 | 2 | 3 | 4 | 5
    availableCards: string[]
  }
}
export function createPickCardFromTrickEvent(
  playerId: PlayerId,
  trickNumber: 1 | 2 | 3 | 4 | 5,
  availableCards: string[]
): PickCardFromTrickEvent {
  return {
    type: 'PICK_CARD_FROM_TRICK',
    payload: { playerId, trickNumber, availableCards }
  }
}

// CARD STOLEN FROM TRICK EVENT
/**
 * Event emitted when a player steals a card from a completed trick
 */
export interface CardStolenFromTrickEvent {
  type: 'CARD_STOLEN_FROM_TRICK'
  payload: {
    playerId: PlayerId
    stolenCardId: string
    trickNumber: 1 | 2 | 3 | 4 | 5
  }
}
export function createCardStolenFromTrickEvent(
  playerId: PlayerId,
  stolenCardId: string,
  trickNumber: 1 | 2 | 3 | 4 | 5
): CardStolenFromTrickEvent {
  return {
    type: 'CARD_STOLEN_FROM_TRICK',
    payload: { playerId, stolenCardId, trickNumber }
  }
}

// UNION TYPE
export type GameEvent = 
  | DeckShuffledEvent
  | RoundSetupCompletedEvent
  | FirstCardDealtEvent
  | RemainingCardsDealtEvent
  | CardReplacedPublicEvent
  | CardReplacedPrivateEvent
  | FirstCardHiddenEvent
  | TrickStartedEvent
  | CardPlayedEvent
  | TrickCompletedEvent
  | RoundEndedEvent
  | PlayerConfirmedRoundEndEvent
  | BidMadeEvent
  | BidPlacedEvent
  | TurnFinishedEvent
  | TrickFinishedEvent
  | CardReplacementSkippedEvent
  | CardReplacementCompletedEvent
  | GameEndedEvent
  | PickNextLeadEvent
  | NextLeadPlayerSelectedEvent
  | PickCardFromTrickEvent
  | CardStolenFromTrickEvent