import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PlayerId } from '@domain/interfaces/Player'
import { useLobbyStore } from './lobbyStore'
import { useGameStore } from './gameStore'

export const useHasenStore = defineStore('hasen', () => {
  const currentPlayerId = ref<PlayerId | ''>('')

  const lobbyStore = useLobbyStore()
  const gameStore = useGameStore()

  function setCurrentPlayerId(playerId: PlayerId) {
    currentPlayerId.value = playerId
  }

  function clearAll() {
    currentPlayerId.value = ''
    lobbyStore.reset()
    gameStore.reset()
  }

  return {
    currentPlayerId,
    setCurrentPlayerId,
    clearAll,
    
    lobby: lobbyStore,
    game: gameStore,
  }
})
