import { computed } from 'vue'
import type { ActivePlayer, PlayerId } from '@domain/interfaces/Player'
import { getDefaultPlayerProfile } from '@domain/interfaces/Player'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'
import { useI18n } from '@/common/composables/useI18n'

export function usePlayers() {
  const gameStore = useGameStore()
  const hasenStore = useHasenStore()
  const { t } = useI18n()

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

  /** Nombre + sufijo "(You)"/"(Tú)" cuando el jugador es el actual */
  const getPlayerDisplayName = computed(() => {
    return (id: PlayerId): string | undefined => {
      const name = getPlayerNameById.value(id)
      if (!name) return name
      return id === hasenStore.currentPlayerId ? `${name} ${t('common.you')}` : name
    }
  })

  const getPlayerColorById = computed(() => {
    return (id: PlayerId): string => getPlayerById.value(id)?.color || '#B89B5E'
  })

  const isPlayerTurn = computed(() => {
    return (id: PlayerId): boolean => {
      return id === gameStore.publicGameState?.round?.playerTurn
    }
  })

  const isCurrentPlayer = computed(() => {
    return (id: PlayerId): boolean => id === hasenStore.currentPlayerId
  })

  return {
    getPlayerById,
    getPlayerNameById,
    getPlayerDisplayName,
    getPlayerColorById,
    isPlayerTurn,
    isCurrentPlayer
  }
}
