import { describe, expect, it } from 'vitest'
import type { Game, PlayerScore } from '../interfaces/Game'
import type { PlayerId } from '../interfaces/Player'
import { GAME_END_MAX_SCORE, GAME_END_MIN_SCORE, hasGameEnded } from './GameEndRules'

function createGameFixture(options?: {
  playerScores?: PlayerScore[]
  playerTurnOrder?: PlayerId[]
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
    bidDecks: {
      setCollectionBidDeck: [],
      pointsBidDeck: [],
      tricksBidDeck: []
    },
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
      pointsToWin: 100,
      reconnectionTimeoutMinutes: 3
    }
  }
}

describe('hasGameEnded', () => {
  it('does not end when nobody reached the thresholds', () => {
    const game = createGameFixture({
      playerScores: [
        { playerId: 'player_1', score: 50 },
        { playerId: 'player_2', score: GAME_END_MAX_SCORE - 1 },
        { playerId: 'player_3', score: GAME_END_MIN_SCORE + 1 }
      ]
    })

    expect(hasGameEnded(game)).toEqual({ hasEnded: false, winner: null })
  })

  it('does not end with no scores', () => {
    const game = createGameFixture({ playerScores: [] })
    expect(hasGameEnded(game)).toEqual({ hasEnded: false, winner: null })
  })

  it('ends when a player reaches +100 and the highest score wins', () => {
    const game = createGameFixture({
      playerScores: [
        { playerId: 'player_1', score: GAME_END_MAX_SCORE },
        { playerId: 'player_2', score: 40 },
        { playerId: 'player_3', score: 10 }
      ]
    })

    expect(hasGameEnded(game)).toEqual({ hasEnded: true, winner: 'player_1' })
  })

  it('ends when a player reaches -85 and someone else wins', () => {
    const game = createGameFixture({
      playerScores: [
        { playerId: 'player_1', score: GAME_END_MIN_SCORE },
        { playerId: 'player_2', score: 40 },
        { playerId: 'player_3', score: 10 }
      ]
    })

    expect(hasGameEnded(game)).toEqual({ hasEnded: true, winner: 'player_2' })
  })

  it('the mano wins a tie at the top score', () => {
    // player_2 es el mano (playerTurnOrder[0])
    const game = createGameFixture({
      playerScores: [
        { playerId: 'player_1', score: 110 },
        { playerId: 'player_2', score: 110 },
        { playerId: 'player_3', score: 10 }
      ]
    })

    expect(hasGameEnded(game)).toEqual({ hasEnded: true, winner: 'player_2' })
  })

  it('when the mano is not tied, the tied player closest to the mano wins', () => {
    // Orden desde el mano: player_2 (mano), player_3, player_1
    // Empatados en el máximo: player_1 y player_3 → gana player_3
    // El fin lo dispara el mano llegando a -85
    const game = createGameFixture({
      playerScores: [
        { playerId: 'player_1', score: 60 },
        { playerId: 'player_2', score: GAME_END_MIN_SCORE },
        { playerId: 'player_3', score: 60 }
      ]
    })

    expect(hasGameEnded(game)).toEqual({ hasEnded: true, winner: 'player_3' })
  })

  it('falls back to the first top scorer when playerTurnOrder is empty', () => {
    const game = createGameFixture({
      playerTurnOrder: [],
      playerScores: [
        { playerId: 'player_1', score: 30 },
        { playerId: 'player_2', score: GAME_END_MAX_SCORE }
      ]
    })

    expect(hasGameEnded(game)).toEqual({ hasEnded: true, winner: 'player_2' })
  })
})
