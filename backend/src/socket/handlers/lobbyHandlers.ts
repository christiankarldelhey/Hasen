import { Server, Socket } from 'socket.io'
import { GameService } from '../../services/GameService.js'
import { PlayerId } from '@domain/interfaces/Player.js'
import { GameModel } from '../../models/Game.js'

// Map compartido entre handlers
export const socketToPlayer = new Map<string, { gameId: string; playerId: PlayerId; userId: string }>()

export function setupLobbyHandlers(io: Server, socket: Socket) {
  
  // Handler: Unirse a un lobby
  socket.on('lobby:join', async ({ gameId, playerId, userId }: { gameId: string; playerId: PlayerId; userId: string }) => {
    socket.join(gameId)
    socketToPlayer.set(socket.id, { gameId, playerId, userId })
    console.log(`🎮 Socket ${socket.id} joined lobby: ${gameId} as ${playerId} (userId: ${userId})`)
    
    // Verificar si el jugador ya estaba en el juego
    const game = await GameModel.findOne({ gameId });
    const wasAlreadyInGame = game?.activePlayers.includes(playerId);
    
    // Solo notificar si es un nuevo jugador
    if (!wasAlreadyInGame) {
      io.to(gameId).emit('player:joined', { playerId })
    }
  })

  socket.on('lobby:leave', async ({ gameId, playerId, userId }: { gameId: string; playerId: PlayerId; userId: string }) => {
  try {
    console.log(`🚪 Player ${playerId} (userId: ${userId}) leaving lobby ${gameId}`)
    
    socket.leave(gameId)
    
    const result = await GameService.leaveGame(gameId, playerId, userId)
    
    // Siempre notificar que el jugador se fue (room persiste)
    io.to(gameId).emit('player:left', { 
      playerId,
      currentPlayers: result.game!.activePlayers.length,
      wasHost: result.wasHost
    })
    
    socketToPlayer.delete(socket.id)
    
  } catch (error) {
    console.error(`Error leaving lobby:`, error)
  }
})

socket.on('game:deleted-by-host', ({ gameId }: { gameId: string }) => {
  console.log(`🗑️ Host deleted game ${gameId}`);
  // Notificar a todos en el room
  io.to(gameId).emit('game:deleted', { 
    gameId, 
    message: 'Host deleted the game' 
  });
});
}