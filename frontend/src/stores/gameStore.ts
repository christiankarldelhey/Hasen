import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { gameService } from '../services/gameService'
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

  // Actions
  async function fetchGames() {
    loading.value = true
    error.value = null
    try {
      games.value = await gameService.getAvailableGames()
    } catch (err) {
      error.value = 'Error when fetching games'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  async function createGame(gameName: string, hostPlayerId: PlayerId) {
    loading.value = true
    error.value = null
    try {
      const result = await gameService.createNewGame(gameName, hostPlayerId)
      
      // Crear el objeto LobbyGame completo
      currentGame.value = {
        gameId: result.gameId,
        gameName: result.gameName,
        hostPlayer: result.assignedPlayerId as PlayerId,
        currentPlayers: 1,
        maxPlayers: 4,
        minPlayers: 2,
        hasSpace: true,
        createdAt: new Date().toISOString()
      }
      
      currentGameId.value = result.gameId
      currentPlayerId.value = result.assignedPlayerId as PlayerId
      
      // Guardar en sessionStorage
      sessionStorage.setItem('current_player_id', result.assignedPlayerId)
      sessionStorage.setItem('current_game_id', result.gameId)
      
      // Agregar a la lista de juegos
      games.value.unshift(currentGame.value)
      
      return result
    } catch (err: any) {
      error.value = err.message || 'Error creating new game'
      console.error('Error creating new game:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function joinGame(gameId: string) {
    joiningGameId.value = gameId
    error.value = null
    try {
      const result = await gameService.joinGame(gameId)
      
      currentGameId.value = result.gameId
      currentPlayerId.value = result.assignedPlayerId as PlayerId
      
      // Guardar en sessionStorage
      sessionStorage.setItem('current_player_id', result.assignedPlayerId)
      sessionStorage.setItem('current_game_id', result.gameId)
      
      // Actualizar el juego en la lista
      const gameIndex = games.value.findIndex(g => g.gameId === gameId)
      if (gameIndex !== -1) {
        games.value[gameIndex].currentPlayers = result.currentPlayers as 1 | 2 | 3 | 4
        currentGame.value = games.value[gameIndex]
      }
      
      return result
    } catch (err: any) {
      error.value = err.message || 'Error joining game'
      console.error('Error joining game:', err)
      throw err
    } finally {
      joiningGameId.value = null
    }
  }

  function clearCurrentGame() {
    currentGame.value = null
    currentGameId.value = ''
    currentPlayerId.value = ''
  }

  // Restaurar estado desde sessionStorage al iniciar
  function restoreSession() {
    const savedPlayerId = sessionStorage.getItem('current_player_id')
    const savedGameId = sessionStorage.getItem('current_game_id')
    
    if (savedPlayerId && savedGameId) {
      currentPlayerId.value = savedPlayerId as PlayerId
      currentGameId.value = savedGameId
    }
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
    
    // Actions
    fetchGames,
    createGame,
    joinGame,
    clearCurrentGame,
    restoreSession
  }
})