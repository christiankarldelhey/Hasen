import { BID_DEFINITIONS } from '../data/bidDefinitions'
import type { Bid, BidPool } from '../interfaces'

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

export interface BidDecks {
  setCollectionBidDeck: Bid[]
  pointsBidDeck: Bid[]
  tricksBidDeck: Bid[]
}

/**
 * Creates three separate bid decks based on bid type.
 * Returns an object with setCollectionBidDeck, pointsBidDeck, and tricksBidDeck.
 */
export function createBidDeck(): BidDecks {
  const setCollectionBidDeck: Bid[] = []
  const pointsBidDeck: Bid[] = []
  const tricksBidDeck: Bid[] = []
  BID_DEFINITIONS.forEach((def: any) => {
    const bid: Bid = {
      bid_id: generateUUID(),
      bid_type: def.type,
      bid_score: def.score,
      win_condition: def.win_condition,
      bid_winner: null
    }
    if (def.type === 'set_collection') {
      setCollectionBidDeck.push(bid)
    } else if (def.type === 'points') {
      pointsBidDeck.push(bid)
    } else if (def.type === 'trick') {
      tricksBidDeck.push(bid)
    }
  })
  return {
    setCollectionBidDeck,
    pointsBidDeck,
    tricksBidDeck
  }
}

/**
 * Shuffles a bid deck using the Fisher-Yates algorithm.
 * Returns a new shuffled array without modifying the original.
 */
export function shuffleBidDeck(deck: Bid[]): Bid[] {
  const shuffled = [...deck]
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    const swapItem = shuffled[j];
    if (temp && swapItem) {
      shuffled[i] = swapItem;
      shuffled[j] = temp;
    }
  }
  
  return shuffled
}

/**
 * Deals 2 bids from each shuffled deck to create a BidPool for the round.
 * Takes the first 2 bids from each deck array.
 */
export function updateBidsPool(
  shuffledSetCollection: Bid[],
  shuffledPoints: Bid[],
  shuffledTricks: Bid[]
): BidPool {
  const setCollectionBids = shuffledSetCollection.slice(0, 2);
  const pointsBids = shuffledPoints.slice(0, 2);
  const trickBids = shuffledTricks.slice(0, 2);
  
  if (setCollectionBids.length < 2 || pointsBids.length < 2 || trickBids.length < 2) {
    throw new Error('Bid decks must have at least 2 bids each');
  }
  
  return {
    bids: [...setCollectionBids, ...pointsBids, ...trickBids],
    playerBids: {}
  }
}
