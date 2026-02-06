import { computed } from 'vue'
import type { PlayerId } from '@domain/interfaces/Player'
import { AVAILABLE_PLAYERS } from '@domain/interfaces/Player'
import { useGameStore } from '@/stores/gameStore'

export function usePlayers() {
  const gameStore = useGameStore()

  const getPlayerById = computed(() => {
    return (id: PlayerId) => AVAILABLE_PLAYERS.find(p => p.id === id)
  })

  const getPlayerNameById = computed(() => {
    return (id: PlayerId): string | undefined => getPlayerById.value(id)?.name
  })

  const getPlayerColorById = computed(() => {
    return (id: PlayerId): string => getPlayerById.value(id)?.color || '#B89B5E'
  })

  const isPlayerTurn = computed(() => {
    return (id: PlayerId): boolean => {
      return id === gameStore.publicGameState?.round?.playerTurn
    }
  })

  return {
    getPlayerById,
    getPlayerNameById,
    getPlayerColorById,
    isPlayerTurn
  }
}