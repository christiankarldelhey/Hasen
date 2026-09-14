import type {
  Character,
  LeadSuit,
  PlayerId,
  PlayingCard,
  PrivateGameState,
  PublicGameState,
  Suit,
  TrickNumber
} from '@domain/interfaces'
import { demoCard } from './tutorialCards'
import { TUTORIAL_PLAYER_ID } from './tutorialMockState'

export interface TutorialSnapshot {
  publicGameState: PublicGameState
  privateGameState: PrivateGameState
}

export interface TutorialStateBuildOptions {
  dealCompleted?: boolean
}

export type TutorialStateBuilder = (
  snapshot: TutorialSnapshot,
  options: TutorialStateBuildOptions
) => void

interface TrickCardSpec {
  suit: Suit
  char: Character
  /** Player that played this card. Order in the array = play order. */
  owner: PlayerId
}

interface TrickOptions {
  trickNumber?: TrickNumber
  leadSuit?: LeadSuit | null
  leadPlayer?: PlayerId
  /** Index into specs of the winning card. Requires `resolved`. */
  winningIndex?: number
  /** 'resolve' raises/rings the winning card. */
  resolved?: boolean
  /** Card ids stolen by the Sparrow (shown as removed from the trick). */
  stolenIndexes?: number[]
}

function countSuits(cards: PlayingCard[]): Record<Suit, number> {
  const counts = { acorns: 0, leaves: 0, berries: 0, flowers: 0 } as Record<Suit, number>
  for (const card of cards) counts[card.suit] += 1
  return counts
}

function clearTrick(snapshot: TutorialSnapshot) {
  const trick = snapshot.publicGameState.round.currentTrick
  if (trick) {
    for (const cardId of trick.cards) {
      delete snapshot.publicGameState.publicCards[cardId]
    }
  }
  snapshot.publicGameState.round.currentTrick = null
}

/** Trims everyone's remaining hand to match a given trick number + who already played. */
function syncHandCounts(snapshot: TutorialSnapshot, trickNumber: TrickNumber, playedOwners: Set<PlayerId>) {
  const remaining = (playerId: PlayerId) =>
    Math.max(0, 5 - (trickNumber - 1) - (playedOwners.has(playerId) ? 1 : 0))

  snapshot.publicGameState.opponentsPublicInfo = snapshot.publicGameState.opponentsPublicInfo.map(info => ({
    ...info,
    handCardsCount: remaining(info.playerId)
  }))

  const hand = snapshot.privateGameState.hand ?? []
  snapshot.privateGameState.hand = hand.slice(0, remaining(TUTORIAL_PLAYER_ID))
}

function setTrick(snapshot: TutorialSnapshot, specs: TrickCardSpec[], options: TrickOptions = {}) {
  const gs = snapshot.publicGameState
  const trickNumber = options.trickNumber ?? gs.round.currentTrick?.trick_number ?? 2

  clearTrick(snapshot)

  const cards = specs.map((spec, index) =>
    demoCard(spec.suit, spec.char, {
      id: `demo-trick-${trickNumber}-${index}`,
      owner: spec.owner,
      state: 'in_trick'
    })
  )
  for (const card of cards) {
    gs.publicCards[card.id] = card
  }

  const winnerIndex = options.resolved ? options.winningIndex : undefined
  const winnerCard = winnerIndex !== undefined ? cards[winnerIndex] : undefined

  gs.round.currentTrick = {
    trick_id: `demo-trick-${trickNumber}`,
    trick_state: options.resolved ? 'resolve' : 'in_progress',
    trick_number: trickNumber,
    lead_player: options.leadPlayer ?? specs[0]?.owner ?? TUTORIAL_PLAYER_ID,
    winning_card: winnerCard?.id ?? null,
    lead_suit: options.leadSuit ?? null,
    cards: cards.map(card => card.id),
    stolenCards: options.stolenIndexes?.map(index => cards[index]!.id),
    score: {
      trick_winner: winnerCard?.owner ?? null,
      trick_points: cards.reduce((total, card) => total + card.points, 0),
      trick_collections: countSuits(cards)
    }
  }

  syncHandCounts(snapshot, trickNumber, new Set(specs.map(spec => spec.owner)))
}

function setPlayerBids(
  snapshot: TutorialSnapshot,
  bids: { bidId: string; trickNumber: TrickNumber; onLose: number; isPlayerWinning?: boolean | null }[]
) {
  snapshot.publicGameState.round.roundBids.playerBids.player_1 = bids.map(bid => ({
    bidId: bid.bidId,
    trickNumber: bid.trickNumber,
    onLose: bid.onLose,
    isPlayerWinning: bid.isPlayerWinning ?? null
  }))
}

export const tutorialStateBuilders: Record<string, TutorialStateBuilder> = {
  // Board mid-trick, exactly like the base mock. First step of `basic-rules`
  // doubles as the state captured by scripts/capture-rules-screenshots.mjs.
  'full-board': () => {},

  'round-setup': snapshot => {
    snapshot.publicGameState.round.roundPhase = 'round_setup'
    clearTrick(snapshot)
  },

  'swap-phase': snapshot => {
    snapshot.publicGameState.round.roundPhase = 'player_drawing'
    snapshot.publicGameState.round.playerTurn = TUTORIAL_PLAYER_ID
    clearTrick(snapshot)
  },

  // Kept for MobileDevView (?phase=player_drawing).
  'scripted-deal': (snapshot, options) => {
    snapshot.publicGameState.round.roundPhase = 'player_drawing'
    clearTrick(snapshot)

    const firstCard = snapshot.privateGameState.hand?.find(card => card.state === 'in_hand_visible')
    const hiddenCards = snapshot.privateGameState.hand?.filter(card => card.state === 'in_hand_hidden') ?? []

    snapshot.publicGameState.opponentsPublicInfo = snapshot.publicGameState.opponentsPublicInfo.map(info => ({
      ...info,
      handCardsCount: options.dealCompleted ? 5 : 1
    }))

    if (firstCard) {
      snapshot.privateGameState.hand = options.dealCompleted ? [firstCard, ...hiddenCards] : [firstCard]
    }
  },

  // --- Trick demos -------------------------------------------------------

  // First card of the round sets the led suit; a second player throws garbage.
  'trick-led-suit': snapshot => {
    setTrick(snapshot, [
      { suit: 'acorns', char: '10', owner: 'player_1' },
      { suit: 'leaves', char: '8', owner: 'player_2' }
    ], { trickNumber: 1, leadSuit: 'acorns', leadPlayer: 'player_1' })
  },

  // Level 1: Karnoffel (Q of flowers) beats even the led-suit Ober.
  'trick-major-trump': snapshot => {
    setTrick(snapshot, [
      { suit: 'acorns', char: '10', owner: 'player_1' },
      { suit: 'acorns', char: 'O', owner: 'player_2' },
      { suit: 'flowers', char: 'Q', owner: 'player_3' },
      { suit: 'berries', char: '8', owner: 'player_4' }
    ], { trickNumber: 2, leadSuit: 'acorns', leadPlayer: 'player_1', resolved: true, winningIndex: 2 })
  },

  // Level 2: the Ober of the led suit beats a minor trump.
  'trick-led-ober': snapshot => {
    setTrick(snapshot, [
      { suit: 'berries', char: '10', owner: 'player_1' },
      { suit: 'flowers', char: '2', owner: 'player_2' },
      { suit: 'berries', char: 'O', owner: 'player_3' },
      { suit: 'berries', char: 'U', owner: 'player_4' }
    ], { trickNumber: 2, leadSuit: 'berries', leadPlayer: 'player_1', resolved: true, winningIndex: 2 })
  },

  // Level 3: the rules.md example — a sad 2 of flowers climbs over everyone.
  'trick-minor-trump': snapshot => {
    setTrick(snapshot, [
      { suit: 'berries', char: '10', owner: 'player_1' },
      { suit: 'leaves', char: 'O', owner: 'player_2' },
      { suit: 'flowers', char: '2', owner: 'player_3' },
      { suit: 'berries', char: '8', owner: 'player_4' }
    ], { trickNumber: 2, leadSuit: 'berries', leadPlayer: 'player_1', resolved: true, winningIndex: 2 })
  },

  // Level 4: only led-suit cards compete; off-suit 10s and Obers are dead.
  'trick-minor-colors': snapshot => {
    setTrick(snapshot, [
      { suit: 'acorns', char: '9', owner: 'player_1' },
      { suit: 'berries', char: '10', owner: 'player_2' },
      { suit: 'acorns', char: '10', owner: 'player_3' },
      { suit: 'leaves', char: 'O', owner: 'player_4' }
    ], { trickNumber: 2, leadSuit: 'acorns', leadPlayer: 'player_1', resolved: true, winningIndex: 2 })
  },

  // --- The three birds ---------------------------------------------------

  // Owl leading beats everything, even the Ace of flowers.
  'owl-lead': snapshot => {
    setTrick(snapshot, [
      { suit: 'berries', char: 'S', owner: 'player_2' },
      { suit: 'flowers', char: 'A', owner: 'player_3' },
      { suit: 'berries', char: '10', owner: 'player_4' },
      { suit: 'berries', char: 'O', owner: 'player_1' }
    ], { trickNumber: 4, leadSuit: 'berries', leadPlayer: 'player_2', resolved: true, winningIndex: 0 })
  },

  // ...except the Karnoffel.
  'owl-karnoffel': snapshot => {
    setTrick(snapshot, [
      { suit: 'berries', char: 'S', owner: 'player_2' },
      { suit: 'flowers', char: 'A', owner: 'player_3' },
      { suit: 'flowers', char: 'Q', owner: 'player_4' },
      { suit: 'berries', char: 'O', owner: 'player_1' }
    ], { trickNumber: 4, leadSuit: 'berries', leadPlayer: 'player_2', resolved: true, winningIndex: 2 })
  },

  // Owl not leading: lowest berry alive, loses to the 10.
  'owl-off-lead': snapshot => {
    setTrick(snapshot, [
      { suit: 'berries', char: '9', owner: 'player_1' },
      { suit: 'berries', char: 'S', owner: 'player_2' },
      { suit: 'berries', char: '10', owner: 'player_3' },
      { suit: 'leaves', char: '5', owner: 'player_4' }
    ], { trickNumber: 3, leadSuit: 'berries', leadPlayer: 'player_1', resolved: true, winningIndex: 2 })
  },

  // Sparrow: player_2 wins the trick with the Ace, but player_3 steals it.
  'sparrow-steal': snapshot => {
    setTrick(snapshot, [
      { suit: 'leaves', char: '9', owner: 'player_1' },
      { suit: 'flowers', char: 'A', owner: 'player_2' },
      { suit: 'leaves', char: 'S', owner: 'player_3' },
      { suit: 'leaves', char: '6', owner: 'player_4' }
    ], { trickNumber: 3, leadSuit: 'leaves', leadPlayer: 'player_1', resolved: true, winningIndex: 1 })
  },

  // Woodpecker can never win, but its owner picks who leads next.
  'woodpecker': snapshot => {
    setTrick(snapshot, [
      { suit: 'leaves', char: '10', owner: 'player_1' },
      { suit: 'acorns', char: 'S', owner: 'player_2' },
      { suit: 'flowers', char: '1', owner: 'player_3' },
      { suit: 'leaves', char: '8', owner: 'player_4' }
    ], { trickNumber: 3, leadSuit: 'leaves', leadPlayer: 'player_1', resolved: true, winningIndex: 2 })
  },

  // --- Bets & scoring ----------------------------------------------------

  // Trick 1 about to start: all six bid cards are available.
  'bid-pool': snapshot => {
    snapshot.publicGameState.round.roundPhase = 'playing'
    setTrick(snapshot, [], { trickNumber: 1, leadPlayer: TUTORIAL_PLAYER_ID })
    snapshot.publicGameState.round.playerTurn = TUTORIAL_PLAYER_ID
    setPlayerBids(snapshot, [])
  },

  // Window 2: one bet already down, two rabbits left.
  'bid-window-2': snapshot => {
    setTrick(snapshot, [
      { suit: 'leaves', char: 'O', owner: 'player_2' }
    ], { trickNumber: 2, leadSuit: 'leaves', leadPlayer: 'player_2' })
    snapshot.publicGameState.round.playerTurn = 'player_3'
    setPlayerBids(snapshot, [{ bidId: 'points-1', trickNumber: 1, onLose: -20, isPlayerWinning: true }])
  },

  // Window 3: last chance — penalties are highest now.
  'bid-window-3': snapshot => {
    setTrick(snapshot, [
      { suit: 'berries', char: '7', owner: 'player_3' },
      { suit: 'flowers', char: '4', owner: 'player_4' }
    ], { trickNumber: 3, leadSuit: 'berries', leadPlayer: 'player_3' })
    snapshot.publicGameState.round.playerTurn = TUTORIAL_PLAYER_ID
    setPlayerBids(snapshot, [
      { bidId: 'points-1', trickNumber: 1, onLose: -20, isPlayerWinning: true },
      { bidId: 'set-1', trickNumber: 2, onLose: -15, isPlayerWinning: true }
    ])
  },

  'bid-points': snapshot => {
    setTrick(snapshot, [
      { suit: 'acorns', char: '10', owner: 'player_1' },
      { suit: 'leaves', char: '8', owner: 'player_2' }
    ], { trickNumber: 2, leadSuit: 'acorns', leadPlayer: 'player_1' })
    setPlayerBids(snapshot, [{ bidId: 'points-1', trickNumber: 1, onLose: -20, isPlayerWinning: true }])
  },

  'bid-collection': snapshot => {
    setTrick(snapshot, [
      { suit: 'acorns', char: '10', owner: 'player_1' },
      { suit: 'leaves', char: '8', owner: 'player_2' }
    ], { trickNumber: 2, leadSuit: 'acorns', leadPlayer: 'player_1' })
    setPlayerBids(snapshot, [{ bidId: 'set-1', trickNumber: 1, onLose: -10, isPlayerWinning: true }])
    const score = snapshot.publicGameState.round.roundScore.find(s => s.playerId === TUTORIAL_PLAYER_ID)
    if (score) score.setCollection = { acorns: 3, leaves: 0, berries: 1, flowers: 0 }
  },

  'bid-tricks': snapshot => {
    setTrick(snapshot, [
      { suit: 'acorns', char: '10', owner: 'player_1' },
      { suit: 'leaves', char: '8', owner: 'player_2' }
    ], { trickNumber: 2, leadSuit: 'acorns', leadPlayer: 'player_1' })
    setPlayerBids(snapshot, [{ bidId: 'trick-2', trickNumber: 1, onLose: -20, isPlayerWinning: true }])
  },

  // Round over: bets settle, card points only bank if you stayed quiet.
  'round-end': snapshot => {
    snapshot.publicGameState.round.roundPhase = 'scoring'
    clearTrick(snapshot)
    setPlayerBids(snapshot, [
      { bidId: 'points-1', trickNumber: 1, onLose: -20, isPlayerWinning: true },
      { bidId: 'trick-2', trickNumber: 2, onLose: -25, isPlayerWinning: false }
    ])
    snapshot.publicGameState.round.roundScore = [
      { playerId: 'player_1', points: 24, tricksWon: [1, 4], setCollection: { acorns: 2, leaves: 0, berries: 1, flowers: 1 } },
      { playerId: 'player_2', points: 9, tricksWon: [2], setCollection: { acorns: 0, leaves: 2, berries: 0, flowers: 0 } },
      { playerId: 'player_3', points: 6, tricksWon: [], setCollection: { acorns: 0, leaves: 1, berries: 1, flowers: 0 } },
      { playerId: 'player_4', points: 31, tricksWon: [3, 5], setCollection: { acorns: 1, leaves: 0, berries: 1, flowers: 2 } }
    ]
  },

  'game-end': snapshot => {
    snapshot.publicGameState.gamePhase = 'ended'
    snapshot.publicGameState.round.roundPhase = 'scoring'
    clearTrick(snapshot)
    snapshot.publicGameState.playerScores = [
      { playerId: 'player_1', score: 95 },
      { playerId: 'player_2', score: 61 },
      { playerId: 'player_3', score: 40 },
      { playerId: 'player_4', score: 104 }
    ]
    snapshot.publicGameState.winner = 'player_4'
  }
}


