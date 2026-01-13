import { RoundService } from '@/services/RoundService';
import { GameService } from '@/services/GameService';
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
      
      // 4. Enviar estado actualizado del juego con playerTurn seteado y fase player_drawing
      for (const [socketId, data] of socketToPlayer.entries()) {
        if (data.gameId === gameId) {
          const { publicState, privateState } = await GameService.getPlayerGameState(gameId, data.userId);
          io.to(socketId).emit('game:stateUpdate', {
            publicGameState: publicState,
            privateGameState: privateState
          });
        }
      }
      
      console.log('✅ Round setup, first cards dealt, private cards sent, and game state updated');
      
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
        
        // Enviar estado actualizado con nueva fase
        for (const [socketId, data] of socketToPlayer.entries()) {
          if (data.gameId === gameId) {
            const { publicState, privateState } = await GameService.getPlayerGameState(gameId, data.userId);
            io.to(socketId).emit('game:stateUpdate', {
              publicGameState: publicState,
              privateGameState: privateState
            });
          }
        }
        break;
        
    }
  });

  socket.on('player:skipCardReplacement', async ({ gameId }) => {
    try {
      const playerData = socketToPlayer.get(socket.id);
      if (!playerData) {
        socket.emit('error', { message: 'Player not found in session' });
        return;
      }

      const { game, event } = await GameService.skipCardReplacement(gameId, playerData.playerId);
      
      const { publicState, privateState } = await GameService.getPlayerGameState(gameId, playerData.userId);
      
      io.to(gameId).emit('game:stateUpdate', {
        publicGameState: publicState,
        event
      });

      console.log(`✅ Player ${playerData.playerId} skipped card replacement`);
      
    } catch (error: any) {
      console.error('Error in skipCardReplacement:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('player:replaceCard', async ({ gameId, cardId }: { gameId: string; cardId: string }) => {
    try {
      const playerData = socketToPlayer.get(socket.id);
      if (!playerData) {
        socket.emit('error', { message: 'Player not found in session' });
        return;
      }

      const { game, publicEvent, privateEvent } = await GameService.replaceCard(
        gameId, 
        playerData.playerId, 
        cardId
      );
      
      // Enviar estado actualizado a cada jugador (público + privado)
      for (const [socketId, data] of socketToPlayer.entries()) {
        if (data.gameId === gameId) {
          const { publicState, privateState } = await GameService.getPlayerGameState(gameId, data.userId);
          
          io.to(socketId).emit('game:stateUpdate', {
            publicGameState: publicState,
            privateGameState: privateState,
            event: publicEvent
          });
        }
      }

      // Enviar evento privado solo al jugador que reemplazó
      io.to(socket.id).emit('game:event', privateEvent);
      
    } catch (error: any) {
      console.error('Error in replaceCard:', error);
      socket.emit('error', { message: error.message });
    }
  });

}