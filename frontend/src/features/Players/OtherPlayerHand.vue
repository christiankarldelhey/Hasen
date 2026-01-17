<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import OtherPlayerInfo from '@/common/components/OtherPlayerInfo.vue'
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
      return 'left-4 top-1/2 -translate-y-1/2'
    case 'right':
      return 'right-4 top-1/2 -translate-y-1/2'
  }
})

</script>

<template>
  <div 
    :class="['fixed z-10 flex items-center gap-3', positionClasses]"
  >
    <!-- Layout for top position: cards only -->
    <template v-if="position === 'top'">
      <div class="flex flex-row gap-2 items-center">
        <div class="flex flex-row gap-2">
          <OtherPlayerInfo :player-id="playerId" />
          <StackedCards 
            :count="privateHandsCount" 
            :public-card="publicCard || undefined" 
            :player-id="playerId" 
          />
        </div>
      </div>
    </template>

    <!-- Layout for left/right positions: cards only -->
    <template v-else>
      <div class="flex flex-col gap-2">

        <template v-if="position === 'right'">
          <OtherPlayerInfo :player-id="playerId" />
          <StackedCards 
            :public-card="publicCard || undefined"
            :count="privateHandsCount" 
            :player-id="playerId" 
          />
        </template>

        <template v-if="position === 'left'">
          <OtherPlayerInfo :player-id="playerId" />
          <StackedCards 
            :public-card="publicCard || undefined"
            :count="privateHandsCount" 
            :player-id="playerId" 
          />
        </template>
        
        
      </div>
    </template>

  </div>
</template>