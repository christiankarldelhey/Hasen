import { describe, expect, it } from 'vitest'
import type { Bid, BidType, PlayerBidsMap, PlayerCount } from '../interfaces/Bid'
import type { Game } from '../interfaces/Game'
import type { PlayerId } from '../interfaces/Player'
import type { RoundPhase } from '../interfaces/Round'
import type { TrickNumber, TrickState } from '../interfaces/Trick'
import { calculateBidOnLose, canMakeBid, canMakeSpecificBid, isWinningBid, getPlayerScoreFromRound } from './BidRules'

function createGameFixture(options?: {
  playerTurn?: PlayerId
  trickNumber?: TrickNumber
  trickState?: TrickState
  roundPhase?: RoundPhase
  playerBids?: PlayerBidsMap
  bids?: Bid[]
  roundScorePoints?: number
  roundScoreTricksWon?: TrickNumber[]
}): Game {
  const trickBid: Bid = {
    bid_id: 'trick-1',
    bid_type: 'trick',
    bid_score: 20,
    win_condition: {
      win_min_tricks: 1,
      win_max_tricks: 2
    }
  }

  const pointsBid: Bid = {
    bid_id: 'points-1',
    bid_type: 'points',
    bid_score: 20,
    win_condition: {
      min_points: 20,
      max_points: 40
    }
  }

  return {
    gameId: 'game-1',
    gameName: 'Test Game',
    hostPlayer: 'player_1',
    hostUserId: 'host-user',
    activePlayers: [
      { id: 'player_1', name: 'P1', color: '#111', defaultAvatar: 'a1.png' },
      { id: 'player_2', name: 'P2', color: '#222', defaultAvatar: 'a2.png' }
    ],
    deck: [],
    discardPile: [],
    bidDecks: {
      setCollectionBidDeck: [],
      pointsBidDeck: [pointsBid],
      tricksBidDeck: [trickBid]
    },
    gamePhase: 'playing',
    round: {
      round: 1,
      playerTurn: options?.playerTurn ?? 'player_1',
      roundBids: {
        bids: options?.bids ?? [trickBid, pointsBid],
        playerBids: options?.playerBids ?? {}
      },
      roundPhase: options?.roundPhase ?? 'playing',
      currentTrick: {
        trick_id: 'trick-1',
        trick_state: options?.trickState ?? 'in_progress',
        trick_number: options?.trickNumber ?? 1,
        lead_player: 'player_1',
        winning_card: null,
        lead_suit: null,
        cards: [],
        score: {
          trick_winner: null,
          trick_points: 0,
          trick_collections: null
        }
      },
      roundScore: [
        {
          playerId: 'player_1',
          points: options?.roundScorePoints ?? 0,
          tricksWon: options?.roundScoreTricksWon ?? [],
          setCollection: {
            acorns: 0,
            leaves: 0,
            berries: 0,
            flowers: 0
          }
        }
      ]
    },
    playerTurnOrder: ['player_1', 'player_2'],
    tricksHistory: [],
    bidsHistory: [],
    playerScores: [],
    winner: null,
    gameSettings: {
      minPlayers: 2,
      maxPlayers: 4,
      reconnectionTimeoutMinutes: 3
    }
  }
}

describe('canMakeBid', () => {
  it('rejects when it is not the player turn', () => {
    const game = createGameFixture({ playerTurn: 'player_2' })

    const result = canMakeBid(game, 'player_1', 'trick', 1)

    expect(result.canMakeBid).toBe(false)
    expect(result.reason).toBe('Not your turn')
  })

  it('rejects bids after trick 3', () => {
    const game = createGameFixture({ trickNumber: 4 })

    const result = canMakeBid(game, 'player_1', 'trick', 4)

    expect(result.canMakeBid).toBe(false)
    expect(result.reason).toBe('You can only make bids in the first 3 tricks')
  })

  it('rejects when trick is not active', () => {
    const game = createGameFixture({ trickState: 'resolve' })

    const result = canMakeBid(game, 'player_1', 'trick', 1)

    expect(result.canMakeBid).toBe(false)
    expect(result.reason).toBe('Trick must be active to make a bid')
  })

  it('rejects when player already made a bid in the same trick', () => {
    const game = createGameFixture({
      playerBids: {
        player_1: [
          {
            bidId: 'trick-1',
            trickNumber: 1,
            onLose: -20,
            isPlayerWinning: null
          }
        ]
      }
    })

    const result = canMakeBid(game, 'player_1', 'points', 1)

    expect(result.canMakeBid).toBe(false)
    expect(result.reason).toBe('You can only make one bid per trick')
  })

  it('allows a bid when rules are satisfied', () => {
    const game = createGameFixture()

    const result = canMakeBid(game, 'player_1', 'trick', 1)

    expect(result.canMakeBid).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('rejects trick bids when player already won outside may+required trick positions', () => {
    const trickBidWithMayWin: Bid = {
      bid_id: 'trick-may-window',
      bid_type: 'trick',
      bid_score: 30,
      win_condition: {
        may_win_trick_position: [2, 3],
        win_trick_position: [4, 5]
      }
    }

    const game = createGameFixture({
      bids: [trickBidWithMayWin],
      roundScoreTricksWon: [1]
    })

    const result = canMakeBid(game, 'player_1', 'trick', 2)

    expect(result.canMakeBid).toBe(false)
    expect(result.reason).toBe('No trick bids are possible given your current progress')
  })

  it('rejects a specific bid once two players already took it', () => {
    const trickBid: Bid = {
      bid_id: 'shared-trick',
      bid_type: 'trick',
      bid_score: 50,
      win_condition: { win_min_tricks: 1, win_max_tricks: 1 }
    }
    const otherTrickBid: Bid = {
      bid_id: 'other-trick',
      bid_type: 'trick',
      bid_score: 35,
      win_condition: { win_min_tricks: 0, win_max_tricks: 0 }
    }
    const game = createGameFixture({
      bids: [trickBid, otherTrickBid],
      playerBids: {
        player_2: [{ bidId: trickBid.bid_id, trickNumber: 1, onLose: -20, isPlayerWinning: null }],
        player_3: [{ bidId: trickBid.bid_id, trickNumber: 1, onLose: -20, isPlayerWinning: null }]
      }
    })

    const result = canMakeSpecificBid(game, 'player_1', trickBid, 1)

    expect(result.canMakeBid).toBe(false)
    expect(result.reason).toBe('This bid already has the maximum of 2 players')
  })
})

describe('calculateBidOnLose', () => {
  it.each<[BidType, TrickNumber, PlayerCount, number]>([
    ['set_collection', 1, 4, -10],
    ['set_collection', 2, 4, -15],
    ['set_collection', 3, 4, -20],
    ['set_collection', 1, 2, -15],
    ['set_collection', 2, 2, -20],
    ['set_collection', 3, 2, -25],
    ['trick', 1, 4, -20],
    ['trick', 2, 4, -25],
    ['trick', 3, 4, -30],
    ['points', 1, 4, -20],
    ['points', 2, 4, -25],
    ['points', 3, 4, -30],
    ['trick', 4, 4, 0]
  ])('returns %s penalty for trick %i with %i players', (bidType: BidType, trickNumber: TrickNumber, playerCount: PlayerCount, expected: number) => {
    expect(calculateBidOnLose(bidType, trickNumber, playerCount)).toBe(expected)
  })
})

describe('isWinningBid', () => {
  it('returns false when a forbidden trick was won', () => {
    const trickBid: Bid = {
      bid_id: 'trick-forbidden',
      bid_type: 'trick',
      bid_score: 20,
      win_condition: {
        lose_trick_position: [2]
      }
    }

    const result = isWinningBid(
      trickBid,
      {
        playerId: 'player_1',
        points: 0,
        tricksWon: [2],
        setCollection: { acorns: 0, leaves: 0, berries: 0, flowers: 0 }
      },
      true
    )

    expect(result).toBe(false)
  })

  it('returns true for points bid in range when round is complete', () => {
    const pointsBid: Bid = {
      bid_id: 'points-range',
      bid_type: 'points',
      bid_score: 25,
      win_condition: {
        min_points: 10,
        max_points: 30
      }
    }

    const result = isWinningBid(
      pointsBid,
      {
        playerId: 'player_1',
        points: 20,
        tricksWon: [],
        setCollection: { acorns: 0, leaves: 0, berries: 0, flowers: 0 }
      },
      true
    )

    expect(result).toBe(true)
  })

  it('returns true for set_collection bid when the net reaches the floor', () => {
    const setBid: Bid = {
      bid_id: 'set-floor',
      bid_type: 'set_collection',
      bid_score: 15,
      win_condition: {
        win_suit: 'acorns',
        floor: 10
      }
    }

    const result = isWinningBid(
      setBid,
      {
        playerId: 'player_1',
        points: 0,
        tricksWon: [],
        setCollection: { acorns: 2, leaves: 1, berries: 0, flowers: 0 }
      },
      true,
      { bidEntry: { bidId: setBid.bid_id, trickNumber: 1, onLose: -10, isPlayerWinning: null } }
    )

    expect(result).toBe(true)
  })

  it('uses the bid window penalty for every card of the other suits', () => {
    const setBid: Bid = {
      bid_id: 'set-window-penalty',
      bid_type: 'set_collection',
      bid_score: 15,
      win_condition: {
        win_suit: 'berries',
        floor: 20
      }
    }
    const playerRoundScore = {
      playerId: 'player_1' as PlayerId,
      points: 0,
      tricksWon: [] as TrickNumber[],
      setCollection: { acorns: 1, leaves: 1, berries: 2, flowers: 0 }
    }

    const windowOneResult = isWinningBid(setBid, playerRoundScore, true, {
      bidEntry: { bidId: setBid.bid_id, trickNumber: 1, onLose: -10, isPlayerWinning: null }
    })
    const windowThreeResult = isWinningBid(setBid, playerRoundScore, true, {
      bidEntry: { bidId: setBid.bid_id, trickNumber: 3, onLose: -20, isPlayerWinning: null }
    })

    expect(windowOneResult).toBe(true) // 30 - 2×2 = 26
    expect(windowThreeResult).toBe(false) // 30 - 2×6 = 18
  })

  it('returns null during the round while a collection bid can still reach the floor', () => {
    const setBid: Bid = {
      bid_id: 'set-in-progress',
      bid_type: 'set_collection',
      bid_score: 15,
      win_condition: {
        win_suit: 'acorns',
        floor: 10
      }
    }

    const result = isWinningBid(
      setBid,
      {
        playerId: 'player_1',
        points: 0,
        tricksWon: [],
        setCollection: { acorns: 0, leaves: 2, berries: 0, flowers: 0 }
      },
      false,
      { bidEntry: { bidId: setBid.bid_id, trickNumber: 1, onLose: -10, isPlayerWinning: null } }
    )

    expect(result).toBeNull()
  })

  it('returns false at round end when the collection net is below the floor', () => {
    const setBid: Bid = {
      bid_id: 'set-below-floor',
      bid_type: 'set_collection',
      bid_score: 15,
      win_condition: {
        win_suit: 'flowers',
        floor: 20
      }
    }

    const result = isWinningBid(
      setBid,
      {
        playerId: 'player_1',
        points: 0,
        tricksWon: [],
        setCollection: { acorns: 1, leaves: 1, berries: 0, flowers: 1 }
      },
      true,
      { bidEntry: { bidId: setBid.bid_id, trickNumber: 1, onLose: -10, isPlayerWinning: null } }
    )

    expect(result).toBe(false) // 15 - 2×2 = 11
  })

  it('returns false for trick bid when winning outside may+required positions', () => {
    const trickBid: Bid = {
      bid_id: 'trick-may-window',
      bid_type: 'trick',
      bid_score: 30,
      win_condition: {
        may_win_trick_position: [2, 3],
        win_trick_position: [4, 5]
      }
    }

    const result = isWinningBid(
      trickBid,
      {
        playerId: 'player_1',
        points: 0,
        tricksWon: [1],
        setCollection: { acorns: 0, leaves: 0, berries: 0, flowers: 0 }
      },
      false
    )

    expect(result).toBe(false)
  })

  it('returns true for trick bid when all required tricks are won and optional wins stay in may positions', () => {
    const trickBid: Bid = {
      bid_id: 'trick-may-window',
      bid_type: 'trick',
      bid_score: 30,
      win_condition: {
        may_win_trick_position: [1, 2, 3],
        win_trick_position: [4, 5]
      }
    }

    const result = isWinningBid(
      trickBid,
      {
        playerId: 'player_1',
        points: 0,
        tricksWon: [1, 4, 5],
        setCollection: { acorns: 0, leaves: 0, berries: 0, flowers: 0 }
      },
      true
    )

    expect(result).toBe(true)
  })
})

describe('getPlayerScoreFromRound', () => {
  it('should penalize players with bids even when they won no tricks', () => {
    const pointsBid: Bid = {
      bid_id: 'points-bid-1',
      bid_type: 'points',
      bid_score: 65,
      win_condition: {
        min_points: 2,
        max_points: 10
      }
    }
    
    const setCollectionBid: Bid = {
      bid_id: 'set-bid-1',
      bid_type: 'set_collection',
      bid_score: 15,
      win_condition: {
        win_suit: 'acorns',
        floor: 10
      }
    }
    
    const game: any = {
      round: {
        roundScore: [],
        roundBids: {
          bids: [pointsBid, setCollectionBid],
          playerBids: {
            player_1: [
              {
                bidId: 'points-bid-1',
                trickNumber: 1,
                onLose: -20,
                isPlayerWinning: null
              },
              {
                bidId: 'set-bid-1',
                trickNumber: 2,
                onLose: -15,
                isPlayerWinning: null
              }
            ]
          }
        }
      }
    }
    
    const score = getPlayerScoreFromRound(game, 'player_1')
    
    expect(score).toBe(-35)
  })
  
  it('should return card points for players without bids', () => {
    const game: any = {
      round: {
        roundScore: [
          {
            playerId: 'player_1',
            points: 25,
            tricksWon: [1, 2],
            setCollection: { acorns: 2, leaves: 1, berries: 0, flowers: 1 }
          }
        ],
        roundBids: {
          bids: [],
          playerBids: {}
        }
      }
    }
    
    const score = getPlayerScoreFromRound(game, 'player_1')
    
    expect(score).toBe(25)
  })

  it('pays the collection net when the floor is reached', () => {
    const collectionBid: Bid = {
      bid_id: 'set-net-win',
      bid_type: 'set_collection',
      bid_score: 15,
      win_condition: { win_suit: 'acorns', floor: 10 }
    }
    const game: any = {
      round: {
        roundScore: [
          {
            playerId: 'player_1',
            points: 0,
            tricksWon: [],
            setCollection: { acorns: 2, leaves: 1, berries: 1, flowers: 0 }
          }
        ],
        roundBids: {
          bids: [collectionBid],
          playerBids: {
            player_1: [
              { bidId: collectionBid.bid_id, trickNumber: 1, onLose: -10, isPlayerWinning: null }
            ]
          }
        }
      }
    }

    expect(getPlayerScoreFromRound(game, 'player_1')).toBe(26) // 30 - 2×2
  })

  it('applies the ±5 duel adjustment when two players share a bid and only one wins', () => {
    const sharedBid: Bid = {
      bid_id: 'shared-points',
      bid_type: 'points',
      bid_score: 45,
      win_condition: { min_points: 10, max_points: 30 }
    }
    const game: any = {
      round: {
        roundScore: [
          {
            playerId: 'player_1',
            points: 20,
            tricksWon: [],
            setCollection: { acorns: 0, leaves: 0, berries: 0, flowers: 0 }
          },
          {
            playerId: 'player_2',
            points: 45,
            tricksWon: [],
            setCollection: { acorns: 0, leaves: 0, berries: 0, flowers: 0 }
          }
        ],
        roundBids: {
          bids: [sharedBid],
          playerBids: {
            player_1: [{ bidId: sharedBid.bid_id, trickNumber: 1, onLose: -20, isPlayerWinning: null }],
            player_2: [{ bidId: sharedBid.bid_id, trickNumber: 1, onLose: -20, isPlayerWinning: null }]
          }
        }
      }
    }

    expect(getPlayerScoreFromRound(game, 'player_1')).toBe(50)
    expect(getPlayerScoreFromRound(game, 'player_2')).toBe(-25)
  })
})
