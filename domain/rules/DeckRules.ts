import { CARD_DEFINITIONS } from '../data/cardDefinitions'
import type { PlayingCard, PlayerId, SpritePosition, Suit, Character } from '../interfaces'


function getSpritePosition(suit: Suit, char: Character): SpritePosition {
  const suitRow: Record<Suit, number> = {
    'flowers': 0,
    'berries': 1,
    'leaves': 2,
    'acorns': 3
  }

  // Sprite v3: different column layout per suit
  // Row 0 (flowers): [card-back], 1, 2, 3, 4, 5, Q, K, A, [decorative]
  // Rows 1-3 (berries/leaves/acorns): 5, 6, 7, 8, 9, 10, S, U, O
  const flowersCharCol: Partial<Record<Character, number>> = {
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
    'Q': 6, 'K': 7, 'A': 8
  }

  const normalCharCol: Partial<Record<Character, number>> = {
    '5': 0, '6': 1, '7': 2, '8': 3, '9': 4, '10': 5,
    'S': 6, 'U': 7, 'O': 8
  }

  const charCol = suit === 'flowers' ? flowersCharCol : normalCharCol
  const col = charCol[char]

  if (col === undefined) {
    throw new Error(`Invalid char '${char}' for suit '${suit}'`)
  }

  return {
    row: suitRow[suit],
    col
  }
}


/**
 * Creates a complete deck of playing cards based on card definitions.
 * Each card is initialized with its base rank and on-suit rank from the definitions.
 */
export function createDeck(): PlayingCard[] {
  return CARD_DEFINITIONS.map(def => ({
    id: `${def.suit}-${def.char}`,
    suit: def.suit,
    char: def.char,
    rank: { base: def.baseRank, onSuit: def.leadRank },
    owner: null,
    state: 'in_deck',
    points: def.points,
    spritePos: getSpritePosition(def.suit, def.char)
  }))
}

/**
 * Shuffles a deck using Fisher-Yates algorithm.
 * Returns a new shuffled array without mutating the original.
 */
export function shuffleDeck(deck: PlayingCard[]): PlayingCard[] {
  const shuffled = [...deck]
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    shuffled[i] = shuffled[j]!
    shuffled[j] = temp!
  }
  
  return shuffled
}
/**
 * Deals cards to players from a deck.
 * Returns player hands and remaining deck.
 */
export function dealCards(
  deck: PlayingCard[],
  playerIds: PlayerId[],
  cardsPerPlayer: number
): { hands: Map<PlayerId, PlayingCard[]>, remaining: PlayingCard[] } {
  
  const hands = new Map<PlayerId, PlayingCard[]>()
  let deckIndex = 0
  for (const playerId of playerIds) {
    const playerCards = deck.slice(deckIndex, deckIndex + cardsPerPlayer)
    
    // Update card ownership and state
    playerCards.forEach(card => {
      card.owner = playerId
      card.state = 'in_hand_hidden'
    })
    
    hands.set(playerId, playerCards)
    deckIndex += cardsPerPlayer
  }
  const remaining = deck.slice(deckIndex)
  return { hands, remaining }
}