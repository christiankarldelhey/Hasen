import { gameService } from '../../services/gameService'
import { useGameStore } from '../../stores/gameStore'
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
      
      return result
    } catch (err: any) {
      gameStore.setError(err.message || 'Error joining game')
      console.error('Error joining game:', err)
      throw err
    } finally {
      gameStore.setJoiningGameId(null)
    }
  }

  async function deleteGame(gameId: string, hostPlayerId: string) {
  gameStore.setLoading(true)
  gameStore.setError(null)
  try {
    await gameService.deleteGame(gameId, hostPlayerId)
    gameStore.clearCurrentGame()
  } catch (err: any) {
    gameStore.setError(err.message || 'Error deleting game')
    console.error('Error deleting game:', err)
    throw err
  } finally {
    gameStore.setLoading(false)
  }
}

async function fetchPlayerGameState(gameId: string) {
  gameStore.setLoading(true)
  gameStore.setError(null)
  try {
    const gameData = await gameService.getPlayerGameState(gameId)
    
    // Setear estado público
    gameStore.setPublicGameState(gameData.publicState)
    
    // Si hay estado privado, restaurarlo
    if (gameData.privateState) {
      gameStore.setCurrentPlayerId(gameData.privateState.playerId)
      if (gameStore.privateGameState) {
        gameStore.privateGameState.hand = gameData.privateState.hand
      }
    }
    
    return gameData
  } catch (err: any) {
    gameStore.setError(err.message || 'Error fetching game state')
    console.error('Error fetching game state:', err)
    throw err
  } finally {
    gameStore.setLoading(false)
  }
}

  async function startGame(gameId: string, hostPlayerId: string) {
    gameStore.setLoading(true)
    gameStore.setError(null)
    try {
      await gameService.startGame(gameId, hostPlayerId)
    } catch (err: any) {
      gameStore.setError(err.message || 'Error starting game')
      console.error('Error starting game:', err)
      throw err
    } finally {
      gameStore.setLoading(false)
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
