<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import PlayerPopover from '@/common/components/PlayerPopover.vue'
import StackedCards from '@/common/components/StackedCards.vue'
import type { PlayerId } from '@domain/interfaces/Player'

interface Props {
  playerId: PlayerId
  publicCardId: string | null
  handCardsCount: number
  position: 'top' | 'left' | 'right'
}

const props = defineProps<Props>()
const gameStore = useGameStore()

const publicCard = computed(() => {
  if (!props.publicCardId) return null
  const card = gameStore.publicGameState?.publicCards[props.publicCardId]
  // Solo mostrar la carta si está en estado 'in_hand_visible'
  if (card && card.state === 'in_hand_visible') {
    return card
  }
  return null
})

const privateHandsCount = computed(() => {
  // Solo restar 1 si realmente hay una carta visible
  return publicCard.value ? props.handCardsCount - 1 : props.handCardsCount
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
    :class="['fixed z-10 flex items-center gap-3', positionClasses]"
  >
    <div :class="position === 'top' ? 'flex flex-row gap-2 items-center' : 'flex flex-col gap-2'">
      <PlayerPopover :player-id="playerId" :position="position" />
      <StackedCards 
        :count="privateHandsCount" 
        :public-card="publicCard || undefined" 
        :player-id="playerId" 
      />
    </div>
  </div>
</template>
