import { Request, Response } from 'express'
import { GameModel } from '../models/Game.js'
import { GameService } from '../services/GameService.js'
import { PlayerId } from '../../../domain/interfaces/Player'

export const createGame = async (req: Request, res: Response) => {
  try {
    const { gameName, hostPlayerId } = req.body;
    const newGame = await GameService.createGame(gameName, hostPlayerId);
    
    res.status(201).json({
      success: true,
      data: {
        gameId: newGame.gameId,
        gamePhase: newGame.gamePhase,
        deckSize: newGame.deck.length,
        bidDecks: {
          setCollection: newGame.bidDecks.setCollectionBidDeck.length,
          points: newGame.bidDecks.pointsBidDeck.length,
          tricks: newGame.bidDecks.tricksBidDeck.length
        }
      }
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ success: false, error: 'Failed to create game' });
  }
}

export const getGame = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const game = await GameModel.findOne({ gameId });
    
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }
    
    res.status(200).json({ success: true, data: game });
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch game' });
  }
}

export const getGames = async (req: Request, res: Response) => {
  try {
    const games = await GameModel.find({ gamePhase: 'setup' })
      .select('gameId gameName hostPlayer activePlayers gameSettings.maxPlayers gameSettings.minPlayers')
      .lean();
    
    const gamesInfo = games.map(game => ({
      gameId: game.gameId,
      gameName: game.gameName,
      hostPlayer: game.hostPlayer,
      currentPlayers: game.activePlayers.length,
      maxPlayers: game.gameSettings.maxPlayers,
      minPlayers: game.gameSettings.minPlayers,
      hasSpace: game.activePlayers.length < game.gameSettings.maxPlayers
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
    const { game, assignedPlayerId } = await GameService.joinGame(gameId);
    
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
    io.to(gameId).emit('game:event', event);

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

export const leaveGame = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;
    
    const result = await GameService.leaveGame(gameId, playerId as PlayerId);
    
    if (result.gameDeleted) {
      return res.status(200).json({
        success: true,
        message: 'Host left, game deleted',
        gameDeleted: true
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        gameId: result.game!.gameId,
        activePlayers: result.game!.activePlayers,
        currentPlayers: result.game!.activePlayers.length
      }
    });
  } catch (error: any) {
    console.error('Error leaving game:', error);
    const status = error.message === 'Game not found' ? 404 : 400;
    res.status(status).json({ success: false, error: error.message });
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