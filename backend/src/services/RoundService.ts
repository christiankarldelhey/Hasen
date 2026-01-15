import { GameModel } from '../models/Game.js'
import { shuffleDeck } from '@domain/rules/DeckRules.js'
import { shuffleBidDeck } from '@domain/rules/BidDeckRules'
import { createFirstCardDealtEvent } from '@domain/events/GameEvents.js'
import { createRoundSetupCompletedEvent } from '@domain/events/GameEvents.js'
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
    
    game.round.roundBids = {
      points: shuffledPoints[0] || null,
      set_collection: shuffledSetCollection[0] || null,
      trick: shuffledTricks[0] || null
    };

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
    
    // Simplemente llamar a startNewRound que ya hace todo:
    // - Incrementa round number
    // - Resetea roundScore
    // - Devuelve cartas al deck y hace shuffle
    // - Reparte 5 cartas a cada jugador
    // - Cambia fase a 'player_drawing'
    const result = await RoundService.startNewRound(gameId);
    
    console.log(`✅ Round ${result.game.round.round} started successfully`);
    
    return result;
  }

}