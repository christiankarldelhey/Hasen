import { Server, Socket } from 'socket.io'
import { GameService } from '../../services/GameService.js'
import { PlayerId } from '@domain/interfaces/Player.js'

// Map compartido entre handlers
export const socketToPlayer = new Map<string, { gameId: string; playerId: PlayerId; userId: string }>()

export function setupLobbyHandlers(io: Server, socket: Socket) {
  
  // Handler: Unirse a un lobby
  socket.on('lobby:join', ({ gameId, playerId, userId }: { gameId: string; playerId: PlayerId; userId: string }) => {
    socket.join(gameId)
    socketToPlayer.set(socket.id, { gameId, playerId, userId })
    console.log(`🎮 Socket ${socket.id} joined lobby: ${gameId} as ${playerId} (userId: ${userId})`)
    
    // Notificar a otros en el lobby
    io.to(gameId).emit('player:joined', { playerId })
  })

  socket.on('lobby:leave', async ({ gameId, playerId, userId }: { gameId: string; playerId: PlayerId; userId: string }) => {
    try {
      console.log(`🚪 Player ${playerId} (userId: ${userId}) leaving lobby ${gameId}`)
      
      // Salir de la sala de Socket.io
      socket.leave(gameId)
      
      // Remover del juego en la base de datos
      const result = await GameService.leaveGame(gameId, playerId, userId)
      
      // Notificar a otros jugadores
      if (!result.gameDeleted) {
        io.to(gameId).emit('player:left', { 
          playerId,
          currentPlayers: result.game!.activePlayers.length 
        })
      } else {
        io.to(gameId).emit('game:deleted', { gameId, message: 'Host left, game deleted' })
      }
      
      // Limpiar el mapeo
      socketToPlayer.delete(socket.id)
      
    } catch (error) {
      console.error(`Error leaving lobby:`, error)
      // TODO: Agregar manejo de errores en el frontend
    }
  })
}