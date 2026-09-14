import type { TutorialScenario } from '../core/tutorialTypes'
import { firstRoundScenario } from './firstRoundScenario'

export const tutorialScenarios: TutorialScenario[] = [firstRoundScenario]

export function getScenarioById(id: string | undefined | null): TutorialScenario | null {
  if (!id) return null
  return tutorialScenarios.find(scenario => scenario.id === id) ?? null
}
