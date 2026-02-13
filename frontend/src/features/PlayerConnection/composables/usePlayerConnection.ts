import { ref, computed } from 'vue'
import { useSocket } from '@/common/composables/useSocket'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'
import { userIdService } from '@/services/userIdService'
import type { PlayerId, PlayerConnectionStatus } from '@domain/interfaces/Player'

type InterruptionReason = 'player_left_game' | 'player_disconnect_timeout'

export function usePlayerConnection(gameId: string) {
  const socket = useSocket()
  const gameStore = useGameStore()
  const hasenStore = useHasenStore()
  
  const disconnectedPlayers = ref<Set<PlayerId>>(new Set())
  const reconnectionTimestamps = ref<Map<PlayerId, number>>(new Map())
  const remainingSeconds = ref<number | null>(null)
  const interruptionReason = ref<InterruptionReason | null>(null)
  const interruptedPlayerId = ref<PlayerId | null>(null)
  const countdownIntervalId = ref<ReturnType<typeof setInterval> | null>(null)
  
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

  const clearCountdown = () => {
    if (countdownIntervalId.value) {
      clearInterval(countdownIntervalId.value)
      countdownIntervalId.value = null
    }
    remainingSeconds.value = null
  }

  const updateRemainingSeconds = () => {
    if (reconnectionTimestamps.value.size === 0) {
      clearCountdown()
      return
    }

    const timeoutSeconds = (gameStore.publicGameState?.gameSettings?.reconnectionTimeoutMinutes || 3) * 60
    const now = Date.now()
    const minRemaining = Math.min(
      ...Array.from(reconnectionTimestamps.value.values()).map((timestamp) => {
        const elapsedSeconds = Math.floor((now - timestamp) / 1000)
        return Math.max(timeoutSeconds - elapsedSeconds, 0)
      })
    )

    remainingSeconds.value = minRemaining
  }

  const startCountdown = () => {
    updateRemainingSeconds()
    if (countdownIntervalId.value) {
      return
    }

    countdownIntervalId.value = setInterval(() => {
      updateRemainingSeconds()
    }, 1000)
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
        startCountdown()
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
        clearCountdown()
      }
    }

    if (reconnectionTimestamps.value.size === 0) {
      clearCountdown()
    }
  }

  const handleGameInterrupted = (data: { reason: InterruptionReason; playerId: PlayerId }) => {
    interruptionReason.value = data.reason
    interruptedPlayerId.value = data.playerId
    clearCountdown()
  }

  const resetInterruption = () => {
    interruptionReason.value = null
    interruptedPlayerId.value = null
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
    socket.on('game:interrupted', handleGameInterrupted)
    
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
    socket.off('game:interrupted', handleGameInterrupted)
    clearCountdown()
  }
  
  return {
    isPaused,
    pauseReason,
    disconnectedPlayers,
    disconnectedPlayerIds,
    remainingSeconds,
    interruptionReason,
    interruptedPlayerId,
    isAnyPlayerDisconnected,
    playerConnectionStatus,
    getPlayerConnectionStatus,
    isPlayerDisconnected,
    resetInterruption,
    attemptReconnection,
    setupListeners,
    cleanupListeners
  }
}
