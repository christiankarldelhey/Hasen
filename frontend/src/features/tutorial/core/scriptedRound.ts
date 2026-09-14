import type {
  Bid,
  Character,
  Game,
  LeadSuit,
  PlayerBidEntry,
  PlayerId,
  PlayerRoundScore,
  PlayingCard,
  Suit,
  Trick,
  TrickNumber
} from '@domain/interfaces'
import { compareCards } from '@domain/rules/CardRules'
import { determineLeadSuit, scoreCardsInTrick } from '@domain/rules/TrickRules'
import { calculateBidOnLose, getPlayerScoreFromRound, isWinningBid } from '@domain/rules/BidRules'
import { demoCard } from './tutorialCards'
import { TUTORIAL_PLAYER_ID } from './tutorialMockState'
import type { TutorialSnapshot, TutorialStateBuilder } from './tutorialStateBuilders'

export interface CardSpec {
  suit: Suit
  char: Character
}

export interface ScriptedPlay extends CardSpec {
  owner: PlayerId
}

export interface ScriptedHand {
  visible: CardSpec
  hidden: CardSpec[]
}

export interface ScriptedBid {
  bidId: string
  trickNumber: TrickNumber
}

export interface ScriptedSteal {
  /** 1-based trick where the steal happens at resolve time. */
  trick: number
  by: PlayerId
  card: CardSpec
}

export interface ScriptedRound {
  hands: Record<PlayerId, ScriptedHand>
  /** What the tutorial player does in the swap phase, or null to pass (+3). */
  swap: { discard: CardSpec; draw: CardSpec } | null
  /** Players who skipped the swap (+3 each). May include the tutorial player. */
  swapSkippedBy: PlayerId[]
  /** Play order inside each trick == array order; plays[0].owner leads. */
  tricks: ScriptedPlay[][]
  /** Sparrow steals applied when a trick resolves. */
  steals?: ScriptedSteal[]
  bids: Bid[]
  /** Bids the tutorial player places during the round. */
  playerBids: ScriptedBid[]
}

export interface ScriptedMatch {
  rounds: ScriptedRound[]
  /** Scores carried into round 1. */
  initialScores?: Partial<Record<PlayerId, number>>
}

export interface ScriptCursor {
  /** 0-based round index. */
  round: number
  phase: 'swap' | 'play' | 'scoring'
  /** 1-based; ignored in 'swap'. */
  trick?: number
  /** Cards already on the table in the current trick. */
  played?: number
  /** All cards down and the winner marked. */
  resolved?: boolean
  /** Swap already performed by the tutorial player. Implied by phase !== 'swap'. */
  swapped?: boolean
  /** How many of the round's `playerBids` are already placed. */
  bids?: number
}

const sameCard = (a: CardSpec, b: CardSpec) => a.suit === b.suit && a.char === b.char
const cardId = (owner: PlayerId, spec: CardSpec) => `script-${owner}-${spec.suit}-${spec.char}`

function playerHandCards(script: ScriptedRound, owner: PlayerId, swapped: boolean): PlayingCard[] {
  const hand = script.hands[owner]
  let hidden = hand.hidden
  if (owner === TUTORIAL_PLAYER_ID && swapped && script.swap) {
    hidden = hidden.map(spec => (sameCard(spec, script.swap!.discard) ? script.swap!.draw : spec))
  }
  return [
    demoCard(hand.visible.suit, hand.visible.char, { id: cardId(owner, hand.visible), owner, state: 'in_hand_visible' }),
    ...hidden.map(spec => demoCard(spec.suit, spec.char, { id: cardId(owner, spec), owner, state: 'in_hand_hidden' }))
  ]
}

interface ResolvedTrick {
  cards: PlayingCard[]
  leadSuit: LeadSuit | null
  winner: PlayingCard
}

function resolveTrick(plays: ScriptedPlay[], trickNumber: TrickNumber): ResolvedTrick {
  const cards = plays.map(play =>
    demoCard(play.suit, play.char, { id: cardId(play.owner, play), owner: play.owner, state: 'in_trick' })
  )
  const leadSuit = determineLeadSuit(cards[0]!)
  const winner = cards.slice(1).reduce((best, card) => compareCards(best, card, trickNumber, leadSuit), cards[0]!)
  return { cards, leadSuit, winner }
}

function emptyRoundScore(playerId: PlayerId): PlayerRoundScore {
  return { playerId, points: 0, tricksWon: [], setCollection: { acorns: 0, leaves: 0, berries: 0, flowers: 0 } }
}

function addCardsToScore(score: PlayerRoundScore, cards: PlayingCard[]) {
  const trickScore = scoreCardsInTrick(cards)
  score.points += trickScore.trick_points
  for (const suit of Object.keys(trickScore.trick_collections!) as Suit[]) {
    score.setCollection[suit] += trickScore.trick_collections![suit]
  }
}

/** Round score per player for the first `completedCount` tricks of `script`. */
function computeRoundScores(script: ScriptedRound, players: PlayerId[], completedCount: number) {
  const roundScore = new Map(players.map(id => [id, emptyRoundScore(id)]))

  for (let index = 0; index < completedCount; index++) {
    const plays = script.tricks[index]!
    const result = resolveTrick(plays, (index + 1) as TrickNumber)
    const steal = script.steals?.find(s => s.trick === index + 1)
    const stolen = steal ? result.cards.filter(card => sameCard(card, steal.card)) : []
    const kept = result.cards.filter(card => !stolen.includes(card))

    const winnerScore = roundScore.get(result.winner.owner!)!
    addCardsToScore(winnerScore, kept)
    winnerScore.tricksWon.push((index + 1) as TrickNumber)
    if (steal && stolen.length) {
      addCardsToScore(roundScore.get(steal.by)!, stolen)
    }
  }
  return roundScore
}

/** Final score a player banks for a fully played scripted round (bids or card points). */
function roundResult(script: ScriptedRound, players: PlayerId[], playerId: PlayerId): number {
  const roundScore = computeRoundScores(script, players, script.tricks.length)
  // Only the tutorial player places bids in our scripts.
  const entries: PlayerBidEntry[] = script.playerBids.map(placed => {
    const bid = script.bids.find(b => b.bid_id === placed.bidId)!
    return {
      bidId: placed.bidId,
      trickNumber: placed.trickNumber,
      onLose: calculateBidOnLose(bid.bid_type, placed.trickNumber),
      isPlayerWinning: isWinningBid(bid, roundScore.get(TUTORIAL_PLAYER_ID)!, true)
    }
  })
  const game = {
    round: {
      roundScore: players.map(id => roundScore.get(id)!),
      roundBids: { bids: script.bids, playerBids: { [TUTORIAL_PLAYER_ID]: entries } }
    }
  } as unknown as Game
  return getPlayerScoreFromRound(game, playerId)
}

/** Swap bonuses of a round (skippers get +3 straight to the game score). */
function swapBonuses(script: ScriptedRound, players: PlayerId[]): Map<PlayerId, number> {
  return new Map(players.map(id => [id, script.swapSkippedBy.includes(id) ? 3 : 0]))
}

/** Builders that materialise the scripted match at `cursor`. */
export function scriptedState(match: ScriptedMatch, cursor: ScriptCursor): TutorialStateBuilder {
  return (snapshot: TutorialSnapshot) => {
    const script = match.rounds[cursor.round]!
    const gs = snapshot.publicGameState
    const players = gs.playerTurnOrder
    const swapped = cursor.phase !== 'swap' || !!cursor.swapped
    const trickNumber = (cursor.phase === 'scoring' ? script.tricks.length : cursor.trick ?? 1) as TrickNumber
    const played = cursor.phase === 'play' ? cursor.played ?? 0 : 0
    const resolved = cursor.phase === 'play' && !!cursor.resolved

    // --- Hands -------------------------------------------------------------
    const hands = new Map(players.map(id => [id, playerHandCards(script, id, swapped)]))
    const removeFromHand = (owner: PlayerId, spec: CardSpec) => {
      hands.set(owner, hands.get(owner)!.filter(card => !sameCard(card, spec)))
    }

    // --- Completed tricks → round score -----------------------------------
    const completedCount = cursor.phase === 'scoring' ? script.tricks.length : trickNumber - 1 + (resolved ? 1 : 0)
    const roundScore = computeRoundScores(script, players, completedCount)
    for (let index = 0; index < completedCount; index++) {
      for (const play of script.tricks[index]!) removeFromHand(play.owner, play)
    }

    // --- Current trick -----------------------------------------------------
    let currentTrick: Trick | null = null
    let playerTurn: PlayerId = TUTORIAL_PLAYER_ID

    if (cursor.phase === 'play') {
      const plays = script.tricks[trickNumber - 1]!
      const result = resolveTrick(plays, trickNumber)
      const onTable = result.cards.slice(0, resolved ? plays.length : played)
      for (const card of onTable) removeFromHand(card.owner!, card)

      const leadSuit = onTable.length ? determineLeadSuit(onTable[0]!) : null
      const trickScore = scoreCardsInTrick(onTable)

      currentTrick = {
        trick_id: `script-trick-${cursor.round}-${trickNumber}`,
        trick_state: resolved ? 'resolve' : 'in_progress',
        trick_number: trickNumber,
        lead_player: plays[0]!.owner,
        winning_card: resolved ? result.winner.id : null,
        lead_suit: leadSuit,
        cards: onTable.map(card => card.id),
        score: { ...trickScore, trick_winner: resolved ? result.winner.owner : null }
      }

      playerTurn = resolved ? result.winner.owner! : plays[Math.min(played, plays.length - 1)]!.owner
    }

    // --- Public cards ------------------------------------------------------
    gs.publicCards = {}
    for (const id of players) {
      const visible = hands.get(id)!.find(card => card.state === 'in_hand_visible')
      if (visible) gs.publicCards[visible.id] = visible
    }
    if (currentTrick) {
      for (const card of resolveTrick(script.tricks[trickNumber - 1]!, trickNumber).cards) {
        if (currentTrick.cards.includes(card.id)) gs.publicCards[card.id] = card
      }
    }

    gs.opponentsPublicInfo = players.map(id => ({
      playerId: id,
      publicCardId: cardId(id, script.hands[id]!.visible),
      handCardsCount: hands.get(id)!.length
    }))

    // --- Bids --------------------------------------------------------------
    const placedBids = script.playerBids.slice(
      0,
      cursor.bids ?? (cursor.phase === 'scoring' ? script.playerBids.length : 0)
    )
    const myScore = roundScore.get(TUTORIAL_PLAYER_ID)!
    const entries: PlayerBidEntry[] = placedBids.map(placed => {
      const bid = script.bids.find(b => b.bid_id === placed.bidId)!
      return {
        bidId: placed.bidId,
        trickNumber: placed.trickNumber,
        onLose: calculateBidOnLose(bid.bid_type, placed.trickNumber),
        isPlayerWinning: isWinningBid(bid, myScore, cursor.phase === 'scoring')
      }
    })

    gs.round.roundBids = {
      bids: script.bids,
      playerBids: Object.fromEntries(players.map(id => [id, id === TUTORIAL_PLAYER_ID ? entries : []]))
    }

    // --- Round / phase -----------------------------------------------------
    gs.round.round = cursor.round + 1
    gs.round.roundPhase = cursor.phase === 'swap' ? 'player_drawing' : cursor.phase === 'scoring' ? 'scoring' : 'playing'
    gs.round.playerTurn = playerTurn
    gs.round.currentTrick = currentTrick
    gs.round.roundScore = players.map(id => roundScore.get(id)!)

    // --- Game scores (cumulative across rounds) ----------------------------
    const bonuses = swapBonuses(script, players)
    gs.playerScores = players.map(id => {
      let score = match.initialScores?.[id] ?? 0
      for (let r = 0; r < cursor.round; r++) {
        const past = match.rounds[r]!
        score += roundResult(past, players, id) + (swapBonuses(past, players).get(id) ?? 0)
      }
      if (swapped) score += bonuses.get(id) ?? 0
      if (cursor.phase === 'scoring') score += roundResult(script, players, id)
      return { playerId: id, score }
    })

    snapshot.privateGameState.hand = hands.get(TUTORIAL_PLAYER_ID)!
  }
}

/**
 * Builders that reveal the rival plays of a trick one at a time, starting after
 * `fromPlayed` cards are on the table, and end with the trick resolved.
 */
export function revealTrick(match: ScriptedMatch, round: number, trick: number, fromPlayed: number, bids?: number): TutorialStateBuilder[] {
  const total = match.rounds[round]!.tricks[trick - 1]!.length
  const steps: TutorialStateBuilder[] = []
  for (let played = fromPlayed + 1; played <= total; played++) {
    steps.push(scriptedState(match, { round, phase: 'play', trick, played, bids }))
  }
  steps.push(scriptedState(match, { round, phase: 'play', trick, played: total, resolved: true, bids }))
  return steps
}
