import { createDeck } from '@domain/rules/DeckRules'
import type { Character, PlayerId, PlayingCard, Suit } from '@domain/interfaces'

const baseCardByKey = new Map(createDeck().map(card => [`${card.suit}-${card.char}`, card]))

interface DemoCardOptions {
  id?: string
  owner?: PlayerId | null
  state?: PlayingCard['state']
}

/**
 * Builds a mock card from the real deck definitions, so spritePos, points
 * and ranks always match what the game actually renders.
 */
export function demoCard(suit: Suit, char: Character, options: DemoCardOptions = {}): PlayingCard {
  const base = baseCardByKey.get(`${suit}-${char}`)
  if (!base) {
    throw new Error(`Unknown tutorial card ${suit}-${char}`)
  }

  return {
    ...base,
    id: options.id ?? `demo-${suit}-${char}`,
    owner: options.owner ?? null,
    state: options.state ?? 'in_deck',
    rank: { ...base.rank },
    spritePos: { ...base.spritePos }
  }
}
