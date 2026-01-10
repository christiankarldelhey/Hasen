import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LobbyGame } from '@domain/interfaces/Game'

export const useLobbyStore = defineStore('lobby', () => {
  // State
  const rooms = ref<LobbyGame[]>([])
  const currentRoom = ref<LobbyGame | null>(null)
  const currentRoomId = ref<string>('')
  const loading = ref(false)
  const error = ref<string | null>(null)
  const joiningRoomId = ref<string | null>(null)

  // Getters
  function isHost(currentPlayerId: string): boolean {
    if (!currentRoom.value || !currentPlayerId) return false
    return currentRoom.value.hostPlayer === currentPlayerId
  }

  const currentRoomData = computed(() => {
    if (currentRoom.value) return currentRoom.value
    return rooms.value.find(room => room.gameId === currentRoomId.value) || null
  })

  // Actions
  function setRooms(newRooms: LobbyGame[]) {
    rooms.value = newRooms
  }

  function setCurrentRoom(room: LobbyGame | null) {
    currentRoom.value = room
    if (room) {
      currentRoomId.value = room.gameId
      // Add to rooms list if not already there
      const existingIndex = rooms.value.findIndex(r => r.gameId === room.gameId)
      if (existingIndex === -1) {
        rooms.value.unshift(room)
      }
    }
  }

  function setCurrentRoomId(roomId: string) {
    currentRoomId.value = roomId
  }

  function setLoading(value: boolean) {
    loading.value = value
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  function setJoiningRoomId(roomId: string | null) {
    joiningRoomId.value = roomId
  }

  function updateRoomPlayers(roomId: string, playerCount: number) {
    const roomIndex = rooms.value.findIndex(r => r.gameId === roomId)
    if (roomIndex !== -1 && rooms.value[roomIndex]) {
      rooms.value[roomIndex].currentPlayers = playerCount as 1 | 2 | 3 | 4
    }
    
    if (currentRoom.value?.gameId === roomId) {
      currentRoom.value.currentPlayers = playerCount as 1 | 2 | 3 | 4
    }
  }

  function clearCurrentRoom() {
    currentRoom.value = null
    currentRoomId.value = ''
  }

  function reset() {
    rooms.value = []
    currentRoom.value = null
    currentRoomId.value = ''
    loading.value = false
    error.value = null
    joiningRoomId.value = null
  }

  return {
    // State
    rooms,
    currentRoom,
    currentRoomId,
    loading,
    error,
    joiningRoomId,
    
    // Getters
    isHost,
    currentRoomData,
    
    // Actions
    setRooms,
    setCurrentRoom,
    setCurrentRoomId,
    setLoading,
    setError,
    setJoiningRoomId,
    updateRoomPlayers,
    clearCurrentRoom,
    reset,
  }
})
