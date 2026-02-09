import type { Character, Suit, CardPoints, NormalRank, LeadRank } from "../interfaces";

interface CardDefinition {
  char: Character
  suit: Suit
  points: CardPoints
  baseRank: NormalRank
  leadRank: LeadRank | null
}

export const CARD_DEFINITIONS: CardDefinition[] = [
  // ACORNS
  { char: '5', suit: 'acorns', points: 0, baseRank: 2, leadRank: 5 },
  { char: '6', suit: 'acorns', points: 0, baseRank: 3, leadRank: 6 },
  { char: '7', suit: 'acorns', points: 0, baseRank: 3, leadRank: 7 },
  { char: '8', suit: 'acorns', points: 0, baseRank: 3, leadRank: 8 },
  { char: '9', suit: 'acorns', points: 0, baseRank: 3, leadRank: 9 },
  { char: '10', suit: 'acorns', points: 10, baseRank: 3, leadRank: 10 },
  { char: 'S', suit: 'acorns', points: 0, baseRank: 0, leadRank: null },  // MUY especial - pierde siempre, solo elige próximo lead
  { char: 'U', suit: 'acorns', points: 3, baseRank: 3, leadRank: 20 },
  { char: 'O', suit: 'acorns', points: 4, baseRank: 3, leadRank: 21 },

  // LEAVES
  { char: '5', suit: 'leaves', points: 0, baseRank: 2, leadRank: 5 },
  { char: '6', suit: 'leaves', points: 0, baseRank: 3, leadRank: 6 },
  { char: '7', suit: 'leaves', points: 0, baseRank: 3, leadRank: 7 },
  { char: '8', suit: 'leaves', points: 0, baseRank: 3, leadRank: 8 },
  { char: '9', suit: 'leaves', points: 0, baseRank: 3, leadRank: 9 },
  { char: '10', suit: 'leaves', points: 10, baseRank: 3, leadRank: 10 },
  { char: 'S', suit: 'leaves', points: 0, baseRank: 0, leadRank: null},  // Especial - pierde siempre, roba carta
  { char: 'U', suit: 'leaves', points: 3, baseRank: 3, leadRank: 20 },
  { char: 'O', suit: 'leaves', points: 4, baseRank: 3, leadRank: 21 },

  // BERRIES
  { char: '5', suit: 'berries', points: 0, baseRank: 2, leadRank: 5 },
  { char: '6', suit: 'berries', points: 0, baseRank: 3, leadRank: 6 },
  { char: '7', suit: 'berries', points: 0, baseRank: 3, leadRank: 7 },
  { char: '8', suit: 'berries', points: 0, baseRank: 3, leadRank: 8 },
  { char: '9', suit: 'berries', points: 0, baseRank: 3, leadRank: 9 },
  { char: '10', suit: 'berries', points: 10, baseRank: 3, leadRank: 10 },
  { char: 'S', suit: 'berries', points: 0, baseRank: 1, leadRank: 40 },  // Especial - gana casi todo cuando se juega primero
  { char: 'U', suit: 'berries', points: 3, baseRank: 3, leadRank: 20 },
  { char: 'O', suit: 'berries', points: 4, baseRank: 3, leadRank: 21 },

  // FLOWERS (Trumps)
  { char: '1', suit: 'flowers', points: 1, baseRank: 11, leadRank: null },
  { char: '2', suit: 'flowers', points: 2, baseRank: 12, leadRank: null },
  { char: '3', suit: 'flowers', points: 3, baseRank: 13, leadRank: null },
  { char: '4', suit: 'flowers', points: 4, baseRank: 14, leadRank: null },
  { char: '5', suit: 'flowers', points: 5, baseRank: 15, leadRank: null },
  { char: 'Q', suit: 'flowers', points: 0, baseRank: 31, leadRank: null },  // Special trump
  { char: 'K', suit: 'flowers', points: 11, baseRank: 32, leadRank: null },
  { char: 'A', suit: 'flowers', points: 12, baseRank: 33, leadRank: null },
]