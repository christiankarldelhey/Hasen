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
    
    // 2. Shuffle deck de cartas
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
      points: [shuffledPoints[0], shuffledPoints[1]] as [Bid, Bid],
      set_collection: [shuffledSetCollection[0], shuffledSetCollection[1]] as [Bid, Bid],
      trick: [shuffledTricks[0], shuffledTricks[1]] as [Bid, Bid]
    };
    
    // 4. Deal first card to each player (visible/público)
    const firstCards: { playerId: PlayerId; card: PlayingCard }[] = [];
    for (const playerId of game.activePlayers) {
      const card = game.deck.shift()!;
      card.owner = playerId;
      card.state = 'in_hand_visible'; // Visible para todos
      firstCards.push({ playerId, card });
    }
    
    // 5. Deal remaining 4 cards to each player (privado)
    const privateCards = new Map<PlayerId, PlayingCard[]>();
    for (const playerId of game.activePlayers) {
      const cards: PlayingCard[] = [];
      for (let i = 0; i < 4; i++) {
        const card = game.deck.shift()!;
        card.owner = playerId;
        card.state = 'in_hand_hidden'; // Privado
        cards.push(card);
      }
      privateCards.set(playerId, cards);
    }
    
    // 6. Actualizar fase a player_drawing
    game.round.roundPhase = 'player_drawing';
    game.round.currentTrick = null;
    
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

}