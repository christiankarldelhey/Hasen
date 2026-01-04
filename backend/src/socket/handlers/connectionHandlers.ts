import { Server, Socket } from 'socket.io'
import { GameService } from '../../services/GameService.js'
import { socketToPlayer } from './lobbyHandlers.js'

export function setupConnectionHandlers(io: Server, socket: Socket) {
  
  // Handler: Desconexión automática
  socket.on('disconnect', async () => {
    console.log(`❌ Client disconnected: ${socket.id}`)
    
    const playerInfo = socketToPlayer.get(socket.id)
    if (playerInfo) {
      const { gameId, playerId, userId } = playerInfo
      
      try {
        console.log(`🚪 Auto-leaving player ${playerId} (userId: ${userId}) from game ${gameId}`)
        const result = await GameService.leaveGame(gameId, playerId, userId)
        
        // Notificar a otros jugadores en el lobby
        if (!result.gameDeleted) {
          io.to(gameId).emit('player:left', { 
            playerId,
            currentPlayers: result.game!.activePlayers.length 
          })
        } else {
          io.to(gameId).emit('game:deleted', { message: 'Host left, game deleted' })
        }
        
        socketToPlayer.delete(socket.id)
      } catch (error) {
        console.error(`Error auto-leaving game:`, error)
      }
    }
  })
}