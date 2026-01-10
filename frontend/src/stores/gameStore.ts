import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LobbyGame, PublicGameState, PrivateGameState } from '@domain/interfaces/Game'
import type { PlayerId } from '@domain/interfaces/Player'
import type { RoundPhase } from '@domain/interfaces/Round'
import { processGameEvent } from './gameEventHandlers'

export const useGameStore = defineStore('game', () => {
  // State - Lobby
  const games = ref<LobbyGame[]>([])
  const currentGame = ref<LobbyGame | null>(null)
  const currentGameId = ref<string>('')
  const currentPlayerId = ref<PlayerId | ''>('')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const joiningGameId = ref<string | null>(null)

  //Round
  const lastEvent = ref<any>(null)
  
  // Computeds basados en publicGameState (fuente única de verdad)
  const currentRound = computed(() => publicGameState.value?.round.round ?? 0)
  const currentPhase = computed(() => publicGameState.value?.round.roundPhase ?? 'round_setup')
  
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
  
    // Inicializar privateGameState
    if (!privateGameState.value) {
      privateGameState.value = {
        playerId,
        hand: []
      }
    }
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

  function handleGameEvent(event: any) {
    lastEvent.value = event
    
    processGameEvent(event, {
      publicGameState: publicGameState.value,
      privateGameState: privateGameState.value,
      currentPlayerId: currentPlayerId.value
    })
  }
  function setCurrentPhase(phase: RoundPhase) {
    if (publicGameState.value) {
      publicGameState.value.round.roundPhase = phase
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
    setLoading,
    setError,
    setJoiningGameId,
    updateGamePlayers,
    clearCurrentGame,
    
    // Setters - Game Playing
    setPublicGameState,

    // Round
    currentRound,
    currentPhase,
    lastEvent,
    handleGameEvent,
    setCurrentPhase,
  }
})