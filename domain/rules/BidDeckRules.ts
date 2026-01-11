import { BID_DEFINITIONS } from '../data/bidDefinitions'
import type { Bid, BidPool } from '../interfaces'


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
      bid_id: def.type + '_' + def.score,
      bid_type: def.type,
      bid_score: def.score,
      current_bids: {
        trick_1: { bidder: null, onLose: def.type === 'set_collection' ? -10 : -5 },
        trick_2: { bidder: null, onLose: def.type === 'set_collection' ? -15 : -10 },
        trick_3: { bidder: null, onLose: def.type === 'set_collection' ? -20 : -15 }
      },
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
 * Deals 1 bid from each shuffled deck to create a BidPool for the round.
 * Takes the first bid from each deck array.
 */
export function updateBidsPool(
  shuffledSetCollection: Bid[],
  shuffledPoints: Bid[],
  shuffledTricks: Bid[]
): BidPool {
  const setCollectionBid = shuffledSetCollection[0];
  const pointsBid = shuffledPoints[0];
  const trickBid = shuffledTricks[0];
  
  if (!setCollectionBid || !pointsBid || !trickBid) {
    throw new Error('Bid decks must have at least one bid each');
  }
  
  return {
    setCollectionBid,
    pointsBid,
    trickBid
  }
}
