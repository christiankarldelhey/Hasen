import { ref, computed } from 'vue'
import { useSocket } from '@/common/composables/useSocket'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'
import { userIdService } from '@/services/userIdService'
import type { PlayerId, PlayerConnectionStatus } from '@domain/interfaces/Player'

export function usePlayerConnection(gameId: string) {
  const socket = useSocket()
  const gameStore = useGameStore()
  const hasenStore = useHasenStore()
  
  const disconnectedPlayers = ref<Set<PlayerId>>(new Set())
  const reconnectionTimestamps = ref<Map<PlayerId, number>>(new Map())
  
  const isPaused = computed(() => gameStore.publicGameState?.isPaused || false)
  const pauseReason = computed(() => gameStore.publicGameState?.pauseReason || null)
  
  const playerConnectionStatus = computed(() => 
    gameStore.publicGameState?.playerConnectionStatus || {} as Record<PlayerId, PlayerConnectionStatus>
  )
  
  const isAnyPlayerDisconnected = computed(() => 
    Object.values(playerConnectionStatus.value).some(status => status === 'disconnected')
  )
  
  const disconnectedPlayerIds = computed(() => {
    return Object.entries(playerConnectionStatus.value)
      .filter(([_, status]) => status === 'disconnected')
      .map(([playerId]) => playerId as PlayerId)
  })
  
  const getPlayerConnectionStatus = (playerId: PlayerId): PlayerConnectionStatus => {
    return playerConnectionStatus.value[playerId] || 'connected'
  }
  
  const isPlayerDisconnected = (playerId: PlayerId): boolean => {
    return getPlayerConnectionStatus(playerId) === 'disconnected'
  }
  
  const handlePlayerDisconnected = (data: { playerId: PlayerId; isPaused: boolean; disconnectedAt: number }) => {
    console.log(`⏸️ Player ${data.playerId} disconnected`)
    disconnectedPlayers.value.add(data.playerId)
    reconnectionTimestamps.value.set(data.playerId, data.disconnectedAt)
    
    // Actualizar estado de conexión en el publicGameState
    if (gameStore.publicGameState) {
      if (!gameStore.publicGameState.playerConnectionStatus) {
        gameStore.publicGameState.playerConnectionStatus = {} as Record<PlayerId, PlayerConnectionStatus>
      }
      gameStore.publicGameState.playerConnectionStatus[data.playerId] = 'disconnected'
      if (data.isPaused) {
        gameStore.publicGameState.isPaused = true
        gameStore.publicGameState.pauseReason = 'player_disconnected'
      }
    }
  }
  
  const handlePlayerReconnected = (data: { playerId: PlayerId; shouldResume: boolean }) => {
    console.log(`✅ Player ${data.playerId} reconnected`)
    disconnectedPlayers.value.delete(data.playerId)
    reconnectionTimestamps.value.delete(data.playerId)
    
    // Actualizar estado de conexión en el publicGameState
    if (gameStore.publicGameState) {
      if (!gameStore.publicGameState.playerConnectionStatus) {
        gameStore.publicGameState.playerConnectionStatus = {} as Record<PlayerId, PlayerConnectionStatus>
      }
      gameStore.publicGameState.playerConnectionStatus[data.playerId] = 'connected'
      if (data.shouldResume) {
        gameStore.publicGameState.isPaused = false
        gameStore.publicGameState.pauseReason = null
      }
    }
  }
  
  const attemptReconnection = async () => {
    const userId = userIdService.getUserId()
    const playerId = hasenStore.currentPlayerId
    
    if (!playerId || !userId) {
      console.error('Cannot reconnect: missing playerId or userId')
      return
    }
    
    console.log(`🔄 Attempting reconnection for ${playerId}`)
    socket.emit('game:player-reconnected', { gameId, playerId, userId })
  }
  
  const setupListeners = () => {
    socket.on('player:disconnected', handlePlayerDisconnected)
    socket.on('player:reconnected', handlePlayerReconnected)
    
    // Auto-reconectar si detectamos que nos desconectamos
    socket.on('connect', () => {
      const myPlayerId = hasenStore.currentPlayerId
      if (myPlayerId && disconnectedPlayers.value.has(myPlayerId)) {
        attemptReconnection()
      }
    })
  }
  
  const cleanupListeners = () => {
    socket.off('player:disconnected', handlePlayerDisconnected)
    socket.off('player:reconnected', handlePlayerReconnected)
  }
  
  return {
    isPaused,
    pauseReason,
    disconnectedPlayers,
    disconnectedPlayerIds,
    isAnyPlayerDisconnected,
    playerConnectionStatus,
    getPlayerConnectionStatus,
    isPlayerDisconnected,
    attemptReconnection,
    setupListeners,
    cleanupListeners
  }
}
