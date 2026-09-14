import type { TutorialScenario, TutorialStep } from '../core/tutorialTypes'
import { revealTrick, scriptedState, type ScriptCursor } from '../core/scriptedRound'
import { firstMatchScript as match } from './firstMatchScript'

const K = 'tutorial.scenarios.firstRound.steps'
const at = (cursor: ScriptCursor) => [scriptedState(match, cursor)]
const reveal = (round: number, trick: number, fromPlayed: number, bids = 1) =>
  revealTrick(match, round, trick, fromPlayed, bids)

function step(id: string, extra: Omit<TutorialStep, 'id' | 'title' | 'description'>): TutorialStep {
  return { id, title: `${K}.${id}.title`, description: `${K}.${id}.description`, ...extra}
}

// One guided match in three rounds: R1 general flow, R2 collection bets,
// R3 trick bets. The player performs every action on the real board.
export const firstRoundScenario: TutorialScenario = {
  id: 'first-round',
  title: 'tutorial.scenarios.firstRound.title',
  description: 'tutorial.scenarios.firstRound.description',
  icon: '🎲',
  steps: [
    // ------------------------------------------------------------- Round 1
    step('intro', { states: at({ round: 0, phase: 'swap' }) }),
    step('yourHand', { targetId: 'player-hand', states: at({ round: 0, phase: 'swap' }) }),
    step('swap', {
      targetId: 'player-hand',
      states: at({ round: 0, phase: 'swap' }),
      action: { type: 'replace-card', suit: 'leaves', char: '8' },
      hint: `${K}.swap.hint`
    }),
    step('swapResult', { targetId: 'player-hand', states: at({ round: 0, phase: 'play', trick: 1, played: 0 }) }),
    step('bet', {
      targetId: 'available-bids',
      states: at({ round: 0, phase: 'play', trick: 1, played: 0 }),
      action: { type: 'make-bid', bidId: 'points-2' },
      hint: `${K}.bet.hint`
    }),
    step('playOber', {
      targetId: 'player-hand',
      states: at({ round: 0, phase: 'play', trick: 1, played: 0, bids: 1 }),
      action: { type: 'play-card', suit: 'acorns', char: 'O' },
      hint: `${K}.playOber.hint`
    }),
    step('trick1Result', {
      targetId: 'trick-center',
      states: reveal(0, 1, 1),
      action: { type: 'finish-trick' }
    }),
    step('playGarbage', {
      targetId: 'player-hand',
      states: at({ round: 0, phase: 'play', trick: 2, played: 0, bids: 1 }),
      action: { type: 'play-card', suit: 'acorns', char: '9' },
      hint: `${K}.playGarbage.hint`
    }),
    step('trick2Result', { targetId: 'trick-center', states: reveal(0, 2, 1) }),
    step('trick3Watch', { targetId: 'trick-center', states: reveal(0, 3, 0).slice(0, 3) }),
    step('playKing', {
      targetId: 'player-hand',
      states: at({ round: 0, phase: 'play', trick: 3, played: 3, bids: 1 }),
      action: { type: 'play-card', suit: 'flowers', char: 'K' },
      hint: `${K}.playKing.hint`
    }),
    step('trick3Result', {
      targetId: 'trick-center',
      states: at({ round: 0, phase: 'play', trick: 3, played: 4, resolved: true, bids: 1 }),
      action: { type: 'finish-trick' }
    }),
    step('playOwl', {
      targetId: 'player-hand',
      states: at({ round: 0, phase: 'play', trick: 4, played: 0, bids: 1 }),
      action: { type: 'play-card', suit: 'berries', char: 'S' },
      hint: `${K}.playOwl.hint`
    }),
    step('trick4Result', {
      targetId: 'trick-center',
      states: reveal(0, 4, 1),
      action: { type: 'finish-trick' }
    }),
    step('playLast', {
      targetId: 'player-hand',
      states: at({ round: 0, phase: 'play', trick: 5, played: 0, bids: 1 }),
      action: { type: 'play-card', suit: 'berries', char: '10' },
      hint: `${K}.playLast.hint`
    }),
    step('trick5Result', {
      targetId: 'trick-center',
      states: reveal(0, 5, 1),
      action: { type: 'finish-trick' }
    }),
    step('roundScoring', {
      targetId: 'player-round-score',
      mobileTargetId: 'game-scores',
      states: at({ round: 0, phase: 'scoring' })
    }),
    step('roundDone', { targetId: 'game-scores', states: at({ round: 0, phase: 'scoring' }) }),

    // ------------------------------------------------------------- Round 2
    step('r2Intro', { states: at({ round: 1, phase: 'swap' }) }),
    step('r2Hand', { targetId: 'player-hand', states: at({ round: 1, phase: 'swap' }) }),
    step('r2Swap', {
      targetId: 'player-hand',
      states: at({ round: 1, phase: 'swap' }),
      action: { type: 'replace-card', suit: 'berries', char: '9' },
      hint: `${K}.r2Swap.hint`
    }),
    step('r2Bet', {
      targetId: 'available-bids',
      states: at({ round: 1, phase: 'play', trick: 1, played: 0 }),
      action: { type: 'make-bid', bidId: 'set-1' },
      hint: `${K}.r2Bet.hint`
    }),
    step('r2Sparrow', {
      targetId: 'player-hand',
      states: reveal(1, 1, 0).slice(0, 3),
      action: { type: 'play-card', suit: 'leaves', char: 'S' },
      hint: `${K}.r2Sparrow.hint`
    }),
    step('r2Trick1Result', {
      targetId: 'trick-center',
      states: reveal(1, 1, 3),
      action: { type: 'finish-trick' }
    }),
    step('r2Play10', {
      targetId: 'player-hand',
      states: at({ round: 1, phase: 'play', trick: 2, played: 1, bids: 1 }),
      action: { type: 'play-card', suit: 'acorns', char: '10' },
      hint: `${K}.r2Play10.hint`
    }),
    step('r2Trick2Result', {
      targetId: 'trick-center',
      states: reveal(1, 2, 1),
      action: { type: 'finish-trick' }
    }),
    step('r2Play9', {
      targetId: 'player-hand',
      states: at({ round: 1, phase: 'play', trick: 3, played: 0, bids: 1 }),
      action: { type: 'play-card', suit: 'leaves', char: '9' },
      hint: `${K}.r2Play9.hint`
    }),
    step('r2Trick3Result', {
      targetId: 'trick-center',
      states: reveal(1, 3, 0),
      action: { type: 'finish-trick' }
    }),
    step('r2Play6', {
      targetId: 'player-hand',
      states: at({ round: 1, phase: 'play', trick: 4, played: 0, bids: 1 }),
      action: { type: 'play-card', suit: 'leaves', char: '6' },
      hint: `${K}.r2Play6.hint`
    }),
    step('r2Trick4Result', {
      targetId: 'trick-center',
      states: reveal(1, 4, 0),
      action: { type: 'finish-trick' }
    }),
    step('r2Play7', {
      targetId: 'player-hand',
      states: at({ round: 1, phase: 'play', trick: 5, played: 0, bids: 1 }),
      action: { type: 'play-card', suit: 'leaves', char: '7' },
      hint: `${K}.r2Play7.hint`
    }),
    step('r2Trick5Result', {
      targetId: 'trick-center',
      states: reveal(1, 5, 0),
      action: { type: 'finish-trick' }
    }),
    step('r2Scoring', {
      targetId: 'player-round-score',
      mobileTargetId: 'game-scores',
      states: at({ round: 1, phase: 'scoring' })
    }),
    step('r2Done', { targetId: 'game-scores', states: at({ round: 1, phase: 'scoring' }) }),

    // ------------------------------------------------------------- Round 3
    step('r3Intro', { states: at({ round: 2, phase: 'swap' }) }),
    step('r3Hand', { targetId: 'player-hand', states: at({ round: 2, phase: 'swap' }) }),
    step('r3Skip', {
      targetId: 'player-hand',
      states: at({ round: 2, phase: 'swap' }),
      action: { type: 'skip-replacement' },
      hint: `${K}.r3Skip.hint`
    }),
    step('r3Bet', {
      targetId: 'available-bids',
      states: at({ round: 2, phase: 'play', trick: 1, played: 0 }),
      action: { type: 'make-bid', bidId: 'trick-1' },
      hint: `${K}.r3Bet.hint`
    }),
    step('r3Trick1Watch', { targetId: 'trick-center', states: reveal(2, 1, 0) }),
    step('r3Play10', {
      targetId: 'player-hand',
      states: at({ round: 2, phase: 'play', trick: 2, played: 1, bids: 1 }),
      action: { type: 'play-card', suit: 'acorns', char: '10' },
      hint: `${K}.r3Play10.hint`
    }),
    step('r3Trick2Result', {
      targetId: 'trick-center',
      states: reveal(2, 2, 1),
      action: { type: 'finish-trick' }
    }),
    step('r3LeadOber', {
      targetId: 'player-hand',
      states: at({ round: 2, phase: 'play', trick: 3, played: 0, bids: 1 }),
      action: { type: 'play-card', suit: 'berries', char: 'O' },
      hint: `${K}.r3LeadOber.hint`
    }),
    step('r3Trick3Result', {
      targetId: 'trick-center',
      states: reveal(2, 3, 0),
      action: { type: 'finish-trick' }
    }),
    step('r3Woodpecker', {
      targetId: 'player-hand',
      states: at({ round: 2, phase: 'play', trick: 4, played: 2, bids: 1 }),
      action: { type: 'play-card', suit: 'acorns', char: 'S' },
      hint: `${K}.r3Woodpecker.hint`
    }),
    step('r3Trick4Result', {
      targetId: 'trick-center',
      states: reveal(2, 4, 2),
      action: { type: 'finish-trick' }
    }),
    step('r3PlayTrump', {
      targetId: 'player-hand',
      states: at({ round: 2, phase: 'play', trick: 5, played: 0, bids: 1 }),
      action: { type: 'play-card', suit: 'flowers', char: '5' },
      hint: `${K}.r3PlayTrump.hint`
    }),
    step('r3Trick5Result', {
      targetId: 'trick-center',
      states: reveal(2, 5, 0),
      action: { type: 'finish-trick' }
    }),
    step('r3Scoring', {
      targetId: 'player-round-score',
      mobileTargetId: 'game-scores',
      states: at({ round: 2, phase: 'scoring' })
    }),
    step('gameDone', { targetId: 'game-scores', states: at({ round: 2, phase: 'scoring' }) })
  ]
}
