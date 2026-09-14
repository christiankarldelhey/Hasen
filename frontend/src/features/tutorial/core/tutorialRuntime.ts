import { createTutorialMockState, TUTORIAL_PLAYER_ID } from './tutorialMockState'
import { tutorialStateBuilders, type TutorialSnapshot } from './tutorialStateBuilders'

export { TUTORIAL_PLAYER_ID }
export type { TutorialSnapshot }

interface BuildStateOptions {
  /** Key into tutorialStateBuilders; falls back to the base mock state. */
  stateId: string
  dealCompleted?: boolean
}

export function buildTutorialState(options: BuildStateOptions): TutorialSnapshot {
  const { publicGameState, privateGameState } = createTutorialMockState()
  const snapshot: TutorialSnapshot = structuredClone({ publicGameState, privateGameState })

  tutorialStateBuilders[options.stateId]?.(snapshot, options)

  return snapshot
}
