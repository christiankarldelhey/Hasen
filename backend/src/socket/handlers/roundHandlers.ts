import { RoundService } from '@/services/RoundService';
import { GameService } from '@/services/GameService';
import { TrickService } from '@/services/TrickService';
import { BidService } from '@/services/BidService';
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
    }
  });

  socket.on('player:skipCardReplacement', async ({ gameId }) => {
    try {
      const playerData = socketToPlayer.get(socket.id);
      if (!playerData) {
        socket.emit('error', { message: 'Player not found in session' });
        return;
      }

      const result = await GameService.skipCardReplacement(gameId, playerData.playerId);
      
      const { publicState, privateState } = await GameService.getPlayerGameState(gameId, playerData.userId);
      
      io.to(gameId).emit('game:stateUpdate', {
        publicGameState: publicState,
        event: result.event
      });
      
      if (result.trickEvent) {
        io.to(gameId).emit('game:event', result.trickEvent);
      }

      console.log(`✅ Player ${playerData.playerId} skipped card replacement`);
      
    } catch (error: any) {
      console.error('Error in skipCardReplacement:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('player:replaceCard', async ({ gameId, cardId, position }: { gameId: string; cardId: string; position: number }) => {
    try {
      const playerData = socketToPlayer.get(socket.id);
      if (!playerData) {
        socket.emit('error', { message: 'Player not found in session' });
        return;
      }

      const result = await GameService.replaceCard(
        gameId, 
        playerData.playerId, 
        cardId,
        position
      );
      
      // Enviar estado actualizado a cada jugador (público + privado)
      for (const [socketId, data] of socketToPlayer.entries()) {
        if (data.gameId === gameId) {
          const { publicState, privateState } = await GameService.getPlayerGameState(gameId, data.userId);
          
          io.to(socketId).emit('game:stateUpdate', {
            publicGameState: publicState,
            privateGameState: privateState,
            event: result.publicEvent
          });
        }
      }

      // Enviar evento privado solo al jugador que reemplazó
      io.to(socket.id).emit('game:event', result.privateEvent);
      
      if (result.trickEvent) {
        io.to(gameId).emit('game:event', result.trickEvent);
      }
      
    } catch (error: any) {
      console.error('Error in replaceCard:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('player:playCard', async ({ gameId, cardId }: { gameId: string; cardId: string }) => {
    try {
      const playerData = socketToPlayer.get(socket.id);
      if (!playerData) {
        socket.emit('error', { message: 'Player not found in session' });
        return;
      }

      const { game, event, trickCompletedEvent } = await TrickService.playCard(
        gameId,
        playerData.playerId,
        cardId
      );

      // Emitir el evento CARD_PLAYED a todos los jugadores en la sala
      io.to(gameId).emit('game:event', event);

      // Si el trick está completo, emitir evento TRICK_COMPLETED
      if (trickCompletedEvent) {
        io.to(gameId).emit('game:event', trickCompletedEvent);
      }

      // Verificar si el round pasó a fase 'scoring' (todos los tricks completados)
      if (game.round.roundPhase === 'scoring') {
        console.log(`🏁 Round ${game.round.round} completed! Starting next round...`);
        
        // Dar un pequeño delay para que los clientes procesen el TRICK_COMPLETED
        setTimeout(async () => {
          try {
            const { game: newGame, setupEvent, firstCardsEvent, privateCards } = 
              await RoundService.finishRoundAndStartNext(gameId);
            
            // Emitir eventos del nuevo round
            io.to(gameId).emit('game:event', setupEvent);
            io.to(gameId).emit('game:event', firstCardsEvent);
            
            // Enviar cartas privadas a cada jugador
            for (const [playerId, cards] of privateCards) {
              const privateEvent = createRemainingCardsDealtEvent(playerId, cards);
              const playerSocketId = Array.from(socketToPlayer.entries())
                .find(([_, data]) => data.gameId === gameId && data.playerId === playerId)?.[0];
              
              if (playerSocketId) {
                io.to(playerSocketId).emit('game:event', privateEvent);
              }
            }
            
            // Enviar estado actualizado del nuevo round
            for (const [socketId, data] of socketToPlayer.entries()) {
              if (data.gameId === gameId) {
                const { publicState, privateState } = await GameService.getPlayerGameState(gameId, data.userId);
                io.to(socketId).emit('game:stateUpdate', {
                  publicGameState: publicState,
                  privateGameState: privateState
                });
              }
            }
            
            console.log(`✅ Round ${newGame.round.round} started automatically`);
          } catch (error: any) {
            console.error('Error starting next round:', error);
          }
        }, 2000); // 2 segundos de delay
      } else {
        // Enviar estado actualizado a cada jugador (público + privado)
        for (const [socketId, data] of socketToPlayer.entries()) {
          if (data.gameId === gameId) {
            const { publicState, privateState } = await GameService.getPlayerGameState(gameId, data.userId);
            
            io.to(socketId).emit('game:stateUpdate', {
              publicGameState: publicState,
              privateGameState: privateState
            });
          }
        }
      }

      console.log(`✅ Player ${playerData.playerId} played card ${cardId}`);
      
    } catch (error: any) {
      console.error('Error in playCard:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('player:makeBid', async ({ gameId, bidType, trickNumber, bidId }: { gameId: string; bidType: 'points' | 'set_collection' | 'trick'; trickNumber: 1 | 2 | 3 | 4 | 5; bidId?: string }) => {
    try {
      const playerData = socketToPlayer.get(socket.id);
      if (!playerData) {
        socket.emit('error', { message: 'Player not found in session' });
        return;
      }

      const { game, event } = await BidService.makeBid(
        gameId,
        playerData.playerId,
        bidType,
        trickNumber,
        bidId
      );

      io.to(gameId).emit('game:event', event);

      for (const [socketId, data] of socketToPlayer.entries()) {
        if (data.gameId === gameId) {
          const { publicState, privateState } = await GameService.getPlayerGameState(gameId, data.userId);
          
          io.to(socketId).emit('game:stateUpdate', {
            publicGameState: publicState,
            privateGameState: privateState
          });
        }
      }

      console.log(`✅ Player ${playerData.playerId} made bid ${bidType} on trick ${trickNumber}`);
      
    } catch (error: any) {
      console.error('Error in makeBid:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('player:finishTurn', async ({ gameId }: { gameId: string }) => {
    try {
      const playerData = socketToPlayer.get(socket.id);
      if (!playerData) {
        socket.emit('error', { message: 'Player not found in session' });
        return;
      }

      const { game, nextPlayer } = await TrickService.finishTurn(
        gameId,
        playerData.playerId
      );

      for (const [socketId, data] of socketToPlayer.entries()) {
        if (data.gameId === gameId) {
          const { publicState, privateState } = await GameService.getPlayerGameState(gameId, data.userId);
          
          io.to(socketId).emit('game:stateUpdate', {
            publicGameState: publicState,
            privateGameState: privateState
          });
        }
      }

      console.log(`✅ Player ${playerData.playerId} finished turn, next player: ${nextPlayer}`);
      
    } catch (error: any) {
      console.error('Error in finishTurn:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('player:finishTrick', async ({ gameId }: { gameId: string }) => {
    try {
      const { game } = await TrickService.finishTrick(gameId);

      // Verificar si el round pasó a fase 'scoring' (todos los tricks completados)
      if (game.round.roundPhase === 'scoring') {
        console.log(`🏁 Round ${game.round.round} completed! Starting next round...`);
        
        // Dar un pequeño delay para que los clientes procesen el cambio de estado
        setTimeout(async () => {
          try {
            const { game: newGame, setupEvent, firstCardsEvent, privateCards } = 
              await RoundService.finishRoundAndStartNext(gameId);
            
            // Emitir eventos del nuevo round
            io.to(gameId).emit('game:event', setupEvent);
            io.to(gameId).emit('game:event', firstCardsEvent);
            
            // Enviar cartas privadas a cada jugador
            for (const [playerId, cards] of privateCards) {
              const privateEvent = createRemainingCardsDealtEvent(playerId, cards);
              const playerSocketId = Array.from(socketToPlayer.entries())
                .find(([_, data]) => data.gameId === gameId && data.playerId === playerId)?.[0];
              
              if (playerSocketId) {
                io.to(playerSocketId).emit('game:event', privateEvent);
              }
            }
            
            // Enviar estado actualizado del nuevo round
            for (const [socketId, data] of socketToPlayer.entries()) {
              if (data.gameId === gameId) {
                const { publicState, privateState } = await GameService.getPlayerGameState(gameId, data.userId);
                io.to(socketId).emit('game:stateUpdate', {
                  publicGameState: publicState,
                  privateGameState: privateState
                });
              }
            }
            
            console.log(`✅ Round ${newGame.round.round} started automatically`);
          } catch (error: any) {
            console.error('Error starting next round:', error);
          }
        }, 2000); // 2 segundos de delay
      } else {
        // Si no es el último trick, solo enviar estado actualizado
        for (const [socketId, data] of socketToPlayer.entries()) {
          if (data.gameId === gameId) {
            const { publicState, privateState } = await GameService.getPlayerGameState(gameId, data.userId);
            
            io.to(socketId).emit('game:stateUpdate', {
              publicGameState: publicState,
              privateGameState: privateState
            });
          }
        }
      }

      console.log(`✅ Trick finished, moved to history and next trick started`);
      
    } catch (error: any) {
      console.error('Error in finishTrick:', error);
      socket.emit('error', { message: error.message });
    }
  });

}