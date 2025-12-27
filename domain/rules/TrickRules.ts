import { PlayingCard, LeadSuit, Trick, PlayerId, TrickScore, ActivePlayers } from "../interfaces";
import { compareCards } from "./CardRules";

// Orden de acciones en Trick
// Start new trick: Lo hace automatico el juego cuando termina el resolve de un trick y seguimos en la misma round
// Play card: Jugador coloca una carta en el trick
// Score card: El suit va al score de suit y los points se suman a los points
// PlayerTurn: Pasa el turno al proximo jugador
// Resolve trick: Se determina el ganador y se actualiza el estado del trick


/**
 * Generally the first card determines the lead suit of th trick except for the flowers.
 */
export function determineLeadSuit(firstCard: PlayingCard): LeadSuit | null {
    // Flowers don't establish lead suit
    if (firstCard.suit === 'flowers') {
      return null
    }
    
    return firstCard.suit as LeadSuit
}

/**
 * Calculates the total points and suit collection in a card to be added to the trickScore.
 */
export function scoreCardInTrick(card: PlayingCard): TrickScore {
  return {
    trick_winner: null,
    trick_points: card.points,
    trick_collections: {
      acorns: card.suit === 'acorns' ? 1 : 0,
      leaves: card.suit === 'leaves' ? 1 : 0,
      berries: card.suit === 'berries' ? 1 : 0,
      flowers: card.suit === 'flowers' ? 1 : 0
    }
  };
}

/**
 * Determines if last card of the game is placed, 
 * then the trick should pass to resolve and to determineTrickWinner.
 */
export function hasTrickEnded(trick: Trick, activePlayers: ActivePlayers): boolean {
  return trick.cards.length === activePlayers.length;
}


/**
 * Determines the winner of a trick.
 */
export function determineTrickWinner(trick: Trick, winning_card: PlayingCard, last_card: PlayingCard, leadSuit: LeadSuit | null): PlayerId {

    if (trick?.trick_state === 'resolve' && trick.winning_card) {
     // Find the winning card in the last trick
        const new_winning_card = compareCards(winning_card, last_card, trick.trick_number, leadSuit!);
        return new_winning_card.owner!;
    }
    throw new Error("Trick is not in resolve state or missing winning card");
  }
