import { Server, Socket } from 'socket.io'

export function setupGameHandlers(io: Server, socket: Socket) {
  
  // TODO: Implementar handlers de gameplay cuando sea necesario
  
  // Handler: Jugar carta (ejemplo para el futuro)
  // socket.on('PLAY_CARD', async ({ gameId, playerId, cardId }) => {
  //   // TODO: Implementar cuando se desarrolle el gameplay
  //   // const { game, event } = await GameService.playCard(gameId, playerId, cardId)
  //   // io.to(gameId).emit('game:event', event)
  //   console.log('PLAY_CARD not implemented yet')
  // })
  
  // Handler: Colocar apuesta (ejemplo para el futuro)
  // socket.on('PLACE_BID', async ({ gameId, playerId, bidId }) => {
  //   // TODO: Implementar cuando se desarrolle el gameplay
  //   // const { game, event } = await GameService.placeBid(gameId, playerId, bidId)
  //   // io.to(gameId).emit('game:event', event)
  //   console.log('PLACE_BID not implemented yet')
  // })
}