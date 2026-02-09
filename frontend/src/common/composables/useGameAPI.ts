import { gameService } from '../../services/gameService'
import { useLobbyStore } from '../../stores/lobbyStore'
import { useHasenStore } from '../../stores/hasenStore'
import { useGameStore } from '../../stores/gameStore'
import type { PlayerId } from '@domain/interfaces/Player'
import { useLoadingTime } from './useLoadingTime'

export function useGameAPI() {
  const lobbyStore = useLobbyStore()
  const hasenStore = useHasenStore()
  const gameStore = useGameStore()
  const { startLoading, stopLoading } = useLoadingTime(1000)

  async function fetchGames() {
    startLoading()
    lobbyStore.setLoading(true)
    lobbyStore.setError(null)
    try {
      const games = await gameService.getAvailableGames()
      lobbyStore.setRooms(games)
    } catch (err) {
      lobbyStore.setError('Error when fetching games')
      console.error('Error fetching games:', err)
    } finally {
      await stopLoading()
      lobbyStore.setLoading(false)
    }
  }

  async function createGame(gameName: string, hostPlayerId: PlayerId) {
    startLoading()
    lobbyStore.setLoading(true)
    lobbyStore.setError(null)
    try {
      const result = await gameService.createNewGame(gameName, hostPlayerId)
      
      // Actualizar el store con el nuevo juego
      lobbyStore.setCurrentRoom({
        gameId: result.gameId,
        gameName: result.gameName,
        hostPlayer: result.assignedPlayerId as PlayerId,
        currentPlayers: 1,
        maxPlayers: 4,
        minPlayers: 2,
        hasSpace: true,
        createdAt: new Date().toISOString()
      })
      
      lobbyStore.setCurrentRoomId(result.gameId)
      hasenStore.setCurrentPlayerId(result.assignedPlayerId as PlayerId)
      
      return result
    } catch (err) {
      const error = err as Error
      lobbyStore.setError(error.message || 'Error creating new game')
      console.error('Error creating game:', err)
      throw err
    } finally {
      await stopLoading()
      lobbyStore.setLoading(false)
    }
  }

  async function joinGame(gameId: string) {
    lobbyStore.setJoiningRoomId(gameId)
    lobbyStore.setError(null)
    try {
      const result = await gameService.joinGame(gameId)
      
      lobbyStore.setCurrentRoomId(result.gameId)
      hasenStore.setCurrentPlayerId(result.assignedPlayerId as PlayerId)
      
      return result
    } catch (err) {
      const error = err as Error
      lobbyStore.setError(error.message || 'Error joining game')
      console.error('Error joining game:', err)
      throw err
    } finally {
      lobbyStore.setJoiningRoomId(null)
    }
  }

  async function deleteGame(gameId: string, hostPlayerId: string) {
    startLoading()
    lobbyStore.setLoading(true)
    lobbyStore.setError(null)
    try {
      await gameService.deleteGame(gameId, hostPlayerId)
      lobbyStore.clearCurrentRoom()
    } catch (err) {
      const error = err as Error
      lobbyStore.setError(error.message || 'Error deleting game')
      console.error('Error deleting game:', err)
      throw err
    } finally {
      await stopLoading()
      lobbyStore.setLoading(false)
    }
  }

  async function fetchPlayerGameState(gameId: string) {
    startLoading()
    lobbyStore.setLoading(true)
    lobbyStore.setError(null)
    try {
      const gameData = await gameService.getPlayerGameState(gameId)
      
      // Setear estado público
      gameStore.setPublicGameState(gameData.publicState)
      
      // Si hay estado privado, restaurarlo
      if (gameData.privateState) {
        hasenStore.setCurrentPlayerId(gameData.privateState.playerId)
        gameStore.setPrivateGameState(gameData.privateState)
      }
      
      return gameData
    } catch (err) {
      const error = err as Error
      lobbyStore.setError(error.message || 'Error fetching game state')
      console.error('Error fetching game state:', err)
      throw err
    } finally {
      await stopLoading()
      lobbyStore.setLoading(false)
    }
  }

  async function startGame(gameId: string, hostPlayerId: string) {
    startLoading()
    lobbyStore.setLoading(true)
    lobbyStore.setError(null)
    try {
      await gameService.startGame(gameId, hostPlayerId)
    } catch (err) {
      const error = err as Error
      lobbyStore.setError(error.message || 'Error starting game')
      console.error('Error starting game:', err)
      throw err
    } finally {
      await stopLoading()
      lobbyStore.setLoading(false)
    }
  }

  return {
    fetchGames,
    createGame,
    joinGame,
    deleteGame,
    startGame,
    fetchPlayerGameState
  }
}
