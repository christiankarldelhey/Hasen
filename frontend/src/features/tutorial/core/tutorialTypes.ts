export interface TutorialStep {
  id: string
  title: string
  description: string
  targetId: string
}

export interface TutorialScenario {
  id: string
  title: string
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
