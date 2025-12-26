import { Character, Suit, CardPoints, NormalRank, LeadRank } from "../interfaces/types";

interface CardDefinition {
  char: Character
  suit: Suit
  points: CardPoints
  baseRank: NormalRank
  leadRank: LeadRank | null
}

export const CARD_DEFINITIONS: CardDefinition[] = [
  // ACORNS
  { char: '6', suit: 'acorns', points: 0, baseRank: 3, leadRank: 6 },
  { char: '7', suit: 'acorns', points: 0, baseRank: 3, leadRank: 7 },
  { char: '8', suit: 'acorns', points: 0, baseRank: 3, leadRank: 8 },
  { char: '9', suit: 'acorns', points: 0, baseRank: 3, leadRank: 9 },
  { char: '10', suit: 'acorns', points: 10, baseRank: 3, leadRank: 10 },
  { char: 'U', suit: 'acorns', points: 2, baseRank: 1, leadRank: 40 },  // Especial
  { char: 'O', suit: 'acorns', points: 3, baseRank: 3, leadRank: 20 },
  { char: 'K', suit: 'acorns', points: 4, baseRank: 3, leadRank: 21 },

  // LEAVES
  { char: '6', suit: 'leaves', points: 0, baseRank: 3, leadRank: 6 },
  { char: '7', suit: 'leaves', points: 0, baseRank: 3, leadRank: 7 },
  { char: '8', suit: 'leaves', points: 0, baseRank: 3, leadRank: 8 },
  { char: '9', suit: 'leaves', points: 0, baseRank: 3, leadRank: 9 },
  { char: '10', suit: 'leaves', points: 10, baseRank: 3, leadRank: 10 },
  { char: 'U', suit: 'leaves', points: 2, baseRank: 2, leadRank: 40 },  // Especial
  { char: 'O', suit: 'leaves', points: 3, baseRank: 3, leadRank: 20 },
  { char: 'K', suit: 'leaves', points: 4, baseRank: 3, leadRank: 21 },

  // BERRIES
  { char: '6', suit: 'berries', points: 0, baseRank: 3, leadRank: 6 },
  { char: '7', suit: 'berries', points: 0, baseRank: 3, leadRank: 7 },
  { char: '8', suit: 'berries', points: 0, baseRank: 3, leadRank: 8 },
  { char: '9', suit: 'berries', points: 0, baseRank: 3, leadRank: 9 },
  { char: '10', suit: 'berries', points: 10, baseRank: 3, leadRank: 10 },
  { char: 'U', suit: 'berries', points: 11, baseRank: 0, leadRank: 40 },  // MUY especial
  { char: 'O', suit: 'berries', points: 3, baseRank: 3, leadRank: 20 },
  { char: 'K', suit: 'berries', points: 4, baseRank: 3, leadRank: 21 },

  // FLOWERS (Trumps)
  { char: '7', suit: 'flowers', points: 0, baseRank: 11, leadRank: null },
  { char: '8', suit: 'flowers', points: 0, baseRank: 12, leadRank: null },
  { char: '9', suit: 'flowers', points: 0, baseRank: 13, leadRank: null },
  { char: '10', suit: 'flowers', points: 10, baseRank: 14, leadRank: null },
  { char: 'U', suit: 'flowers', points: 2, baseRank: 31, leadRank: null },  // Major trump
  { char: 'O', suit: 'flowers', points: 3, baseRank: 32, leadRank: null },
  { char: 'K', suit: 'flowers', points: 4, baseRank: 33, leadRank: null },
]