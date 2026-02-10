import { Server, Socket } from 'socket.io'
import { GameService } from '../../services/GameService.js'
import { PlayerId } from '@domain/interfaces/Player.js'

// Map compartido entre handlers
export const socketToPlayer = new Map<string, { gameId: string; playerId: PlayerId; userId: string }>()

export function setupLobbyHandlers(io: Server, socket: Socket) {
  
  // Handler: Unirse al room global de lista de lobbies
  socket.on('lobby-list:join', () => {
    socket.join('lobby-list')
    console.log(`📋 Socket ${socket.id} joined lobby-list room`)
  })

  // Handler: Salir del room global de lista de lobbies
  socket.on('lobby-list:leave', () => {
    socket.leave('lobby-list')
    console.log(`📋 Socket ${socket.id} left lobby-list room`)
  })
  
  // Handler: Unirse a un lobby
  socket.on('lobby:join', async ({ gameId, playerId, userId }: { gameId: string; playerId: PlayerId; userId: string }) => {
    socket.join(gameId)
    socketToPlayer.set(socket.id, { gameId, playerId, userId })
    console.log(`🎮 Socket ${socket.id} joined lobby: ${gameId} as ${playerId} (userId: ${userId})`)
  })

  socket.on('lobby:leave', async ({ gameId, playerId, userId }: { gameId: string; playerId: PlayerId; userId: string }) => {
  try {
    console.log(`🚪 Player ${playerId} (userId: ${userId}) leaving lobby ${gameId}`)
    
    socket.leave(gameId)
    
    const result = await GameService.leaveGame(gameId, playerId, userId)
    
    // Broadcast al lobby-list para actualizar contadores
    io.to('lobby-list').emit('lobby:player-count-changed', { 
      gameId, 
      currentPlayers: result.game!.activePlayers.length 
    })
    
    socketToPlayer.delete(socket.id)
    
  } catch (error) {
    console.error(`Error leaving lobby:`, error)
  }
})

  // Handler: Registrar jugador en juego activo (después del refresh)
  socket.on('game:register-player', ({ gameId, playerId, userId }: { gameId: string; playerId: PlayerId; userId: string }) => {
    socket.join(gameId)
    socketToPlayer.set(socket.id, { gameId, playerId, userId })
    console.log(`🎮 Socket ${socket.id} registered in active game: ${gameId} as ${playerId} (userId: ${userId})`)
  })

  // Handler: Desregistrar jugador del juego activo
  socket.on('game:unregister-player', ({ gameId, playerId, userId }: { gameId: string; playerId: PlayerId; userId: string }) => {
    console.log(`🚪 Player ${playerId} (userId: ${userId}) unregistering from game ${gameId}`)
    socket.leave(gameId)
    socketToPlayer.delete(socket.id)
  })

  socket.on('game:deleted-by-host', ({ gameId }: { gameId: string }) => {
    console.log(`🗑️ Host deleted game ${gameId}`);
    // Notificar a todos en el room
    io.to(gameId).emit('game:deleted', { 
      gameId, 
      message: 'Host deleted the game' 
    });
  });

  // Handler: Reconexión de jugador durante partida activa
  socket.on('game:player-reconnected', async ({ gameId, playerId, userId }: { gameId: string; playerId: PlayerId; userId: string }) => {
    try {
      console.log(`🔄 Player ${playerId} reconnecting to game ${gameId}`)
      
      const result = await GameService.markPlayerReconnected(gameId, playerId)
      
      // Registrar el nuevo socket
      socket.join(gameId)
      socketToPlayer.set(socket.id, { gameId, playerId, userId })
      
      // Notificar a todos
      io.to(gameId).emit('player:reconnected', {
        playerId,
        shouldResume: result.shouldResume
      })
      
      // Actualizar estado del juego
      const updatedState = await GameService.getPlayerGameState(gameId, userId)
      io.to(gameId).emit('game:stateUpdate', {
        publicGameState: updatedState.publicState
      })
      
      // Enviar estado privado al jugador reconectado
      if (updatedState.privateState) {
        socket.emit('game:privateStateUpdate', {
          privateGameState: updatedState.privateState
        })
      }
      
    } catch (error: any) {
      console.error('Error reconnecting player:', error)
      socket.emit('error', { message: error.message })
    }
  })
}