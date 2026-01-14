import { GameModel } from '../models/Game.js'
import { createTrickStartedEvent, createCardPlayedEvent } from '@domain/events/GameEvents.js'
import type { PlayerId, Trick, TrickNumber, PlayingCard, LeadSuit } from '@domain/interfaces'
import { canPlayCard, compareCards } from '@domain/rules/CardRules.js'
import { determineLeadSuit, hasTrickEnded, determineTrickWinner } from '@domain/rules/TrickRules.js'
import { randomUUID } from 'crypto'

export class TrickService {
  static async startTrick(gameId: string, leadPlayer?: PlayerId) {
    const game = await GameModel.findOne({ gameId });
    if (!game) throw new Error('Game not found');
    
    if (game.round.roundPhase !== 'playing') {
      throw new Error('Cannot start trick: round phase must be "playing"');
    }
    
    const currentTrickNumber = game.round.currentTrick 
      ? (game.round.currentTrick.trick_number + 1) as TrickNumber
      : 1;
    
    if (currentTrickNumber > 5) {
      throw new Error('Cannot start trick: maximum 5 tricks per round');
    }
    
    const determinedLeadPlayer = leadPlayer || game.playerTurnOrder[0];
    
    const newTrick: Trick = {
      trick_id: randomUUID(),
      trick_state: 'in_progress',
      trick_number: currentTrickNumber,
      lead_player: determinedLeadPlayer,
      winning_card: null,
      lead_suit: null,
      cards: [],
      score: {
        trick_winner: null,
        trick_points: 0,
        trick_collections: null
      }
    };
    
    game.round.currentTrick = newTrick;
    game.round.playerTurn = determinedLeadPlayer;
    
    await game.save();
    
    console.log(`✅ Trick ${currentTrickNumber} started with lead player: ${determinedLeadPlayer}`);
    
    const event = createTrickStartedEvent(
      newTrick.trick_id,
      currentTrickNumber,
      determinedLeadPlayer
    );
    
    return { game, event };
  }

  static async playCard(gameId: string, playerId: PlayerId, cardId: string) {
    const game = await GameModel.findOne({ gameId });
    if (!game) throw new Error('Game not found');

    const currentTrick = game.round.currentTrick;
    if (!currentTrick) throw new Error('No active trick');

    // TODO: Aquí irán validaciones adicionales y lógica de negocio
    // Por ahora implementamos lo básico

    // Encontrar la carta en el deck del juego
    const card = game.deck.find(c => c.id === cardId);
    if (!card) throw new Error('Card not found in deck');

    // Obtener la mano del jugador
    const playerHand = game.deck.filter(c => c.owner === playerId && (c.state === 'in_hand_visible' || c.state === 'in_hand_hidden'));

    // Validar si el jugador puede jugar la carta usando la rule
    const validation = canPlayCard(
      card as PlayingCard,
      playerId,
      game.round.playerTurn!,
      playerHand as PlayingCard[],
      currentTrick
    );

    if (!validation.valid) {
      throw new Error(`Cannot play card: ${validation.reason}`);
    }

    // Actualizar el estado de la carta a 'in_trick'
    card.state = 'in_trick';

    // Agregar la carta al array de cards del trick
    currentTrick.cards.push(cardId);

    // Determinar lead_suit si es la primera carta y no hay lead_suit
    if (!currentTrick.lead_suit && currentTrick.cards.length === 1) {
      currentTrick.lead_suit = determineLeadSuit(card as PlayingCard);
    }

    // Actualizar winning_card
    if (!currentTrick.winning_card) {
      // Primera carta, se auto-adjudica como winning card
      currentTrick.winning_card = cardId;
    } else {
      // Comparar con la winning card actual
      const winningCard = game.deck.find(c => c.id === currentTrick.winning_card);
      if (!winningCard) throw new Error('Winning card not found');

      const newWinningCard = compareCards(
        winningCard as PlayingCard,
        card as PlayingCard,
        currentTrick.trick_number,
        currentTrick.lead_suit as LeadSuit | null
      );

      currentTrick.winning_card = newWinningCard.id;
    }

    // Verificar si el trick está completo (todos los jugadores jugaron)
    const trickIsComplete = hasTrickEnded(currentTrick, game.activePlayers);
    
    let nextPlayer: PlayerId | null = null;
    
    if (trickIsComplete) {
      // Cambiar estado del trick a 'resolve'
      currentTrick.trick_state = 'resolve';
      
      // Determinar el ganador del trick
      const winningCardObj = game.deck.find(c => c.id === currentTrick.winning_card);
      if (!winningCardObj) throw new Error('Winning card not found');
      
      const trickWinner = determineTrickWinner(
        currentTrick,
        winningCardObj as PlayingCard,
        card as PlayingCard,
        currentTrick.lead_suit
      );
      
      currentTrick.score.trick_winner = trickWinner;
      
      console.log(`🏆 Trick ${currentTrick.trick_number} completed! Winner: ${trickWinner}`);
      
      // No hay próximo jugador porque el trick terminó
      nextPlayer = null;
    } else {
      // Determinar el próximo jugador
      const currentPlayerIndex = game.playerTurnOrder.indexOf(playerId);
      const nextPlayerIndex = (currentPlayerIndex + 1) % game.playerTurnOrder.length;
      nextPlayer = game.playerTurnOrder[nextPlayerIndex];
      
      // Actualizar el turno del jugador
      game.round.playerTurn = nextPlayer;
    }

    await game.save();

    console.log(`✅ Card ${cardId} played by ${playerId} in trick ${currentTrick.trick_number}`);

    const event = createCardPlayedEvent(
      currentTrick.trick_id,
      playerId,
      card as PlayingCard,
      currentTrick.trick_number,
      nextPlayer
    );

    return { game, event };
  }
}
