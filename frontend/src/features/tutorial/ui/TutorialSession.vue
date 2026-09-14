<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, provide, ref, watch } from 'vue'
import TutorialSidebar from './TutorialSidebar.vue'
import TutorialHighlights from './TutorialHighlights.vue'
import { useTutorialEngine } from '../core/useTutorialEngine'
import type { HighlightRect, TutorialAction, TutorialScenario } from '../core/tutorialTypes'
import { buildTutorialState, TUTORIAL_PLAYER_ID } from '../core/tutorialRuntime'
import { tutorialStateBuilders, type TutorialStateBuilder } from '../core/tutorialStateBuilders'
import GameBoardDesktop from '@/features/Game/GameBoardDesktop.vue'
import MobileGameBoard from '@/features/Mobile/MobileGameBoard.vue'
import { provideAnimationCoords, useDealAnimation } from '@/features/Animations'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'
import { useIsMobile } from '@/common/composables/useIsMobile'
import { useI18n } from '@/common/composables/useI18n'
import type { BidType, PlayerId, PrivateGameState, PublicGameState } from '@domain/interfaces'

const props = defineProps<{
  scenario: TutorialScenario
  /** Render the board full-size without sidebar/highlights (used for rules screenshots). */
  bare?: boolean
  /** In bare mode, render this state-builder key instead of the current step's state. */
  bareStateId?: string
}>()

const emit = defineEmits<{
  exit: []
}>()

const SIDEBAR_WIDTH = 320
const SIDEBAR_HEIGHT_MOBILE = 220
const REVEAL_DELAY_MS = 650
const HINT_MS = 3500

const {
  currentStep,
  stepIndex,
  totalSteps,
  isFirstStep,
  isLastStep,
  nextStep,
  previousStep,
  restart
} = useTutorialEngine(props.scenario)

const gameStore = useGameStore()
const hasenStore = useHasenStore()
const isMobile = useIsMobile()
const { t } = useI18n()

// --- Store save/restore -------------------------------------------------------

const previousPublicGameState = ref<PublicGameState | null>(
  gameStore.publicGameState ? structuredClone(gameStore.publicGameState) : null
)
const previousPrivateGameState = ref<PrivateGameState | null>(
  gameStore.privateGameState ? structuredClone(gameStore.privateGameState) : null
)
const previousPlayerId = ref(hasenStore.currentPlayerId)

function restorePreviousState() {
  gameStore.reset()
  if (previousPublicGameState.value) gameStore.setPublicGameState(previousPublicGameState.value)
  if (previousPrivateGameState.value) gameStore.setPrivateGameState(previousPrivateGameState.value)
  if (previousPlayerId.value) {
    hasenStore.setCurrentPlayerId(previousPlayerId.value as PlayerId)
  } else {
    hasenStore.currentPlayerId = ''
  }
}

// --- Board plumbing (mirrors GameView) ---------------------------------------

const animCoords = provideAnimationCoords()
const { isDealing, animatedCards, dealProgress } = useDealAnimation({ coords: animCoords })
const allAnimatedCards = computed(() => [...animatedCards.value])

provide('specialCards', {
  isPlayerSelectable: () => false,
  isCardSelectable: () => false,
  handlePlayerClick: (_playerId: PlayerId) => {},
  handleCardClick: (_cardId: string) => {}
})
provide('isDealing', isDealing)
provide('dealProgress', dealProgress)

const boardComponent = computed(() => (isMobile.value ? MobileGameBoard : GameBoardDesktop))

const opponentPositions = computed(() => {
  const infos = gameStore.publicGameState?.opponentsPublicInfo || []
  const opponents = infos.filter(info => info.playerId !== hasenStore.currentPlayerId)
  return opponents.slice(0, 3).map((opponent, index) => ({
    playerId: opponent.playerId,
    publicCardId: opponent.publicCardId,
    position: (index === 0 ? 'top' : index === 1 ? 'left' : 'right') as 'top' | 'left' | 'right'
  }))
})

const trickCards = computed(() => {
  const currentTrick = gameStore.publicGameState?.round.currentTrick
  if (!currentTrick) return []
  const publicCards = gameStore.publicGameState?.publicCards || {}
  return currentTrick.cards
    .map(cardId => publicCards[cardId])
    .filter((card): card is NonNullable<typeof card> => card !== undefined)
})

const playerHand = computed(() => gameStore.privateGameState?.hand || [])
const winningCardId = computed(() => gameStore.publicGameState?.round.currentTrick?.winning_card || null)
const trickState = computed(() => gameStore.publicGameState?.round.currentTrick?.trick_state || null)
const isMyTurn = computed(() => gameStore.publicGameState?.round.playerTurn === hasenStore.currentPlayerId)
const handMode = computed(() =>
  gameStore.publicGameState?.round.roundPhase === 'player_drawing' && isMyTurn.value
    ? 'card_replacement' as const
    : 'normal' as const
)
const isTrickInResolve = computed(() => trickState.value === 'resolve')
const isTrickWinner = computed(
  () => gameStore.publicGameState?.round.currentTrick?.score.trick_winner === hasenStore.currentPlayerId
)

// --- Step state --------------------------------------------------------------

let stateRun = 0

function applyBuilder(builder: TutorialStateBuilder) {
  const snapshot = buildTutorialState({ stateId: 'full-board' })
  builder(snapshot, {})
  gameStore.setPublicGameState(snapshot.publicGameState)
  gameStore.setPrivateGameState(snapshot.privateGameState)
  hasenStore.setCurrentPlayerId(TUTORIAL_PLAYER_ID)
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** Applies the step's state (or state sequence, revealing rival plays one at a time). */
async function applyStepState() {
  const step = currentStep.value
  if (!step) return
  const run = ++stateRun

  if (props.bare && props.bareStateId) {
    applyBuilder(tutorialStateBuilders[props.bareStateId] ?? tutorialStateBuilders['full-board']!)
    return
  }

  const builders = step.states ?? [tutorialStateBuilders[step.stateId ?? 'full-board'] ?? tutorialStateBuilders['full-board']!]
  for (let index = 0; index < builders.length; index++) {
    if (run !== stateRun) return
    applyBuilder(builders[index]!)
    await refreshHighlight()
    if (index < builders.length - 1) await sleep(REVEAL_DELAY_MS)
  }
}

// --- Highlights --------------------------------------------------------------

const highlightRects = ref<HighlightRect[]>([])
const tutorialRoot = ref<HTMLElement | null>(null)

const activeTargetId = computed(() => {
  const step = currentStep.value
  if (!step) return undefined
  return isMobile.value ? (step.mobileTargetId ?? step.targetId) : step.targetId
})

function getTargetRects(targetId: string | undefined): HighlightRect[] {
  if (!targetId || !tutorialRoot.value) return []
  // Elements may declare several ids: data-tutorial-id="a b".
  return Array.from(tutorialRoot.value.querySelectorAll('[data-tutorial-id]'))
    .filter(el => (el.getAttribute('data-tutorial-id') ?? '').split(/\s+/).includes(targetId))
    .map(el => el.getBoundingClientRect())
    .filter(rect => rect.width > 0 && rect.height > 0)
    .map(rect => ({ top: rect.top, left: rect.left, width: rect.width, height: rect.height }))
}

async function refreshHighlight() {
  await nextTick()
  highlightRects.value = getTargetRects(activeTargetId.value)
}

// --- Stage scaling -----------------------------------------------------------
// The board lays itself out fluidly against the viewport (fixed positions:
// panels hug the edges, the hand is pinned to the bottom). We render the stage
// at the real size of the available area so it behaves like a real game window,
// and only scale it down when the available width drops below the minimum
// comfortable board width. The transform also turns the stage into the
// containing block for every `position: fixed` element on the board.

// Width at which the desktop board's panels stop colliding (its design width).
const MIN_BOARD_WIDTH_DESKTOP = 1440
const MIN_BOARD_WIDTH_MOBILE = 400

const viewport = ref({ width: window.innerWidth, height: window.innerHeight })

const stageStyle = computed(() => {
  const { width, height } = viewport.value
  if (props.bare) return { width: `${width}px`, height: `${height}px`, transform: 'none' }

  const availableWidth = isMobile.value ? width : width - SIDEBAR_WIDTH
  const availableHeight = isMobile.value ? height - SIDEBAR_HEIGHT_MOBILE : height
  const minWidth = isMobile.value ? MIN_BOARD_WIDTH_MOBILE : MIN_BOARD_WIDTH_DESKTOP
  const scale = Math.min(availableWidth / minWidth, 1)

  return {
    width: `${availableWidth / scale}px`,
    height: `${availableHeight / scale}px`,
    transform: `scale(${scale})`
  }
})

function handleResize() {
  viewport.value = { width: window.innerWidth, height: window.innerHeight }
  refreshHighlight()
}

// --- Actions -----------------------------------------------------------------

const hint = ref<string | null>(null)
let hintTimer: ReturnType<typeof setTimeout> | null = null

function showHint() {
  const step = currentStep.value
  hint.value = step?.hint ? t(step.hint) : t('tutorial.genericHint')
  if (hintTimer) clearTimeout(hintTimer)
  hintTimer = setTimeout(() => (hint.value = null), HINT_MS)
}

const requiresAction = computed(() => !!currentStep.value?.action)

function advance() {
  hint.value = null
  if (isLastStep.value) {
    emit('exit')
  } else {
    nextStep()
  }
}

function matchesCard(action: TutorialAction, cardId: string) {
  const card = playerHand.value.find(c => c.id === cardId)
  return !!card && 'suit' in action && card.suit === action.suit && card.char === action.char
}

function performAction(actual: TutorialAction | { type: 'play-card' | 'replace-card'; cardId: string }) {
  const expected = currentStep.value?.action
  if (!expected) return

  let ok = false
  if ('cardId' in actual) {
    ok = expected.type === actual.type && matchesCard(expected, actual.cardId)
  } else if (actual.type === 'make-bid') {
    ok = expected.type === 'make-bid' && expected.bidId === actual.bidId
  } else {
    ok = expected.type === actual.type
  }

  if (ok) {
    advance()
  } else {
    showHint()
  }
}

const handlePlayCard = (cardId: string) => performAction({ type: 'play-card', cardId })
const handleConfirmReplacement = (cardId: string) => performAction({ type: 'replace-card', cardId })
const handleSkipReplacement = () => performAction({ type: 'skip-replacement' })
const handleFinishTrick = () => performAction({ type: 'finish-trick' })

// Bid.vue talks to the socket in real games; in the tutorial it calls this instead.
provide('tutorialActions', {
  makeBid: (_type: BidType, bidId: string) => performAction({ type: 'make-bid', bidId })
})

// --- Lifecycle ---------------------------------------------------------------

watch(currentStep, () => {
  hint.value = null
  applyStepState()
}, { immediate: true })

watch(isMobile, () => {
  applyStepState()
})

onMounted(() => {
  refreshHighlight()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  stateRun++
  if (hintTimer) clearTimeout(hintTimer)
  restorePreviousState()
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div :class="['tutorial-layout fixed inset-0 flex overflow-hidden', isMobile ? 'flex-col' : 'flex-row']" data-testid="tutorial-session">
    <div class="tutorial-board relative flex-1 overflow-hidden">
      <div ref="tutorialRoot" class="tutorial-stage relative origin-top-left" :style="stageStyle">
        <component
          :is="boardComponent"
          :opponent-positions="opponentPositions"
          :trick-cards="trickCards"
          :winning-card-id="winningCardId"
          :trick-state="trickState"
          :is-dealing="isDealing"
          :deal-progress="dealProgress"
          :player-hand="playerHand"
          :hand-mode="handMode"
          :is-my-turn="isMyTurn"
          :is-trick-in-resolve="isTrickInResolve"
          :is-trick-winner="isTrickWinner"
          :can-finish-trick="isTrickWinner"
          :animated-cards="allAnimatedCards"
          @play-card="handlePlayCard"
          @finish-trick="handleFinishTrick"
          @skip-replacement="handleSkipReplacement"
          @confirm-replacement="handleConfirmReplacement"
        />
      </div>
    </div>

    <TutorialHighlights v-if="!bare" :rects="highlightRects" :pulse="requiresAction" />

    <TutorialSidebar
      v-if="!bare && currentStep"
      :style="isMobile ? { height: `${SIDEBAR_HEIGHT_MOBILE}px` } : { width: `${SIDEBAR_WIDTH}px` }"
      class="relative z-[60] shrink-0"
      :scenario-title="t(scenario.title)"
      :title="t(currentStep.title)"
      :description="t(currentStep.description)"
      :step-index="stepIndex"
      :total-steps="totalSteps"
      :is-first-step="isFirstStep"
      :is-last-step="isLastStep"
      :requires-action="requiresAction"
      :hint="hint"
      @next="advance"
      @previous="previousStep"
      @restart="restart"
      @skip="advance"
      @exit="emit('exit')"
    />
  </div>
</template>
