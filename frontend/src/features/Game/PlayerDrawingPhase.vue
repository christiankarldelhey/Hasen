<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'

const gameStore = useGameStore()
const hasenStore = useHasenStore()

const isPlayerDrawingPhase = computed(() => 
  gameStore.publicGameState?.round.roundPhase === 'player_drawing'
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
</script>

<template>
  <div v-if="isPlayerDrawingPhase" class="fixed top-20 left-1/2 -translate-x-1/2 z-20">
    <div v-if="isMyTurn" class="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
      <p class="font-bold">Your turn!</p>
      <p class="text-sm">Choose to skip or replace a card</p>
    </div>
    <div v-else class="bg-gray-700 text-white px-6 py-3 rounded-lg shadow-lg">
      <p class="font-bold">Waiting for {{ currentPlayerName }}</p>
      <p class="text-sm">Player is deciding...</p>
    </div>
  </div>
</template>
