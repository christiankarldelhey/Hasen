<script setup lang="ts">
import { computed, inject } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import PlayerPopover from '@/common/components/PlayerPopover.vue'
import StackedCards from '@/common/components/StackedCards.vue'
import type { PlayerId } from '@domain/interfaces/Player'

interface Props {
  playerId: PlayerId
  publicCardId: string | null
  position: 'top' | 'left' | 'right'
}

const props = defineProps<Props>()
const gameStore = useGameStore()

const specialCards = inject<any>('specialCards', null)

const isSelectable = computed(() => 
  specialCards?.isPlayerSelectable(props.playerId) ?? false
)

const publicCard = computed(() => {
  if (!props.publicCardId) return null
  const card = gameStore.publicGameState?.publicCards[props.publicCardId]
  // Solo mostrar la carta si está en estado 'in_hand_visible'
  if (card && card.state === 'in_hand_visible') {
    return card
  }
  return null
})

const calculateCardCount = computed(() => {
  const currentTrick = gameStore.publicGameState?.round.currentTrick
  const trickNumber = currentTrick?.trick_number ?? 0
  const roundPhase = gameStore.publicGameState?.round.roundPhase
  
  // Durante card replacement (trick 0)
  if (roundPhase === 'player_drawing') {
    // Si tiene public card visible: 4 cartas privadas + 1 pública
    return publicCard.value ? 4 : 5
  }
  
  // Durante los tricks (1-5)
  // Empezamos con 5 cartas, restamos el número de tricks completados
  let totalCards = 5 - (trickNumber - 1)
  
  // Verificar si el jugador ya jugó en el trick actual
  const hasPlayedInCurrentTrick = currentTrick?.cards.some(cardId => {
    const card = gameStore.publicGameState?.publicCards[cardId]
    return card?.owner === props.playerId
  })
  
  // Si ya jugó en el trick actual, restar 1 más
  if (hasPlayedInCurrentTrick) {
    totalCards -= 1
  }
  
  return totalCards
})

const privateHandsCount = computed(() => {
  // Si tiene public card visible, restar 1 del total calculado
  return publicCard.value ? calculateCardCount.value - 1 : calculateCardCount.value
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
    <div :class="position === 'top' ? 'flex flex-row gap-5 items-center' : 'flex flex-col gap-5'">
      <PlayerPopover :player-id="playerId" :position="position" :disableHover="isSelectable" />
      <StackedCards 
        :count="privateHandsCount" 
        :public-card="publicCard || undefined" 
        :player-id="playerId" 
      />
    </div>
  </div>
</template>
