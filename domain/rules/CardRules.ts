import type { PlayingCard, LeadSuit, PlayerId, Trick, TrickNumber } from "../interfaces";

export type CardValidationResult = {
  valid: boolean;
  reason?: string;
};

export function canPlayCard(
    card: PlayingCard,
    playerId: PlayerId,
    playerTurn: PlayerId,
    playerHand: PlayingCard[],
    currentTrick: Trick,
    trickCardOwners?: Map<string, PlayerId>
  ): CardValidationResult {
    // 1. Verify card belongs to player
    if (card.owner !== playerId) {
      return { valid: false, reason: 'Card doesnt belong to player' }
    }
    // 2. Verify card is in player's hand
    const cardInHand = playerHand.find(c => c.id === card.id)
    if (!cardInHand) {
      return { valid: false, reason: 'Card not in player hand' }
    }
    // 3. Verify card is in correct state
    if (card.state !== 'in_hand_visible' && card.state !== 'in_hand_hidden') {
      return { valid: false, reason: 'Card not available to play' }
    }
    // 4. Check if trick is complete (max 4 cards)
    if (currentTrick.trick_state !== 'in_progress') {
      return { valid: false, reason: 'Trick is already complete' }
    }
    // 5. Check if it's your turn (playerTurn should match playerId)
    if (playerTurn !== playerId) {
      return { valid: false, reason: 'Not your turn to play a card' }
    }
    // 6. Check if player already played a card in this trick
    if (trickCardOwners) {
      const alreadyPlayed = currentTrick.cards.some(cardId => trickCardOwners.get(cardId) === playerId)
      if (alreadyPlayed) {
        return { valid: false, reason: 'You already played a card in this trick' }
      }
    }
    // 7. SPECIAL RULE: Berries S cannot be played as first card of first trick if you are lead player
    const isBerriesS = card.suit === 'berries' && card.char === 'S';
    const isFirstCardOfTrick = currentTrick.cards.length === 0;
    const isFirstTrick = currentTrick.trick_number === 1;
    const isLeadPlayer = currentTrick.lead_player === playerId;
    
    if (isBerriesS && isFirstCardOfTrick && isFirstTrick && isLeadPlayer) {
      return { valid: false, reason: 'Berries S cannot be played as first card of the first trick' }
    }
    
    return { valid: true }
  }

/**
 * Gets the effective rank of a card for trick evaluation.
 * For trump cards (flowers), uses base rank.
 * For non-trump cards, uses onSuit rank if following suit, otherwise base rank.
 */
export function getEffectiveRank(
  card: PlayingCard,
  leadSuit: LeadSuit | null,
  _trickNumber: TrickNumber
): number {
  // SPECIAL: Berries S (rank 40) has high rank when it leads ANY trick
  // In all other cases, it uses its base rank (1)
  if (card.rank.onSuit === 40) {
    // Use high rank whenever berries-S is the lead card (any trick)
    if (leadSuit === 'berries') {
      return card.rank.onSuit; // 40
    }
    return card.rank.base; // 1
  }
  // If it's trump (flowers), always use base rank
  if (card.suit === 'flowers') {
    return card.rank.base
  }
  // If it matches the lead suit and has an on-suit rank
  if (leadSuit && card.suit === leadSuit && card.rank.onSuit !== null) {
    return card.rank.onSuit
  }
  // Default case: use base rank
  return card.rank.base
}

/**
 * Compares two cards and return the winner
 */
export function compareCards(
    winning_card: PlayingCard,
    current_card: PlayingCard,
    trick_number: TrickNumber,
    leadSuit: LeadSuit | null
  ): PlayingCard {
    const currentCardRank = getEffectiveRank(current_card, leadSuit, trick_number);
    const winningCardRank = getEffectiveRank(winning_card, leadSuit, trick_number);

    // EXCEPTION: Flowers Q (rank 31) beats Berries S (rank 40) when Berries S leads
    if (currentCardRank === 31 && winningCardRank === 40) {
      return current_card as PlayingCard;
    }
    
    // Normal cases: higher rank wins
    const newWinningCard = winningCardRank >= currentCardRank ? winning_card : current_card;

    return newWinningCard as PlayingCard;
  }

