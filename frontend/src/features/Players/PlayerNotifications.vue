<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'
import { usePlayers } from './composables/usePlayers'

const { getPlayerNameById } = usePlayers()

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

const currentTrick = computed(() => 
  gameStore.publicGameState?.round.currentTrick
)

const pendingSpecialAction = computed(() => 
  currentTrick.value?.pendingSpecialAction
)

const isAwaitingSpecialAction = computed(() => 
  currentTrick.value?.trick_state === 'awaiting_special_action'
)

const shouldShowTurnInfo = computed(() => 
  isPlayerDrawingPhase.value || isPlayingPhase.value || isAwaitingSpecialAction.value
)

const currentPlayerTurn = computed(() => 
  gameStore.publicGameState?.round.playerTurn
)

const isMyTurn = computed(() => 
  currentPlayerTurn.value === hasenStore.currentPlayerId
)

const currentPlayerName = computed(() => {
  return currentPlayerTurn.value ? getPlayerNameById.value(currentPlayerTurn.value) : undefined
})

const turnMessage = computed(() => {
  // Prioridad a acciones especiales
  if (isAwaitingSpecialAction.value && pendingSpecialAction.value) {
    const actionPlayerId = pendingSpecialAction.value.playerId
    const actionPlayerName = getPlayerNameById.value(actionPlayerId)
    const isMyAction = actionPlayerId === hasenStore.currentPlayerId
    
    if (pendingSpecialAction.value.type === 'PICK_NEXT_LEAD') {
      return {
        title: isMyAction ? '🫐 Select Next Lead Player!' : `⏳ Waiting for ${actionPlayerName}`,
        subtitle: isMyAction ? 'Choose who will lead the next trick' : 'Selecting the next lead player...'
      }
    } else if (pendingSpecialAction.value.type === 'STEAL_CARD') {
      return {
        title: isMyAction ? '🍃 Select Card to Steal!' : `⏳ Waiting for ${actionPlayerName}`,
        subtitle: isMyAction ? 'Choose a card from the trick to steal' : 'Selecting a card to steal...'
      }
    }
  }
  
  if (isMyTurn.value) {
    if (isPlayerDrawingPhase.value) {
      return {
        title: 'Your turn!',
        subtitle: 'Choose to skip or replace a card'
      }
    } else {
      return {
        title: 'Your turn!',
        subtitle: 'Play a card and optionally make a Bid'
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
      class="rounded-lg px-8 py-4 shadow-lg transition-colors duration-300 w-full"
      :class="isMyTurn ? 'bg-hasen-base' : 'bg-hasen-base'">
      <div class="text-hasen-dark">
        <p class="font-bold text-lg">{{ turnMessage.title }}</p>
        <p class="text-sm opacity-90">{{ turnMessage.subtitle }}</p>
      </div>
    </div>
  </div>
</template>
