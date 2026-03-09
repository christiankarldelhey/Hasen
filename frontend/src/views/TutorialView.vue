<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, provide, ref, watch } from 'vue'
import GameLayout from '@/layout/GameLayout.vue'
import TutorialOverlay from '@/features/tutorial/ui/TutorialOverlay.vue'
import { basicRulesScenario } from '@/features/tutorial/scenarios/basicRulesScenario'
import { useTutorialEngine } from '@/features/tutorial/core/useTutorialEngine'
import type { HighlightRect } from '@/features/tutorial/core/tutorialTypes'
import { buildTutorialState, TUTORIAL_PLAYER_ID } from '@/features/tutorial/core/tutorialRuntime'
import GameInfo from '@/features/Game/GameInfo.vue'
import AvailableBids from '@/features/Bids/AvailableBids.vue'
import OtherPlayerHand from '@/features/Players/OtherPlayerHand.vue'
import Trick from '@/features/Trick/Trick.vue'
import PlayerHand from '@/features/Players/PlayerHand.vue'
import AnimationOverlay from '@/features/Animations/components/AnimationOverlay.vue'
import { provideAnimationCoords, useDealAnimation } from '@/features/Animations'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'
import type { PlayerId, PrivateGameState, PublicGameState } from '@domain/interfaces'

const {
  currentStep,
  stepIndex,
  totalSteps,
  isFirstStep,
  isLastStep,
  nextStep,
  previousStep,
  restart
} = useTutorialEngine(basicRulesScenario)

const gameStore = useGameStore()
const hasenStore = useHasenStore()

const previousPublicGameState = ref<PublicGameState | null>(
  gameStore.publicGameState ? structuredClone(gameStore.publicGameState) : null
)
const previousPrivateGameState = ref<PrivateGameState | null>(
  gameStore.privateGameState ? structuredClone(gameStore.privateGameState) : null
)
const previousPlayerId = ref(hasenStore.currentPlayerId)

const animCoords = provideAnimationCoords()
const { isDealing, animatedCards, dealProgress } = useDealAnimation({ coords: animCoords })

const allAnimatedCards = computed(() => [...animatedCards.value])

provide('specialCards', {
  isPlayerSelectable: () => false,
  isCardSelectable: () => false,
  handlePlayerClick: (_playerId: PlayerId) => {
    // tutorial mode: no-op
  },
  handleCardClick: (_cardId: string) => {
    // tutorial mode: no-op
  }
})

provide('isDealing', isDealing)
provide('dealProgress', dealProgress)

const highlightRect = ref<HighlightRect | null>(null)
const highlightRects = ref<HighlightRect[]>([])
const tutorialRoot = ref<HTMLElement | null>(null)

const opponentPositions = computed(() => {
  const infos = gameStore.publicGameState?.opponentsPublicInfo || []
  const currentPlayerId = hasenStore.currentPlayerId
  const opponents = infos.filter(info => info.playerId !== currentPlayerId)

  if (!opponents.length) return []

  return opponents.slice(0, 3).map((opponent, index) => {
    const position = index === 0 ? 'top' : index === 1 ? 'left' : 'right'

    return {
      playerId: opponent.playerId,
      publicCardId: opponent.publicCardId,
      position: position as 'top' | 'left' | 'right'
    }
  })
})

const trickCards = computed(() => {
  const currentTrick = gameStore.publicGameState?.round.currentTrick
  if (!currentTrick) return []

  const publicCards = gameStore.publicGameState?.publicCards || {}
  return currentTrick.cards
    .map(cardId => publicCards[cardId])
    .filter((card): card is NonNullable<typeof card> => card !== undefined)
})

const playerHand = computed(() => {
  return gameStore.privateGameState?.hand || []
})

const winningCardId = computed(() => {
  return gameStore.publicGameState?.round.currentTrick?.winning_card || null
})

const trickState = computed(() => {
  return gameStore.publicGameState?.round.currentTrick?.trick_state || null
})

function applyStepState() {
  const stepId = currentStep.value?.id
  if (!stepId) return

  const snapshot = buildTutorialState({
    stepId,
    dealCompleted: false
  })

  gameStore.setPublicGameState(snapshot.publicGameState)
  gameStore.setPrivateGameState(snapshot.privateGameState)
  hasenStore.setCurrentPlayerId(TUTORIAL_PLAYER_ID)
}

function initializeTutorialState() {
  applyStepState()
}

function restorePreviousState() {
  gameStore.reset()

  if (previousPublicGameState.value) {
    gameStore.setPublicGameState(previousPublicGameState.value)
  }

  if (previousPrivateGameState.value) {
    gameStore.setPrivateGameState(previousPrivateGameState.value)
  }

  if (previousPlayerId.value) {
    hasenStore.setCurrentPlayerId(previousPlayerId.value as PlayerId)
  } else {
    hasenStore.currentPlayerId = ''
  }
}

function getTargetRects(targetId: string | undefined): HighlightRect[] {
  if (!targetId || !tutorialRoot.value) return []

  const targets = tutorialRoot.value.querySelectorAll(`[data-tutorial-id="${targetId}"]`)
  if (!targets.length) return []

  return Array.from(targets)
    .map((target): HighlightRect => {
      const rect = target.getBoundingClientRect()
      return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      }
    })
    .filter(rect => rect.width > 0 && rect.height > 0)
}

async function refreshHighlight() {
  await nextTick()
  const rects = getTargetRects(currentStep.value?.targetId)
  highlightRects.value = rects
  highlightRect.value = rects[0] ?? null
}

function handleNext() {
  if (isLastStep.value) {
    restart()
  } else {
    nextStep()
  }
}

watch(currentStep, async () => {
  applyStepState()
  await refreshHighlight()
}, { immediate: true })

onMounted(() => {
  initializeTutorialState()
  refreshHighlight()
  window.addEventListener('resize', refreshHighlight)
  window.addEventListener('scroll', refreshHighlight, true)
})

onUnmounted(() => {
  restorePreviousState()
  window.removeEventListener('resize', refreshHighlight)
  window.removeEventListener('scroll', refreshHighlight, true)
})
</script>

<template>
  <GameLayout>
    <div ref="tutorialRoot" class="relative h-screen w-full">
      <div data-tutorial-id="game-info">
        <GameInfo />
      </div>

      <AvailableBids />

      <OtherPlayerHand
        v-for="opponent in opponentPositions"
        :key="opponent.playerId"
        :player-id="opponent.playerId"
        :public-card-id="opponent.publicCardId"
        :position="opponent.position"
      />

      <Trick class="translate-y-14" :cards="trickCards" :winning-card-id="winningCardId" :trick-state="trickState" />

      <AnimationOverlay :cards="allAnimatedCards" />

      <PlayerHand
        :cards="playerHand"
        mode="normal"
        :is-my-turn="true"
        :is-trick-in-resolve="false"
        :is-trick-winner="false"
        :can-finish-trick="false"
      />

      <TutorialOverlay
        v-if="currentStep"
        :title="currentStep.title"
        :description="currentStep.description"
        :step-index="stepIndex"
        :total-steps="totalSteps"
        :rect="highlightRect"
        :rects="highlightRects"
        :is-first-step="isFirstStep"
        :is-last-step="isLastStep"
        @next="handleNext"
        @previous="previousStep"
        @restart="restart"
      />
    </div>
  </GameLayout>
</template>
