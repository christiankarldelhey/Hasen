<script setup lang="ts">
import { computed, toRef } from 'vue'
import type { PlayingCard as Card, TrickState } from '@domain/interfaces'
import type { AnimatedCard } from '@/features/Animations'
import type { OpponentPosition } from '@/features/Game/GameBoardDesktop.vue'
import { useMobileInteraction } from './composables/useMobileInteraction'
import MobileTopBar from './MobileTopBar.vue'
import MobileTrick from './MobileTrick.vue'
import MobileActionBar from './MobileActionBar.vue'
import MobileHand from './MobileHand.vue'
import MobileSheet from './MobileSheet.vue'
import MobileCardZoom from './MobileCardZoom.vue'
import AnimationOverlay from '@/features/Animations/components/AnimationOverlay.vue'

interface Props {
  opponentPositions: OpponentPosition[]
  trickCards: Card[]
  winningCardId?: string | null
  trickState?: TrickState | null
  isDealing: boolean
  dealProgress: Record<string, number>
  playerHand: Card[]
  handMode: 'normal' | 'card_replacement'
  isMyTurn: boolean
  isTrickInResolve: boolean
  isTrickWinner: boolean
  canFinishTrick: boolean
  animatedCards: AnimatedCard[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  skipReplacement: []
  confirmReplacement: [cardId: string, position: number]
  playCard: [cardId: string]
  finishTrick: []
}>()

const displayCards = computed(() =>
  props.isDealing
    ? props.playerHand.slice(0, props.dealProgress['player-hand'] ?? 0)
    : props.playerHand
)

const interaction = useMobileInteraction({
  handMode: toRef(props, 'handMode'),
  isMyTurn: toRef(props, 'isMyTurn'),
  isTrickInResolve: toRef(props, 'isTrickInResolve'),
  isTrickWinner: toRef(props, 'isTrickWinner'),
  canFinishTrick: toRef(props, 'canFinishTrick'),
  handCards: displayCards,
  actions: {
    playCard: (cardId) => emit('playCard', cardId),
    confirmReplacement: (cardId, position) => emit('confirmReplacement', cardId, position),
    skipReplacement: () => emit('skipReplacement'),
    finishTrick: () => emit('finishTrick'),
  },
})

const {
  selectedHandCardId,
  selectedStealCardId,
  zoomCard,
  sheetOpen,
  sheetTab,
  sheetPlayerId,
  toastMessage,
  actionBarState,
  canMakeBids,
  myBidCount,
  canPlayZoomCard,
  isHandCardDisabled,
  tapHandCard,
  tapTrickCard,
  tapPlayerChip,
  confirmPlay,
  confirmSteal,
  confirmReplacement,
  playZoomedCard,
  clearSelection,
  openSheet,
  closeSheet,
  openZoom,
  closeZoom,
  showToast,
} = interaction
</script>

<template>
  <div class="m-board" data-testid="game-board">
    <!-- Z1: top bar -->
    <MobileTopBar
      :opponent-positions="props.opponentPositions"
      @chip-tap="tapPlayerChip"
    />

    <!-- Z2: baza + línea de estado -->
    <MobileTrick
      :cards="props.trickCards"
      :winning-card-id="props.winningCardId"
      :trick-state="props.trickState"
      :selected-steal-card-id="selectedStealCardId"
      @tap-card="tapTrickCard"
      @long-press-card="openZoom"
      @background-tap="clearSelection"
    />

    <!-- Z3: barra de acciones contextual -->
    <MobileActionBar
      :state="actionBarState"
      :can-confirm="!!selectedHandCardId"
      :can-finish-trick="props.canFinishTrick"
      :can-make-bids="canMakeBids"
      :bid-count="myBidCount"
      @open-sheet="openSheet"
      @confirm-play="confirmPlay"
      @confirm-steal="confirmSteal"
      @confirm-replacement="confirmReplacement"
      @skip-replacement="emit('skipReplacement')"
      @finish-trick="emit('finishTrick')"
      @cancel-selection="clearSelection"
    />

    <!-- Z4: mano -->
    <MobileHand
      :cards="displayCards"
      :mode="props.handMode"
      :selected-card-id="selectedHandCardId"
      :is-disabled="isHandCardDisabled"
      @tap-card="tapHandCard"
      @long-press-card="openZoom"
    />

    <AnimationOverlay :cards="props.animatedCards" :card-width="56" :card-height="99" />

    <!-- Bottom sheet: apuestas + puntaje -->
    <MobileSheet
      :open="sheetOpen"
      :tab="sheetTab"
      :player-id="sheetPlayerId"
      @close="closeSheet"
      @update:tab="sheetTab = $event"
      @toast="showToast"
    />

    <!-- Zoom de carta (pulsación larga) -->
    <MobileCardZoom
      :card="zoomCard"
      :can-play="canPlayZoomCard"
      @close="closeZoom"
      @play="playZoomedCard"
    />

    <!-- Toast -->
    <Transition name="toast">
      <div
        v-if="toastMessage"
        class="absolute left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-lg bg-hasen-dark text-hasen-base text-[13px] shadow-xl border border-hasen-base/30 pointer-events-none"
        :style="{ top: 'calc(var(--m-zone-topbar) + 12px)' }"
      >
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.m-board {
  position: fixed;
  inset: 0;
  height: 100dvh;
  display: grid;
  grid-template-rows:
    var(--m-zone-topbar)
    minmax(160px, 1fr)
    var(--m-zone-hud)
    var(--m-zone-hand);
  padding-bottom: env(safe-area-inset-bottom);
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  overflow: hidden;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -6px);
}

@media (prefers-reduced-motion: reduce) {
  .m-board * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.1s !important;
  }
}
</style>
