import { GameModel } from '../models/Game.js'
import { createDeck } from '@domain/rules/DeckRules.js'
import { createBidDeck } from '@domain/rules/BidDeckRules.js'
import { shuffleDeck } from '@domain/rules/DeckRules.js'
import { createDeckShuffledEvent } from '@domain/events/GameEvents.js'
import { v4 as uuidv4 } from 'uuid'
import type { PlayerId, Game, PlayingCard } from '@domain/interfaces'
import { canSkipCardReplacement, canReplaceCard } from '@domain/rules/CardReplacementRules.js'
import { 
  createCardReplacementSkippedEvent, 
  createCardReplacementCompletedEvent,
  createCardReplacedPrivateEvent 
} from '@domain/events/PlayerEvents.js'
import { TrickService } from './TrickService.js'

export class GameService {
  
  static async createGame(gameName?: string, hostPlayerId?: PlayerId, hostUserId?: string) {
    console.log("Creating game");
    const gameId = uuidv4();
    let deck = createDeck();
    const bidDecks = createBidDeck();
    
    // Inicializar playerSessions con el host
    const playerSessions = new Map<string, PlayerId>();
    if (hostUserId && hostPlayerId) {
      playerSessions.set(hostUserId, hostPlayerId);
    }
    
    const newGame = new GameModel({
      gameId,
      gameName: gameName || 'My Hasen Game',
      hostPlayer: hostPlayerId || 'player_1',
      hostUserId,
      activePlayers: [hostPlayerId || 'player_1'],
      playerSessions,
      deck,
      discardPile: [],
      bidDecks: {
        setCollectionBidDeck: bidDecks.setCollectionBidDeck,
        pointsBidDeck: bidDecks.pointsBidDeck,
        tricksBidDeck: bidDecks.tricksBidDeck
      },
      round: {
        round: 0,
        playerTurn: null,
        roundBids: {
          bids: [],
          playerBids: {}
        },
        roundPhase: 'round_setup',
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

  static async getPlayerGameState(gameId: string, userId?: string) {
  const game = await GameModel.findOne({ gameId });
  
  if (!game) {
    throw new Error('Game not found');
  }
  
  // Información pública base
  const publicState = {
    gameId: game.gameId,
    gameName: game.gameName,
    hostPlayer: game.hostPlayer,
    activePlayers: game.activePlayers,
    gamePhase: game.gamePhase,
    playerTurnOrder: game.playerTurnOrder,
    publicCards: {} as Record<string, any>,
    opponentsPublicInfo: [] as any[],
    round: {
      round: game.round.round,
      roundPhase: game.round.roundPhase,
      playerTurn: game.round.playerTurn,
      currentTrick: game.round.currentTrick,
      roundBids: game.round.roundBids,
      roundScore: game.round.roundScore || []
    },
    bidDecks: {
      setCollectionBidDeck: game.bidDecks.setCollectionBidDeck,
      pointsBidDeck: game.bidDecks.pointsBidDeck,
      tricksBidDeck: game.bidDecks.tricksBidDeck
    },
    gameSettings: game.gameSettings,
    playerScores: game.playerScores
  };

  // Agregar las cartas públicas visibles al mapa
  const visibleCards = game.deck.filter((card: any) => 
    card.state === 'in_hand_visible' || card.state === 'in_trick'
  );
  
  visibleCards.forEach((card: any) => {
    publicState.publicCards[card.id] = card;
  });

  // Crear opponentsPublicInfo para todos los jugadores activos
  publicState.opponentsPublicInfo = game.activePlayers.map((activePlayerId: PlayerId) => {
    const visibleCard = visibleCards.find((card: any) => card.owner === activePlayerId);
    const handCardsCount = game.deck.filter((c: any) => 
      c.owner === activePlayerId && 
      (c.state === 'in_hand_visible' || c.state === 'in_hand_hidden')
    ).length;
    
    return {
      playerId: activePlayerId,
      publicCardId: visibleCard ? visibleCard.id : null,
      handCardsCount
    };
  });

  // Si se proporciona userId, buscar su playerId y agregar su mano privada
  let playerHand = null;
  let playerId: PlayerId | null = null;
  
  if (userId && game.playerSessions) {
    playerId = game.playerSessions.get(userId) || null;
    console.log(`🔍 [getPlayerGameState] userId: ${userId}, mapped playerId: ${playerId}`);
    console.log(`🔍 [getPlayerGameState] playerSessions:`, Array.from(game.playerSessions.entries()));
    
    if (playerId && game.activePlayers.includes(playerId)) {
      playerHand = game.deck.filter(
        (card: any) => card.owner === playerId && 
        (card.state === 'in_hand_visible' || card.state === 'in_hand_hidden')
      );
      console.log(`🔍 [getPlayerGameState] Found ${playerHand.length} cards for ${playerId}`);
    }
  }

  return {
    publicState,
    privateState: playerHand ? {
      playerId,
      hand: playerHand
    } : null
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
    game.round.roundPhase = 'round_setup';
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

  static advancePlayerTurn(game: Game): PlayerId {
    const currentIndex = game.playerTurnOrder.indexOf(game.round.playerTurn!);
    const nextIndex = (currentIndex + 1) % game.playerTurnOrder.length;
    const nextPlayer = game.playerTurnOrder[nextIndex];
    
    game.round.playerTurn = nextPlayer;
    
    return nextPlayer;
  }

  private static hideAllPlayersCards(game: Game): void {
    // Convertir todas las cartas visibles a hidden
    game.deck.forEach((card: PlayingCard) => {
      if (card.state === 'in_hand_visible') {
        card.state = 'in_hand_hidden';
      }
    });
  }

  static async skipCardReplacement(gameId: string, playerId: PlayerId) {
    const game = await GameModel.findOne({ gameId });
    if (!game) throw new Error('Game not found');
    
    const validation = canSkipCardReplacement(playerId, game.round);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }
    
    const nextPlayer = this.advancePlayerTurn(game);
    
    const nextIndex = game.playerTurnOrder.indexOf(nextPlayer);
    if (game.round.roundPhase === 'player_drawing' && nextIndex === 0) {
      this.hideAllPlayersCards(game);
      game.round.roundPhase = 'playing';
      
      await game.save();
      
      const { game: updatedGame, event: trickEvent } = await TrickService.startTrick(gameId);
      
      const event = createCardReplacementSkippedEvent(
        playerId,
        game.round.round,
        nextPlayer
      );
      
      return { game: updatedGame, event, trickEvent };
    }
    
    await game.save();
    
    const event = createCardReplacementSkippedEvent(
      playerId,
      game.round.round,
      nextPlayer
    );
    
    return { game, event };
  }

  static async replaceCard(gameId: string, playerId: PlayerId, cardId: string, position: number) {
    const game = await GameModel.findOne({ gameId });
    if (!game) throw new Error('Game not found');
    
    const playerHand = game.deck.filter(
      (card: PlayingCard) => card.owner === playerId && 
      (card.state === 'in_hand_visible' || card.state === 'in_hand_hidden')
    );
    
    const validation = canReplaceCard(
      playerId,
      cardId,
      playerHand,
      game.round,
      game.deck.filter((c: PlayingCard) => c.state === 'in_deck').length
    );
    if (!validation.valid) {
      throw new Error(validation.reason);
    }
    
    const cardToDiscard = game.deck.find((c: PlayingCard) => c.id === cardId);
    if (!cardToDiscard) throw new Error('Card not found');
    
    cardToDiscard.state = 'in_discard_pile';
    cardToDiscard.owner = null;
    game.discardPile.push(cardToDiscard);
    
    const deckCards = game.deck.filter((c: PlayingCard) => c.state === 'in_deck');
    const randomIndex = Math.floor(Math.random() * deckCards.length);
    const newCard = deckCards[randomIndex];
    
    newCard.state = 'in_hand_hidden';
    newCard.owner = playerId;
    newCard.position = position;
    
    const nextPlayer = this.advancePlayerTurn(game);
    
    const nextIndex = game.playerTurnOrder.indexOf(nextPlayer);
    if (game.round.roundPhase === 'player_drawing' && nextIndex === 0) {
      this.hideAllPlayersCards(game);
      game.round.roundPhase = 'playing';
      
      await game.save();
      
      const { game: updatedGame, event: trickEvent } = await TrickService.startTrick(gameId);
      
      const publicEvent = createCardReplacementCompletedEvent(
        playerId,
        game.round.round,
        nextPlayer
      );
      const privateEvent = createCardReplacedPrivateEvent(
        playerId,
        cardToDiscard,
        newCard
      );
      
      return { game: updatedGame, publicEvent, privateEvent, trickEvent };
    }
    
    await game.save();
    
    const publicEvent = createCardReplacementCompletedEvent(
      playerId,
      game.round.round,
      nextPlayer
    );
    const privateEvent = createCardReplacedPrivateEvent(
      playerId,
      cardToDiscard,
      newCard
    );
    
    return { game, publicEvent, privateEvent };
  }
}