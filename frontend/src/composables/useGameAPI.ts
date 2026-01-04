import { gameService } from '../services/gameService'
import { useGameStore } from '../stores/gameStore'
import type { PlayerId } from '@domain/interfaces/Player'

export function useGameAPI() {
  const gameStore = useGameStore()

  async function fetchGames() {
    gameStore.setLoading(true)
    gameStore.setError(null)
    try {
      const games = await gameService.getAvailableGames()
      gameStore.setGames(games)
    } catch (err) {
      gameStore.setError('Error when fetching games')
      console.error(err)
    } finally {
      gameStore.setLoading(false)
    }
  }

  async function createGame(gameName: string, hostPlayerId: PlayerId) {
    gameStore.setLoading(true)
    gameStore.setError(null)
    try {
      const result = await gameService.createNewGame(gameName, hostPlayerId)
      
      // Actualizar el store con el nuevo juego
      gameStore.setCurrentGame({
        gameId: result.gameId,
        gameName: result.gameName,
        hostPlayer: result.assignedPlayerId as PlayerId,
        currentPlayers: 1,
        maxPlayers: 4,
        minPlayers: 2,
        hasSpace: true,
        createdAt: new Date().toISOString()
      })
      
      gameStore.setCurrentGameId(result.gameId)
      gameStore.setCurrentPlayerId(result.assignedPlayerId as PlayerId)
      gameStore.setIsHost(true)
      
      // Guardar en sessionStorage
      sessionStorage.setItem('current_player_id', result.assignedPlayerId)
      sessionStorage.setItem('current_game_id', result.gameId)
      
      return result
    } catch (err: any) {
      gameStore.setError(err.message || 'Error creating new game')
      console.error('Error creating new game:', err)
      throw err
    } finally {
      gameStore.setLoading(false)
    }
  }

  async function joinGame(gameId: string) {
    gameStore.setJoiningGameId(gameId)
    gameStore.setError(null)
    try {
      const result = await gameService.joinGame(gameId)
      
      gameStore.setCurrentGameId(result.gameId)
      gameStore.setCurrentPlayerId(result.assignedPlayerId as PlayerId)
      
      // Guardar en sessionStorage
      sessionStorage.setItem('current_player_id', result.assignedPlayerId)
      sessionStorage.setItem('current_game_id', result.gameId)
      
      // Actualizar el juego en la lista
      gameStore.updateGamePlayers(gameId, result.currentPlayers as 1 | 2 | 3 | 4)
      
      return result
    } catch (err: any) {
      gameStore.setError(err.message || 'Error joining game')
      console.error('Error joining game:', err)
      throw err
    } finally {
      gameStore.setJoiningGameId(null)
    }
  }

  return {
    fetchGames,
    createGame,
    joinGame
  }
}
