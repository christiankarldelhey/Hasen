import { RoundService } from '@/services/RoundService';
import { GameService } from '@/services/GameService';
import { TrickService } from '@/services/TrickService';
import { BidService } from '@/services/BidService';
import { Server, Socket } from 'socket.io'
import { GameModel } from '@/models/Game.js'
import { socketToPlayer } from './lobbyHandlers.js'
import type { PlayerId } from '@domain/interfaces'
import { 
  createRemainingCardsDealtEvent, 
  createTurnFinishedEvent, 
  createTrickFinishedEvent, 
  createTrickStartedEvent,
  createNextLeadPlayerSelectedEvent,
  createCardStolenFromTrickEvent,
  createRoundEndedEvent
} from '@domain/events/GameEvents.js'

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
      
      io.to(gameId).emit('game:event', result.event);
      
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
      
      io.to(gameId).emit('game:event', result.publicEvent);
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

      // Verificar si se activó una acción especial y emitir evento correspondiente
      const currentTrick = game.round.currentTrick;
      if (currentTrick) {
        const specialCardEvent = TrickService.getSpecialCardEvents(game, currentTrick);
        if (specialCardEvent) {
          io.to(gameId).emit('game:event', specialCardEvent);
          const emoji = specialCardEvent.type === 'PICK_CARD_FROM_TRICK' ? '🍃' : '🫐';
          console.log(`${emoji} Emitted ${specialCardEvent.type} event for ${specialCardEvent.payload.playerId}`);
        }
      }

      // Verificar si el round pasó a fase 'scoring' (todos los tricks completados)
      if (game.round.roundPhase === 'scoring') {
        console.log(`🏁 Round ${game.round.round} completed! Starting next round...`);
        
        setTimeout(async () => {
          try {
            const result = await RoundService.finishRoundAndStartNext(gameId);
            
            io.to(gameId).emit('game:event', result.roundEndedEvent);
            
            if (result.gameEndedEvent) {
              io.to(gameId).emit('game:event', result.gameEndedEvent);
              console.log(`🏆 Game ended! Winner: ${result.gameEndedEvent.payload.winnerName}`);
              return;
            }
            
            io.to(gameId).emit('game:event', result.setupEvent);
            io.to(gameId).emit('game:event', result.firstCardsEvent);
            
            for (const [playerId, cards] of result.privateCards) {
              const privateEvent = createRemainingCardsDealtEvent(playerId, cards);
              const playerSocketId = Array.from(socketToPlayer.entries())
                .find(([_, data]) => data.gameId === gameId && data.playerId === playerId)?.[0];
              
              if (playerSocketId) {
                io.to(playerSocketId).emit('game:event', privateEvent);
              }
            }
            
            console.log(`✅ Round ${result.game.round.round} started automatically`);
          } catch (error: any) {
            console.error('Error starting next round:', error);
          }
        }, 2000);
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

      if (!game.round.currentTrick) {
        throw new Error('No active trick');
      }

      const turnFinishedEvent = createTurnFinishedEvent(
        playerData.playerId,
        nextPlayer,
        game.round.currentTrick.trick_number
      );
      
      io.to(gameId).emit('game:event', turnFinishedEvent);

      console.log(`✅ Player ${playerData.playerId} finished turn, next player: ${nextPlayer}`);
      
    } catch (error: any) {
      console.error('Error in finishTurn:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('player:finishTrick', async ({ gameId }: { gameId: string }) => {
    try {
      const result = await TrickService.finishTrick(gameId);
      const game = result.game;

      // Emitir TRICK_COMPLETED si existe (con score correcto después del robo)
      if (result.trickCompletedEvent) {
        io.to(gameId).emit('game:event', result.trickCompletedEvent);
      }

      const currentTrickNumber = game.round.currentTrick?.trick_number || null;
      const previousTrickNumber = currentTrickNumber ? (currentTrickNumber - 1) as 1 | 2 | 3 | 4 | 5 : 5;

      const trickFinishedEvent = createTrickFinishedEvent(
        previousTrickNumber,
        currentTrickNumber
      );
      
      io.to(gameId).emit('game:event', trickFinishedEvent);

      // Si hay un nuevo trick, emitir TRICK_STARTED
      if (game.round.currentTrick) {
        const trickStartedEvent = createTrickStartedEvent(
          game.round.currentTrick.trick_id,
          game.round.currentTrick.trick_number,
          game.round.currentTrick.lead_player
        );
        io.to(gameId).emit('game:event', trickStartedEvent);
        console.log(`🎯 Emitted TRICK_STARTED for trick ${game.round.currentTrick.trick_number}`);
      }

      // Verificar si el round pasó a fase 'scoring' (todos los tricks completados)
      if (game.round.roundPhase === 'scoring') {
        console.log(`🏁 Round ${game.round.round} completed! Calculating scores...`);
        
        setTimeout(async () => {
          try {
            const updatedGame = await GameModel.findOne({ gameId });
            if (!updatedGame) throw new Error('Game not found');

            // Calcular scores del round
            const { getPlayerScoreFromRound } = await import('@domain/rules/BidRules');
            const roundScores: Partial<Record<PlayerId, number>> = {};
            
            for (const playerId of updatedGame.activePlayers) {
              const scoreFromRound = getPlayerScoreFromRound(updatedGame, playerId);
              roundScores[playerId] = scoreFromRound;
              
              const playerScore = updatedGame.playerScores.find(ps => ps.playerId === playerId);
              if (playerScore) {
                playerScore.score += scoreFromRound;
              } else {
                updatedGame.playerScores.push({ playerId, score: scoreFromRound });
              }
            }

            // Resetear lista de ready players para el próximo round
            updatedGame.round.playersReadyForNextRound = [];
            await updatedGame.save();
            
            console.log(`� Round ${updatedGame.round.round} scores calculated:`, roundScores);
            
            // Verificar si el juego terminó
            const { hasGameEnded, getWinnerName } = await import('@domain/rules/GameEndRules');
            const gameEndCheck = hasGameEnded(updatedGame);

            if (gameEndCheck.hasEnded && gameEndCheck.winner) {
              console.log(`🏆 Game ended! Winner: ${gameEndCheck.winner}`);
              
              updatedGame.gamePhase = 'ended';
              updatedGame.winner = gameEndCheck.winner;
              await updatedGame.save();
              
              const { createGameEndedEvent } = await import('@domain/events/GameEvents');
              const winnerName = getWinnerName(gameEndCheck.winner);
              const gameEndedEvent = createGameEndedEvent(
                gameEndCheck.winner,
                winnerName,
                updatedGame.playerScores
              );
              
              io.to(gameId).emit('game:event', gameEndedEvent);
              return;
            }
            
            // Emitir ROUND_ENDED para mostrar modal
            const roundEndedEvent = createRoundEndedEvent(
              updatedGame.round.round,
              roundScores as Record<PlayerId, number>,
              updatedGame.playerScores
            );
            
            io.to(gameId).emit('game:event', roundEndedEvent);
            console.log(`📢 ROUND_ENDED event emitted, waiting for all players to be ready...`);
            
          } catch (error: any) {
            console.error('Error calculating round scores:', error);
          }
        }, 500);
      }

      console.log(`✅ Trick finished, moved to history and next trick started`);
      
    } catch (error: any) {
      console.error('Error in finishTrick:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('player:selectNextLeadPlayer', async ({ gameId, selectedLeadPlayer }: { gameId: string; selectedLeadPlayer: string }) => {
    try {
      const playerData = socketToPlayer.get(socket.id);
      if (!playerData) {
        socket.emit('error', { message: 'Player not found in session' });
        return;
      }

      const { game, trickCompletedEvent } = await TrickService.saveSpecialCardSelection(
        gameId,
        playerData.playerId,
        { nextLead: selectedLeadPlayer as PlayerId }
      );

      // Emitir evento de selección completada
      const nextLeadSelectedEvent = createNextLeadPlayerSelectedEvent(
        playerData.playerId,
        selectedLeadPlayer as PlayerId,
        0 as any // El trick number no importa aquí, se procesa en finishTrick
      );
      io.to(gameId).emit('game:event', nextLeadSelectedEvent);

      // Emitir evento TRICK_COMPLETED si existe
      if (trickCompletedEvent) {
        io.to(gameId).emit('game:event', trickCompletedEvent);
      }

      console.log(`✅ Player ${playerData.playerId} selected ${selectedLeadPlayer} as next lead`);
      
    } catch (error: any) {
      console.error('Error in selectNextLeadPlayer:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('player:selectCardToSteal', async ({ gameId, selectedCardId }: { gameId: string; selectedCardId: string }) => {
    try {
      const playerData = socketToPlayer.get(socket.id);
      if (!playerData) {
        socket.emit('error', { message: 'Player not found in session' });
        return;
      }

      const { game, trickCompletedEvent } = await TrickService.saveSpecialCardSelection(
        gameId,
        playerData.playerId,
        { cardToSteal: selectedCardId }
      );

      // Emitir evento de carta seleccionada para robar
      const cardStolenEvent = createCardStolenFromTrickEvent(
        playerData.playerId,
        selectedCardId,
        0 as any // El trick number no importa aquí, se procesa en finishTrick
      );
      io.to(gameId).emit('game:event', cardStolenEvent);

      // Emitir evento TRICK_COMPLETED si existe
      if (trickCompletedEvent) {
        io.to(gameId).emit('game:event', trickCompletedEvent);
      }

      console.log(`✅ Player ${playerData.playerId} selected card ${selectedCardId} to steal`);
      
    } catch (error: any) {
      console.error('Error in selectCardToSteal:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('player:readyForNextRound', async ({ gameId }: { gameId: string }) => {
    try {
      const playerData = socketToPlayer.get(socket.id);
      if (!playerData) {
        socket.emit('error', { message: 'Player not found in session' });
        return;
      }

      const game = await GameModel.findOne({ gameId });
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      // Agregar jugador a la lista de ready si no está ya
      if (!game.round.playersReadyForNextRound) {
        game.round.playersReadyForNextRound = [];
      }
      
      if (!game.round.playersReadyForNextRound.includes(playerData.playerId)) {
        game.round.playersReadyForNextRound.push(playerData.playerId);
        await game.save();
      }

      console.log(`✅ Player ${playerData.playerId} is ready for next round (${game.round.playersReadyForNextRound.length}/${game.activePlayers.length})`);

      // Emitir evento de status actualizado a todos
      const { createPlayersReadyStatusEvent } = await import('@domain/events/GameEvents');
      const statusEvent = createPlayersReadyStatusEvent(
        game.round.round,
        game.round.playersReadyForNextRound,
        game.activePlayers.length
      );
      io.to(gameId).emit('game:event', statusEvent);

      // Si todos están ready, iniciar nuevo round
      if (game.round.playersReadyForNextRound.length === game.activePlayers.length) {
        console.log(`🎯 All players ready! Starting round ${game.round.round + 1}...`);
        
        setTimeout(async () => {
          try {
            const result = await RoundService.startNewRound(gameId);
            
            io.to(gameId).emit('game:event', result.setupEvent);
            io.to(gameId).emit('game:event', result.firstCardsEvent);
            
            for (const [playerId, cards] of result.privateCards) {
              const privateEvent = createRemainingCardsDealtEvent(playerId, cards);
              const playerSocketId = Array.from(socketToPlayer.entries())
                .find(([_, data]) => data.gameId === gameId && data.playerId === playerId)?.[0];
              
              if (playerSocketId) {
                io.to(playerSocketId).emit('game:event', privateEvent);
              }
            }

            // Enviar estado completo a cada jugador para garantizar sincronización
            for (const [socketId, data] of socketToPlayer.entries()) {
              if (data.gameId === gameId) {
                const { publicState, privateState } = await GameService.getPlayerGameState(gameId, data.userId);
                io.to(socketId).emit('game:stateUpdate', {
                  publicGameState: publicState,
                  privateGameState: privateState
                });
              }
            }
            
            console.log(`✅ Round ${result.game.round.round} started after all players ready`);
          } catch (error: any) {
            console.error('Error starting next round:', error);
          }
        }, 1000);
      }
      
    } catch (error: any) {
      console.error('Error in readyForNextRound:', error);
      socket.emit('error', { message: error.message });
    }
  });


}