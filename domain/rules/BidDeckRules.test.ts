import { describe, expect, it } from 'vitest'
import {
  canDrawBidPool,
  createBidDeck,
  drawBidPool,
  getBidDeckCounts,
  getBidDeckSize,
  getTotalRounds
} from './BidDeckRules'

const byCondition = (bid: unknown) => JSON.stringify((bid as { win_condition: unknown }).win_condition)

describe('BidDeckRules', () => {
  it.each<[number, number, number]>([
    [2, 8, 4],
    [3, 12, 6],
    [4, 16, 8]
  ])('creates %i-player decks with %i cards per type for %i rounds', (playerCount, expectedCards, expectedRounds) => {
    const decks = createBidDeck(playerCount)

    expect(decks.setCollectionBidDeck).toHaveLength(expectedCards)
    expect(decks.pointsBidDeck).toHaveLength(expectedCards)
    expect(decks.tricksBidDeck).toHaveLength(expectedCards)
    expect(getBidDeckSize(playerCount)).toBe(expectedCards)
    expect(getTotalRounds(playerCount)).toBe(expectedRounds)
    expect(getBidDeckCounts(decks)).toEqual({
      set_collection: expectedCards,
      points: expectedCards,
      trick: expectedCards
    })
  })

  it('materializes the prize for the actual player count', () => {
    const twoPlayerDecks = createBidDeck(2)
    const fourPlayerDecks = createBidDeck(4)

    const twoPlayerNoTricks = twoPlayerDecks.tricksBidDeck.find(
      bid => byCondition(bid) === JSON.stringify({ win_min_tricks: 0, win_max_tricks: 0 })
    )
    const fourPlayerNoTricks = fourPlayerDecks.tricksBidDeck.find(
      bid => byCondition(bid) === JSON.stringify({ win_min_tricks: 0, win_max_tricks: 0 })
    )

    expect(twoPlayerNoTricks?.bid_score).toBe(40)
    expect(fourPlayerNoTricks?.bid_score).toBe(20)
  })

  it('excludes player-count-specific definitions and includes the correct copies', () => {
    const twoPlayerDecks = createBidDeck(2)
    const threePlayerDecks = createBidDeck(3)
    const fourPlayerDecks = createBidDeck(4)

    const allTricks = JSON.stringify({ win_trick_position: [1, 2, 3, 4, 5] })
    const exactlyThree = JSON.stringify({ win_min_tricks: 3, win_max_tricks: 3 })
    const pointsTwentyForty = JSON.stringify({ min_points: 20, max_points: 40 })
    const flowers = JSON.stringify({ win_suit: 'flowers', floor: 20 })

    expect(twoPlayerDecks.tricksBidDeck.filter(bid => byCondition(bid) === allTricks)).toHaveLength(1)
    expect(threePlayerDecks.tricksBidDeck.filter(bid => byCondition(bid) === allTricks)).toHaveLength(0)
    expect(fourPlayerDecks.tricksBidDeck.filter(bid => byCondition(bid) === exactlyThree)).toHaveLength(2)
    expect(twoPlayerDecks.pointsBidDeck.filter(bid => byCondition(bid) === pointsTwentyForty)).toHaveLength(0)
    expect(threePlayerDecks.pointsBidDeck.filter(bid => byCondition(bid) === pointsTwentyForty)).toHaveLength(2)
    expect(threePlayerDecks.setCollectionBidDeck.filter(bid => byCondition(bid) === flowers)).toHaveLength(0)
    expect(fourPlayerDecks.setCollectionBidDeck.filter(bid => byCondition(bid) === flowers)).toHaveLength(1)
  })

  it('draws a complete pool and consumes it without repetition', () => {
    const decks = createBidDeck(4)
    const pool = drawBidPool(decks)

    expect(pool.bids).toHaveLength(6)
    expect(pool.bids.filter(bid => bid.bid_type === 'set_collection')).toHaveLength(2)
    expect(pool.bids.filter(bid => bid.bid_type === 'points')).toHaveLength(2)
    expect(pool.bids.filter(bid => bid.bid_type === 'trick')).toHaveLength(2)
    expect(getBidDeckCounts(decks)).toEqual({ set_collection: 14, points: 14, trick: 14 })

    const allDrawn: string[] = []
    while (canDrawBidPool(decks)) {
      allDrawn.push(...drawBidPool(decks).bids.map(bid => bid.bid_id))
    }

    const allIds = [
      ...pool.bids.map(bid => bid.bid_id),
      ...allDrawn
    ]
    expect(new Set(allIds).size).toBe(allIds.length)
    expect(allIds).toHaveLength(48)
    expect(canDrawBidPool(decks)).toBe(false)
    expect(() => drawBidPool(decks)).toThrow('Bid decks do not have enough cards for a complete bid pool')
  })
})
