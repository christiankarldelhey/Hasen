import type { Character, Suit } from '@domain/interfaces'
import type { TutorialStateBuilder } from './tutorialStateBuilders'

/** An action the player must perform on the board to advance a step. */
export type TutorialAction =
  | { type: 'play-card'; suit: Suit; char: Character }
  | { type: 'make-bid'; bidId: string }
  | { type: 'replace-card'; suit: Suit; char: Character }
  | { type: 'skip-replacement' }
  | { type: 'finish-trick' }

export interface TutorialStep {
  id: string
  title: string
  description: string
  /** data-tutorial-id to highlight on the desktop board. Omit for text-only steps. */
  targetId?: string
  /** data-tutorial-id to highlight on the mobile board. Falls back to targetId. */
  mobileTargetId?: string
  /** Key into the state-builders registry; builds the mock board for this step. */
  stateId?: string
  /**
   * Builders applied in sequence when the step is entered (with a short delay
   * between them) — used to "reveal" rival plays one by one. Overrides stateId.
   */
  states?: TutorialStateBuilder[]
  /** If set, the Next button is disabled until the player performs this action. */
  action?: TutorialAction
  /** i18n key shown when the player performs a different action than expected. */
  hint?: string
}

export interface TutorialScenario {
  id: string
  title: string
  /** i18n key shown in the scenario selector. */
  description: string
  /** Emoji shown in the scenario selector. */
  icon?: string
  steps: TutorialStep[]
}

export interface TutorialEngineState {
  scenario: TutorialScenario
  stepIndex: number
  isCompleted: boolean
}

export interface HighlightRect {
  top: number
  left: number
  width: number
  height: number
}
