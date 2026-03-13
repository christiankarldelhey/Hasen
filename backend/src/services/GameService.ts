import { GameModel } from '../models/Game.js'
import { createDeck } from '@domain/rules/DeckRules.js'
import { createBidDeck } from '@domain/rules/BidDeckRules.js'
import { shuffleDeck } from '@domain/rules/DeckRules.js'
import { 
  createDeckShuffledEvent,
  createCardReplacementSkippedEvent, 
  createCardReplacementCompletedEvent,
  createCardReplacedPrivateEvent 
} from '@domain/events/GameEvents.js'
import { v4 as uuidv4 } from 'uuid'
import { getAvailablePlayerColors, getDefaultPlayerProfile, PLAYER_IDS } from '@domain/interfaces'
import type { ActivePlayer, PlayerId, Game, PlayingCard } from '@domain/interfaces'
import { canSkipCardReplacement, canReplaceCard } from '@domain/rules/CardReplacementRules.js'
import { TrickService } from './TrickService.js'

export class GameService {
  
  private static readonly SKIP_CARD_REPLACEMENT_POINTS = 3
  private static readonly PLAYER_NAME_MAX_LENGTH = 15
  private static readonly BOT_NAME_SUFFIX = ' Bot'

  private static getActivePlayerIds(game: Game): PlayerId[] {
    return game.activePlayers.map(player => player.id)
  }

  private static isPlayerActive(game: Game, playerId: PlayerId): boolean {
    return game.activePlayers.some(player => player.id === playerId)
  }

  private static getActivePlayer(game: Game, playerId: PlayerId): ActivePlayer | undefined {
    return game.activePlayers.find(player => player.id === playerId)
  }

  private static buildBotProfile(playerId: PlayerId): ActivePlayer {
    const profile = getDefaultPlayerProfile(playerId)
    const botName = profile.name.endsWith(this.BOT_NAME_SUFFIX)
      ? profile.name
      : `${profile.name}${this.BOT_NAME_SUFFIX}`

    return {
      ...profile,
      name: botName,
      isBot: true
    }
  }

  static addBotsUntilMinPlayers(game: Game): number {
    const missingPlayers = game.gameSettings.minPlayers - game.activePlayers.length
    if (missingPlayers <= 0) return 0

    const activePlayerIds = this.getActivePlayerIds(game)
    const availableSlots = PLAYER_IDS.filter(p => !activePlayerIds.includes(p))
    const botsToAdd = availableSlots.slice(0, missingPlayers)

    botsToAdd.forEach(playerId => {
      game.activePlayers.push(this.buildBotProfile(playerId))
    })

    return botsToAdd.length
  }

  static addSpecificBots(game: Game, botCount: number): number {
    const normalizedBotCount = Math.max(0, Math.floor(botCount))
    if (normalizedBotCount === 0) return 0

    const activePlayerIds = this.getActivePlayerIds(game)
    const availableSlots = PLAYER_IDS.filter(p => !activePlayerIds.includes(p))
    const botsToAdd = availableSlots.slice(0, normalizedBotCount)

    botsToAdd.forEach(playerId => {
      game.activePlayers.push(this.buildBotProfile(playerId))
    })

    return botsToAdd.length
  }

  private static applySkipCardReplacementBonus(game: Game, playerId: PlayerId): { awardedPoints: number; playerGameScore: number } {
    const awardedPoints = this.SKIP_CARD_REPLACEMENT_POINTS
    const playerScore = game.playerScores.find(ps => ps.playerId === playerId)

    if (playerScore) {
      playerScore.score += awardedPoints
      return { awardedPoints, playerGameScore: playerScore.score }
    }

    game.playerScores.push({ playerId, score: awardedPoints })
    return { awardedPoints, playerGameScore: awardedPoints }
  }

  static async createGame(gameName?: string, hostPlayerId?: PlayerId, hostUserId?: string, maxPlayers?: number, pointsToWin?: number) {
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
      activePlayers: [getDefaultPlayerProfile(hostPlayerId || 'player_1')],
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
      playerScores: [],
      gameSettings: {
        minPlayers: 2,
        maxPlayers: maxPlayers || 4,
        pointsToWin: pointsToWin || 300,
        reconnectionTimeoutMinutes: 3
      }
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
    playerScores: game.playerScores,
    winner: game.winner || null,
    playerConnectionStatus: {} as Record<string, string>,
    isPaused: game.isPaused || false,
    pauseReason: game.pauseReason || null
  };
  
  const activePlayerIds = this.getActivePlayerIds(game)

  // Agregar estado de conexión al publicState
  if (game.playerConnectionStatus) {
    activePlayerIds.forEach((playerId: PlayerId) => {
      publicState.playerConnectionStatus[playerId] = game.playerConnectionStatus!.get(playerId) || 'connected';
    });
  } else {
    // Si no existe, inicializar todos como conectados
    activePlayerIds.forEach((playerId: PlayerId) => {
      publicState.playerConnectionStatus[playerId] = 'connected';
    });
  }

  // Agregar las cartas públicas visibles al mapa
  const visibleCards = game.deck.filter((card: any) => 
    card.state === 'in_hand_visible' || card.state === 'in_trick'
  );
  
  visibleCards.forEach((card: any) => {
    publicState.publicCards[card.id] = card;
  });

  // Crear opponentsPublicInfo para todos los jugadores activos
  publicState.opponentsPublicInfo = activePlayerIds.map((activePlayerId: PlayerId) => {
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
    
    if (playerId && this.isPlayerActive(game, playerId)) {
      playerHand = game.deck.filter(
        (card: any) => card.owner === playerId && 
        (card.state === 'in_hand_visible' || card.state === 'in_hand_hidden')
      );
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
    if (this.isPlayerActive(game, existingPlayerId!)) {
      return { game, assignedPlayerId: existingPlayerId };
    }
    
    // Si no está en activePlayers (se desconectó), volver a agregarlo
    game.activePlayers.push(getDefaultPlayerProfile(existingPlayerId!));
    await game.save();
    return { game, assignedPlayerId: existingPlayerId };
  }
  
  // Nuevo jugador: verificar espacio disponible
  if (game.activePlayers.length >= game.gameSettings.maxPlayers) {
    throw new Error('Game is full');
  }
  
  const activePlayerIds = this.getActivePlayerIds(game)
  const availablePlayer = PLAYER_IDS.find(p => !activePlayerIds.includes(p));
  
  if (!availablePlayer) {
    throw new Error('No available player slots');
  }
  
  game.activePlayers.push(getDefaultPlayerProfile(availablePlayer));
  
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

    const botsAdded = this.addBotsUntilMinPlayers(game)
    if (botsAdded > 0) {
      console.log(`🤖 Added ${botsAdded} bot player(s) to reach min players before start`)
    }

    if (game.activePlayers.length < game.gameSettings.minPlayers) {
      throw new Error(`Need at least ${game.gameSettings.minPlayers} players to start`)
    }

    game.gamePhase = 'playing';
    const activePlayerIds = this.getActivePlayerIds(game)
    game.playerTurnOrder = [...activePlayerIds];
    // Inicializar playerScores con todos los jugadores activos
    game.playerScores = activePlayerIds.map(playerId => ({
      playerId,
      score: 0
    }));
    game.round.round = 0;
    game.round.roundPhase = 'round_setup';
    game.deck = shuffleDeck(game.deck);
    
    game.deck.forEach(card => {
      card.state = 'in_deck';
      card.owner = null;
    });
    
    // Inicializar estado de conexión para todos los jugadores activos
    game.playerConnectionStatus = new Map();
    activePlayerIds.forEach(playerId => {
      game.playerConnectionStatus!.set(playerId, 'connected');
    });
    game.isPaused = false;
    game.pauseReason = null;
    
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
  
  if (!this.isPlayerActive(game, playerId)) {
    console.error('❌ [leaveGame] Player not found in activePlayers!', {
      requestedPlayerId: playerId,
      activePlayers: game.activePlayers
    });
    throw new Error('Player is not in this game');
  }
  
  // Remover el jugador (ya no importa si es host o no)
  game.activePlayers = game.activePlayers.filter(p => p.id !== playerId);
  
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

  static async interruptGame(
    gameId: string,
    reason: 'player_left_game' | 'player_disconnect_timeout',
    affectedPlayerId: PlayerId
  ) {
    const game = await GameModel.findOne({ gameId });
    if (!game) throw new Error('Game not found');

    if (game.gamePhase === 'ended') {
      return {
        game,
        interrupted: false,
      };
    }

    game.gamePhase = 'ended';
    game.isPaused = false;
    game.pauseReason = null;
    game.winner = null;

    if (game.disconnectionTimestamps) {
      game.disconnectionTimestamps.clear();
    }

    await game.save();

    return {
      game,
      interrupted: true,
      interruptionPayload: {
        reason,
        playerId: affectedPlayerId,
      },
    };
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

    const { awardedPoints, playerGameScore } = this.applySkipCardReplacementBonus(game, playerId)
    
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
        nextPlayer,
        awardedPoints,
        playerGameScore
      );
      
      return { game: updatedGame, event, trickEvent };
    }
    
    await game.save();
    
    const event = createCardReplacementSkippedEvent(
      playerId,
      game.round.round,
      nextPlayer,
      awardedPoints,
      playerGameScore
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

  static async markPlayerDisconnected(gameId: string, playerId: PlayerId) {
    const game = await GameModel.findOne({ gameId });
    if (!game) throw new Error('Game not found');
    
    // Solo aplicar durante partida activa
    if (game.gamePhase !== 'playing') {
      return { game, shouldPause: false };
    }
    
    if (!game.playerConnectionStatus) {
      game.playerConnectionStatus = new Map();
    }
    if (!game.disconnectionTimestamps) {
      game.disconnectionTimestamps = new Map();
    }
    
    game.playerConnectionStatus.set(playerId, 'disconnected');
    game.disconnectionTimestamps.set(playerId, Date.now());
    
    // Pausar el juego automáticamente
    game.isPaused = true;
    game.pauseReason = 'player_disconnected';
    
    await game.save();
    
    return { game, shouldPause: true };
  }

  static async markPlayerReconnected(gameId: string, playerId: PlayerId) {
    const game = await GameModel.findOne({ gameId });
    if (!game) throw new Error('Game not found');
    
    if (!game.playerConnectionStatus) {
      game.playerConnectionStatus = new Map();
    }
    
    game.playerConnectionStatus.set(playerId, 'connected');
    
    if (game.disconnectionTimestamps) {
      game.disconnectionTimestamps.delete(playerId);
    }
    
    // Despausar si todos están conectados
    const allConnected = Array.from(game.playerConnectionStatus.values())
      .every(status => status === 'connected');
    
    if (allConnected) {
      game.isPaused = false;
      game.pauseReason = null;
    }
    
    await game.save();
    
    return { game, shouldResume: allConnected };
  }

  static async checkDisconnectionTimeouts(gameId: string) {
    const game = await GameModel.findOne({ gameId });
    if (!game) throw new Error('Game not found');
    
    const timeoutMs = game.gameSettings.reconnectionTimeoutMinutes * 60 * 1000;
    const now = Date.now();
    const timedOutPlayers: PlayerId[] = [];
    
    if (game.disconnectionTimestamps) {
      game.disconnectionTimestamps.forEach((timestamp, playerId) => {
        if (now - timestamp > timeoutMs) {
          timedOutPlayers.push(playerId);
        }
      });
    }
    
    return { game, timedOutPlayers };
  }

  static async updatePlayerProfile(
    gameId: string,
    playerId: PlayerId,
    updates: { name?: string; color?: string }
  ) {
    const game = await GameModel.findOne({ gameId })
    if (!game) throw new Error('Game not found')

    if (game.gamePhase !== 'setup') {
      throw new Error('Player profile can only be updated in setup phase')
    }

    const activePlayer = this.getActivePlayer(game, playerId)
    if (!activePlayer) {
      throw new Error('Player is not in this game')
    }

    const defaultProfile = getDefaultPlayerProfile(playerId)

    if (typeof updates.name === 'string') {
      const trimmedName = updates.name.trim()
      if (trimmedName.length > this.PLAYER_NAME_MAX_LENGTH) {
        throw new Error(`Name must be at most ${this.PLAYER_NAME_MAX_LENGTH} characters`)
      }
      activePlayer.name = trimmedName.length > 0 ? trimmedName : defaultProfile.name
    }

    if (typeof updates.color === 'string') {
      const nextColor = updates.color.trim()
      const allowedColors = getAvailablePlayerColors()
      if (!allowedColors.includes(nextColor)) {
        throw new Error('Color is not allowed')
      }

      const colorTakenByOtherPlayer = game.activePlayers.some(
        player => player.id !== playerId && player.color === nextColor
      )

      if (colorTakenByOtherPlayer) {
        throw new Error('Color already taken by another player')
      }

      activePlayer.color = nextColor
    }

    await game.save()

    return { game, updatedPlayer: activePlayer }
  }

  static async updatePointsToWin(gameId: string, hostPlayerId: PlayerId, pointsToWin: number) {
    const game = await GameModel.findOne({ gameId })
    if (!game) throw new Error('Game not found')

    if (game.gamePhase !== 'setup') {
      throw new Error('Game settings can only be updated in setup phase')
    }

    if (game.hostPlayer !== hostPlayerId) {
      throw new Error('Only the host can update game settings')
    }

    if (!Number.isFinite(pointsToWin) || pointsToWin <= 0) {
      throw new Error('pointsToWin must be a positive number')
    }

    game.gameSettings.pointsToWin = Math.floor(pointsToWin)
    await game.save()

    return game
  }
}