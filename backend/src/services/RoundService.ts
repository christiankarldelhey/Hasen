import { GameModel } from '../models/Game.js'
import { shuffleDeck } from '@domain/rules/DeckRules.js'
import { shuffleBidDeck, updateBidsPool } from '@domain/rules/BidDeckRules'
import { createFirstCardDealtEvent } from '@domain/events/GameEvents.js'
import { createRoundSetupCompletedEvent } from '@domain/events/GameEvents.js'
import { createRoundEndedEvent } from '@domain/events/GameEvents.js'
import { getPlayerScoreFromRound } from '@domain/rules/BidRules.js'
import type { RoundPhase, Bid, PlayerId, PlayingCard } from '@domain/interfaces'


export class RoundService {
  static async startNewRound(gameId: string) {
    const game = await GameModel.findOne({ gameId });
    if (!game) throw new Error('Game not found');
    
    // 1. Incrementar ronda
    game.round.round += 1;
    
    // 2. Reset discard pile y roundScore (tricksHistory NO se resetea, es el historial del juego completo)
    game.discardPile = [];
    game.round.roundScore = [];
    
    // 3. Shuffle deck de cartas
    game.deck = shuffleDeck(game.deck);
    game.deck.forEach(card => {
      card.state = 'in_deck';
      card.owner = null;
    });
    
    // 3. Shuffle y repartir bids
    const shuffledSetCollection = shuffleBidDeck(game.bidDecks.setCollectionBidDeck);
    const shuffledPoints = shuffleBidDeck(game.bidDecks.pointsBidDeck);
    const shuffledTricks = shuffleBidDeck(game.bidDecks.tricksBidDeck);
    
    game.bidDecks.setCollectionBidDeck = shuffledSetCollection;
    game.bidDecks.pointsBidDeck = shuffledPoints;
    game.bidDecks.tricksBidDeck = shuffledTricks;
    
    const bidPool = updateBidsPool(shuffledSetCollection, shuffledPoints, shuffledTricks);
    game.round.roundBids = bidPool;

    // 4. Deal first card to each player (visible/público)
  const firstCards: { playerId: PlayerId; card: PlayingCard }[] = [];
  let cardIndex = 0;
  for (const playerId of game.activePlayers) {
    const card = game.deck[cardIndex];
    card.owner = playerId;
    card.state = 'in_hand_visible';
    firstCards.push({ playerId, card });
    cardIndex++;
  }
  // 5. Deal remaining 4 cards to each player (privado)
  const privateCards = new Map<PlayerId, PlayingCard[]>();
  for (const playerId of game.activePlayers) {
    const cards: PlayingCard[] = [];
    for (let i = 0; i < 4; i++) {
      const card = game.deck[cardIndex];
      card.owner = playerId;
      card.state = 'in_hand_hidden';
      cards.push(card);
      cardIndex++;
    }
    privateCards.set(playerId, cards);
  }
    
    
    
    // 6. Actualizar fase a player_drawing
    game.round.roundPhase = 'player_drawing';
    game.round.currentTrick = null;
    game.round.playerTurn = game.activePlayers[0];
    
    await game.save();
    
    console.log('backend: round setup completed with card dealing');
    
    // 7. Crear eventos
    const setupEvent = createRoundSetupCompletedEvent(
      game.round.round,
      game.deck.length,
      'player_drawing',
      game.activePlayers[0],
      null,
      game.round.roundBids
    );
    
    const firstCardsEvent = createFirstCardDealtEvent(
      game.round.round,
      firstCards
    );
    return { 
      game, 
      setupEvent,
      firstCardsEvent,
      privateCards
    };
  }

  static async updateRoundPhase(gameId: string, phase: RoundPhase) {
    console.log('updateRoundPhase', phase);
    const game = await GameModel.findOne({ gameId });
    if (!game) throw new Error('Game not found');
    
    game.round.roundPhase = phase;
    await game.save();
    
    return { game };
  }

  static async finishRoundAndStartNext(gameId: string) {
    console.log(`🏁 Finishing round and starting next for game ${gameId}`);
    
    const game = await GameModel.findOne({ gameId });
    if (!game) throw new Error('Game not found');

    // 1. CALCULAR SCORES DEL ROUND
    const roundScores: Partial<Record<PlayerId, number>> = {};
    
    for (const playerId of game.activePlayers) {
      const scoreFromRound = getPlayerScoreFromRound(game, playerId);
      roundScores[playerId] = scoreFromRound;
      
      // Actualizar playerScores acumulados
      const playerScore = game.playerScores.find(ps => ps.playerId === playerId);
      if (playerScore) {
        playerScore.score += scoreFromRound;
      } else {
        game.playerScores.push({ playerId, score: scoreFromRound });
      }
    }

    await game.save();
    
    console.log(`📊 Round ${game.round.round} scores calculated:`, roundScores);
    
    // 2. CREAR EVENTO ROUND_ENDED
    const roundEndedEvent = createRoundEndedEvent(game.round.round, roundScores as Record<PlayerId, number>);
    
    // 3. INICIAR NUEVO ROUND
    const result = await RoundService.startNewRound(gameId);
    
    console.log(`✅ Round ${result.game.round.round} started successfully`);
    
    return { 
      ...result,
      roundEndedEvent
    };
  }

}