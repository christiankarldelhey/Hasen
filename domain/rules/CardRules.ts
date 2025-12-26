import { PlayingCard, LeadSuit } from "../interfaces/types";

/**
 * Gets the effective rank of a card for trick evaluation.
 * For trump cards (flowers), uses base rank.
 * For non-trump cards, uses onSuit rank if following suit, otherwise base rank.
 */

export function getEffectiveRank(
  card: PlayingCard,
  leadSuit: LeadSuit | null
): number {
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