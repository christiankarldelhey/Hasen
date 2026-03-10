import { describe, expect, it } from 'vitest'
import type { PlayingCard } from '../interfaces/Card'
import type { PlayerId } from '../interfaces/Player'
import type { Trick } from '../interfaces/Trick'
import { canPlayCard, compareCards, getEffectiveRank } from './CardRules'

function createCard(overrides?: Partial<PlayingCard>): PlayingCard {
  return {
    id: overrides?.id ?? 'card-1',
    suit: overrides?.suit ?? 'acorns',
    char: overrides?.char ?? 'A',
    rank: overrides?.rank ?? { base: 15, onSuit: 21 },
    owner: overrides?.owner ?? 'player_1',
    state: overrides?.state ?? 'in_hand_visible',
    points: overrides?.points ?? 11,
    spritePos: overrides?.spritePos ?? { row: 0, col: 0 }
  }
}

function createTrick(overrides?: Partial<Trick>): Trick {
  return {
    trick_id: 'trick-1',
    trick_state: overrides?.trick_state ?? 'in_progress',
    trick_number: overrides?.trick_number ?? 1,
    lead_player: overrides?.lead_player ?? 'player_1',
    winning_card: overrides?.winning_card ?? null,
    lead_suit: overrides?.lead_suit ?? null,
    cards: overrides?.cards ?? [],
    score: overrides?.score ?? {
      trick_winner: null,
      trick_points: 0,
      trick_collections: null
    }
  }
}

describe('canPlayCard', () => {
  it('rejects when card does not belong to the player', () => {
    const card = createCard({ owner: 'player_2' })
    const hand = [card]

    const result = canPlayCard(card, 'player_1', 'player_1', hand, createTrick())

    expect(result).toEqual({ valid: false, reason: 'Card doesnt belong to player' })
  })

  it('rejects when card is not in player hand', () => {
    const card = createCard()

    const result = canPlayCard(card, 'player_1', 'player_1', [], createTrick())

    expect(result).toEqual({ valid: false, reason: 'Card not in player hand' })
  })

  it('rejects when card state is not playable', () => {
    const card = createCard({ state: 'in_trick' })

    const result = canPlayCard(card, 'player_1', 'player_1', [card], createTrick())

    expect(result).toEqual({ valid: false, reason: 'Card not available to play' })
  })

  it('rejects when trick is not in progress', () => {
    const card = createCard()

    const result = canPlayCard(card, 'player_1', 'player_1', [card], createTrick({ trick_state: 'resolve' }))

    expect(result).toEqual({ valid: false, reason: 'Trick is already complete' })
  })

  it('rejects when it is not the player turn', () => {
    const card = createCard()

    const result = canPlayCard(card, 'player_1', 'player_2', [card], createTrick())

    expect(result).toEqual({ valid: false, reason: 'Not your turn to play a card' })
  })

  it('rejects when player already played in this trick', () => {
    const card = createCard({ id: 'new-card' })
    const trick = createTrick({ cards: ['played-card'] })
    const trickCardOwners = new Map<string, PlayerId>([['played-card', 'player_1']])

    const result = canPlayCard(card, 'player_1', 'player_1', [card], trick, trickCardOwners)

    expect(result).toEqual({ valid: false, reason: 'You already played a card in this trick' })
  })

  it('rejects berries S as first card of first trick by lead player', () => {
    const card = createCard({ suit: 'berries', char: 'S', rank: { base: 1, onSuit: 40 } })

    const result = canPlayCard(card, 'player_1', 'player_1', [card], createTrick({ trick_number: 1, cards: [] }))

    expect(result).toEqual({
      valid: false,
      reason: 'Berries S cannot be played as first card of the first trick'
    })
  })

  it('allows valid play', () => {
    const card = createCard()

    const result = canPlayCard(card, 'player_1', 'player_1', [card], createTrick())

    expect(result).toEqual({ valid: true })
  })
})

describe('getEffectiveRank', () => {
  it('uses berries S onSuit rank when berries is lead suit', () => {
    const berriesS = createCard({ suit: 'berries', char: 'S', rank: { base: 1, onSuit: 40 } })

    expect(getEffectiveRank(berriesS, 'berries', 1)).toBe(40)
  })

  it('uses berries S base rank when lead suit is not berries', () => {
    const berriesS = createCard({ suit: 'berries', char: 'S', rank: { base: 1, onSuit: 40 } })

    expect(getEffectiveRank(berriesS, 'acorns', 1)).toBe(1)
  })

  it('uses base rank for flowers cards', () => {
    const flowerCard = createCard({ suit: 'flowers', rank: { base: 31, onSuit: null } })

    expect(getEffectiveRank(flowerCard, 'acorns', 1)).toBe(31)
  })

  it('uses onSuit rank when card follows lead suit', () => {
    const card = createCard({ suit: 'leaves', rank: { base: 3, onSuit: 10 } })

    expect(getEffectiveRank(card, 'leaves', 1)).toBe(10)
  })
})

describe('compareCards', () => {
  it('applies Flowers Q special exception against Berries S lead', () => {
    const berriesS = createCard({
      id: 'berries-s',
      suit: 'berries',
      char: 'S',
      rank: { base: 1, onSuit: 40 },
      owner: 'player_1'
    })
    const flowersQ = createCard({
      id: 'flowers-q',
      suit: 'flowers',
      char: 'Q',
      rank: { base: 31, onSuit: null },
      owner: 'player_2'
    })

    const winner = compareCards(berriesS, flowersQ, 1, 'berries')

    expect(winner.id).toBe('flowers-q')
    expect(winner.owner).toBe('player_2')
  })

  it('returns current winning card when it has higher rank', () => {
    const winningCard = createCard({ id: 'winning', rank: { base: 15, onSuit: 21 } })
    const currentCard = createCard({ id: 'current', rank: { base: 11, onSuit: 20 } })

    const winner = compareCards(winningCard, currentCard, 1, 'acorns')

    expect(winner.id).toBe('winning')
  })
})
