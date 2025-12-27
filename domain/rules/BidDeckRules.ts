import { BID_DEFINITIONS } from '../data/bidDefinitions'
import { Bid, BidPool } from '../interfaces'


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
      bid_id: parseInt(def.type + '_' + def.score),
      bid_type: def.type,
      bid_score: def.score,
      current_bids: {
        trick_1: null,
        trick_2: null,
        trick_3: null
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
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  return shuffled
}

/**
 * Deals 3 bids from each shuffled deck to create a BidPool for the round.
 * Takes the first 3 bids from each deck array.
 */
export function updateBidsPool(
  shuffledSetCollection: Bid[],
  shuffledPoints: Bid[],
  shuffledTricks: Bid[]
): BidPool {
  return {
    setCollectionBids: [
      shuffledSetCollection[0],
      shuffledSetCollection[1],
      shuffledSetCollection[2]
    ] as [Bid, Bid, Bid],
    pointsBids: [
      shuffledPoints[0],
      shuffledPoints[1],
      shuffledPoints[2]
    ] as [Bid, Bid, Bid],
    trickBids: [
      shuffledTricks[0],
      shuffledTricks[1],
      shuffledTricks[2]
    ] as [Bid, Bid, Bid]
  }
}
