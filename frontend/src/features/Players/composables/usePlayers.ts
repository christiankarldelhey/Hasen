import { computed } from 'vue'
import type { PlayerId } from '@domain/interfaces/Player'
import { AVAILABLE_PLAYERS } from '@domain/interfaces/Player'

export function usePlayers() {

  const getPlayerNameById = computed(() => {
    return (id: PlayerId): string | undefined => {
      const player = AVAILABLE_PLAYERS.find(p => p.id === id)
      return player?.name
    }
  })

  return {
    getPlayerNameById
  }
}