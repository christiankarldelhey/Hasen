import { describe, expect, it } from 'vitest'
import type { Game, PlayerId } from '@domain/interfaces'
import { getLegalActionsForBot } from './legalActions.js'
import { HeuristicAgent } from './HeuristicAgent.js'

function buildBaseGame(): Game {
  return {
    gameId: 'game-1',
    gameName: 'Test',
    hostPlayer: 'player_1',
    hostUserId: 'host-user',
    activePlayers: [
      { id: 'player_1', name: 'Human', color: '#111', defaultAvatar: 'a1.png' },
      { id: 'player_2', name: 'Bot', color: '#222', defaultAvatar: 'a2.png', isBot: true }
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
      roundBids: {
        bids: [],
        playerBids: {}
      },
      roundPhase: 'playing',
      currentTrick: {
        trick_id: 'trick-1',
        trick_state: 'in_progress',
        trick_number: 4,
        lead_player: 'player_2',
        winning_card: null,
        lead_suit: null,
        cards: [],
        score: {
          trick_winner: null,
          trick_points: 0,
          trick_collections: null
        }
      },
      roundScore: [],
      playersReadyForNextRound: []
    },
    playerTurnOrder: ['player_1', 'player_2'],
    tricksHistory: [],
    bidsHistory: [],
    playerScores: [],
    winner: null,
    gameSettings: {
      minPlayers: 2,
      maxPlayers: 4,
      pointsToWin: 300,
      reconnectionTimeoutMinutes: 3
    },
    playerConnectionStatus: new Map<PlayerId, 'connected' | 'disconnected' | 'reconnecting'>(),
    disconnectionTimestamps: new Map<PlayerId, number>(),
    isPaused: false,
    pauseReason: null
  }
}

describe('getLegalActionsForBot', () => {
  it('includes play_card when bot has a legal card in turn', () => {
    const game = buildBaseGame()
    game.deck = [
      {
        id: 'card-1',
        suit: 'acorns',
        char: '1',
        rank: { base: 1, onSuit: 5 },
        owner: 'player_2',
        state: 'in_hand_hidden',
        points: 0,
        spritePos: { row: 0, col: 0 },
        position: 0
      }
    ]

    const actions = getLegalActionsForBot(game, 'player_2')
    expect(actions.some(action => action.type === 'play_card' && action.cardId === 'card-1')).toBe(true)
  })

  it('offers ready_next_round during scoring when bot is not ready', () => {
    const game = buildBaseGame()
    game.round.roundPhase = 'scoring'
    game.round.currentTrick = null

    const actions = getLegalActionsForBot(game, 'player_2')
    expect(actions).toEqual([{ type: 'ready_next_round' }])
  })

  it('offers finish_trick only when bot is trick winner in resolve state', () => {
    const game = buildBaseGame()
    game.round.currentTrick!.trick_state = 'resolve'

    game.round.currentTrick!.score.trick_winner = 'player_2'
    const botWinnerActions = getLegalActionsForBot(game, 'player_2')
    expect(botWinnerActions).toContainEqual({ type: 'finish_trick' })

    game.round.currentTrick!.score.trick_winner = 'player_1'
    const humanWinnerActions = getLegalActionsForBot(game, 'player_2')
    expect(humanWinnerActions).not.toContainEqual({ type: 'finish_trick' })
  })
})

describe('HeuristicAgent', () => {
  it('prioritizes playing a card over bidding when both are legal', async () => {
    const game = buildBaseGame()
    const agent = new HeuristicAgent()

    const decision = await agent.decide({
      game,
      playerId: 'player_2',
      legalActions: [
        { type: 'make_bid', bidType: 'points', bidId: 'bid-1' },
        { type: 'play_card', cardId: 'card-1' }
      ]
    })

    expect(decision).toEqual({ type: 'play_card', cardId: 'card-1' })
  })

  it('chooses a points bid when hand points match bid range strongly', async () => {
    const game = buildBaseGame()
    const agent = new HeuristicAgent()

    game.deck = [
      {
        id: 'card-1',
        suit: 'acorns',
        char: '1',
        rank: { base: 1, onSuit: 5 },
        owner: 'player_2',
        state: 'in_hand_hidden',
        points: 4,
        spritePos: { row: 0, col: 0 },
        position: 0
      },
      {
        id: 'card-2',
        suit: 'leaves',
        char: '2',
        rank: { base: 2, onSuit: 6 },
        owner: 'player_2',
        state: 'in_hand_hidden',
        points: 4,
        spritePos: { row: 0, col: 1 },
        position: 1
      },
      {
        id: 'card-3',
        suit: 'berries',
        char: '3',
        rank: { base: 3, onSuit: 7 },
        owner: 'player_2',
        state: 'in_hand_hidden',
        points: 4,
        spritePos: { row: 0, col: 2 },
        position: 2
      }
    ]

    game.round.roundBids.bids = [
      {
        bid_id: 'points-mid',
        bid_type: 'points',
        bid_score: 30,
        win_condition: { min_points: 5, max_points: 20 }
      }
    ]

    const decision = await agent.decide({
      game,
      playerId: 'player_2',
      legalActions: [
        { type: 'play_card', cardId: 'card-1' },
        { type: 'make_bid', bidType: 'points', bidId: 'points-mid' }
      ]
    })

    expect(decision).toEqual({ type: 'make_bid', bidType: 'points', bidId: 'points-mid' })
  })

  it('skips low-confidence bid and plays card instead', async () => {
    const game = buildBaseGame()
    const agent = new HeuristicAgent()

    game.deck = [
      {
        id: 'card-1',
        suit: 'acorns',
        char: '1',
        rank: { base: 1, onSuit: 5 },
        owner: 'player_2',
        state: 'in_hand_hidden',
        points: 1,
        spritePos: { row: 0, col: 0 },
        position: 0
      },
      {
        id: 'card-2',
        suit: 'leaves',
        char: '2',
        rank: { base: 2, onSuit: 6 },
        owner: 'player_2',
        state: 'in_hand_hidden',
        points: 0,
        spritePos: { row: 0, col: 1 },
        position: 1
      }
    ]

    game.round.roundBids.bids = [
      {
        bid_id: 'points-high',
        bid_type: 'points',
        bid_score: 55,
        win_condition: { min_points: 45, max_points: 100 }
      }
    ]

    const decision = await agent.decide({
      game,
      playerId: 'player_2',
      legalActions: [
        { type: 'play_card', cardId: 'card-1' },
        { type: 'make_bid', bidType: 'points', bidId: 'points-high' }
      ]
    })

    expect(decision).toEqual({ type: 'play_card', cardId: 'card-1' })
  })

  it('plays a stronger card when active trick bid requires winning current trick', async () => {
    const game = buildBaseGame()
    const agent = new HeuristicAgent()

    game.round.currentTrick = {
      trick_id: 'trick-1',
      trick_state: 'in_progress',
      trick_number: 1,
      lead_player: 'player_1',
      winning_card: 'opponent-card',
      lead_suit: 'acorns',
      cards: ['opponent-card'],
      score: {
        trick_winner: null,
        trick_points: 0,
        trick_collections: null
      }
    }

    game.deck = [
      {
        id: 'opponent-card',
        suit: 'acorns',
        char: '6',
        rank: { base: 11, onSuit: 10 },
        owner: 'player_1',
        state: 'in_trick',
        points: 0,
        spritePos: { row: 0, col: 0 }
      },
      {
        id: 'low-card',
        suit: 'acorns',
        char: '2',
        rank: { base: 2, onSuit: 6 },
        owner: 'player_2',
        state: 'in_hand_hidden',
        points: 1,
        spritePos: { row: 0, col: 1 },
        position: 0
      },
      {
        id: 'high-card',
        suit: 'acorns',
        char: 'Q',
        rank: { base: 31, onSuit: 20 },
        owner: 'player_2',
        state: 'in_hand_hidden',
        points: 4,
        spritePos: { row: 0, col: 2 },
        position: 1
      }
    ]

    game.round.roundBids.bids = [
      {
        bid_id: 'must-win-1',
        bid_type: 'trick',
        bid_score: 40,
        win_condition: { win_trick_position: [1] }
      }
    ]
    game.round.roundBids.playerBids.player_2 = [
      { bidId: 'must-win-1', trickNumber: 1, onLose: -20, isPlayerWinning: null }
    ]

    const decision = await agent.decide({
      game,
      playerId: 'player_2',
      legalActions: [
        { type: 'play_card', cardId: 'low-card' },
        { type: 'play_card', cardId: 'high-card' }
      ]
    })

    expect(decision).toEqual({ type: 'play_card', cardId: 'high-card' })
  })

  it('plays a weaker card when active trick bid requires losing current trick', async () => {
    const game = buildBaseGame()
    const agent = new HeuristicAgent()

    game.round.currentTrick = {
      trick_id: 'trick-1',
      trick_state: 'in_progress',
      trick_number: 1,
      lead_player: 'player_1',
      winning_card: 'opponent-card',
      lead_suit: 'acorns',
      cards: ['opponent-card'],
      score: {
        trick_winner: null,
        trick_points: 0,
        trick_collections: null
      }
    }

    game.deck = [
      {
        id: 'opponent-card',
        suit: 'acorns',
        char: '7',
        rank: { base: 12, onSuit: 10 },
        owner: 'player_1',
        state: 'in_trick',
        points: 0,
        spritePos: { row: 0, col: 0 }
      },
      {
        id: 'weak-card',
        suit: 'acorns',
        char: '2',
        rank: { base: 2, onSuit: 6 },
        owner: 'player_2',
        state: 'in_hand_hidden',
        points: 0,
        spritePos: { row: 0, col: 1 },
        position: 0
      },
      {
        id: 'strong-card',
        suit: 'acorns',
        char: 'K',
        rank: { base: 32, onSuit: 21 },
        owner: 'player_2',
        state: 'in_hand_hidden',
        points: 5,
        spritePos: { row: 0, col: 2 },
        position: 1
      }
    ]

    game.round.roundBids.bids = [
      {
        bid_id: 'must-lose-1',
        bid_type: 'trick',
        bid_score: 40,
        win_condition: { lose_trick_position: [1], win_trick_position: [2, 3] }
      }
    ]
    game.round.roundBids.playerBids.player_2 = [
      { bidId: 'must-lose-1', trickNumber: 1, onLose: -20, isPlayerWinning: null }
    ]

    const decision = await agent.decide({
      game,
      playerId: 'player_2',
      legalActions: [
        { type: 'play_card', cardId: 'weak-card' },
        { type: 'play_card', cardId: 'strong-card' }
      ]
    })

    expect(decision).toEqual({ type: 'play_card', cardId: 'weak-card' })
  })
})
