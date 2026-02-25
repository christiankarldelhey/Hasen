import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PublicGameState, PrivateGameState, PlayerScore } from '@domain/interfaces/Game'
import type { PlayerId } from '@domain/interfaces/Player'
import { processGameEvent } from './gameEventHandlers'

export const useGameStore = defineStore('game', () => {
  // State - Game Playing
  const publicGameState = ref<PublicGameState | null>(null)
  const privateGameState = ref<PrivateGameState | null>(null)
  
  // Computed - Game state
  const currentRound = computed(() => publicGameState.value?.round.round ?? 0)
  const currentPhase = computed(() => publicGameState.value?.round.roundPhase ?? 'round_setup')

  const playerHand = computed(() => privateGameState.value?.hand || null)
  
  const playerScores = computed(() => publicGameState.value?.playerScores || [])

  const isBidWindowOpenForPlayer = computed(() => {
    return (playerId: PlayerId | null | undefined): boolean => {
      if (!playerId || !publicGameState.value) return false

      const round = publicGameState.value.round
      const currentTrick = round.currentTrick

      if (!currentTrick) return false
      if (round.roundPhase !== 'playing') return false
      if (round.playerTurn !== playerId) return false
      if (currentTrick.trick_state !== 'in_progress') return false
      if (currentTrick.trick_number > 3) return false

      const playerBids = round.roundBids.playerBids[playerId] || []
      const hasBidInCurrentTrick = playerBids.some(
        playerBid => playerBid.trickNumber === currentTrick.trick_number
      )

      return !hasBidInCurrentTrick
    }
  })

  // Actions
  function setPublicGameState(state: PublicGameState) {
    publicGameState.value = state
  }

  function setPrivateGameState(state: PrivateGameState) {
    privateGameState.value = state
  }

  function handleGameEvent(event: any) {
    const hasenStore = useHasenStore()
    
    processGameEvent(event, {
      publicGameState: publicGameState.value,
      privateGameState: privateGameState.value,
      currentPlayerId: hasenStore.currentPlayerId
    })
  }

  function updatePlayerScores(scores: PlayerScore[]) {
    if (publicGameState.value) {
      publicGameState.value.playerScores = scores
    }
  }

  function reset() {
    publicGameState.value = null
    privateGameState.value = null
  }

  return {
    // State
    publicGameState,
    privateGameState,
    
    // Computed
    currentRound,
    currentPhase,
    playerHand,
    playerScores,
    isBidWindowOpenForPlayer,
    
    // Actions
    setPublicGameState,
    setPrivateGameState,
    handleGameEvent,
    updatePlayerScores,
    reset,
  }
})

// Import at the end to avoid circular dependency
import { useHasenStore } from './hasenStore'