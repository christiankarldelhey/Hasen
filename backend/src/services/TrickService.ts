import { GameModel } from '../models/Game.js'
import { createTrickStartedEvent, createCardPlayedEvent, createTrickCompletedEvent } from '@domain/events/GameEvents.js'
import type { PlayerId, Trick, TrickNumber, PlayingCard, LeadSuit } from '@domain/interfaces'
import { canPlayCard, compareCards } from '@domain/rules/CardRules.js'
import { determineLeadSuit, hasTrickEnded, determineTrickWinner } from '@domain/rules/TrickRules.js'
import { randomUUID } from 'crypto'
import { SpecialCardsService } from './specialCards/SpecialCardsService.js';
import { TrickScoreService } from './TrickScoreService.js'

export class TrickService {
  /**
   * Obtiene los eventos de special cards que deben emitirse según el estado del trick
   * Retorna null si no hay eventos de special cards pendientes
   */
  static getSpecialCardEvents(game: any, trick: Trick) {
    if (trick.trick_state !== 'awaiting_special_action' || !trick.pendingSpecialAction) {
      return null;
    }

    const action = trick.pendingSpecialAction;

    if (action.type === 'PICK_NEXT_LEAD') {
      return SpecialCardsService.createPickNextLeadEvent(
        action.playerId,
        trick.trick_number,
        game.activePlayers
      );
    } else if (action.type === 'STEAL_CARD') {
      return SpecialCardsService.createPickCardFromTrickEvent(
        action.playerId,
        trick.trick_number,
        trick.cards
      );
    }

    return null;
  }

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
    
    // Usar el playerTurn actual del round como lead player por defecto
    // Esto respeta la rotación del lead player entre rounds
    const determinedLeadPlayer = leadPlayer || game.round.playerTurn || game.playerTurnOrder[0];
    
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
    if (!currentTrick.lead_suit) {
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
    let trickCompletedEvent = null;
    
    if (trickIsComplete) {
      // Detectar y configurar acción especial si existe
      const hasSpecialAction = SpecialCardsService.setupSpecialAction(game, currentTrick);
      
      if (hasSpecialAction) {
        await game.save();
        
        // Crear evento de carta jugada para retornar
        const cardPlayedEvent = createCardPlayedEvent(
          currentTrick.trick_id,
          playerId,
          card as PlayingCard,
          currentTrick.trick_number,
          null // No hay próximo jugador, esperamos acción especial
        );
        
        // NO calcular ganador ni score todavía, esperar la acción especial
        return { game, event: cardPlayedEvent, trickCompletedEvent: null };
      }
      
      // No hay carta especial, proceder normalmente
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
      
      // Guardar solo el ganador, el score se calculará en finishTrick
      currentTrick.score = {
        trick_winner: trickWinner,
        trick_points: 0, // Se calculará en finishTrick
        trick_collections: null
      };
      
      console.log(`🏆 Trick ${currentTrick.trick_number} completed! Winner: ${trickWinner}. Score will be calculated in finishTrick.`);
      
      // Obtener todas las cartas del trick para el evento
      const trickCards = currentTrick.cards
        .map(cardId => game.deck.find(c => c.id === cardId))
        .filter(c => c !== undefined) as PlayingCard[];
      
      // Crear evento TRICK_COMPLETED (sin score, solo para notificar al frontend)
      trickCompletedEvent = createTrickCompletedEvent(
        currentTrick.trick_number,
        trickWinner,
        currentTrick.winning_card || '',
        0, // Score será calculado en finishTrick
        trickCards,
        null // Collections serán calculadas en finishTrick
      );
      
      // NO cambiar el estado de las cartas todavía - se mantendrán en 'in_trick'
      // hasta que el jugador presione "Finish Trick"
      
      // NO mover el trick a history ni iniciar nuevo trick aquí
      // Eso se hará cuando el jugador haga click en "Finish Trick"
      
      // No hay próximo jugador inmediato porque el trick terminó
      nextPlayer = null;
    } else {
      // Calcular el siguiente jugador para el evento, pero NO actualizar playerTurn
      // El jugador debe hacer click en "Finish Turn" para avanzar (puede hacer bids primero)
      const currentPlayerIndex = game.playerTurnOrder.indexOf(playerId);
      const nextPlayerIndex = (currentPlayerIndex + 1) % game.playerTurnOrder.length;
      nextPlayer = game.playerTurnOrder[nextPlayerIndex];
    }

    await game.save();

    console.log(`✅ Card ${cardId} played by ${playerId} in trick ${currentTrick.trick_number}`);

    const cardPlayedEvent = createCardPlayedEvent(
      currentTrick.trick_id,
      playerId,
      card as PlayingCard,
      currentTrick.trick_number,
      nextPlayer
    );

    return { game, event: cardPlayedEvent, trickCompletedEvent };
  }

  static async saveSpecialCardSelection(gameId: string, playerId: PlayerId, selection: { nextLead?: PlayerId; cardToSteal?: string }) {
    const game = await GameModel.findOne({ gameId });
    if (!game) throw new Error('Game not found');

    const currentTrick = game.round.currentTrick;
    if (!currentTrick) throw new Error('No active trick');

    if (currentTrick.trick_state !== 'awaiting_special_action') {
      throw new Error('Trick is not awaiting special action');
    }

    if (!currentTrick.pendingSpecialAction) {
      throw new Error('No pending special action');
    }

    if (currentTrick.pendingSpecialAction.playerId !== playerId) {
      throw new Error('Only the player who played the special card can make this selection');
    }

    // Guardar la selección según el tipo
    if (selection.nextLead && currentTrick.pendingSpecialAction.type === 'PICK_NEXT_LEAD') {
      if (!game.activePlayers.includes(selection.nextLead)) {
        throw new Error('Selected player is not in the game');
      }
      currentTrick.pendingSpecialAction.selectedNextLead = selection.nextLead;
      console.log(`🫐 Player ${playerId} selected ${selection.nextLead} as next lead`);
    } else if (selection.cardToSteal && currentTrick.pendingSpecialAction.type === 'STEAL_CARD') {
      if (!currentTrick.cards.includes(selection.cardToSteal)) {
        throw new Error('Selected card is not in the trick');
      }
      currentTrick.pendingSpecialAction.selectedCardToSteal = selection.cardToSteal;
      console.log(`🍃 Player ${playerId} selected card ${selection.cardToSteal} to steal`);
    } else {
      throw new Error('Invalid selection for pending special action type');
    }

    // Determinar el ganador del trick
    const winningCardObj = game.deck.find(c => c.id === currentTrick.winning_card);
    if (!winningCardObj) throw new Error('Winning card not found');
    
    const trickWinner = winningCardObj.owner as PlayerId;
    
    // Si hay carta para robar, NO calcular score todavía
    // El score se calculará en finishTrick DESPUÉS de procesar el robo
    let trickCompletedEvent = null;
    
    if (selection.cardToSteal) {
      // Solo guardar el ganador, score se calculará después del robo
      currentTrick.score = {
        trick_winner: trickWinner,
        trick_points: 0, // Se calculará en finishTrick
        trick_collections: null
      };
      
      console.log(`🍃 Card steal selection saved. Winner: ${trickWinner}. Score will be calculated in finishTrick after processing the steal.`);
    } else {
      // No hay robo (PICK_NEXT_LEAD), guardar ganador solamente
      // El score se calculará en finishTrick para evitar doble cálculo
      currentTrick.score = {
        trick_winner: trickWinner,
        trick_points: 0, // Se calculará en finishTrick
        trick_collections: null
      };
      
      console.log(`🫐 Trick ${currentTrick.trick_number} next lead selected. Winner: ${trickWinner}. Score will be calculated in finishTrick.`);
    }
    
    // Cambiar estado a 'resolve' para permitir finishTrick
    currentTrick.trick_state = 'resolve';

    // Marcar pendingSpecialAction como modificado para que Mongoose persista los cambios
    // (necesario porque es un campo Schema.Types.Mixed)
    game.markModified('round.currentTrick.pendingSpecialAction');

    await game.save();

    return { game, trickCompletedEvent };
  }

  static async finishTurn(gameId: string, playerId: PlayerId) {
    const game = await GameModel.findOne({ gameId });
    if (!game) throw new Error('Game not found');

    const currentTrick = game.round.currentTrick;
    if (!currentTrick) throw new Error('No active trick');

    if (game.round.playerTurn !== playerId) {
      throw new Error('Not your turn');
    }

    if (currentTrick.trick_state !== 'in_progress') {
      throw new Error('Trick is not in progress');
    }

    const playerHasPlayedCard = currentTrick.cards.some(cardId => {
      const card = game.deck.find(c => c.id === cardId);
      return card && card.owner === playerId;
    });

    if (!playerHasPlayedCard) {
      throw new Error('You must play a card before finishing your turn');
    }

    const currentPlayerIndex = game.playerTurnOrder.indexOf(playerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % game.playerTurnOrder.length;
    const nextPlayer = game.playerTurnOrder[nextPlayerIndex];

    game.round.playerTurn = nextPlayer;

    await game.save();

    console.log(`✅ Player ${playerId} finished turn, next player: ${nextPlayer}`);

    return { game, nextPlayer };
  }

  static async finishTrick(gameId: string) {
    const game = await GameModel.findOne({ gameId });
    if (!game) throw new Error('Game not found');

    const currentTrick = game.round.currentTrick;
    if (!currentTrick) throw new Error('No active trick');

    if (currentTrick.trick_state !== 'resolve') {
      throw new Error('Trick is not in resolve state');
    }

    const trickWinner = currentTrick.score.trick_winner;
    if (!trickWinner) throw new Error('Trick winner not determined');

    // Procesar carta robada si existe
    let stolenCardId: string | null = null;
    let stolenCard: PlayingCard | null = null;
    let thiefId: PlayerId | null = null;
    
    if (currentTrick.pendingSpecialAction?.selectedCardToSteal) {
      stolenCardId = currentTrick.pendingSpecialAction.selectedCardToSteal;
      const card = game.deck.find(c => c.id === stolenCardId);
      
      if (card) {
        stolenCard = card as PlayingCard;
        thiefId = currentTrick.pendingSpecialAction.playerId;
        
        // Cambiar owner de la carta robada
        stolenCard.owner = thiefId;
        stolenCard.state = 'in_finished_trick';
        
        // Guardar en stolenCards del trick
        currentTrick.stolenCards = [stolenCardId];
        
        // REMOVER la carta robada del array de cartas del trick
        currentTrick.cards = currentTrick.cards.filter(id => id !== stolenCardId);
        
        console.log(`🍃 Card ${stolenCardId} stolen by ${thiefId}, removed from trick cards`);
      }
    }

    // Calcular score del trick con las cartas correctas (sin la robada si aplica)
    const trickCards = currentTrick.cards
      .map(cardId => game.deck.find(c => c.id === cardId))
      .filter(c => c !== undefined) as PlayingCard[];
    
    const trickScore = TrickScoreService.calculateAndUpdateTrickScore(
      game,
      trickWinner,
      trickCards,
      currentTrick.trick_number
    );
    
    // Actualizar el score del trick con el ganador
    currentTrick.score = {
      trick_winner: trickWinner,
      trick_points: trickScore.trick_points,
      trick_collections: trickScore.trick_collections
    };
    
    console.log(`🏆 Trick ${currentTrick.trick_number} winner: ${trickWinner}, Points: ${trickScore.trick_points}`);
    
    // Si hubo robo, calcular score del ladrón con la carta robada
    let stolenCardInfo = undefined;
    if (stolenCard && thiefId) {
      const stolenScore = TrickScoreService.calculateAndUpdateTrickScore(
        game,
        thiefId,
        [stolenCard],
        currentTrick.trick_number,
        false // No agregar el trick a tricksWon para el ladrón
      );
      
      stolenCardInfo = {
        thiefId,
        stolenCardId: stolenCard.id,
        stolenCard,
        points: stolenScore.trick_points,
        collections: stolenScore.trick_collections!
      };
      
      console.log(`🍃 Thief ${thiefId} scored ${stolenScore.trick_points} points from stolen card`);
    }

    // Crear evento TRICK_COMPLETED con el score correcto (después del robo)
    const trickCompletedEvent = createTrickCompletedEvent(
      currentTrick.trick_number,
      trickWinner,
      currentTrick.winning_card || '',
      currentTrick.score.trick_points,
      trickCards,
      currentTrick.score.trick_collections,
      stolenCardInfo
    );

    // Cambiar estado de las cartas del trick a 'in_finished_trick'
    trickCards.forEach(trickCard => {
      const deckCard = game.deck.find((c: any) => c.id === trickCard.id);
      if (deckCard) {
        deckCard.state = 'in_finished_trick';
      }
    });

    // Guardar el trick completado en tricksHistory
    if (!game.tricksHistory) {
      game.tricksHistory = [];
    }

    // Cambiar estado del trick a 'ended' antes de guardarlo
    currentTrick.trick_state = 'ended';

    // Crear una copia plana del trick para guardar en history
    const trickToSave = {
      trick_id: currentTrick.trick_id,
      trick_state: currentTrick.trick_state,
      trick_number: currentTrick.trick_number,
      lead_player: currentTrick.lead_player,
      winning_card: currentTrick.winning_card,
      lead_suit: currentTrick.lead_suit,
      cards: [...currentTrick.cards],
      stolenCards: currentTrick.stolenCards || [],
      pendingSpecialAction: currentTrick.pendingSpecialAction,
      score: {
        trick_winner: currentTrick.score.trick_winner,
        trick_points: currentTrick.score.trick_points,
        trick_collections: currentTrick.score.trick_collections
      }
    };

    game.tricksHistory.push(trickToSave);

    console.log(`📚 Trick ${currentTrick.trick_number} saved to tricksHistory`);

    // Determinar el lead player del próximo trick
    let nextLeadPlayer = trickWinner;
    if (currentTrick.pendingSpecialAction?.selectedNextLead) {
      nextLeadPlayer = currentTrick.pendingSpecialAction.selectedNextLead;
      console.log(`🫐 Next lead player selected: ${nextLeadPlayer}`);
    }

    // Resetear currentTrick
    game.round.currentTrick = null;
    
    // Verificar si debemos iniciar un nuevo trick (máximo 5 tricks por round)
    if (currentTrick.trick_number < 5) {
      const newTrickNumber = (currentTrick.trick_number + 1) as TrickNumber;
      
      // Iniciar nuevo trick con el lead player determinado
      const newTrick: Trick = {
        trick_id: randomUUID(),
        trick_state: 'in_progress',
        trick_number: newTrickNumber,
        lead_player: nextLeadPlayer,
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
      game.round.playerTurn = nextLeadPlayer;

      console.log(`🎯 New trick ${newTrickNumber} started with lead player: ${nextLeadPlayer}`);
    } else {
      // Todos los tricks completados, la ronda pasa a fase de scoring
      game.round.roundPhase = 'scoring';
      console.log(`🏁 All 5 tricks completed! Round ${game.round.round} moving to scoring phase`);
    }

    await game.save();

    console.log(`✅ Trick finished, moving to next trick or scoring phase`);

    return { game, trickCompletedEvent };
  }

}
