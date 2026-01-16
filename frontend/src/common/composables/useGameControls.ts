import { computed, onUnmounted } from 'vue'
import { useGameAPI } from './useGameAPI'
import { useSocketGame } from './useSocketGame'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'
import { useLobbyStore } from '@/stores/lobbyStore'

export function useGameControls(gameId: string) {
  const gameAPI = useGameAPI()
  const socketGame = useSocketGame()
  const gameStore = useGameStore()
  const hasenStore = useHasenStore()
  const lobbyStore = useLobbyStore()

  const playerHand = computed(() => gameStore.privateGameState?.hand || [])

  const isPlayerDrawingPhase = computed(() => 
    gameStore.publicGameState?.round.roundPhase === 'player_drawing'
  )

  const isMyTurn = computed(() => 
    gameStore.publicGameState?.round.playerTurn === hasenStore.currentPlayerId
  )

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
      return [{ ...opponents[0], position: 'top' as const }]
    }
    
    if (totalOpponents === 2 && opponents[0] && opponents[1]) {
      return [
        { ...opponents[0], position: 'top' as const },
        { ...opponents[1], position: 'left' as const }
      ]
    }
    
    if (totalOpponents === 3 && opponents[0] && opponents[1] && opponents[2]) {
      return [
        { ...opponents[0], position: 'top' as const },
        { ...opponents[1], position: 'left' as const },
        { ...opponents[2], position: 'right' as const }
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
      console.log('mounted game view')
      
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
