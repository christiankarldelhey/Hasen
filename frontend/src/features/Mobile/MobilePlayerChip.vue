<script setup lang="ts">
import { computed, inject, ref, onMounted, onUnmounted } from 'vue'
import type { PlayerId } from '@domain/interfaces/Player'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'
import { usePlayers } from '@/features/Players/composables/usePlayers'
import { useGameScore } from '@/features/Score/composables/useGameScore'
import { useAnimationCoords } from '@/features/Animations'
import PlayerAvatar from '@/common/components/PlayerAvatar.vue'
import PlayingCard from '@/common/components/PlayingCard.vue'

interface Props {
  playerId: PlayerId
  publicCardId?: string | null
  /** anchor key suffix used by the animation system (opponent-<position>) */
  position?: 'top' | 'left' | 'right'
}

const props = defineProps<Props>()
const emit = defineEmits<{ tap: [] }>()

const gameStore = useGameStore()
const hasenStore = useHasenStore()
const { getPlayerById, isPlayerTurn } = usePlayers()

const chipEl = ref<HTMLElement | null>(null)
const coords = useAnimationCoords()
const coordKey = computed(() => (props.position ? `opponent-${props.position}` : null))

onMounted(() => {
  if (coordKey.value) coords.register(coordKey.value, chipEl)
})
onUnmounted(() => {
  if (coordKey.value) coords.unregister(coordKey.value)
})

const specialCards = inject<any>('specialCards', null)

const isSelectable = computed(() =>
  specialCards?.isPlayerSelectable(props.playerId) ?? false
)

const player = computed(() => getPlayerById.value(props.playerId))
const isCurrentTurn = computed(() => isPlayerTurn.value(props.playerId))
const isMe = computed(() => props.playerId === hasenStore.currentPlayerId)

const publicInfo = computed(() =>
  gameStore.publicGameState?.opponentsPublicInfo.find(
    (info) => info.playerId === props.playerId
  )
)

const handCardsCount = computed(() => publicInfo.value?.handCardsCount ?? 0)

const { playerRoundScore } = useGameScore(props.playerId)
const tricksWon = computed(() => playerRoundScore.value?.tricksWon?.length ?? 0)

const hasBids = computed(() => {
  const bids = gameStore.publicGameState?.round.roundBids.playerBids?.[props.playerId]
  return (bids?.length ?? 0) > 0
})

const connectionStatus = computed(
  () => gameStore.publicGameState?.playerConnectionStatus?.[props.playerId] ?? 'connected'
)

// Carta pública visible durante la fase de robo/reemplazo (paridad con desktop)
const publicCard = computed(() => {
  if (gameStore.publicGameState?.round.roundPhase !== 'player_drawing') return null
  if (!props.publicCardId) return null
  const card = gameStore.publicGameState?.publicCards[props.publicCardId]
  return card?.state === 'in_hand_visible' ? card : null
})

const handleTap = () => emit('tap')
</script>

<template>
  <div ref="chipEl" class="relative shrink-0">
    <button
      type="button"
      :class="[
        'relative flex items-center gap-1.5 h-11 px-1.5 rounded-lg border transition-colors min-w-0',
        isSelectable
          ? 'border-yellow-400 bg-yellow-400/15 animate-pulse'
          : isCurrentTurn
            ? 'border-hasen-light bg-black/50'
            : 'border-hasen-base/30 bg-black/50'
      ]"
      @click="handleTap"
    >
      <PlayerAvatar :player-id="playerId" size="tiny" :show-glow="isCurrentTurn" />

      <div class="flex flex-col items-start leading-none min-w-0">
        <span class="text-[10px] text-hasen-base/90 font-semibold truncate max-w-[52px]">
          {{ isMe ? `${player?.name ?? ''} (You)` : player?.name }}
        </span>
        <span class="text-[10px] text-hasen-base/70 tabular-nums mt-0.5">
          {{ handCardsCount }} · ★{{ tricksWon }}
        </span>
      </div>

      <!-- Bid marker dot -->
      <span
        v-if="hasBids"
        class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-hasen-base border border-hasen-dark"
      />

      <!-- Connection dot -->
      <span
        v-if="connectionStatus !== 'connected'"
        class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black"
        :class="connectionStatus === 'disconnected' ? 'bg-hasen-red' : 'bg-yellow-400'"
      />
    </button>

    <!-- Carta pública durante player_drawing -->
    <div
      v-if="publicCard"
      class="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-20 pointer-events-none"
    >
      <PlayingCard :card="publicCard" size="tiny" />
    </div>
  </div>
</template>
