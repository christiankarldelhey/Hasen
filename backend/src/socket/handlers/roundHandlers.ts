import { RoundService } from '@/services/RoundService';
import { Server, Socket } from 'socket.io'
import { GameModel } from '@/models/Game.js'
import { socketToPlayer } from './lobbyHandlers.js'
import { createRemainingCardsDealtEvent } from '@domain/events/GameEvents.js'

export function setupRoundHandlers(io: Server, socket: Socket) {

socket.on('round:start', async ({ gameId }) => {
    try {
      const { game, setupEvent, firstCardsEvent, privateCards } = 
        await RoundService.startNewRound(gameId);
      
      console.log('handler: round:start - setup completed');
      
      // 1. Emitir evento de setup (público - bids)
      io.to(gameId).emit('game:event', setupEvent);
      
      // 2. Emitir evento de first cards (público - todos ven la primera carta)
      io.to(gameId).emit('game:event', firstCardsEvent);
      
      // 3. Emitir cartas privadas a cada jugador individualmente
      for (const [playerId, cards] of privateCards) {
        const privateEvent = createRemainingCardsDealtEvent(playerId, cards);
        
        // Encontrar el socket del jugador
        const playerSocketId = Array.from(socketToPlayer.entries())
          .find(([_, data]) => data.gameId === gameId && data.playerId === playerId)?.[0];
        
        if (playerSocketId) {
          io.to(playerSocketId).emit('game:event', privateEvent);
          console.log(`🃏 Sent private cards to ${playerId}`);
        } else {
          console.warn(`⚠️ Socket not found for player ${playerId}`);
        }
      }
      
      // 4. Emitir cambio de fase a player_drawing
      io.to(gameId).emit('round:phase-changed', { phase: 'player_drawing' });
      
      console.log('✅ Round setup, first cards dealt, and private cards sent');
      
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('round:next-phase', async ({ gameId }) => {
    console.log('next phase');
    const game = await GameModel.findOne({ gameId });
    
    switch (game?.round.roundPhase) {
      case 'player_drawing':
        // Esperar a que los jugadores hagan draw...
        break;
        
      case 'back_to_hand':
        // Transición a playing
        await RoundService.updateRoundPhase(gameId, 'playing');
        io.to(gameId).emit('round:phase-changed', { phase: 'playing' });
        break;
        
      // ... etc
    }
  });

}