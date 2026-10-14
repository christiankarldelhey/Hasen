import { describe, expect, it } from 'vitest'
import { BID_DEFINITIONS } from '@domain/data/bidDefinitions'
import type { Bid, BidType, Game, LeadSuit, PlayerCount, PlayerId, PlayingCard, Trick, TrickNumber } from '@domain/interfaces'
import { PLAYER_IDS, getDefaultPlayerProfile } from '@domain/interfaces'
import { canReplaceCard, canSkipCardReplacement } from '@domain/rules/CardReplacementRules'
import { canPlayCard, compareCards } from '@domain/rules/CardRules'
import {
  calculateBidOnLose,
  canMakeSpecificBid,
  getBidDuelAdjustment,
  getPlayerBidOutcome,
  getPlayerScoreFromRound
} from '@domain/rules/BidRules'
import { createDeck } from '@domain/rules/DeckRules'
import { canDrawBidPool, drawBidPool, getTotalRounds, type BidDecks } from '@domain/rules/BidDeckRules'
import { hasGameEnded } from '@domain/rules/GameEndRules'
import { determineLeadSuit, determineTrickWinner, hasTrickEnded, scoreCardsInTrick } from '@domain/rules/TrickRules'
import { getHighestPrioritySpecialCard } from '@domain/rules/SpecialCardRules'
import { HeuristicAgent } from './HeuristicAgent.js'
import { getBotToAct } from './botTurns.js'
import { getLegalActionsForBot } from './legalActions.js'
import type { BotAction } from './AgentPolicy.js'

const MAX_SIMULATION_STEPS = 1_000
const SKIP_CARD_REPLACEMENT_POINTS = 3
const VALID_STATES = new Set([
  'in_deck',
  'in_hand_visible',
  'in_hand_hidden',
  'in_trick',
  'in_finished_trick',
  'in_discard_pile'
])

type Rng = () => number

interface BidOutcomeSummary {
  playerId: PlayerId
  bidId: string
  bidType: BidType
  window: TrickNumber
  bidScore: number
  outcomeScore: number
  duelScore: number
  totalScore: number
  isWinning: boolean | null
}

interface PlayerRoundSummary {
  cardPoints: number
  tricksWon: TrickNumber[]
  collections: Record<string, number>
  roundScore: number
}

interface RoundSummary {
  round: number
  leadPlayer: PlayerId
  initialHands: Record<PlayerId, string[]>
  postDrawHands: Record<PlayerId, string[]>
  initialStrength: Record<PlayerId, number>
  players: Record<PlayerId, PlayerRoundSummary>
  bids: BidOutcomeSummary[]
}

interface SimulationResult {
  playerCount: PlayerCount
  rounds: number
  steps: number
  bidsMade: number
  winner: PlayerId
  finalScores: Record<PlayerId, number>
  actionCounts: Record<PlayerId, Partial<Record<BotAction['type'], number>>>
  roundSummaries: RoundSummary[]
}

interface RoundContext {
  leadPlayer: PlayerId
  initialHands: Record<PlayerId, string[]>
  postDrawHands: Record<PlayerId, string[]>
  initialStrength: Record<PlayerId, number>
}

function mulberry32(seed: number): Rng {
  let value = seed
  return () => {
    value += 0x6D2B79F5
    let next = value
    next = Math.imul(next ^ (next >>> 15), next | 1)
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61)
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleWithRng<T>(items: T[], rng: Rng): T[] {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(rng() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }
  return shuffled
}

function createBidDecks(playerCount: PlayerCount, rng: Rng): BidDecks {
  const decks: BidDecks = {
    setCollectionBidDeck: [],
    pointsBidDeck: [],
    tricksBidDeck: []
  }

  BID_DEFINITIONS.forEach((definition, definitionIndex) => {
    const copies = definition.copies[playerCount]
    for (let copy = 0; copy < copies; copy++) {
      const bid: Bid = {
        bid_id: `${playerCount}p-${definitionIndex}-${copy}`,
        bid_type: definition.type,
        bid_score: definition.score[playerCount],
        win_condition: definition.win_condition
      }

      if (definition.type === 'set_collection') decks.setCollectionBidDeck.push(bid)
      if (definition.type === 'points') decks.pointsBidDeck.push(bid)
      if (definition.type === 'trick') decks.tricksBidDeck.push(bid)
    }
  })

  return {
    setCollectionBidDeck: shuffleWithRng(decks.setCollectionBidDeck, rng),
    pointsBidDeck: shuffleWithRng(decks.pointsBidDeck, rng),
    tricksBidDeck: shuffleWithRng(decks.tricksBidDeck, rng)
  }
}

function createSimulationGame(playerCount: PlayerCount, rng: Rng): Game {
  const activePlayers = PLAYER_IDS.slice(0, playerCount).map(playerId => ({
    ...getDefaultPlayerProfile(playerId),
    isBot: true
  }))

  return {
    gameId: `sim-${playerCount}p`,
    gameName: `Simulation ${playerCount}p`,
    hostPlayer: activePlayers[0].id,
    hostUserId: 'simulation',
    activePlayers,
    deck: createDeck(),
    discardPile: [],
    bidDecks: createBidDecks(playerCount, rng),
    playerSessions: new Map(),
    gamePhase: 'playing',
    round: {
      round: 0,
      playerTurn: activePlayers[0].id,
      roundPhase: 'round_setup',
      currentTrick: null,
      roundBids: { bids: [], playerBids: {} },
      roundScore: [],
      playersReadyForNextRound: []
    },
    playerTurnOrder: activePlayers.map(player => player.id),
    tricksHistory: [],
    bidsHistory: [],
    playerScores: activePlayers.map(player => ({ playerId: player.id, score: 0 })),
    winner: null,
    playerConnectionStatus: new Map(activePlayers.map(player => [player.id, 'connected'])),
    isPaused: false,
    pauseReason: null,
    gameSettings: {
      minPlayers: 2,
      maxPlayers: playerCount,
      reconnectionTimeoutMinutes: 3
    }
  }
}

function getPlayerHand(game: Game, playerId: PlayerId): PlayingCard[] {
  return game.deck.filter(card =>
    card.owner === playerId &&
    (card.state === 'in_hand_hidden' || card.state === 'in_hand_visible')
  )
}

function estimateHandStrength(cards: PlayingCard[]): number {
  return cards.reduce((total, card) => {
    const trumpScore = card.suit === 'flowers' ? card.rank.base * 1.15 : 0
    const naturalScore = card.suit === 'flowers'
      ? 0
      : Math.max(card.rank.base, card.rank.onSuit ?? 0) * 0.55 + card.points * 0.25
    return total + trumpScore + naturalScore
  }, 0)
}

function snapshotRoundContext(game: Game): RoundContext {
  const initialHands = Object.fromEntries(game.activePlayers.map(player => [
    player.id,
    getPlayerHand(game, player.id).map(card => card.id)
  ])) as Record<PlayerId, string[]>
  const initialStrength = Object.fromEntries(game.activePlayers.map(player => [
    player.id,
    Number(estimateHandStrength(getPlayerHand(game, player.id)).toFixed(1))
  ])) as Record<PlayerId, number>

  return {
    leadPlayer: game.round.playerTurn,
    initialHands,
    postDrawHands: {},
    initialStrength
  }
}

function updatePostDrawHands(context: RoundContext, game: Game) {
  context.postDrawHands = Object.fromEntries(game.activePlayers.map(player => [
    player.id,
    getPlayerHand(game, player.id).map(card => card.id)
  ])) as Record<PlayerId, string[]>
}

function buildRoundSummary(game: Game, context: RoundContext): RoundSummary {
  const players = Object.fromEntries(game.activePlayers.map(player => {
    const score = game.round.roundScore.find(candidate => candidate.playerId === player.id)!
    return [player.id, {
      cardPoints: score.points,
      tricksWon: [...score.tricksWon],
      collections: { ...score.setCollection },
      roundScore: getPlayerScoreFromRound(game, player.id)
    }]
  })) as Record<PlayerId, PlayerRoundSummary>

  const bids = game.activePlayers.flatMap(player => {
    const playerRoundScore = game.round.roundScore.find(score => score.playerId === player.id)!
    return (game.round.roundBids.playerBids[player.id] ?? []).flatMap(entry => {
      const bid = game.round.roundBids.bids.find(candidate => candidate.bid_id === entry.bidId)
      if (!bid) return []

      const outcome = getPlayerBidOutcome(bid, entry, playerRoundScore)
      const duelScore = getBidDuelAdjustment(game, player.id, entry, outcome.isWinning)
      return [{
        playerId: player.id,
        bidId: bid.bid_id,
        bidType: bid.bid_type,
        window: entry.trickNumber,
        bidScore: bid.bid_score,
        outcomeScore: outcome.score,
        duelScore,
        totalScore: outcome.score + duelScore,
        isWinning: outcome.isWinning
      }]
    })
  })

  return {
    round: game.round.round,
    leadPlayer: context.leadPlayer,
    initialHands: context.initialHands,
    postDrawHands: context.postDrawHands,
    initialStrength: context.initialStrength,
    players,
    bids
  }
}

function advancePlayerTurn(game: Game): PlayerId {
  const currentIndex = game.playerTurnOrder.indexOf(game.round.playerTurn)
  if (currentIndex === -1) throw new Error(`Player ${game.round.playerTurn} is not in turn order`)

  const nextPlayer = game.playerTurnOrder[(currentIndex + 1) % game.playerTurnOrder.length]
  game.round.playerTurn = nextPlayer
  return nextPlayer
}

function addRoundScore(game: Game, playerId: PlayerId, cards: PlayingCard[], trickNumber: TrickNumber | null) {
  const score = scoreCardsInTrick(cards)
  let roundScore = game.round.roundScore.find(candidate => candidate.playerId === playerId)

  if (!roundScore) {
    roundScore = {
      playerId,
      points: 0,
      tricksWon: [],
      setCollection: { acorns: 0, leaves: 0, berries: 0, flowers: 0 }
    }
    game.round.roundScore.push(roundScore)
  }

  if (trickNumber !== null) roundScore.tricksWon.push(trickNumber)
  roundScore.points += score.trick_points
  if (score.trick_collections) {
    roundScore.setCollection.acorns += score.trick_collections.acorns
    roundScore.setCollection.leaves += score.trick_collections.leaves
    roundScore.setCollection.berries += score.trick_collections.berries
    roundScore.setCollection.flowers += score.trick_collections.flowers
  }
}

function startTrick(game: Game, leadPlayer?: PlayerId, trickNumber: TrickNumber = 1) {
  const lead = leadPlayer ?? game.round.playerTurn ?? game.playerTurnOrder[0]

  game.round.currentTrick = {
    trick_id: `round-${game.round.round}-trick-${trickNumber}`,
    trick_state: 'in_progress',
    trick_number: trickNumber,
    lead_player: lead,
    winning_card: null,
    lead_suit: null,
    cards: [],
    score: {
      trick_winner: null,
      trick_points: 0,
      trick_collections: null
    }
  }
  game.round.playerTurn = lead
}

function startRound(game: Game, rng: Rng) {
  if (game.gamePhase !== 'playing') throw new Error('Cannot start a round after game end')

  game.round.round += 1
  game.discardPile = []
  game.deck = shuffleWithRng(createDeck(), rng)
  game.round.roundScore = game.activePlayers.map(player => ({
    playerId: player.id,
    points: 0,
    tricksWon: [],
    setCollection: { acorns: 0, leaves: 0, berries: 0, flowers: 0 }
  }))

  const bidPool = drawBidPool(game.bidDecks)
  game.round.roundBids = bidPool
  game.bidsHistory.push(...bidPool.bids)

  let cardIndex = 0
  for (const player of game.activePlayers) {
    const card = game.deck[cardIndex++]
    card.owner = player.id
    card.state = 'in_hand_visible'
    card.position = 0
  }

  for (const player of game.activePlayers) {
    for (let position = 1; position < 5; position++) {
      const card = game.deck[cardIndex++]
      card.owner = player.id
      card.state = 'in_hand_hidden'
      card.position = position
    }
  }

  const leadIndex = (game.round.round - 1) % game.activePlayers.length
  const activePlayerIds = game.activePlayers.map(player => player.id)
  game.playerTurnOrder = [
    ...activePlayerIds.slice(leadIndex),
    ...activePlayerIds.slice(0, leadIndex)
  ]
  game.round.playerTurn = game.playerTurnOrder[0]
  game.round.roundPhase = 'player_drawing'
  game.round.currentTrick = null
  game.round.playersReadyForNextRound = []
}

function advanceDrawingTurn(game: Game) {
  const nextPlayer = advancePlayerTurn(game)
  if (game.playerTurnOrder.indexOf(nextPlayer) !== 0) return

  game.deck.forEach(card => {
    if (card.state === 'in_hand_visible') card.state = 'in_hand_hidden'
  })
  game.round.roundPhase = 'playing'
  startTrick(game)
}

function resolveTrick(game: Game) {
  const trick = game.round.currentTrick
  if (!trick) throw new Error('No active trick')
  const winningCard = game.deck.find(card => card.id === trick.winning_card)
  if (!winningCard?.owner) throw new Error('Cannot resolve a trick without a winning card')

  trick.trick_state = 'resolve'
  trick.score = {
    trick_winner: winningCard.owner,
    trick_points: 0,
    trick_collections: null
  }
}

function finishRound(game: Game) {
  for (const player of game.activePlayers) {
    const roundScore = getPlayerScoreFromRound(game, player.id)
    const playerScore = game.playerScores.find(candidate => candidate.playerId === player.id)
    if (playerScore) playerScore.score += roundScore
    else game.playerScores.push({ playerId: player.id, score: roundScore })
  }

  game.round.playersReadyForNextRound = []
  const gameEnd = hasGameEnded(game)
  if (gameEnd.hasEnded) {
    game.gamePhase = 'ended'
    game.winner = gameEnd.winner
  }
}

function finishTrick(game: Game) {
  const trick = game.round.currentTrick
  if (!trick) throw new Error('No active trick')
  if (trick.trick_state !== 'resolve') throw new Error(`Cannot finish trick in ${trick.trick_state}`)

  const trickWinner = trick.score.trick_winner
  if (!trickWinner) throw new Error('Trick winner is missing')

  const stolenCardId = trick.pendingSpecialAction?.selectedCardToSteal
  let stolenCard: PlayingCard | null = null
  if (stolenCardId) {
    stolenCard = game.deck.find(card => card.id === stolenCardId) ?? null
    if (!stolenCard) throw new Error('Selected stolen card not found')
    stolenCard.owner = trick.pendingSpecialAction!.playerId
    stolenCard.state = 'in_finished_trick'
    trick.stolenCards = [stolenCard.id]
    trick.cards = trick.cards.filter(cardId => cardId !== stolenCard.id)
  }

  const trickCards = trick.cards.map(cardId => {
    const card = game.deck.find(candidate => candidate.id === cardId)
    if (!card) throw new Error(`Trick card ${cardId} not found`)
    return card
  })
  const trickScore = scoreCardsInTrick(trickCards)
  addRoundScore(game, trickWinner, trickCards, trick.trick_number)

  if (stolenCard) {
    addRoundScore(game, stolenCard.owner!, [stolenCard], null)
  }

  trickCards.forEach(card => {
    card.state = 'in_finished_trick'
  })
  trick.score = {
    trick_winner: trickWinner,
    trick_points: trickScore.trick_points,
    trick_collections: trickScore.trick_collections
  }
  trick.trick_state = 'ended'
  game.tricksHistory.push({
    ...trick,
    cards: [...trick.cards],
    stolenCards: [...(trick.stolenCards ?? [])],
    pendingSpecialAction: trick.pendingSpecialAction ? { ...trick.pendingSpecialAction } : undefined,
    score: {
      trick_winner: trick.score.trick_winner,
      trick_points: trick.score.trick_points,
      trick_collections: trick.score.trick_collections
        ? { ...trick.score.trick_collections }
        : null
    }
  })

  game.round.currentTrick = null
  if (trick.trick_number < 5) {
    const nextLead = trick.pendingSpecialAction?.selectedNextLead ?? trickWinner
    startTrick(game, nextLead, (trick.trick_number + 1) as TrickNumber)
    return
  }

  game.round.roundPhase = 'scoring'
  finishRound(game)
}

function applyAction(game: Game, playerId: PlayerId, action: BotAction, rng: Rng) {
  switch (action.type) {
    case 'skip_replacement': {
      const validation = canSkipCardReplacement(playerId, game.round)
      if (!validation.valid) throw new Error(validation.reason)

      const playerScore = game.playerScores.find(candidate => candidate.playerId === playerId)
      if (playerScore) playerScore.score += SKIP_CARD_REPLACEMENT_POINTS
      advanceDrawingTurn(game)
      return
    }
    case 'replace_card': {
      const hand = getPlayerHand(game, playerId)
      const remainingDeckCards = game.deck.filter(card => card.state === 'in_deck')
      const validation = canReplaceCard(playerId, action.cardId, hand, game.round, remainingDeckCards.length)
      if (!validation.valid) throw new Error(validation.reason)

      const discardedCard = game.deck.find(card => card.id === action.cardId)
      const drawnCard = remainingDeckCards[Math.floor(rng() * remainingDeckCards.length)]
      if (!discardedCard || !drawnCard) throw new Error('Replacement card not found')

      discardedCard.owner = null
      discardedCard.state = 'in_discard_pile'
      game.discardPile.push(discardedCard)
      drawnCard.owner = playerId
      drawnCard.state = 'in_hand_hidden'
      drawnCard.position = action.position
      advanceDrawingTurn(game)
      return
    }
    case 'make_bid': {
      const trick = game.round.currentTrick
      const bid = game.round.roundBids.bids.find(candidate => candidate.bid_id === action.bidId)
      if (!trick || !bid) throw new Error('Bid action references missing trick or bid')

      const validation = canMakeSpecificBid(game, playerId, bid, trick.trick_number)
      if (!validation.canMakeBid) throw new Error(validation.reason)

      game.round.roundBids.playerBids[playerId] ??= []
      game.round.roundBids.playerBids[playerId]!.push({
        bidId: bid.bid_id,
        trickNumber: trick.trick_number,
        onLose: calculateBidOnLose(
          bid.bid_type,
          trick.trick_number,
          game.activePlayers.length as PlayerCount
        ),
        isPlayerWinning: null
      })
      return
    }
    case 'play_card': {
      const trick = game.round.currentTrick
      const card = game.deck.find(candidate => candidate.id === action.cardId)
      if (!trick || !card) throw new Error('Card or trick not found')

      const validation = canPlayCard(
        card,
        playerId,
        game.round.playerTurn,
        getPlayerHand(game, playerId),
        trick,
        new Map(trick.cards.map(cardId => {
          const trickCard = game.deck.find(candidate => candidate.id === cardId)
          return [cardId, trickCard!.owner!] as const
        }))
      )
      if (!validation.valid) throw new Error(validation.reason)

      card.state = 'in_trick'
      trick.cards.push(card.id)
      if (!trick.lead_suit) trick.lead_suit = determineLeadSuit(card)

      if (!trick.winning_card) {
        trick.winning_card = card.id
      } else {
        const winningCard = game.deck.find(candidate => candidate.id === trick.winning_card)
        if (!winningCard) throw new Error('Winning card not found')
        trick.winning_card = compareCards(winningCard, card, trick.trick_number, trick.lead_suit as LeadSuit | null).id
      }

      if (!hasTrickEnded(trick, game.activePlayers.map(player => player.id))) {
        advancePlayerTurn(game)
        return
      }

      const specialCard = getHighestPrioritySpecialCard(game.deck, trick)
      if (specialCard) {
        trick.trick_state = 'awaiting_special_action'
        trick.pendingSpecialAction = {
          type: specialCard.type,
          playerId: specialCard.playerId
        }
        game.round.playerTurn = specialCard.playerId
        return
      }

      trick.trick_state = 'resolve'
      const winningCard = game.deck.find(candidate => candidate.id === trick.winning_card)
      if (!winningCard) throw new Error('Winning card not found')
      trick.score.trick_winner = determineTrickWinner(trick, winningCard, card, trick.lead_suit)
      return
    }
    case 'select_next_lead': {
      const trick = game.round.currentTrick
      if (trick?.trick_state !== 'awaiting_special_action' || trick.pendingSpecialAction?.type !== 'PICK_NEXT_LEAD') {
        throw new Error('No next-lead selection is pending')
      }
      if (trick.pendingSpecialAction.playerId !== playerId) throw new Error('Wrong special-action player')
      if (!game.activePlayers.some(player => player.id === action.selectedLeadPlayer)) {
        throw new Error('Selected lead is not active')
      }

      trick.pendingSpecialAction.selectedNextLead = action.selectedLeadPlayer
      resolveTrick(game)
      return
    }
    case 'select_card_to_steal': {
      const trick = game.round.currentTrick
      if (trick?.trick_state !== 'awaiting_special_action' || trick.pendingSpecialAction?.type !== 'STEAL_CARD') {
        throw new Error('No card steal is pending')
      }
      if (trick.pendingSpecialAction.playerId !== playerId) throw new Error('Wrong special-action player')
      if (!trick.cards.includes(action.selectedCardId)) throw new Error('Selected card is not in the trick')

      trick.pendingSpecialAction.selectedCardToSteal = action.selectedCardId
      resolveTrick(game)
      return
    }
    case 'finish_trick': {
      finishTrick(game)
      return
    }
    case 'ready_next_round': {
      if (game.round.roundPhase !== 'scoring') throw new Error('Cannot ready outside scoring')
      game.round.playersReadyForNextRound ??= []
      if (!game.round.playersReadyForNextRound.includes(playerId)) {
        game.round.playersReadyForNextRound.push(playerId)
      }
      if (game.round.playersReadyForNextRound.length === game.activePlayers.length) {
        startRound(game, rng)
      }
      return
    }
  }
}

function assertRoundScoreMatchesHistory(game: Game) {
  const historyStart = (game.round.round - 1) * 5
  const roundHistory = game.tricksHistory.slice(historyStart)

  for (const player of game.activePlayers) {
    const expected = {
      points: 0,
      tricksWon: [] as TrickNumber[],
      setCollection: { acorns: 0, leaves: 0, berries: 0, flowers: 0 }
    }

    for (const trick of roundHistory) {
      const cards = trick.cards.map(cardId => game.deck.find(card => card.id === cardId)!)
      if (trick.score.trick_winner === player.id) {
        const score = scoreCardsInTrick(cards)
        expected.tricksWon.push(trick.trick_number)
        expected.points += score.trick_points
        for (const suit of ['acorns', 'leaves', 'berries', 'flowers'] as const) {
          expected.setCollection[suit] += score.trick_collections![suit]
        }
      }

      for (const stolenCardId of trick.stolenCards ?? []) {
        const thiefId = trick.pendingSpecialAction?.playerId
        if (thiefId !== player.id) continue
        const stolenCard = game.deck.find(card => card.id === stolenCardId)!
        const score = scoreCardsInTrick([stolenCard])
        expected.points += score.trick_points
        for (const suit of ['acorns', 'leaves', 'berries', 'flowers'] as const) {
          expected.setCollection[suit] += score.trick_collections![suit]
        }
      }
    }

    const actual = game.round.roundScore.find(score => score.playerId === player.id)
    expect(actual?.points, `Round score points for ${player.id}`).toBe(expected.points)
    expect(actual?.tricksWon, `Round tricks for ${player.id}`).toEqual(expected.tricksWon)
    expect(actual?.setCollection, `Round collections for ${player.id}`).toEqual(expected.setCollection)
  }
}

function assertGameInvariants(game: Game) {
  const activePlayerIds = game.activePlayers.map(player => player.id)
  const cardIds = new Set(game.deck.map(card => card.id))
  expect(cardIds.size).toBe(game.deck.length)

  for (const card of game.deck) {
    expect(VALID_STATES.has(card.state), `Invalid state ${card.state} for ${card.id}`).toBe(true)
    if (card.state === 'in_deck' || card.state === 'in_discard_pile') {
      expect(card.owner, `${card.id} has owner in ${card.state}`).toBeNull()
    } else {
      expect(activePlayerIds, `${card.id} has invalid owner`).toContain(card.owner)
    }
  }

  const discardIds = new Set(game.discardPile.map(card => card.id))
  for (const card of game.deck.filter(candidate => candidate.state === 'in_discard_pile')) {
    expect(discardIds.has(card.id), `${card.id} is marked discarded but absent from discardPile`).toBe(true)
  }

  const trick = game.round.currentTrick
  if (trick) {
    expect(trick.cards.length).toBeLessThanOrEqual(game.activePlayers.length)
    expect(new Set(trick.cards).size).toBe(trick.cards.length)
    const owners = new Set<PlayerId>()
    for (const cardId of trick.cards) {
      const card = game.deck.find(candidate => candidate.id === cardId)
      expect(card?.state, `${cardId} should be in trick`).toBe('in_trick')
      expect(card?.owner).toBeTruthy()
      owners.add(card!.owner!)
    }
    expect(owners.size).toBe(trick.cards.length)
    if (trick.cards.length > 0) expect(trick.cards).toContain(trick.winning_card)
  }

  if (game.round.roundPhase === 'playing') {
    expect(game.deck.some(card => card.state === 'in_hand_visible')).toBe(false)
  }

  const completedTricksThisRound = game.round.roundScore.reduce(
    (total, score) => total + score.tricksWon.length,
    0
  )
  expect(game.tricksHistory).toHaveLength((game.round.round - 1) * 5 + completedTricksThisRound)

  for (let roundIndex = 0; roundIndex < game.round.round; roundIndex++) {
    const roundTricks = game.tricksHistory.slice(roundIndex * 5, (roundIndex + 1) * 5)
    if (roundTricks.length === 5) {
      expect(roundTricks.map(trick => trick.trick_number)).toEqual([1, 2, 3, 4, 5])
    }

    for (const trick of roundTricks) {
      const cardsInTrick = [...trick.cards, ...(trick.stolenCards ?? [])]
      expect(cardsInTrick).toHaveLength(game.activePlayers.length)
      expect(new Set(cardsInTrick).size).toBe(cardsInTrick.length)
      const trickCards = trick.cards.map(cardId => game.deck.find(card => card.id === cardId)!)
      expect(trick.score.trick_points).toBe(scoreCardsInTrick(trickCards).trick_points)
      ;(trick.stolenCards ?? []).forEach(cardId => {
        expect(game.deck.some(card => card.id === cardId)).toBe(true)
      })
    }
  }

  if (game.round.roundPhase === 'player_drawing') {
    for (const playerId of activePlayerIds) {
      expect(getPlayerHand(game, playerId)).toHaveLength(5)
    }
  }
  if (game.round.roundPhase === 'scoring') {
    for (const playerId of activePlayerIds) {
      expect(getPlayerHand(game, playerId)).toHaveLength(0)
    }
  }

  expect(game.round.roundBids.bids).toHaveLength(6)
  expect(game.bidsHistory).toHaveLength(game.round.round * 6)
  expect(new Set(game.bidsHistory.map(bid => bid.bid_id)).size).toBe(game.bidsHistory.length)
  for (const playerScore of game.playerScores) {
    expect(Number.isFinite(playerScore.score)).toBe(true)
  }

  const bidIds = new Set(game.round.roundBids.bids.map(bid => bid.bid_id))
  const bidTypes = new Map<string, BidType>(game.round.roundBids.bids.map(bid => [bid.bid_id, bid.bid_type]))
  const bidderCounts = new Map<string, number>()

  for (const playerId of activePlayerIds) {
    const entries = game.round.roundBids.playerBids[playerId] ?? []
    expect(entries.length).toBeLessThanOrEqual(3)
    expect(new Set(entries.map(entry => entry.trickNumber)).size).toBe(entries.length)
    expect(new Set(entries.map(entry => bidTypes.get(entry.bidId))).size).toBe(entries.length)

    for (const entry of entries) {
      expect(bidIds.has(entry.bidId), `Unknown bid ${entry.bidId}`).toBe(true)
      expect(entry.trickNumber).toBeLessThanOrEqual(3)
      expect(entry.onLose).toBe(calculateBidOnLose(
        bidTypes.get(entry.bidId)!,
        entry.trickNumber,
        game.activePlayers.length as PlayerCount
      ))
      bidderCounts.set(entry.bidId, (bidderCounts.get(entry.bidId) ?? 0) + 1)
    }
  }

  bidderCounts.forEach(count => expect(count).toBeLessThanOrEqual(2))
  assertRoundScoreMatchesHistory(game)
}

function describeState(game: Game): string {
  const trick = game.round.currentTrick
  return JSON.stringify({
    gamePhase: game.gamePhase,
    round: game.round.round,
    roundPhase: game.round.roundPhase,
    playerTurn: game.round.playerTurn,
    trick: trick && {
      number: trick.trick_number,
      state: trick.trick_state,
      cards: trick.cards,
      lead: trick.lead_player,
      winningCard: trick.winning_card,
      pending: trick.pendingSpecialAction
    },
    bidDeckCounts: {
      collection: game.bidDecks.setCollectionBidDeck.length,
      points: game.bidDecks.pointsBidDeck.length,
      tricks: game.bidDecks.tricksBidDeck.length
    },
    scores: game.playerScores,
    hands: Object.fromEntries(game.activePlayers.map(player => [
      player.id,
      game.deck
        .filter(card => card.owner === player.id)
        .map(card => `${card.id}:${card.state}`)
    ])),
    turnOrder: game.playerTurnOrder
  })
}

function assertGameEnded(game: Game, playerCount: PlayerCount) {
  expect(game.gamePhase).toBe('ended')
  expect(game.winner).toBeTruthy()
  expect(canDrawBidPool(game.bidDecks)).toBe(false)
  expect(game.round.round).toBe(getTotalRounds(playerCount))
  expect(game.tricksHistory).toHaveLength(game.round.round * 5)

  const topScore = Math.max(...game.playerScores.map(score => score.score))
  const tied = new Set(game.playerScores.filter(score => score.score === topScore).map(score => score.playerId))
  const expectedWinner = game.playerTurnOrder.find(playerId => tied.has(playerId))
  expect(game.winner).toBe(expectedWinner)
}

async function simulateGame(playerCount: PlayerCount, seed: number): Promise<SimulationResult> {
  const rng = mulberry32(seed)
  const game = createSimulationGame(playerCount, rng)
  const agent = new HeuristicAgent()
  const roundContexts = new Map<number, RoundContext>()
  const roundSummaries: RoundSummary[] = []
  const actionCounts = Object.fromEntries(game.activePlayers.map(player => [
    player.id,
    {} as Partial<Record<BotAction['type'], number>>
  ])) as Record<PlayerId, Partial<Record<BotAction['type'], number>>>
  let steps = 0
  let bidsMade = 0

  startRound(game, rng)
  roundContexts.set(game.round.round, snapshotRoundContext(game))

  while (game.gamePhase === 'playing') {
    if (steps >= MAX_SIMULATION_STEPS) {
      throw new Error(`Simulation exceeded ${MAX_SIMULATION_STEPS} steps: ${describeState(game)}`)
    }

    const playerId = getBotToAct(game)
    if (!playerId) throw new Error(`No bot can act: ${describeState(game)}`)

    const legalActions = getLegalActionsForBot(game, playerId)
    if (legalActions.length === 0) throw new Error(`No legal actions for ${playerId}: ${describeState(game)}`)

    const action = await agent.decide({ game, playerId, legalActions })
    expect(legalActions).toContainEqual(action)

    const previousPhase = game.round.roundPhase
    const previousRound = game.round.round
    try {
      applyAction(game, playerId, action, rng)
    } catch (error) {
      throw new Error(
        `Action ${JSON.stringify(action)} by ${playerId} failed: ${(error as Error).message}. State: ${describeState(game)}`
      )
    }

    if (game.round.round !== previousRound) {
      roundContexts.set(game.round.round, snapshotRoundContext(game))
    } else if (previousPhase === 'player_drawing' && game.round.roundPhase === 'playing') {
      const context = roundContexts.get(game.round.round)
      if (context) updatePostDrawHands(context, game)
    } else if (previousPhase === 'playing' && game.round.roundPhase === 'scoring') {
      const context = roundContexts.get(game.round.round)
      if (context) roundSummaries.push(buildRoundSummary(game, context))
    }

    actionCounts[playerId][action.type] = (actionCounts[playerId][action.type] ?? 0) + 1
    if (action.type === 'make_bid') bidsMade += 1
    steps += 1
    assertGameInvariants(game)
  }

  assertGameEnded(game, playerCount)
  const finalScores = Object.fromEntries(
    game.playerScores.map(score => [score.playerId, score.score])
  ) as Record<PlayerId, number>

  return {
    playerCount,
    rounds: game.round.round,
    steps,
    bidsMade,
    winner: game.winner!,
    finalScores,
    actionCounts,
    roundSummaries
  }
}

describe('full game simulation', () => {
  it.each(([2, 3, 4] as const).flatMap(playerCount =>
    [1, 2, 3, 4, 5].map(seed => [playerCount, playerCount * 10 + seed] as const)
  ))('plays a complete %i-player bot match with seed %i', async (playerCount, seed) => {
    const result = await simulateGame(playerCount, seed)

    expect(result.rounds).toBe(getTotalRounds(playerCount))
    expect(result.steps).toBeGreaterThan(0)
    expect(result.bidsMade).toBeGreaterThan(0)
    expect(Object.keys(result.finalScores)).toHaveLength(playerCount)
  })
})
