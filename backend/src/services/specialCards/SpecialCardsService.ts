import type { PlayerId, Trick, TrickNumber, PlayingCard } from '@domain/interfaces';
import { createPickNextLeadEvent, createPickCardFromTrickEvent } from '@domain/events/GameEvents.js';
import { getHighestPrioritySpecialCard, type SpecialCardDetection } from '@domain/rules/SpecialCardRules.js';

/**
 * Servicio para manejar cartas especiales en el juego
 * 
 * Responsabilidades:
 * - Detectar cartas especiales jugadas en un trick (usa domain rules)
 * - Configurar acciones especiales pendientes en la DB
 * - Crear eventos para notificar al frontend
 * 
 * Cartas especiales soportadas:
 * - Berries U: Permite seleccionar el próximo jugador mano (PICK_NEXT_LEAD)
 * - Leaves U: Permite robar una carta del trick (STEAL_CARD)
 * 
 * Prioridad: STEAL_CARD > PICK_NEXT_LEAD (si ambas se juegan en el mismo trick)
 */
export class SpecialCardsService {
  /**
   * Detecta la carta especial de mayor prioridad en el trick
   * 
   * @param game - El objeto del juego (contiene el deck)
   * @param trick - El trick actual a analizar
   * @returns La carta especial detectada o null si no hay ninguna
   * 
   * @remarks
   * Usa las reglas de dominio (SpecialCardRules) para la detección.
   * Si hay múltiples cartas especiales, retorna la de mayor prioridad.
   */
  static detectSpecialCard(game: any, trick: Trick): SpecialCardDetection | null {
    const deck = game.deck as PlayingCard[];
    return getHighestPrioritySpecialCard(deck, trick);
  }

  /**
   * Configura la acción especial en el trick y actualiza el estado del juego
   * 
   * @param game - El objeto del juego (se modifica directamente)
   * @param trick - El trick actual (se modifica directamente)
   * @returns true si se configuró una acción especial, false si no hay cartas especiales
   * 
   * @remarks
   * Esta función modifica el estado del juego:
   * - Cambia trick.trick_state a 'awaiting_special_action'
   * - Configura trick.pendingSpecialAction con el tipo y jugador
   * - Actualiza game.round.playerTurn al jugador que debe hacer la selección
   * 
   * El caller debe guardar el juego después de llamar esta función.
   */
  static setupSpecialAction(game: any, trick: Trick): boolean {
    const specialCard = this.detectSpecialCard(game, trick);
    
    if (!specialCard) {
      return false;
    }
    
    // Cambiar estado del trick a awaiting_special_action
    trick.trick_state = 'awaiting_special_action';
    
    // Configurar la acción pendiente según el tipo
    trick.pendingSpecialAction = {
      type: specialCard.type,
      playerId: specialCard.playerId
    };
    
    // Actualizar el turno al jugador que debe hacer la selección
    game.round.playerTurn = specialCard.playerId;
    
    // Log del evento
    const emoji = specialCard.type === 'STEAL_CARD' ? '🍃' : '🫐';
    const action = specialCard.type === 'STEAL_CARD' ? 'card steal' : 'next lead';
    console.log(`${emoji} Special card played by ${specialCard.playerId}! Awaiting ${action} selection...`);
    
    return true;
  }

  /**
   * Crea el evento para solicitar selección del próximo jugador mano
   * 
   * @param playerId - El jugador que debe seleccionar
   * @param currentTrickNumber - Número del trick actual
   * @param activePlayers - Lista de jugadores activos disponibles para seleccionar
   * @returns Evento PICK_NEXT_LEAD para emitir al frontend
   */
  static createPickNextLeadEvent(playerId: PlayerId, currentTrickNumber: TrickNumber, activePlayers: PlayerId[]) {
    return createPickNextLeadEvent(playerId, currentTrickNumber, activePlayers);
  }

  /**
   * Crea el evento para solicitar selección de carta a robar
   * 
   * @param playerId - El jugador que debe seleccionar la carta
   * @param trickNumber - Número del trick actual
   * @param availableCards - IDs de las cartas disponibles para robar
   * @returns Evento PICK_CARD_FROM_TRICK para emitir al frontend
   */
  static createPickCardFromTrickEvent(playerId: PlayerId, trickNumber: TrickNumber, availableCards: string[]) {
    return createPickCardFromTrickEvent(playerId, trickNumber, availableCards);
  }
}
