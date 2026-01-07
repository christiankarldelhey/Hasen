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
    let deck = createDeck();
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

  static async getPublicGameState(gameId: string) {
  const game = await GameModel.findOne({ gameId });
  
  if (!game) {
    throw new Error('Game not found');
  }
  
  // Devolver solo información pública
  return {
    gameId: game.gameId,
    gameName: game.gameName,
    hostPlayer: game.hostPlayer,
    activePlayers: game.activePlayers,
    gamePhase: game.gamePhase,
    playerTurnOrder: game.playerTurnOrder,
    round: {
      round: game.round.round,
      roundPhase: game.round.roundPhase,
      playerTurn: game.round.playerTurn,
      currentTrick: game.round.currentTrick
    },
    gameSettings: game.gameSettings,
    playerScores: game.playerScores
  };
}

  static async joinGame(gameId: string, userId: string) {
  const game = await GameModel.findOne({ gameId });
  if (!game) throw new Error('Game not found');
  
  if (game.gamePhase !== 'setup') {
    throw new Error('Game already started or ended');
  }

  // Verificar si este userId ya tiene un playerId asignado (rejoin)
  if (game.playerSessions && game.playerSessions.has(userId)) {
    const existingPlayerId = game.playerSessions.get(userId);
    
    // Si el jugador ya está en activePlayers, solo devolver su playerId
    if (game.activePlayers.includes(existingPlayerId!)) {
      return { game, assignedPlayerId: existingPlayerId };
    }
    
    // Si no está en activePlayers (se desconectó), volver a agregarlo
    game.activePlayers.push(existingPlayerId!);
    await game.save();
    return { game, assignedPlayerId: existingPlayerId };
  }
  
  // Nuevo jugador: verificar espacio disponible
  if (game.activePlayers.length >= game.gameSettings.maxPlayers) {
    throw new Error('Game is full');
  }
  
  const allPlayers: PlayerId[] = ['player_1', 'player_2', 'player_3', 'player_4'];
  const availablePlayer = allPlayers.find(p => !game.activePlayers.includes(p));
  
  if (!availablePlayer) {
    throw new Error('No available player slots');
  }
  
  game.activePlayers.push(availablePlayer);
  
  // Guardar el mapeo userId -> playerId
  if (!game.playerSessions) {
    game.playerSessions = new Map();
  }
  game.playerSessions.set(userId, availablePlayer);
  
  await game.save();
  
  return { game, assignedPlayerId: availablePlayer };
}

static async startGame(gameId: string) {
  console.log('🔵 [startGame] CALLED with:', { gameId });
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
  return { game, event };
}

static async leaveGame(gameId: string, playerId: PlayerId, userId: string) {
  console.log('🔵 [leaveGame] CALLED with:', { gameId, playerId, userId });
  
  const game = await GameModel.findOne({ gameId });
  if (!game) throw new Error('Game not found');
  
  if (game.gamePhase !== 'setup') {
    throw new Error('Cannot leave a game that has already started');
  }
  
  if (!game.activePlayers.includes(playerId)) {
    console.error('❌ [leaveGame] Player not found in activePlayers!', {
      requestedPlayerId: playerId,
      activePlayers: game.activePlayers
    });
    throw new Error('Player is not in this game');
  }
  
  // Remover el jugador (ya no importa si es host o no)
  game.activePlayers = game.activePlayers.filter(p => p !== playerId);
  
  // Remover del mapeo de sesiones
  if (game.playerSessions) {
    game.playerSessions.delete(userId);
  }

  await game.save();
  
    // La room persiste aunque se vaya el host
    return { game, gameDeleted: false, wasHost: playerId === game.hostPlayer };
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