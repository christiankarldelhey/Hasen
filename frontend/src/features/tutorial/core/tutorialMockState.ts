import type { Bid, PlayerId, PublicGameState, PrivateGameState, Trick } from '@domain/interfaces'
import { AVAILABLE_PLAYERS } from '@domain/interfaces/Player'
import { demoCard } from './tutorialCards'

export const TUTORIAL_PLAYER_ID: PlayerId = 'player_1'

interface TutorialMockState {
  publicGameState: PublicGameState
  privateGameState: PrivateGameState
  currentPlayerId: PlayerId
}

function createTutorialBids(): Bid[] {
  return [
    {
      bid_id: 'trick-1',
      bid_type: 'trick',
      bid_score: 30,
      win_condition: { may_win_trick_position: [1, 2, 3], win_trick_position: [4, 5] }
    },
    {
      bid_id: 'trick-2',
      bid_type: 'trick',
      bid_score: 45,
      win_condition: { win_min_tricks: 1, win_max_tricks: 1 }
    },
    {
      bid_id: 'points-1',
      bid_type: 'points',
      bid_score: 40,
      win_condition: { min_points: 11, max_points: 30 }
    },
    {
      bid_id: 'points-2',
      bid_type: 'points',
      bid_score: 45,
      win_condition: { min_points: 35, max_points: 100 }
    },
    {
      bid_id: 'set-1',
      bid_type: 'set_collection',
      bid_score: 10,
      win_condition: { win_suit: 'acorns', avoid_suit: 'leaves' }
    },
    {
      bid_id: 'set-2',
      bid_type: 'set_collection',
      bid_score: 10,
      win_condition: { win_suit: 'berries', avoid_suit: 'acorns' }
    }
  ]
}

export function createTutorialMockState(): TutorialMockState {
  const currentPlayerId: PlayerId = TUTORIAL_PLAYER_ID

  const playerVisibleCard = demoCard('acorns', '9', {
    id: 'p1-visible',
    owner: 'player_1',
    state: 'in_hand_visible'
  })
  const playerHandHidden = [
    demoCard('flowers', 'K', { id: 'p1-hidden-1', owner: 'player_1', state: 'in_hand_hidden' }),
    demoCard('berries', '10', { id: 'p1-hidden-2', owner: 'player_1', state: 'in_hand_hidden' }),
    demoCard('leaves', 'U', { id: 'p1-hidden-3', owner: 'player_1', state: 'in_hand_hidden' }),
    demoCard('acorns', 'O', { id: 'p1-hidden-4', owner: 'player_1', state: 'in_hand_hidden' })
  ]

  const opponentVisibleCards = [
    demoCard('leaves', '8', { id: 'p2-visible', owner: 'player_2', state: 'in_hand_visible' }),
    demoCard('berries', 'U', { id: 'p3-visible', owner: 'player_3', state: 'in_hand_visible' }),
    demoCard('flowers', '3', { id: 'p4-visible', owner: 'player_4', state: 'in_hand_visible' })
  ]

  const trickCards = [
    demoCard('acorns', '10', { id: 'trick-p1', owner: 'player_1', state: 'in_trick' }),
    demoCard('leaves', 'O', { id: 'trick-p2', owner: 'player_2', state: 'in_trick' }),
    demoCard('berries', 'S', { id: 'trick-p3', owner: 'player_3', state: 'in_trick' }),
    demoCard('flowers', 'A', { id: 'trick-p4', owner: 'player_4', state: 'in_trick' })
  ]

  const allPublicCards = [playerVisibleCard, ...opponentVisibleCards, ...trickCards]

  const currentTrick: Trick = {
    trick_id: 'tutorial-trick-2',
    trick_state: 'in_progress',
    trick_number: 2,
    lead_player: 'player_1',
    winning_card: null,
    lead_suit: 'acorns',
    cards: trickCards.map(card => card.id),
    score: {
      trick_winner: null,
      trick_points: 0,
      trick_collections: {
        acorns: 0,
        leaves: 0,
        berries: 0,
        flowers: 0
      }
    }
  }

  const publicGameState: PublicGameState = {
    gameId: 'tutorial-basic-rules',
    gameName: 'Tutorial Game',
    hostPlayer: 'player_1',
    activePlayers: AVAILABLE_PLAYERS.map(player => ({ ...player })),
    gamePhase: 'playing',
    publicCards: Object.fromEntries(allPublicCards.map(card => [card.id, card])),
    opponentsPublicInfo: [
      { playerId: 'player_1', publicCardId: 'p1-visible', handCardsCount: 5 },
      { playerId: 'player_2', publicCardId: 'p2-visible', handCardsCount: 5 },
      { playerId: 'player_3', publicCardId: 'p3-visible', handCardsCount: 5 },
      { playerId: 'player_4', publicCardId: 'p4-visible', handCardsCount: 5 }
    ],
    playerTurnOrder: ['player_1', 'player_2', 'player_3', 'player_4'],
    round: {
      round: 1,
      roundPhase: 'playing',
      playerTurn: 'player_1',
      currentTrick,
      roundBids: {
        bids: createTutorialBids(),
        playerBids: {
          player_1: [
            {
              bidId: 'points-1',
              trickNumber: 1,
              onLose: -20,
              isPlayerWinning: true
            }
          ],
          player_2: [],
          player_3: [],
          player_4: []
        }
      },
      roundScore: [
        { playerId: 'player_1', points: 12, tricksWon: [1], setCollection: { acorns: 1, leaves: 0, berries: 1, flowers: 0 } },
        { playerId: 'player_2', points: 9, tricksWon: [], setCollection: { acorns: 0, leaves: 1, berries: 0, flowers: 0 } },
        { playerId: 'player_3', points: 6, tricksWon: [], setCollection: { acorns: 0, leaves: 0, berries: 1, flowers: 0 } },
        { playerId: 'player_4', points: 15, tricksWon: [2], setCollection: { acorns: 0, leaves: 0, berries: 0, flowers: 1 } }
      ]
    },
    playerScores: [
      { playerId: 'player_1', score: 12 },
      { playerId: 'player_2', score: 9 },
      { playerId: 'player_3', score: 6 },
      { playerId: 'player_4', score: 15 }
    ],
    winner: null,
    playerConnectionStatus: {
      player_1: 'connected',
      player_2: 'connected',
      player_3: 'connected',
      player_4: 'connected'
    },
    isPaused: false,
    pauseReason: null,
    gameSettings: {
      minPlayers: 2,
      maxPlayers: 4,
      pointsToWin: 100,
      reconnectionTimeoutMinutes: 5
    }
  }

  const privateGameState: PrivateGameState = {
    playerId: currentPlayerId,
    hand: [playerVisibleCard, ...playerHandHidden]
  }

  return {
    publicGameState,
    privateGameState,
    currentPlayerId
  }
}
