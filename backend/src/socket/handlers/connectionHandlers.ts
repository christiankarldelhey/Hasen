import { Server, Socket } from 'socket.io'
import { GameService } from '../../services/GameService.js'
import { socketToPlayer } from './lobbyHandlers.js'
import { GameModel } from '../../models/Game.js'

export function setupConnectionHandlers(io: Server, socket: Socket) {
  
socket.on('disconnect', async () => {
  console.log(`❌ Client disconnected: ${socket.id}`)
  
  const playerInfo = socketToPlayer.get(socket.id)
  if (playerInfo) {
    const { gameId, playerId, userId } = playerInfo
    
    try {
      const game = await GameModel.findOne({ gameId })
      
      if (!game) {
        console.error('Game not found')
        return
      }
      
      // Si el juego está en setup, remover jugador
      if (game.gamePhase === 'setup') {
        console.log(`🚪 Auto-leaving player ${playerId} from lobby ${gameId}`)
        const result = await GameService.leaveGame(gameId, playerId, userId)
        
        io.to('lobby-list').emit('lobby:player-count-changed', { 
          gameId, 
          currentPlayers: result.game!.activePlayers.length 
        })
      } 
      // Si el juego está activo, marcar como desconectado
      else if (game.gamePhase === 'playing') {
        console.log(`⏸️ Marking player ${playerId} as disconnected in game ${gameId}`)
        const result = await GameService.markPlayerDisconnected(gameId, playerId)
        
        // Notificar a todos en el juego
        io.to(gameId).emit('player:disconnected', {
          playerId,
          isPaused: result.shouldPause,
          disconnectedAt: Date.now()
        })
        
        // Actualizar estado del juego
        const updatedState = await GameService.getPlayerGameState(gameId)
        io.to(gameId).emit('game:stateUpdate', {
          publicGameState: updatedState.publicState
        })
      }
      
      socketToPlayer.delete(socket.id)
    } catch (error) {
      console.error(`Error handling disconnect:`, error)
    }
  }
})
}