import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LobbyGame } from '@domain/interfaces/Game'
import type { PlayerId } from '@domain/interfaces/Player'

export const useGameStore = defineStore('game', () => {
  // State
  const games = ref<LobbyGame[]>([])
  const currentGame = ref<LobbyGame | null>(null)
  const currentGameId = ref<string>('')
  const currentPlayerId = ref<PlayerId | ''>('')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const joiningGameId = ref<string | null>(null)

  // Getters
  const isHost = computed(() => {
    if (!currentGame.value || !currentPlayerId.value) return false
    return currentGame.value.hostPlayer === currentPlayerId.value
  })

  const currentGameData = computed(() => {
    if (currentGame.value) return currentGame.value
    return games.value.find(game => game.gameId === currentGameId.value) || null
  })

  // Setters (solo gestión de estado)
  function setGames(newGames: LobbyGame[]) {
    games.value = newGames
  }

  function setCurrentGame(game: LobbyGame | null) {
    currentGame.value = game
    if (game) {
      games.value.unshift(game)
    }
  }

  function setCurrentGameId(gameId: string) {
    currentGameId.value = gameId
  }

  function setCurrentPlayerId(playerId: PlayerId) {
    currentPlayerId.value = playerId
  }

  function setIsHost(value: boolean) {
    // isHost es computed, pero podemos forzar el estado si es necesario
    // Por ahora no hace nada, isHost se calcula automáticamente
  }

  function setLoading(value: boolean) {
    loading.value = value
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  function setJoiningGameId(gameId: string | null) {
    joiningGameId.value = gameId
  }

  function updateGamePlayers(gameId: string, playerCount: number) {
    // Actualizar en la lista de juegos
    const gameIndex = games.value.findIndex(g => g.gameId === gameId)
    if (gameIndex !== -1 && games.value[gameIndex]) {
      games.value[gameIndex].currentPlayers = playerCount as 1 | 2 | 3 | 4
    }
    
    // Si es el juego actual, también actualizarlo
    if (currentGame.value?.gameId === gameId) {
      currentGame.value.currentPlayers = playerCount as 1 | 2 | 3 | 4
    }
  }

  function clearCurrentGame() {
    currentGame.value = null
    currentGameId.value = ''
    currentPlayerId.value = ''
  }

  return {
    // State
    games,
    currentGame,
    currentGameId,
    currentPlayerId,
    loading,
    error,
    joiningGameId,
    
    // Getters
    isHost,
    currentGameData,
    
    // Setters
    setGames,
    setCurrentGame,
    setCurrentGameId,
    setCurrentPlayerId,
    setIsHost,
    setLoading,
    setError,
    setJoiningGameId,
    updateGamePlayers,
    clearCurrentGame,
  }
})