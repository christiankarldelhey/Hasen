import { GameModel } from '../models/Game.js'
import { createTrickStartedEvent, createCardPlayedEvent, createTrickCompletedEvent } from '@domain/events/GameEvents.js'
import type { PlayerId, Trick, TrickNumber, PlayingCard, LeadSuit } from '@domain/interfaces'
import { canPlayCard, compareCards } from '@domain/rules/CardRules.js'
import { determineLeadSuit, hasTrickEnded, determineTrickWinner, scoreCardsInTrick } from '@domain/rules/TrickRules.js'
import { randomUUID } from 'crypto'

export class TrickService {
  static updateRoundPlayerScore(game: any, winnerId: PlayerId, trickNumber: TrickNumber, trickScore: any) {
    // Inicializar roundScore si no existe
    if (!game.round.roundScore) {
      game.round.roundScore = [];
    }
    
    // Buscar el índice del score del jugador en round.roundScore
    const playerScoreIndex = game.round.roundScore.findIndex((ps: any) => ps.playerId === winnerId);
    
    if (playerScoreIndex === -1) {
      // Crear nuevo score para el jugador si no existe
      game.round.roundScore.push({
        playerId: winnerId,
        points: trickScore.trick_points,
        tricksWon: [trickNumber],
        setCollection: {
          acorns: trickScore.trick_collections?.acorns || 0,
          leaves: trickScore.trick_collections?.leaves || 0,
          berries: trickScore.trick_collections?.berries || 0,
          flowers: trickScore.trick_collections?.flowers || 0
        }
      });
    } else {
      // Actualizar score existente
      const playerScore = game.round.roundScore[playerScoreIndex];
      
      // Agregar el número del trick ganado
      playerScore.tricksWon.push(trickNumber);
      
      // Sumar los puntos
      playerScore.points += trickScore.trick_points;
      
      // Sumar las colecciones de suits
      if (trickScore.trick_collections) {
        playerScore.setCollection.acorns += trickScore.trick_collections.acorns || 0;
        playerScore.setCollection.leaves += trickScore.trick_collections.leaves || 0;
        playerScore.setCollection.berries += trickScore.trick_collections.berries || 0;
        playerScore.setCollection.flowers += trickScore.trick_collections.flowers || 0;
      }
    }
    
    // Marcar el array como modificado para que Mongoose persista los cambios
    game.markModified('round.roundScore');
    
    const playerScore = game.round.roundScore.find((ps: any) => ps.playerId === winnerId);
    console.log(`📊 Updated score for ${winnerId}: ${playerScore.points} points, ${playerScore.tricksWon.length} tricks won`);
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
    let trickCompletedEvent = null;
    
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
      
      // Obtener todas las cartas del trick
      const trickCards = currentTrick.cards
        .map(cardId => game.deck.find(c => c.id === cardId))
        .filter(c => c !== undefined) as PlayingCard[];
      
      // Calcular el score del trick
      const trickScore = scoreCardsInTrick(trickCards);
      
      // Actualizar el score del trick con el ganador
      currentTrick.score = {
        trick_winner: trickWinner,
        trick_points: trickScore.trick_points,
        trick_collections: trickScore.trick_collections
      };
      
      // Actualizar el score del jugador ganador en la ronda
      TrickService.updateRoundPlayerScore(game, trickWinner, currentTrick.trick_number, trickScore);
      
      console.log(`🏆 Trick ${currentTrick.trick_number} completed! Winner: ${trickWinner}, Points: ${trickScore.trick_points}`);
      
      // Crear evento TRICK_COMPLETED
      trickCompletedEvent = createTrickCompletedEvent(
        currentTrick.trick_number,
        trickWinner,
        trickScore.trick_points,
        trickCards
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
        score: {
          trick_winner: currentTrick.score.trick_winner,
          trick_points: currentTrick.score.trick_points,
          trick_collections: currentTrick.score.trick_collections
        }
      };
      
      game.tricksHistory.push(trickToSave);
      
      console.log(`📚 Trick ${currentTrick.trick_number} saved to tricksHistory`);
      
      // Resetear currentTrick
      game.round.currentTrick = null;
      
      // Verificar si debemos iniciar un nuevo trick (máximo 5 tricks por round)
      if (currentTrick.trick_number < 5) {
        // Iniciar nuevo trick con el ganador como lead_player
        const newTrickNumber = (currentTrick.trick_number + 1) as TrickNumber;
        
        const newTrick: Trick = {
          trick_id: randomUUID(),
          trick_state: 'in_progress',
          trick_number: newTrickNumber,
          lead_player: trickWinner,
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
        game.round.playerTurn = trickWinner;
        
        console.log(`🎯 New trick ${newTrickNumber} started with lead player: ${trickWinner}`);
      } else {
        // Todos los tricks completados, la ronda pasa a fase de scoring
        game.round.roundPhase = 'scoring';
        console.log(`🏁 All 5 tricks completed! Round ${game.round.round} moving to scoring phase`);
      }
      
      // No hay próximo jugador inmediato porque el trick terminó
      nextPlayer = null;
    } else {
      // NO avanzar el turno automáticamente
      // El jugador debe hacer click en "Finish Turn" para avanzar
      nextPlayer = null;
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
}
