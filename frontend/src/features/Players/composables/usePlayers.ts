import { computed } from 'vue'
import type { PlayerId } from '@domain/interfaces/Player'
import { AVAILABLE_PLAYERS } from '@domain/interfaces/Player'
import { useGameStore } from '@/stores/gameStore'

export function usePlayers() {
  const gameStore = useGameStore()

  const getPlayerNameById = computed(() => {
    return (id: PlayerId): string | undefined => {
      const player = AVAILABLE_PLAYERS.find(p => p.id === id)
      return player?.name
    }
  })

  const isPlayerTurn = computed(() => {
    return (id: PlayerId): boolean => {
      return id === gameStore.publicGameState?.round?.playerTurn
    }
  })

  return {
    getPlayerNameById,
    isPlayerTurn
  }
}