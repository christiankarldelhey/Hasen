import { Request, Response } from 'express'
import { GameModel } from '../models/Game.js'
import { GameService } from '../services/GameService.js'
import { RoundService } from '../services/RoundService.js'
import { PlayerId } from '../../../domain/interfaces/Player'
import { createRemainingCardsDealtEvent } from '@domain/events/GameEvents.js'
import { socketToPlayer } from '../socket/handlers/lobbyHandlers.js'

export const createGame = async (req: Request, res: Response) => {
  try {
    const { gameName, hostPlayerId, userId, maxPlayers, pointsToWin } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    
    const newGame = await GameService.createGame(gameName, hostPlayerId, userId, maxPlayers, pointsToWin);
    
    // Emitir evento de socket para que todos en lobby-list vean el nuevo room
    const io = req.app.get('io');
    io.to('lobby-list').emit('lobby:room-created', {
      gameId: newGame.gameId,
      gameName: gameName,
      hostPlayer: newGame.hostPlayer,
      currentPlayers: newGame.activePlayers.length,
      maxPlayers: newGame.gameSettings.maxPlayers,
      minPlayers: newGame.gameSettings.minPlayers,
      hasSpace: newGame.activePlayers.length < newGame.gameSettings.maxPlayers,
      pointsToWin: newGame.gameSettings.pointsToWin,
      createdAt: newGame.createdAt
    });
    
    res.status(201).json({
      success: true,
      data: {
        gameId: newGame.gameId,
        gameName: gameName,
        assignedPlayerId: newGame.hostPlayer,
        gamePhase: newGame.gamePhase,
        deckSize: newGame.deck.length,
        bidDecks: {
          setCollection: newGame.bidDecks.setCollectionBidDeck.length,
          points: newGame.bidDecks.pointsBidDeck.length,
          tricks: newGame.bidDecks.tricksBidDeck.length
        }
      }
    });
  } catch (error: any) {
    console.error('Error creating game:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create game' });
  }
}

export const getGame = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { userId } = req.query;
    
    const gameData = await GameService.getPlayerGameState(gameId, userId as string | undefined);
    
    res.status(200).json({ success: true, data: gameData });
  } catch (error: any) {
    console.error('Error fetching game:', error);
    const status = error.message === 'Game not found' ? 404 : 500;
    res.status(status).json({ 
      success: false, 
      error: error.message || 'Failed to fetch game' 
    });
  }
}

export const getGames = async (req: Request, res: Response) => {
  try {
    const games = await GameModel.find({ gamePhase: 'setup' })
      .select('gameId gameName hostPlayer activePlayers gameSettings.maxPlayers gameSettings.minPlayers gameSettings.pointsToWin')
      .sort({ createdAt: -1 })
      .lean();
    
    const gamesInfo = games.map(game => ({
      gameId: game.gameId,
      gameName: game.gameName,
      hostPlayer: game.hostPlayer,
      currentPlayers: game.activePlayers.length,
      maxPlayers: game.gameSettings.maxPlayers,
      minPlayers: game.gameSettings.minPlayers,
      hasSpace: game.activePlayers.length < game.gameSettings.maxPlayers,
      pointsToWin: game.gameSettings.pointsToWin,
      createdAt: game.createdAt
    }));
    
    res.status(200).json({ success: true, data: gamesInfo });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch games' });
  }
}

export const joinGame = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    
    const { game, assignedPlayerId } = await GameService.joinGame(gameId, userId);
    
    // Emitir evento de socket para actualizar contadores en tiempo real
    const io = req.app.get('io');
    io.to('lobby-list').emit('lobby:player-count-changed', {
      gameId: game.gameId,
      currentPlayers: game.activePlayers.length
    });
    
    res.status(200).json({
      success: true,
      data: {
        gameId: game.gameId,
        assignedPlayerId,
        activePlayers: game.activePlayers,
        currentPlayers: game.activePlayers.length,
        maxPlayers: game.gameSettings.maxPlayers
      }
    });
  } catch (error: any) {
    console.error('Error joining game:', error);
    const status = error.message === 'Game not found' ? 404 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
}

export const startGame = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { hostPlayerId } = req.body;
    
    const game = await GameModel.findOne({ gameId });
    if (!game) return res.status(404).json({ success: false, error: 'Game not found' });
    if (game.hostPlayer !== hostPlayerId) return res.status(403).json({ success: false, error: 'Only the host can start the game' });
    if (game.gamePhase !== 'setup') return res.status(400).json({ success: false, error: 'Game already started or ended' });
    if (game.activePlayers.length < game.gameSettings.minPlayers) {
      return res.status(400).json({ success: false, error: `Need at least ${game.gameSettings.minPlayers} players to start` });
    }
    
    const { game: updatedGame, event } = await GameService.startGame(gameId);

    const io = req.app.get('io');
    io.to(gameId).emit('game:started', {
      gameId: updatedGame.gameId,
      gamePhase: updatedGame.gamePhase,
      activePlayers: updatedGame.activePlayers,
      playerTurnOrder: updatedGame.playerTurnOrder
    });
    
    if (event) {
      io.to(gameId).emit('game:event', event);
    }

    const { game: gameWithRound, setupEvent, firstCardsEvent, privateCards } = 
      await RoundService.startNewRound(gameId);
    
    io.to(gameId).emit('game:event', setupEvent);
    io.to(gameId).emit('game:event', firstCardsEvent);
    
    for (const [playerId, cards] of privateCards) {
      const privateEvent = createRemainingCardsDealtEvent(playerId, cards);
      
      const playerSocketId = Array.from(socketToPlayer.entries())
        .find(([_, data]) => data.gameId === gameId && data.playerId === playerId)?.[0];
      
      if (playerSocketId) {
        io.to(playerSocketId).emit('game:event', privateEvent);
        console.log(`🎴 Sent private cards to ${playerId}`);
      } else {
        console.warn(`⚠️ Socket not found for player ${playerId}`);
      }
    }
    
    // Enviar estado actualizado del juego con playerTurn y fase player_drawing
    for (const [socketId, data] of socketToPlayer.entries()) {
      if (data.gameId === gameId) {
        const { publicState, privateState } = await GameService.getPlayerGameState(gameId, data.userId);
        io.to(socketId).emit('game:stateUpdate', {
          publicGameState: publicState,
          privateGameState: privateState
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        gameId: updatedGame.gameId,
        gamePhase: updatedGame.gamePhase,
        activePlayers: updatedGame.activePlayers,
        playerTurnOrder: updatedGame.playerTurnOrder
      }
    });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ success: false, error: 'Failed to start game' });
  }
}


export const deleteGame = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { hostPlayerId } = req.body;
    
    const game = await GameModel.findOne({ gameId });
    if (!game) return res.status(404).json({ success: false, error: 'Game not found' });
    if (game.hostPlayer !== hostPlayerId) return res.status(403).json({ success: false, error: 'Only the host can delete the game' });
    
    await GameService.deleteGame(gameId);
    res.status(200).json({ success: true, message: 'Game deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting game:', error);
    const status = error.message === 'Game not found' ? 404 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
}

export const endGame = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { winnerId } = req.body;
    
    const { game, winnerId: winner } = await GameService.endGame(gameId, winnerId);
    
    res.status(200).json({
      success: true,
      data: {
        gameId: game.gameId,
        gamePhase: game.gamePhase,
        winnerId: winner,
        finalScores: game.playerScores
      }
    });
  } catch (error: any) {
    console.error('Error ending game:', error);
    const status = error.message === 'Game not found' ? 404 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
}