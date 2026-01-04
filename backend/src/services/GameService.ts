import { GameModel } from '../models/Game.js'
import { createDeck } from '@domain/rules/DeckRules.js'
import { createBidDeck } from '@domain/rules/BidDeckRules.js'
import { shuffleDeck } from '@domain/rules/DeckRules.js'
import { createDeckShuffledEvent } from '@domain/events/GameEvents.js'
import { v4 as uuidv4 } from 'uuid'
import { PlayerId } from '@domain/interfaces'

export class GameService {
  
  static async createGame(gameName?: string, hostPlayerId?: PlayerId, hostUserId?: string) {
    console.log("Creating game");
    const gameId = uuidv4();
    const deck = createDeck();
    const bidDecks = createBidDeck();
    
    const newGame = new GameModel({
      gameId,
      gameName: gameName || 'My Hasen Game',
      hostPlayer: hostPlayerId || 'player_1',
      hostUserId,
      activePlayers: [hostPlayerId || 'player_1'],
      deck,
      bidDecks: {
        setCollectionBidDeck: bidDecks.setCollectionBidDeck,
        pointsBidDeck: bidDecks.pointsBidDeck,
        tricksBidDeck: bidDecks.tricksBidDeck
      },
      round: {
        round: 0,
        playerTurn: null,
        roundBids: {
          points: [null, null],
          set_collection: [null, null],
          trick: [null, null]
        },
        roundPhase: 'shuffle',
        currentTrick: null
      },
      playerTurnOrder: [],
      tricksHistory: [],
      bidsHistory: [],
      playerScores: []
    });
    
    await newGame.save();
    return newGame;
  }

  static async joinGame(gameId: string, userId: string) {
    const game = await GameModel.findOne({ gameId });
    if (!game) throw new Error('Game not found');
    
    if (game.gamePhase !== 'setup') {
      throw new Error('Game already started or ended');
    }

    // Validar que no sea el creador intentando unirse de nuevo
    if (game.hostUserId === userId) {
      throw new Error('You cannot join your own game. You are already the host.');
    }
    
    // Verificar si este userId ya está en el juego
    if (game.playerSessions && game.playerSessions.has(userId)) {
      const existingPlayerId = game.playerSessions.get(userId);
      return { game, assignedPlayerId: existingPlayerId };
    }
    
    if (game.activePlayers.length >= game.gameSettings.maxPlayers) {
      throw new Error('Game is full');
    }
    
    const allPlayers: PlayerId[] = ['player_1', 'player_2', 'player_3', 'player_4'];
    const availablePlayer = allPlayers.find(p => !game.activePlayers.includes(p));
    
    if (!availablePlayer) {
      throw new Error('No available player slots');
    }
    
    game.activePlayers.push(availablePlayer);
    
    // Guardar el mapeo sessionId -> playerId
    if (!game.playerSessions) {
      game.playerSessions = new Map();
    }
    game.playerSessions.set(userId, availablePlayer);
    
    await game.save();
    
    return { game, assignedPlayerId: availablePlayer };
}

  static async startGame(gameId: string) {
    const game = await GameModel.findOne({ gameId });
    if (!game) throw new Error('Game not found');

    game.gamePhase = 'playing';
    game.playerTurnOrder = [...game.activePlayers];
    game.round.round = 1;
    game.round.roundPhase = 'shuffle';
    game.deck = shuffleDeck(game.deck);
    
    game.deck.forEach(card => {
      card.state = 'in_deck';
      card.owner = null;
    });
    
    await game.save();
    const event = createDeckShuffledEvent(game.round.round, game.deck.length);
    console.log("Emitting deck shuffled event:", event);
    return { game, event };
  }

  static async leaveGame(gameId: string, playerId: PlayerId, userId: string) {
    const game = await GameModel.findOne({ gameId });
    if (!game) throw new Error('Game not found');
    
    if (game.gamePhase !== 'setup') {
      throw new Error('Cannot leave a game that has already started');
    }
    
    if (!game.activePlayers.includes(playerId)) {
      throw new Error('Player is not in this game');
    }
    
    // Si el host se va, eliminar el juego completo
    if (game.hostPlayer === playerId) {
      await GameModel.deleteOne({ gameId });
      return { gameDeleted: true };
    }
    
    // Remover el jugador
    game.activePlayers = game.activePlayers.filter(p => p !== playerId);
    
    // Remover del mapeo de sesiones
    if (game.playerSessions) {
      game.playerSessions.delete(userId);
    }

    await game.save();
    
    return { game, gameDeleted: false, wasHost: false };
  }

  static async deleteGame(gameId: string) {
    const game = await GameModel.findOne({ gameId });
    if (!game) throw new Error('Game not found');
    
    if (game.gamePhase !== 'setup') {
      throw new Error('Cannot delete a game that has already started');
    }
    
    await GameModel.deleteOne({ gameId });
    return { success: true };
  }

  static async endGame(gameId: string, winnerId?: PlayerId) {
    const game = await GameModel.findOne({ gameId });
    if (!game) throw new Error('Game not found');
    
    if (game.gamePhase !== 'playing') {
      throw new Error('Game is not currently being played');
    }
    
    game.gamePhase = 'ended';
    await game.save();
    
    return { game, winnerId: winnerId || null };
  }
}