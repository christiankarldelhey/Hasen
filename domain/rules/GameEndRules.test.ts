import { describe, expect, it } from 'vitest'
import type { Bid } from '../interfaces/Bid'
import type { Game, PlayerScore } from '../interfaces/Game'
import type { PlayerId } from '../interfaces/Player'
import { hasGameEnded } from './GameEndRules'

function bid(id: string, type: Bid['bid_type']): Bid {
  const win_condition =
    type === 'points'
      ? { min_points: 1, max_points: 20 }
      : type === 'set_collection'
        ? { win_suit: 'acorns' as const, floor: 10 }
        : { win_min_tricks: 1, win_max_tricks: 1 }

  return { bid_id: id, bid_type: type, bid_score: 10, win_condition }
}

function fullDecks(): Game['bidDecks'] {
  return {
    setCollectionBidDeck: [bid('set-1', 'set_collection'), bid('set-2', 'set_collection')],
    pointsBidDeck: [bid('points-1', 'points'), bid('points-2', 'points')],
    tricksBidDeck: [bid('trick-1', 'trick'), bid('trick-2', 'trick')]
  }
}

function emptyDecks(): Game['bidDecks'] {
  return {
    setCollectionBidDeck: [],
    pointsBidDeck: [],
    tricksBidDeck: []
  }
}

function createGameFixture(options?: {
  playerScores?: PlayerScore[]
  playerTurnOrder?: PlayerId[]
  bidDecks?: Game['bidDecks']
}): Game {
  return {
    gameId: 'game-1',
    gameName: 'Test Game',
    hostPlayer: 'player_1',
    hostUserId: 'host-user',
    activePlayers: [
      { id: 'player_1', name: 'P1', color: '#111', defaultAvatar: 'a1.png' },
      { id: 'player_2', name: 'P2', color: '#222', defaultAvatar: 'a2.png' },
      { id: 'player_3', name: 'P3', color: '#333', defaultAvatar: 'a3.png' }
    ],
    deck: [],
    discardPile: [],
    bidDecks: options?.bidDecks ?? fullDecks(),
    gamePhase: 'playing',
    round: {
      round: 1,
      playerTurn: 'player_2',
      roundBids: { bids: [], playerBids: {} },
      roundPhase: 'playing',
      currentTrick: null,
      roundScore: []
    },
    playerTurnOrder: options?.playerTurnOrder ?? ['player_2', 'player_3', 'player_1'],
    tricksHistory: [],
    bidsHistory: [],
    playerScores: options?.playerScores ?? [],
    winner: null,
    gameSettings: {
      minPlayers: 2,
      maxPlayers: 4,
      reconnectionTimeoutMinutes: 3
    }
  }
}

describe('hasGameEnded', () => {
  it('does not end before any round has been scored', () => {
    const game = createGameFixture({ playerScores: [], bidDecks: emptyDecks() })
    expect(hasGameEnded(game)).toEqual({ hasEnded: false, winner: null })
  })

  it('does not end while the decks can still provide a complete pool', () => {
    const game = createGameFixture({
      playerScores: [
        { playerId: 'player_1', score: 150 },
        { playerId: 'player_2', score: 40 },
        { playerId: 'player_3', score: -90 }
      ],
      bidDecks: fullDecks()
    })

    expect(hasGameEnded(game)).toEqual({ hasEnded: false, winner: null })
  })

  it('ends when any deck has fewer cards than a complete pool needs', () => {
    const game = createGameFixture({
      bidDecks: {
        setCollectionBidDeck: [bid('set-last', 'set_collection')],
        pointsBidDeck: [bid('points-1', 'points'), bid('points-2', 'points')],
        tricksBidDeck: [bid('trick-1', 'trick'), bid('trick-2', 'trick')]
      },
      playerScores: [
        { playerId: 'player_1', score: 10 },
        { playerId: 'player_2', score: 40 },
        { playerId: 'player_3', score: 30 }
      ]
    })

    expect(hasGameEnded(game)).toEqual({ hasEnded: true, winner: 'player_2' })
  })

  it('the mano wins a tie at the top score', () => {
    const game = createGameFixture({
      bidDecks: emptyDecks(),
      playerScores: [
        { playerId: 'player_1', score: 110 },
        { playerId: 'player_2', score: 110 },
        { playerId: 'player_3', score: 10 }
      ]
    })

    expect(hasGameEnded(game)).toEqual({ hasEnded: true, winner: 'player_2' })
  })

  it('when the mano is not tied, the tied player closest to the mano wins', () => {
    const game = createGameFixture({
      bidDecks: emptyDecks(),
      playerScores: [
        { playerId: 'player_1', score: 60 },
        { playerId: 'player_2', score: 10 },
        { playerId: 'player_3', score: 60 }
      ]
    })

    expect(hasGameEnded(game)).toEqual({ hasEnded: true, winner: 'player_3' })
  })

  it('falls back to the first top scorer when playerTurnOrder is empty', () => {
    const game = createGameFixture({
      playerTurnOrder: [],
      bidDecks: emptyDecks(),
      playerScores: [
        { playerId: 'player_1', score: 30 },
        { playerId: 'player_2', score: 80 }
      ]
    })

    expect(hasGameEnded(game)).toEqual({ hasEnded: true, winner: 'player_2' })
  })
})
