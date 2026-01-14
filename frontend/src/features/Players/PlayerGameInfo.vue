<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'

const gameStore = useGameStore()
const hasenStore = useHasenStore()

const currentPhase = computed(() => 
  gameStore.publicGameState?.round.roundPhase
)

const isPlayerDrawingPhase = computed(() => 
  currentPhase.value === 'player_drawing'
)

const isPlayingPhase = computed(() => 
  currentPhase.value === 'playing'
)

const shouldShowTurnInfo = computed(() => 
  isPlayerDrawingPhase.value || isPlayingPhase.value
)

const currentPlayerTurn = computed(() => 
  gameStore.publicGameState?.round.playerTurn
)

const isMyTurn = computed(() => 
  currentPlayerTurn.value === hasenStore.currentPlayerId
)

const currentPlayerName = computed(() => {
  return currentPlayerTurn.value || 'Unknown'
})

const turnMessage = computed(() => {
  if (isMyTurn.value) {
    if (isPlayerDrawingPhase.value) {
      return {
        title: 'Your turn!',
        subtitle: 'Choose to skip or replace a card'
      }
    } else {
      return {
        title: 'Your turn!',
        subtitle: 'Play a card'
      }
    }
  } else {
    return {
      title: `Waiting for ${currentPlayerName.value}`,
      subtitle: 'Player is deciding...'
    }
  }
})
</script>

<template>
  <div v-if="shouldShowTurnInfo">
    <div 
      class="rounded-tl-2xl rounded-tr-2xl rounded-br-2xl px-6 py-4 shadow-lg transition-colors duration-300 w-full"
      :class="isMyTurn ? 'bg-green-600' : 'bg-gray-700'"
    >
      <div class="text-white">
        <p class="font-bold text-lg">{{ turnMessage.title }}</p>
        <p class="text-sm opacity-90">{{ turnMessage.subtitle }}</p>
      </div>
    </div>
  </div>
</template>
