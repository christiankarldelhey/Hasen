import { describe, expect, it } from 'vitest'
import type { Game, PlayerId, PlayingCard } from '@domain/interfaces'
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
      reconnectionTimeoutMinutes: 3
    },
    playerConnectionStatus: new Map<PlayerId, 'connected' | 'disconnected' | 'reconnecting'>(),
    disconnectionTimestamps: new Map<PlayerId, number>(),
    isPaused: false,
    pauseReason: null
  }
}

function makeCard(overrides: Partial<PlayingCard> & Pick<PlayingCard, 'id' | 'suit' | 'char'>): PlayingCard {
  return {
    rank: { base: 3, onSuit: 8 },
    owner: 'player_2',
    state: 'in_hand_hidden',
    points: 0,
    spritePos: { row: 0, col: 0 },
    ...overrides
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
        rank: { base: 30, onSuit: 5 },
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
        rank: { base: 30, onSuit: 6 },
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
        rank: { base: 30, onSuit: 7 },
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

  it('chooses an exact trick bid when projected tricks match the target', async () => {
    const game = buildBaseGame()
    const agent = new HeuristicAgent()

    game.round.currentTrick!.trick_number = 1
    game.deck = [
      ...[0, 1, 2, 3, 4].map(index => ({
        id: `bot-card-${index}`,
        suit: 'acorns' as const,
        char: `${index}`,
        rank: index < 2 ? { base: 30, onSuit: 20 } : { base: 1, onSuit: 5 },
        owner: 'player_2' as const,
        state: 'in_hand_hidden' as const,
        points: index < 2 ? 4 : 0,
        spritePos: { row: 0, col: index },
        position: index
      })),
      ...[0, 1, 2, 3, 4].map(index => ({
        id: `opponent-card-${index}`,
        suit: index < 2 ? 'acorns' as const : 'leaves' as const,
        char: `${index}`,
        rank: index < 2 ? { base: 3, onSuit: 10 } : { base: 2, onSuit: 5 },
        owner: 'player_1' as const,
        state: 'in_hand_hidden' as const,
        points: index < 2 ? 10 : 0,
        spritePos: { row: 0, col: index },
        position: index
      }))
    ]
    game.round.roundBids.bids = [
      {
        bid_id: 'exactly-two',
        bid_type: 'trick',
        bid_score: 70,
        win_condition: { win_min_tricks: 2, win_max_tricks: 2 }
      }
    ]

    const decision = await agent.decide({
      game,
      playerId: 'player_2',
      legalActions: [
        { type: 'play_card', cardId: 'bot-card-0' },
        { type: 'make_bid', bidType: 'trick', bidId: 'exactly-two' }
      ]
    })

    expect(decision).toEqual({ type: 'make_bid', bidType: 'trick', bidId: 'exactly-two' })
  })

  it('chooses a collection bid when the hand supports the target suit', async () => {
    const game = buildBaseGame()
    const agent = new HeuristicAgent()

    game.round.currentTrick!.trick_number = 1
    game.deck = [0, 1, 2].map(index => ({
      id: `acorn-${index}`,
      suit: 'acorns' as const,
      char: `${index}`,
      rank: { base: 10, onSuit: 20 },
      owner: 'player_2' as const,
      state: 'in_hand_hidden' as const,
      points: 0,
      spritePos: { row: 0, col: index },
      position: index
    }))
    game.round.roundBids.bids = [
      {
        bid_id: 'collect-acorns',
        bid_type: 'set_collection',
        bid_score: 15,
        win_condition: { win_suit: 'acorns', floor: 10 }
      }
    ]

    const decision = await agent.decide({
      game,
      playerId: 'player_2',
      legalActions: [
        { type: 'play_card', cardId: 'acorn-0' },
        { type: 'make_bid', bidType: 'set_collection', bidId: 'collect-acorns' }
      ]
    })

    expect(decision).toEqual({ type: 'make_bid', bidType: 'set_collection', bidId: 'collect-acorns' })
  })

  it('leads a useful card instead of spending the strongest card first', async () => {
    const game = buildBaseGame()
    const agent = new HeuristicAgent()

    game.round.currentTrick!.trick_number = 1
    game.deck = [
      makeCard({
        id: 'flowers-q',
        suit: 'flowers',
        char: 'Q',
        rank: { base: 31, onSuit: null },
        points: 0
      }),
      makeCard({
        id: 'acorns-o',
        suit: 'acorns',
        char: 'O',
        rank: { base: 3, onSuit: 21 },
        points: 4
      }),
      makeCard({
        id: 'leaves-5',
        suit: 'leaves',
        char: '5',
        rank: { base: 2, onSuit: 5 },
        points: 0
      }),
      makeCard({
        id: 'opponent-leaves-10',
        suit: 'leaves',
        char: '10',
        owner: 'player_1',
        rank: { base: 3, onSuit: 10 },
        points: 10
      })
    ]

    const decision = await agent.decide({
      game,
      playerId: 'player_2',
      legalActions: [
        { type: 'play_card', cardId: 'flowers-q' },
        { type: 'play_card', cardId: 'acorns-o' },
        { type: 'play_card', cardId: 'leaves-5' }
      ]
    })

    expect(decision).toEqual({ type: 'play_card', cardId: 'acorns-o' })
  })

  it('uses the cheapest winning card when a trick bid only cares about winning', async () => {
    const game = buildBaseGame()
    const agent = new HeuristicAgent()

    game.round.currentTrick = {
      trick_id: 'trick-1',
      trick_state: 'in_progress',
      trick_number: 1,
      lead_player: 'player_1',
      winning_card: 'opponent-leaves-5',
      lead_suit: 'leaves',
      cards: ['opponent-leaves-5'],
      score: {
        trick_winner: null,
        trick_points: 0,
        trick_collections: null
      }
    }
    game.deck = [
      makeCard({
        id: 'opponent-leaves-5',
        suit: 'leaves',
        char: '5',
        owner: 'player_1',
        state: 'in_trick',
        rank: { base: 2, onSuit: 5 }
      }),
      makeCard({
        id: 'leaves-u',
        suit: 'leaves',
        char: 'U',
        rank: { base: 3, onSuit: 20 },
        points: 3
      }),
      makeCard({
        id: 'leaves-o',
        suit: 'leaves',
        char: 'O',
        rank: { base: 3, onSuit: 21 },
        points: 4
      })
    ]
    game.round.roundBids.bids = [
      {
        bid_id: 'must-win-1',
        bid_type: 'trick',
        bid_score: 60,
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
        { type: 'play_card', cardId: 'leaves-u' },
        { type: 'play_card', cardId: 'leaves-o' }
      ]
    })

    expect(decision).toEqual({ type: 'play_card', cardId: 'leaves-u' })
  })

  it('avoids winning a trick that would exceed an active points range', async () => {
    const game = buildBaseGame()
    const agent = new HeuristicAgent()

    game.round.currentTrick = {
      trick_id: 'trick-1',
      trick_state: 'in_progress',
      trick_number: 1,
      lead_player: 'player_1',
      winning_card: 'opponent-leaves-10',
      lead_suit: 'leaves',
      cards: ['opponent-leaves-10'],
      score: {
        trick_winner: null,
        trick_points: 0,
        trick_collections: null
      }
    }
    game.deck = [
      makeCard({
        id: 'opponent-leaves-10',
        suit: 'leaves',
        char: '10',
        owner: 'player_1',
        state: 'in_trick',
        rank: { base: 3, onSuit: 10 },
        points: 10
      }),
      makeCard({
        id: 'leaves-5',
        suit: 'leaves',
        char: '5',
        rank: { base: 2, onSuit: 5 }
      }),
      makeCard({
        id: 'leaves-o',
        suit: 'leaves',
        char: 'O',
        rank: { base: 3, onSuit: 21 },
        points: 4
      })
    ]
    game.round.roundScore = [
      {
        playerId: 'player_2',
        points: 28,
        tricksWon: [],
        setCollection: { acorns: 0, leaves: 0, berries: 0, flowers: 0 }
      }
    ]
    game.round.roundBids.bids = [
      {
        bid_id: 'points-10-30',
        bid_type: 'points',
        bid_score: 45,
        win_condition: { min_points: 10, max_points: 30 }
      }
    ]
    game.round.roundBids.playerBids.player_2 = [
      { bidId: 'points-10-30', trickNumber: 1, onLose: -20, isPlayerWinning: null }
    ]

    const decision = await agent.decide({
      game,
      playerId: 'player_2',
      legalActions: [
        { type: 'play_card', cardId: 'leaves-5' },
        { type: 'play_card', cardId: 'leaves-o' }
      ]
    })

    expect(decision).toEqual({ type: 'play_card', cardId: 'leaves-5' })
  })

  it('wins a trick containing collection targets even when the card points are low', async () => {
    const game = buildBaseGame()
    const agent = new HeuristicAgent()

    game.round.currentTrick = {
      trick_id: 'trick-1',
      trick_state: 'in_progress',
      trick_number: 1,
      lead_player: 'player_1',
      winning_card: 'opponent-acorns-5',
      lead_suit: 'acorns',
      cards: ['opponent-acorns-5'],
      score: {
        trick_winner: null,
        trick_points: 0,
        trick_collections: null
      }
    }
    game.deck = [
      makeCard({
        id: 'opponent-acorns-5',
        suit: 'acorns',
        char: '5',
        owner: 'player_1',
        state: 'in_trick',
        rank: { base: 2, onSuit: 5 }
      }),
      makeCard({
        id: 'acorns-10',
        suit: 'acorns',
        char: '10',
        rank: { base: 3, onSuit: 10 },
        points: 10
      }),
      makeCard({
        id: 'leaves-5',
        suit: 'leaves',
        char: '5',
        rank: { base: 2, onSuit: 5 }
      })
    ]
    game.round.roundBids.bids = [
      {
        bid_id: 'collect-acorns',
        bid_type: 'set_collection',
        bid_score: 15,
        win_condition: { win_suit: 'acorns', floor: 10 }
      }
    ]
    game.round.roundBids.playerBids.player_2 = [
      { bidId: 'collect-acorns', trickNumber: 1, onLose: -10, isPlayerWinning: null }
    ]

    const decision = await agent.decide({
      game,
      playerId: 'player_2',
      legalActions: [
        { type: 'play_card', cardId: 'acorns-10' },
        { type: 'play_card', cardId: 'leaves-5' }
      ]
    })

    expect(decision).toEqual({ type: 'play_card', cardId: 'acorns-10' })
  })

  it('replaces the weakest hidden card during the drawing phase', async () => {
    const game = buildBaseGame()
    const agent = new HeuristicAgent()

    game.round.roundPhase = 'player_drawing'
    game.round.currentTrick = null
    game.deck = [
      makeCard({
        id: 'flowers-a',
        suit: 'flowers',
        char: 'A',
        rank: { base: 33, onSuit: null },
        points: 12
      }),
      makeCard({
        id: 'acorns-o',
        suit: 'acorns',
        char: 'O',
        rank: { base: 3, onSuit: 21 },
        points: 4
      }),
      makeCard({
        id: 'leaves-5',
        suit: 'leaves',
        char: '5',
        rank: { base: 2, onSuit: 5 }
      }),
      makeCard({
        id: 'opponent-leaves-10',
        suit: 'leaves',
        char: '10',
        owner: 'player_1',
        rank: { base: 3, onSuit: 10 },
        points: 10
      }),
      ...[0, 1, 2, 3].map(index => makeCard({
        id: `opponent-berries-${index}`,
        suit: 'berries',
        char: `${index + 5}` as PlayingCard['char'],
        owner: 'player_1',
        rank: { base: 3, onSuit: 8 }
      })),
      makeCard({
        id: 'deck-card',
        suit: 'berries',
        char: '9',
        owner: null,
        state: 'in_deck',
        rank: { base: 3, onSuit: 9 }
      })
    ]

    const decision = await agent.decide({
      game,
      playerId: 'player_2',
      legalActions: [
        { type: 'replace_card', cardId: 'leaves-5', position: 2 },
        { type: 'replace_card', cardId: 'acorns-o', position: 1 },
        { type: 'skip_replacement' }
      ]
    })

    expect(decision).toEqual({ type: 'replace_card', cardId: 'leaves-5', position: 2 })
  })

  it('steals a collection target before a higher-point off-suit card', async () => {
    const game = buildBaseGame()
    const agent = new HeuristicAgent()

    game.round.currentTrick!.trick_state = 'awaiting_special_action'
    game.round.currentTrick!.pendingSpecialAction = {
      type: 'STEAL_CARD',
      playerId: 'player_2'
    }
    game.round.currentTrick!.cards = ['acorns-10', 'flowers-a']
    game.deck = [
      makeCard({
        id: 'acorns-10',
        suit: 'acorns',
        char: '10',
        owner: 'player_1',
        state: 'in_trick',
        rank: { base: 3, onSuit: 10 },
        points: 10
      }),
      makeCard({
        id: 'flowers-a',
        suit: 'flowers',
        char: 'A',
        owner: 'player_1',
        state: 'in_trick',
        rank: { base: 33, onSuit: null },
        points: 12
      })
    ]
    game.round.roundBids.bids = [
      {
        bid_id: 'collect-acorns',
        bid_type: 'set_collection',
        bid_score: 15,
        win_condition: { win_suit: 'acorns', floor: 10 }
      }
    ]
    game.round.roundBids.playerBids.player_2 = [
      { bidId: 'collect-acorns', trickNumber: 1, onLose: -10, isPlayerWinning: null }
    ]

    const decision = await agent.decide({
      game,
      playerId: 'player_2',
      legalActions: [
        { type: 'select_card_to_steal', selectedCardId: 'acorns-10' },
        { type: 'select_card_to_steal', selectedCardId: 'flowers-a' }
      ]
    })

    expect(decision).toEqual({ type: 'select_card_to_steal', selectedCardId: 'acorns-10' })
  })

  it('selects itself as next lead when an active bid requires the next trick', async () => {
    const game = buildBaseGame()
    const agent = new HeuristicAgent()

    game.round.currentTrick!.trick_number = 1
    game.round.currentTrick!.trick_state = 'awaiting_special_action'
    game.round.currentTrick!.pendingSpecialAction = {
      type: 'PICK_NEXT_LEAD',
      playerId: 'player_2'
    }
    game.round.roundBids.bids = [
      {
        bid_id: 'win-second',
        bid_type: 'trick',
        bid_score: 60,
        win_condition: { lose_trick_position: [1], win_trick_position: [2] }
      }
    ]
    game.round.roundBids.playerBids.player_2 = [
      { bidId: 'win-second', trickNumber: 1, onLose: -20, isPlayerWinning: null }
    ]

    const decision = await agent.decide({
      game,
      playerId: 'player_2',
      legalActions: [
        { type: 'select_next_lead', selectedLeadPlayer: 'player_1' },
        { type: 'select_next_lead', selectedLeadPlayer: 'player_2' }
      ]
    })

    expect(decision).toEqual({ type: 'select_next_lead', selectedLeadPlayer: 'player_2' })
  })
})
