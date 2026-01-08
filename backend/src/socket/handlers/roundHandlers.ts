import { RoundService } from '@/services/RoundService';
import { Server, Socket } from 'socket.io'
import { GameModel } from '@/models/Game.js'

export function setupRoundHandlers(io: Server, socket: Socket) {

socket.on('round:start', async ({ gameId }) => {
  try {
    const { game, event } = await RoundService.startNewRound(gameId);
    console.log('handler: round:start');
    
    // Emitir evento de shuffle
    io.to(gameId).emit('game:event', event);
    
    // Automáticamente pasar a la siguiente fase (llamada interna)
    setTimeout(async () => {
      console.log('update bid in handler');
      await RoundService.updateRoundPhase(gameId, 'update_bids');
      io.to(gameId).emit('round:phase-changed', { phase: 'update_bids' });
    }, 1000);
    
  } catch (error: any) {
    socket.emit('error', { message: error.message });
  }
});

socket.on('round:next-phase', async ({ gameId }) => {
  console.log('next phase');
  const game = await GameModel.findOne({ gameId });
  
  switch (game?.round.roundPhase) {
    case 'shuffle':
      // Automáticamente ir a update_bids
      await RoundService.updateRoundPhase(gameId, 'update_bids');
      io.to(gameId).emit('round:phase-changed', { phase: 'update_bids' });
      break;
      
    case 'update_bids':
      // Esperar a que se actualicen los bids...
      break;
      
    // ... etc
  }
});
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