import type { PlayingCard, Trick, PlayerId } from '../interfaces';

/**
 * Tipos de cartas especiales en el juego
 */
export type SpecialCardType = 'PICK_NEXT_LEAD' | 'STEAL_CARD';

/**
 * Resultado de la detección de una carta especial
 */
export interface SpecialCardDetection {
  type: SpecialCardType;
  playerId: PlayerId;
  cardId: string;
}

/**
 * Verifica si una carta es "Pick Next Lead" (Acorns S)
 */
export function isPickNextLeadCard(card: PlayingCard): boolean {
  return card.suit === 'acorns' && card.char === 'S';
}

/**
 * Verifica si una carta es "Steal Card" (Leaves S)
 */
export function isStealCardCard(card: PlayingCard): boolean {
  return card.suit === 'leaves' && card.char === 'S';
}

/**
 * Verifica si una carta es especial
 */
export function isSpecialCard(card: PlayingCard): boolean {
  return isPickNextLeadCard(card) || isStealCardCard(card);
}

/**
 * Detecta si se jugó la carta "Pick Next Lead" en el trick
 */
export function detectPickNextLeadCard(deck: PlayingCard[], trick: Trick): SpecialCardDetection | null {
  const card = trick.cards
    .map(cardId => deck.find(c => c.id === cardId))
    .find(card => card && isPickNextLeadCard(card as PlayingCard));
  
  if (card) {
    return {
      type: 'PICK_NEXT_LEAD',
      playerId: card.owner as PlayerId,
      cardId: card.id
    };
  }
  
  return null;
}

/**
 * Detecta si se jugó la carta "Steal Card" en el trick
 */
export function detectStealCard(deck: PlayingCard[], trick: Trick): SpecialCardDetection | null {
  const card = trick.cards
    .map(cardId => deck.find(c => c.id === cardId))
    .find(card => card && isStealCardCard(card as PlayingCard));
  
  if (card) {
    return {
      type: 'STEAL_CARD',
      playerId: card.owner as PlayerId,
      cardId: card.id
    };
  }
  
  return null;
}

/**
 * Detecta todas las cartas especiales jugadas en el trick
 * Retorna un array ordenado por prioridad (STEAL_CARD tiene prioridad sobre PICK_NEXT_LEAD)
 */
export function detectSpecialCards(deck: PlayingCard[], trick: Trick): SpecialCardDetection[] {
  const detections: SpecialCardDetection[] = [];
  
  const pickNextLead = detectPickNextLeadCard(deck, trick);
  if (pickNextLead) {
    detections.push(pickNextLead);
  }
  
  const stealCard = detectStealCard(deck, trick);
  if (stealCard) {
    detections.push(stealCard);
  }
  
  return detections;
}

/**
 * Obtiene la carta especial de mayor prioridad
 * STEAL_CARD tiene prioridad sobre PICK_NEXT_LEAD
 */
export function getHighestPrioritySpecialCard(deck: PlayingCard[], trick: Trick): SpecialCardDetection | null {
  const stealCard = detectStealCard(deck, trick);
  if (stealCard) {
    return stealCard;
  }
  
  const pickNextLead = detectPickNextLeadCard(deck, trick);
  if (pickNextLead) {
    return pickNextLead;
  }
  
  return null;
}

/**
 * Valida si un jugador puede seleccionar el próximo lead
 */
export function canSelectNextLead(
  _playerId: PlayerId,
  selectedLeadPlayer: PlayerId,
  activePlayers: PlayerId[]
): { valid: boolean; reason?: string } {
  if (!activePlayers.includes(selectedLeadPlayer)) {
    return { valid: false, reason: 'Selected player is not in the game' };
  }
  
  return { valid: true };
}

/**
 * Valida si un jugador puede robar una carta del trick
 */
export function canStealCard(
  _playerId: PlayerId,
  cardId: string,
  trickCards: string[]
): { valid: boolean; reason?: string } {
  if (!trickCards.includes(cardId)) {
    return { valid: false, reason: 'Selected card is not in the trick' };
  }
  
  return { valid: true };
}
