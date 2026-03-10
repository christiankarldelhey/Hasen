import { describe, expect, it } from 'vitest'
import type { PlayingCard } from '../interfaces/Card'
import type { ActivePlayers } from '../interfaces/Player'
import type { Trick } from '../interfaces/Trick'
import { determineLeadSuit, determineTrickWinner, hasTrickEnded, scoreCardsInTrick } from './TrickRules'

function createCard(overrides?: Partial<PlayingCard>): PlayingCard {
  return {
    id: overrides?.id ?? 'card-1',
    suit: overrides?.suit ?? 'acorns',
    char: overrides?.char ?? 'A',
    rank: overrides?.rank ?? { base: 15, onSuit: 21 },
    owner: overrides?.owner ?? 'player_1',
    state: overrides?.state ?? 'in_trick',
    points: overrides?.points ?? 11,
    spritePos: overrides?.spritePos ?? { row: 0, col: 0 }
  }
}

function createTrick(overrides?: Partial<Trick>): Trick {
  return {
    trick_id: 'trick-1',
    trick_state: overrides?.trick_state ?? 'resolve',
    trick_number: overrides?.trick_number ?? 1,
    lead_player: overrides?.lead_player ?? 'player_1',
    winning_card: overrides?.winning_card ?? 'winning-card',
    lead_suit: overrides?.lead_suit ?? 'acorns',
    cards: overrides?.cards ?? ['winning-card', 'last-card'],
    score: overrides?.score ?? {
      trick_winner: null,
      trick_points: 0,
      trick_collections: null
    }
  }
}

describe('determineLeadSuit', () => {
  it('returns null when first card is flowers', () => {
    const leadSuit = determineLeadSuit(createCard({ suit: 'flowers', rank: { base: 31, onSuit: null } }))

    expect(leadSuit).toBeNull()
  })

  it('returns card suit for non-flowers first card', () => {
    const leadSuit = determineLeadSuit(createCard({ suit: 'leaves' }))

    expect(leadSuit).toBe('leaves')
  })
})

describe('scoreCardsInTrick', () => {
  it('aggregates trick points and suit collections', () => {
    const cards = [
      createCard({ suit: 'acorns', points: 11 }),
      createCard({ suit: 'leaves', points: 2 }),
      createCard({ suit: 'berries', points: 0 }),
      createCard({ suit: 'flowers', points: 3, rank: { base: 31, onSuit: null } })
    ]

    const score = scoreCardsInTrick(cards)

    expect(score.trick_points).toBe(16)
    expect(score.trick_collections).toEqual({
      acorns: 1,
      leaves: 1,
      berries: 1,
      flowers: 1
    })
    expect(score.trick_winner).toBeNull()
  })
})

describe('hasTrickEnded', () => {
  it('returns true when all active players have played', () => {
    const trick = createTrick({ trick_state: 'in_progress', cards: ['a', 'b', 'c'] })
    const activePlayers: ActivePlayers = ['player_1', 'player_2', 'player_3']

    expect(hasTrickEnded(trick, activePlayers)).toBe(true)
  })

  it('returns false when missing cards from active players', () => {
    const trick = createTrick({ trick_state: 'in_progress', cards: ['a', 'b'] })
    const activePlayers: ActivePlayers = ['player_1', 'player_2', 'player_3']

    expect(hasTrickEnded(trick, activePlayers)).toBe(false)
  })
})

describe('determineTrickWinner', () => {
  it('returns owner of higher ranked card when trick is in resolve state', () => {
    const trick = createTrick({ trick_state: 'resolve', winning_card: 'winning-card', lead_suit: 'acorns' })
    const winningCard = createCard({ id: 'winning-card', owner: 'player_1', rank: { base: 11, onSuit: 20 }, suit: 'acorns' })
    const lastCard = createCard({ id: 'last-card', owner: 'player_2', rank: { base: 15, onSuit: 21 }, suit: 'acorns' })

    const winner = determineTrickWinner(trick, winningCard, lastCard, 'acorns')

    expect(winner).toBe('player_2')
  })

  it('throws when trick is not in resolve state', () => {
    const trick = createTrick({ trick_state: 'in_progress' })
    const winningCard = createCard({ id: 'winning-card' })
    const lastCard = createCard({ id: 'last-card', owner: 'player_2' })

    expect(() => determineTrickWinner(trick, winningCard, lastCard, 'acorns')).toThrow(
      'Trick is not in resolve state or missing winning card'
    )
  })
})
