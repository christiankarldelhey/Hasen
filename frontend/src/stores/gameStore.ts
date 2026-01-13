import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PublicGameState, PrivateGameState } from '@domain/interfaces/Game'
import { processGameEvent } from './gameEventHandlers'

export const useGameStore = defineStore('game', () => {
  // State - Game Playing
  const publicGameState = ref<PublicGameState | null>(null)
  const privateGameState = ref<PrivateGameState | null>(null)
  const lastEvent = ref<any>(null)
  
  // Computed - Game state
  const currentRound = computed(() => publicGameState.value?.round.round ?? 0)
  const currentPhase = computed(() => publicGameState.value?.round.roundPhase ?? 'round_setup')

  const playerHand = computed(() => privateGameState.value?.hand || null)

  // Actions
  function setPublicGameState(state: PublicGameState) {
    publicGameState.value = state
  }

  function setPrivateGameState(state: PrivateGameState) {
    privateGameState.value = state
  }

  function handleGameEvent(event: any) {
    lastEvent.value = event
    const hasenStore = useHasenStore()
    
    processGameEvent(event, {
      publicGameState: publicGameState.value,
      privateGameState: privateGameState.value,
      currentPlayerId: hasenStore.currentPlayerId
    })
  }

  function reset() {
    publicGameState.value = null
    privateGameState.value = null
    lastEvent.value = null
  }

  return {
    // State
    publicGameState,
    privateGameState,
    lastEvent,
    
    // Computed
    currentRound,
    currentPhase,
    playerHand,
    
    // Actions
    setPublicGameState,
    setPrivateGameState,
    handleGameEvent,
    reset,
  }
})

// Import at the end to avoid circular dependency
import { useHasenStore } from './hasenStore'