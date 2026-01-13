import type { PlayingCard, PlayerId, Round } from "../interfaces";

export type CardReplacementValidationResult = {
  valid: boolean;
  reason?: string;
};

export function canSkipCardReplacement(
  playerId: PlayerId,
  round: Round
): CardReplacementValidationResult {
  if (round.roundPhase !== 'player_drawing') {
    return { valid: false, reason: 'Not in player_drawing phase' }
  }
  
  if (round.playerTurn !== playerId) {
    return { valid: false, reason: 'Not your turn' }
  }
  
  return { valid: true }
}

export function canReplaceCard(
  playerId: PlayerId,
  cardId: string,
  playerHand: PlayingCard[],
  round: Round,
  deckSize: number
): CardReplacementValidationResult {
  if (round.roundPhase !== 'player_drawing') {
    return { valid: false, reason: 'Not in player_drawing phase' }
  }
  
  if (round.playerTurn !== playerId) {
    return { valid: false, reason: 'Not your turn' }
  }
  
  if (deckSize === 0) {
    return { valid: false, reason: 'No cards left in deck' }
  }
  
  const card = playerHand.find(c => c.id === cardId)
  if (!card) {
    return { valid: false, reason: 'Card not in player hand' }
  }
  
  if (card.owner !== playerId) {
    return { valid: false, reason: 'Card does not belong to player' }
  }
  
  if (card.state !== 'in_hand_hidden') {
    return { valid: false, reason: 'Can only replace hidden cards' }
  }
  
  return { valid: true }
}

export function canAdvanceFromPlayerDrawing(
  currentPlayerIndex: number,
  totalPlayers: number
): boolean {
  return currentPlayerIndex === 0
}
