import { computed, ref } from 'vue'
import type { TutorialScenario } from './tutorialTypes'

export function useTutorialEngine(scenario: TutorialScenario) {
  const stepIndex = ref(0)

  const totalSteps = computed(() => scenario.steps.length)
  const currentStep = computed(() => scenario.steps[stepIndex.value] ?? null)
  const isFirstStep = computed(() => stepIndex.value === 0)
  const isLastStep = computed(() => stepIndex.value >= totalSteps.value - 1)
  const isCompleted = computed(() => totalSteps.value > 0 && isLastStep.value)

  function nextStep() {
    if (stepIndex.value < totalSteps.value - 1) {
      stepIndex.value += 1
    }
  }

  function previousStep() {
    if (stepIndex.value > 0) {
      stepIndex.value -= 1
    }
  }

  function restart() {
    stepIndex.value = 0
  }

  return {
    stepIndex,
    totalSteps,
    currentStep,
    isFirstStep,
    isLastStep,
    isCompleted,
    nextStep,
    previousStep,
    restart
  }
}
