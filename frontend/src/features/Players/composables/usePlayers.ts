import { computed } from 'vue'
import type { ActivePlayer, PlayerId } from '@domain/interfaces/Player'
import { getDefaultPlayerProfile } from '@domain/interfaces/Player'
import { useGameStore } from '@/stores/gameStore'

export function usePlayers() {
  const gameStore = useGameStore()

  const activePlayersFromState = computed(() => {
    return gameStore.publicGameState?.activePlayers ?? []
  })

  const getPlayerById = computed(() => {
    return (id: PlayerId): ActivePlayer | undefined => {
      const fromState = activePlayersFromState.value.find(player => player.id === id)
      if (fromState) return fromState
      return getDefaultPlayerProfile(id)
    }
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