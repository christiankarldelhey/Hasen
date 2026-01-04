import { Server, Socket } from 'socket.io'
import { GameService } from '../../services/GameService.js'

export function setupGameHandlers(io: Server, socket: Socket) {
  
  // Handler: Iniciar juego/round
  socket.on('game:started', async ({ gameId }) => {
    try {
      console.log(`🎲 Starting round for game ${gameId}`)
      
      const { game, event } = await GameService.startGame(gameId)
      
      // Broadcast evento a todos en el room
      io.to(gameId).emit('game:event', event)
      
      console.log(`✅ Round started for game ${gameId}`)
    } catch (error: any) {
      console.error('Error starting round:', error)
      socket.emit('error', { message: error.message || 'Failed to start round' })
    }
  })
  
  // Handler: Jugar carta (ejemplo para el futuro)
  socket.on('PLAY_CARD', async ({ gameId, playerId, cardId }) => {
    try {
      // const { game, event } = await GameService.playCard(gameId, playerId, cardId)
      // io.to(gameId).emit('game:event', event)
      console.log('PLAY_CARD not implemented yet')
    } catch (error: any) {
      socket.emit('error', { message: error.message })
    }
  })
  
  // Handler: Colocar apuesta (ejemplo para el futuro)
  socket.on('PLACE_BID', async ({ gameId, playerId, bidId }) => {
    try {
      // const { game, event } = await GameService.placeBid(gameId, playerId, bidId)
      // io.to(gameId).emit('game:event', event)
      console.log('PLACE_BID not implemented yet')
    } catch (error: any) {
      socket.emit('error', { message: error.message })
    }
  })
}