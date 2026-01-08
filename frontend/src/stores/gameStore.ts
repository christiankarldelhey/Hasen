import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LobbyGame, PublicGameState, PrivateGameState } from '@domain/interfaces/Game'
import type { PlayerId } from '@domain/interfaces/Player'

export const useGameStore = defineStore('game', () => {
  // State - Lobby
  const games = ref<LobbyGame[]>([])
  const currentGame = ref<LobbyGame | null>(null)
  const currentGameId = ref<string>('')
  const currentPlayerId = ref<PlayerId | ''>('')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const joiningGameId = ref<string | null>(null)

  // State - Game Playing
  const publicGameState = ref<PublicGameState | null>(null)
  const privateGameState = ref<PrivateGameState | null>(null)

  // Getters
  const isHost = computed(() => {
    if (!currentGame.value || !currentPlayerId.value) return false
    return currentGame.value.hostPlayer === currentPlayerId.value
  })

  const currentGameData = computed(() => {
    if (currentGame.value) return currentGame.value
    return games.value.find(game => game.gameId === currentGameId.value) || null
  })

  const playerHand = computed(() => privateGameState.value?.hand || null)

  // Setters - Lobby
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
    const gameIndex = games.value.findIndex(g => g.gameId === gameId)
    if (gameIndex !== -1 && games.value[gameIndex]) {
      games.value[gameIndex].currentPlayers = playerCount as 1 | 2 | 3 | 4
    }
    
    if (currentGame.value?.gameId === gameId) {
      currentGame.value.currentPlayers = playerCount as 1 | 2 | 3 | 4
    }
  }

  function clearCurrentGame() {
    currentGame.value = null
    currentGameId.value = ''
    currentPlayerId.value = ''
    publicGameState.value = null
    privateGameState.value = null
  }

  // Setters - Game Playing State
  function setPublicGameState(state: PublicGameState) {
    publicGameState.value = state
  }

  function setPrivateGameState(state: PrivateGameState) {
    privateGameState.value = state
  }

  function updatePlayerHand(hand: PrivateGameState['hand']) {
    if (privateGameState.value) {
      privateGameState.value.hand = hand
    }
  }

  return {
    // State - Lobby
    games,
    currentGame,
    currentGameId,
    currentPlayerId,
    loading,
    error,
    joiningGameId,
    
    // State - Game Playing
    publicGameState,
    privateGameState,
    
    // Getters
    isHost,
    currentGameData,
    playerHand,
    
    // Setters - Lobby
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
    
    // Setters - Game Playing
    setPublicGameState,
    setPrivateGameState,
    updatePlayerHand,
  }
})