import { BID_DEFINITIONS } from '../data/bidDefinitions'
import type { Bid, BidPool, PlayerCount } from '../interfaces'

export const BIDS_PER_TYPE_PER_ROUND = 2
export const GAME_TOTAL_LAPS = 2

export interface BidDecks {
  setCollectionBidDeck: Bid[]
  pointsBidDeck: Bid[]
  tricksBidDeck: Bid[]
}

export interface BidDeckCounts {
  set_collection: number
  points: number
  trick: number
}

/**
 * Genera un UUID v4 simple compatible con frontend y backend
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function normalizePlayerCount(playerCount: number): PlayerCount {
  return Math.min(4, Math.max(2, playerCount)) as PlayerCount
}

/**
 * Creates the three bid decks for the actual number of active players.
 * Each definition contributes its configured number of copies and receives the
 * score that corresponds to that player count.
 */
export function createBidDeck(playerCount: number): BidDecks {
  const normalizedPlayerCount = normalizePlayerCount(playerCount)
  const setCollectionBidDeck: Bid[] = []
  const pointsBidDeck: Bid[] = []
  const tricksBidDeck: Bid[] = []

  BID_DEFINITIONS.forEach(definition => {
    const copies = definition.copies[normalizedPlayerCount]

    for (let index = 0; index < copies; index++) {
      const bid: Bid = {
        bid_id: generateUUID(),
        bid_type: definition.type,
        bid_score: definition.score[normalizedPlayerCount],
        win_condition: definition.win_condition
      }

      if (definition.type === 'set_collection') {
        setCollectionBidDeck.push(bid)
      } else if (definition.type === 'points') {
        pointsBidDeck.push(bid)
      } else {
        tricksBidDeck.push(bid)
      }
    }
  })

  return {
    setCollectionBidDeck: shuffleBidDeck(setCollectionBidDeck),
    pointsBidDeck: shuffleBidDeck(pointsBidDeck),
    tricksBidDeck: shuffleBidDeck(tricksBidDeck)
  }
}

/**
 * Shuffles a bid deck using the Fisher-Yates algorithm.
 * Returns a new shuffled array without modifying the original.
 */
export function shuffleBidDeck(deck: Bid[]): Bid[] {
  const shuffled = [...deck]

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    const swapItem = shuffled[j]
    if (temp && swapItem) {
      shuffled[i] = swapItem
      shuffled[j] = temp
    }
  }

  return shuffled
}

export function getBidDeckSize(playerCount: number): number {
  const normalizedPlayerCount = normalizePlayerCount(playerCount)
  return BID_DEFINITIONS.reduce(
    (total, definition) => total + definition.copies[normalizedPlayerCount],
    0
  ) / 3
}

export function getTotalRounds(playerCount: number): number {
  return getBidDeckSize(playerCount) / BIDS_PER_TYPE_PER_ROUND
}

export function getBidDeckCounts(decks: BidDecks): BidDeckCounts {
  return {
    set_collection: decks.setCollectionBidDeck.length,
    points: decks.pointsBidDeck.length,
    trick: decks.tricksBidDeck.length
  }
}

export function getRemainingBidRounds(decks: BidDecks): number {
  return Math.min(
    decks.setCollectionBidDeck.length,
    decks.pointsBidDeck.length,
    decks.tricksBidDeck.length
  ) / BIDS_PER_TYPE_PER_ROUND
}

export function canDrawBidPool(decks: BidDecks): boolean {
  return getRemainingBidRounds(decks) >= 1
}

/**
 * Removes the next complete pool from the decks. Consumed bids never return to
 * their decks, so each bid card can appear at most once in a match.
 */
export function drawBidPool(decks: BidDecks): BidPool {
  if (!canDrawBidPool(decks)) {
    throw new Error('Bid decks do not have enough cards for a complete bid pool')
  }

  return {
    bids: [
      ...decks.setCollectionBidDeck.splice(0, BIDS_PER_TYPE_PER_ROUND),
      ...decks.pointsBidDeck.splice(0, BIDS_PER_TYPE_PER_ROUND),
      ...decks.tricksBidDeck.splice(0, BIDS_PER_TYPE_PER_ROUND)
    ],
    playerBids: {
      player_1: [],
      player_2: [],
      player_3: [],
      player_4: []
    }
  }
}
