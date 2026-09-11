<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PlayerId } from '@domain/interfaces/Player'
import type { SheetTab } from './composables/useMobileInteraction'
import { useGameStore } from '@/stores/gameStore'
import { useI18n } from '@/common/composables/useI18n'
import { usePlayers } from '@/features/Players/composables/usePlayers'
import MobileBidsList from './MobileBidsList.vue'
import GameScores from '@/features/Game/GameScores.vue'
import PlayerBids from '@/features/Bids/PlayerBids.vue'
import PlayerAvatar from '@/common/components/PlayerAvatar.vue'
import PlayingCard from '@/common/components/PlayingCard.vue'

interface Props {
  open: boolean
  tab: SheetTab
  /** rival cuyo puntaje/carta pública se muestra en la pestaña Puntaje */
  playerId?: PlayerId | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  'update:tab': [tab: SheetTab]
  toast: [message: string]
}>()

const { t } = useI18n()
const gameStore = useGameStore()
const { getPlayerDisplayName } = usePlayers()

// --- Drag to close -----------------------------------------------------------
const dragY = ref(0)
const dragging = ref(false)
let dragStartY = 0

const onHandlePointerdown = (event: PointerEvent) => {
  dragging.value = true
  dragStartY = event.clientY
  ;(event.target as HTMLElement).setPointerCapture(event.pointerId)
}
const onHandlePointermove = (event: PointerEvent) => {
  if (!dragging.value) return
  dragY.value = Math.max(0, event.clientY - dragStartY)
}
const onHandlePointerup = () => {
  if (!dragging.value) return
  dragging.value = false
  if (dragY.value > 90) {
    emit('close')
  }
  dragY.value = 0
}

watch(
  () => props.open,
  (open) => {
    if (!open) dragY.value = 0
  }
)

// --- Puntaje tab --------------------------------------------------------------
const targetPlayer = computed(() => props.playerId ?? null)
const targetName = computed(() =>
  targetPlayer.value ? getPlayerDisplayName.value(targetPlayer.value) : null
)

const targetPublicCard = computed(() => {
  // Misma regla que en desktop: la carta pública solo se ve durante player_drawing
  if (gameStore.publicGameState?.round.roundPhase !== 'player_drawing') return null
  if (!targetPlayer.value) return null
  const info = gameStore.publicGameState?.opponentsPublicInfo.find(
    (i) => i.playerId === targetPlayer.value
  )
  if (!info?.publicCardId) return null
  const card = gameStore.publicGameState?.publicCards[info.publicCardId]
  return card?.state === 'in_hand_visible' ? card : null
})

const tabs: { key: SheetTab; label: string }[] = [
  { key: 'bids', label: 'game.tabBids' },
  { key: 'score', label: 'game.tabScore' },
]
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="props.open" class="fixed inset-0 z-40">
        <div class="absolute inset-0 bg-black/40" @click="emit('close')" />

        <div
          class="absolute bottom-0 left-0 right-0 bg-hasen-base rounded-t-2xl border-t-2 border-hasen-dark flex flex-col overflow-hidden"
          :style="{
            height: 'min(62dvh, 480px)',
            transform: `translateY(${dragY}px)`,
            transition: dragging ? 'none' : 'transform 0.2s ease-out',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }"
        >
          <!-- Drag handle -->
          <div
            class="pt-2 pb-1 touch-none cursor-grab shrink-0"
            @pointerdown="onHandlePointerdown"
            @pointermove="onHandlePointermove"
            @pointerup="onHandlePointerup"
            @pointercancel="onHandlePointerup"
          >
            <div class="w-9 h-1 rounded-full bg-hasen-dark/30 mx-auto" />
          </div>

          <!-- Tabs -->
          <div class="flex gap-2 px-3 pb-2 shrink-0">
            <button
              v-for="tabItem in tabs"
              :key="tabItem.key"
              type="button"
              :class="[
                'px-4 h-9 rounded-lg text-sm font-semibold transition-colors',
                props.tab === tabItem.key
                  ? 'bg-hasen-green text-hasen-light'
                  : 'text-hasen-dark/70',
              ]"
              @click="emit('update:tab', tabItem.key)"
            >
              {{ t(tabItem.label) }}
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 min-h-0 overflow-y-auto">
            <MobileBidsList
              v-if="props.tab === 'bids'"
              @toast="(msg) => emit('toast', msg)"
            />

            <div v-else class="flex flex-col gap-3 px-3 pb-3">
              <!-- Target player header (when viewing a rival) -->
              <div
                v-if="targetPlayer"
                class="flex items-center gap-3 rounded-lg bg-black/60 px-3 py-2"
              >
                <PlayerAvatar :player-id="targetPlayer" size="tiny" />
                <span class="text-sm font-semibold text-hasen-base">{{ targetName }}</span>
                <PlayingCard
                  v-if="targetPublicCard"
                  :card="targetPublicCard"
                  size="tiny"
                  class="ml-auto"
                />
              </div>

              <GameScores />
              <PlayerBids :player-id="targetPlayer ?? undefined" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s ease;
}
.sheet-enter-active > div:last-child,
.sheet-leave-active > div:last-child {
  transition: transform 0.25s cubic-bezier(0.32, 0.72, 0.35, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from > div:last-child,
.sheet-leave-to > div:last-child {
  transform: translateY(100%) !important;
}
</style>
