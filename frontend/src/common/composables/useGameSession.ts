import { computed, onUnmounted } from 'vue'
import { useGameAPI } from './useGameAPI'
import { useSocketGame } from './useSocketGame'
import { useSocketLobby } from './useSocketLobby'
import { useGameStore } from '../../stores/gameStore'
import { useHasenStore } from '../../stores/hasenStore'
import { useLobbyStore } from '../../stores/lobbyStore'
import { userIdService } from '../../services/userIdService'

export function useGameSession(gameId: string) {
  const gameAPI = useGameAPI()
  const socketGame = useSocketGame()
  const socketLobby = useSocketLobby()
  const gameStore = useGameStore()
  const hasenStore = useHasenStore()
  const lobbyStore = useLobbyStore()

  const playerHand = computed(() => gameStore.privateGameState?.hand || [])

  const isPlayerDrawingPhase = computed(() => 
    gameStore.publicGameState?.round.roundPhase === 'player_drawing'
  )

  const isMyTurn = computed(() => {
    const playerTurn = gameStore.publicGameState?.round.playerTurn
    const currentPlayerId = hasenStore.currentPlayerId
    return playerTurn === currentPlayerId
  })

  const handMode = computed(() => {
    return isPlayerDrawingPhase.value && isMyTurn.value ? 'card_replacement' : 'normal'
  })

  const loading = computed(() => lobbyStore.loading)
  const error = computed(() => lobbyStore.error)

  const opponentsCards = computed(() => {
    if (!gameStore.publicGameState?.opponentsPublicInfo || !hasenStore.currentPlayerId) {
      return []
    }
    
    return gameStore.publicGameState.opponentsPublicInfo.filter(
      (info) => info.playerId !== hasenStore.currentPlayerId
    )
  })

  const opponentPositions = computed(() => {
    const opponents = opponentsCards.value
    const totalOpponents = opponents.length
    
    if (totalOpponents === 0) return []
    
    if (totalOpponents === 1 && opponents[0]) {
      return [{ 
        playerId: opponents[0].playerId,
        publicCardId: opponents[0].publicCardId,
        position: 'top' as const 
      }]
    }
    
    if (totalOpponents === 2 && opponents[0] && opponents[1]) {
      return [
        { 
          playerId: opponents[0].playerId,
          publicCardId: opponents[0].publicCardId,
          position: 'top' as const 
        },
        { 
          playerId: opponents[1].playerId,
          publicCardId: opponents[1].publicCardId,
          position: 'left' as const 
        }
      ]
    }
    
    if (totalOpponents === 3 && opponents[0] && opponents[1] && opponents[2]) {
      return [
        { 
          playerId: opponents[0].playerId,
          publicCardId: opponents[0].publicCardId,
          position: 'top' as const 
        },
        { 
          playerId: opponents[1].playerId,
          publicCardId: opponents[1].publicCardId,
          position: 'left' as const 
        },
        { 
          playerId: opponents[2].playerId,
          publicCardId: opponents[2].publicCardId,
          position: 'right' as const 
        }
      ]
    }
    
    return []
  })

  const trickCards = computed(() => {
    const currentTrick = gameStore.publicGameState?.round.currentTrick
    if (!currentTrick || !currentTrick.cards.length) return []
    
    const publicCards = gameStore.publicGameState?.publicCards || {}
    
    return currentTrick.cards
      .map(cardId => publicCards[cardId])
      .filter(card => card !== undefined)
  })

  const winningCardId = computed(() => {
    const currentTrick = gameStore.publicGameState?.round.currentTrick
    return currentTrick?.winning_card || null
  })

  const trickState = computed(() => {
    const currentTrick = gameStore.publicGameState?.round.currentTrick
    return currentTrick?.trick_state || null
  })

  const isTrickInResolve = computed(() => {
    return trickState.value === 'resolve'
  })

  const handleSkipReplacement = () => {
    socketGame.skipCardReplacement(gameId)
  }

  const handleConfirmReplacement = (cardId: string, position: number) => {
    socketGame.replaceCard(gameId, cardId, position)
  }

  const handlePlayCard = (cardId: string) => {
    socketGame.playCard(gameId, cardId)
  }

  const handleFinishTurn = () => {
    socketGame.finishTurn(gameId)
  }

  const handleFinishTrick = () => {
    socketGame.finishTrick(gameId)
  }

  const initialize = async () => {
    try {
      await gameAPI.fetchPlayerGameState(gameId)
      
      // Registrar el socket en el backend después del refresh
      const userId = userIdService.getUserId()
      const playerId = hasenStore.currentPlayerId
      if (playerId && userId) {
        socketLobby.registerPlayer({ gameId, playerId, userId })
      }
      
      socketGame.onGameStateUpdate((data) => {
        if (data.publicGameState) {
          gameStore.setPublicGameState(data.publicGameState)
        }
        if (data.privateGameState) {
          gameStore.setPrivateGameState(data.privateGameState)
        }
        if (data.event) {
          gameStore.handleGameEvent(data.event)
        }
      })
      
      socketGame.onPrivateStateUpdate((data) => {
        if (data.privateGameState) {
          gameStore.setPrivateGameState(data.privateGameState)
        }
      })
      
    } catch (err) {
      console.error('Error loading game:', err)
      lobbyStore.setError('Failed to load game')
    }
  }

  const cleanup = () => {
    socketGame.offGameStateUpdate()
    socketGame.offPrivateStateUpdate()
    
    // Desregistrar el socket cuando se desmonta el componente
    const userId = userIdService.getUserId()
    const playerId = hasenStore.currentPlayerId
    if (playerId && userId) {
      socketLobby.unregisterPlayer({ gameId, playerId, userId })
    }
  }

  onUnmounted(() => {
    cleanup()
  })

  return {
    playerHand,
    opponentsCards,
    opponentPositions,
    trickCards,
    winningCardId,
    trickState,
    isTrickInResolve,
    loading,
    error,
    isPlayerDrawingPhase,
    isMyTurn,
    handMode,
    handleSkipReplacement,
    handleConfirmReplacement,
    handlePlayCard,
    handleFinishTurn,
    handleFinishTrick,
    initialize,
    cleanup
  }
}
