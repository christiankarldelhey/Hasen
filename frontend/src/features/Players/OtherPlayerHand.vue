<script setup lang="ts">
import { computed, inject, ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import PlayerPopover from '@/common/components/PlayerPopover.vue'
import StackedCards from '@/common/components/StackedCards.vue'
import type { PlayerId } from '@domain/interfaces/Player'
import { useAnimationCoords } from '@/features/Animations'

interface Props {
  playerId: PlayerId
  publicCardId: string | null
  position: 'top' | 'left' | 'right'
}

const props = defineProps<Props>()
const gameStore = useGameStore()

const specialCards = inject<any>('specialCards', null)
const isDealing = inject<import('vue').Ref<boolean>>('isDealing', ref(false))
const dealProgress = inject<import('vue').Ref<Record<string, number>>>('dealProgress', ref({}))

const handEl = ref<HTMLElement | null>(null)
const coords = useAnimationCoords()
const coordKey = computed(() => `opponent-${props.position}`)
onMounted(() => coords.register(coordKey.value, handEl))
onUnmounted(() => coords.unregister(coordKey.value))

const arrivedCards = computed(() => dealProgress.value[coordKey.value] ?? 0)

const isSelectable = computed(() => 
  specialCards?.isPlayerSelectable(props.playerId) ?? false
)

const opponentPublicInfo = computed(() => {
  return gameStore.publicGameState?.opponentsPublicInfo.find(
    info => info.playerId === props.playerId
  )
})

const publicCard = computed(() => {
  const roundPhase = gameStore.publicGameState?.round.roundPhase
  if (roundPhase !== 'player_drawing') return null
  if (!props.publicCardId) return null
  const card = gameStore.publicGameState?.publicCards[props.publicCardId]
  if (card && card.state === 'in_hand_visible') {
    return card
  }
  return null
})

const totalHandCardsCount = computed(() => {
  return opponentPublicInfo.value?.handCardsCount ?? 0
})

const privateHandsCount = computed(() => {
  const visiblePublicCardCount = publicCard.value ? 1 : 0
  return Math.max(0, totalHandCardsCount.value - visiblePublicCardCount)
})

const positionClasses = computed(() => {
  switch (props.position) {
    case 'top':
      return 'top-4 left-1/2 -translate-x-1/2'
    case 'left':
      return 'left-4 top-9/20 -translate-y-1/2'
    case 'right':
      return 'right-4 top-9/20 -translate-y-1/2'
  }
})

</script>

<template>
  <div 
    ref="handEl"
    :class="['fixed z-10 flex items-center gap-3', positionClasses]"
  >
    <div :class="position === 'top' ? 'flex flex-row gap-5 items-center' : 'flex flex-col gap-5'">
      <PlayerPopover :player-id="playerId" :position="position" :disableHover="isSelectable" />
      <StackedCards 
        :count="isDealing ? Math.max(0, arrivedCards - (publicCard && arrivedCards >= 5 ? 1 : 0)) : privateHandsCount" 
        :public-card="isDealing ? (arrivedCards >= 5 ? (publicCard || undefined) : undefined) : (publicCard || undefined)" 
        :player-id="playerId" 
      />
    </div>
  </div>
</template>
