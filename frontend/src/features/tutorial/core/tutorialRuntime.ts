import type { PrivateGameState, PublicGameState } from '@domain/interfaces'
import type { TutorialStep } from './tutorialTypes'
import { createTutorialMockState } from './tutorialMockState'

export const TUTORIAL_PLAYER_ID = 'player_1' as const

interface TutorialRuntimeSnapshot {
  publicGameState: PublicGameState
  privateGameState: PrivateGameState
}

interface BuildStateOptions {
  stepId: TutorialStep['id']
  dealCompleted: boolean
}

function cloneSnapshot(snapshot: TutorialRuntimeSnapshot): TutorialRuntimeSnapshot {
  return structuredClone(snapshot)
}

function getBaseSnapshot(): TutorialRuntimeSnapshot {
  const { publicGameState, privateGameState } = createTutorialMockState()
  return { publicGameState, privateGameState }
}

function applyGameInfoState(snapshot: TutorialRuntimeSnapshot) {
  snapshot.publicGameState.round.roundPhase = 'round_setup'
  snapshot.publicGameState.round.currentTrick = null
}

function applyScriptedDealState(snapshot: TutorialRuntimeSnapshot, dealCompleted: boolean) {
  snapshot.publicGameState.round.roundPhase = 'player_drawing'
  snapshot.publicGameState.round.currentTrick = null

  const firstCard = snapshot.privateGameState.hand?.find(card => card.state === 'in_hand_visible')
  const hiddenCards = snapshot.privateGameState.hand?.filter(card => card.state === 'in_hand_hidden') ?? []

  snapshot.publicGameState.opponentsPublicInfo = snapshot.publicGameState.opponentsPublicInfo.map(info => ({
    ...info,
    handCardsCount: dealCompleted ? 5 : 1
  }))

  if (firstCard) {
    snapshot.privateGameState.hand = dealCompleted ? [firstCard, ...hiddenCards] : [firstCard]
  }
}

export function buildTutorialState(options: BuildStateOptions): TutorialRuntimeSnapshot {
  const snapshot = cloneSnapshot(getBaseSnapshot())

  if (options.stepId === 'game-info') {
    applyGameInfoState(snapshot)
    return snapshot
  }

  if (options.stepId === 'scripted-deal') {
    applyScriptedDealState(snapshot, options.dealCompleted)
    return snapshot
  }

  if (options.stepId === 'available-bids') {
    snapshot.publicGameState.round.roundPhase = 'playing'
    return snapshot
  }

  return snapshot
}
