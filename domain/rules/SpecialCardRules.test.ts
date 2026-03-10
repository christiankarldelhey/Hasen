import { describe, expect, it } from 'vitest'
import type { PlayingCard } from '../interfaces/Card'
import type { Trick } from '../interfaces/Trick'
import {
  canSelectNextLead,
  canStealCard,
  detectPickNextLeadCard,
  detectSpecialCards,
  detectStealCard,
  getHighestPrioritySpecialCard,
  isPickNextLeadCard,
  isSpecialCard,
  isStealCardCard
} from './SpecialCardRules'

function createCard(overrides?: Partial<PlayingCard>): PlayingCard {
  return {
    id: overrides?.id ?? 'card-1',
    suit: overrides?.suit ?? 'acorns',
    char: overrides?.char ?? 'A',
    rank: overrides?.rank ?? { base: 15, onSuit: 21 },
    owner: overrides?.owner ?? 'player_1',
    state: overrides?.state ?? 'in_trick',
    points: overrides?.points ?? 0,
    spritePos: overrides?.spritePos ?? { row: 0, col: 0 }
  }
}

function createTrick(cardIds: string[]): Trick {
  return {
    trick_id: 'trick-1',
    trick_state: 'resolve',
    trick_number: 2,
    lead_player: 'player_1',
    winning_card: cardIds[0] ?? null,
    lead_suit: 'acorns',
    cards: cardIds,
    score: {
      trick_winner: null,
      trick_points: 0,
      trick_collections: null
    }
  }
}

describe('special card identification', () => {
  it('identifies Acorns S as pick-next-lead card', () => {
    const card = createCard({ suit: 'acorns', char: 'S' })

    expect(isPickNextLeadCard(card)).toBe(true)
    expect(isSpecialCard(card)).toBe(true)
  })

  it('identifies Leaves S as steal-card card', () => {
    const card = createCard({ suit: 'leaves', char: 'S' })

    expect(isStealCardCard(card)).toBe(true)
    expect(isSpecialCard(card)).toBe(true)
  })

  it('returns false for non special cards', () => {
    const card = createCard({ suit: 'berries', char: '10' })

    expect(isPickNextLeadCard(card)).toBe(false)
    expect(isStealCardCard(card)).toBe(false)
    expect(isSpecialCard(card)).toBe(false)
  })
})

describe('special card detection in trick', () => {
  it('detects pick-next-lead card from trick cards', () => {
    const pickCard = createCard({ id: 'pick', suit: 'acorns', char: 'S', owner: 'player_2' })
    const deck = [createCard({ id: 'normal' }), pickCard]
    const trick = createTrick(['normal', 'pick'])

    const detection = detectPickNextLeadCard(deck, trick)

    expect(detection).toEqual({
      type: 'PICK_NEXT_LEAD',
      playerId: 'player_2',
      cardId: 'pick'
    })
  })

  it('detects steal-card card from trick cards', () => {
    const stealCard = createCard({ id: 'steal', suit: 'leaves', char: 'S', owner: 'player_3' })
    const deck = [createCard({ id: 'normal' }), stealCard]
    const trick = createTrick(['normal', 'steal'])

    const detection = detectStealCard(deck, trick)

    expect(detection).toEqual({
      type: 'STEAL_CARD',
      playerId: 'player_3',
      cardId: 'steal'
    })
  })

  it('returns null when no pick-next-lead card exists in trick', () => {
    const deck = [createCard({ id: 'a' }), createCard({ id: 'b', suit: 'berries' })]
    const trick = createTrick(['a', 'b'])

    expect(detectPickNextLeadCard(deck, trick)).toBeNull()
  })

  it('returns null when no steal-card card exists in trick', () => {
    const deck = [createCard({ id: 'a' }), createCard({ id: 'b', suit: 'berries' })]
    const trick = createTrick(['a', 'b'])

    expect(detectStealCard(deck, trick)).toBeNull()
  })

  it('detects both cards and keeps pick-first order in detectSpecialCards', () => {
    const pickCard = createCard({ id: 'pick', suit: 'acorns', char: 'S', owner: 'player_1' })
    const stealCard = createCard({ id: 'steal', suit: 'leaves', char: 'S', owner: 'player_4' })
    const deck = [pickCard, stealCard]
    const trick = createTrick(['pick', 'steal'])

    const detections = detectSpecialCards(deck, trick)

    expect(detections).toHaveLength(2)
    expect(detections[0]?.type).toBe('PICK_NEXT_LEAD')
    expect(detections[1]?.type).toBe('STEAL_CARD')
  })

  it('returns STEAL_CARD as highest priority when both special cards exist', () => {
    const pickCard = createCard({ id: 'pick', suit: 'acorns', char: 'S', owner: 'player_1' })
    const stealCard = createCard({ id: 'steal', suit: 'leaves', char: 'S', owner: 'player_4' })
    const deck = [pickCard, stealCard]
    const trick = createTrick(['pick', 'steal'])

    const highest = getHighestPrioritySpecialCard(deck, trick)

    expect(highest).toEqual({
      type: 'STEAL_CARD',
      playerId: 'player_4',
      cardId: 'steal'
    })
  })

  it('returns null highest priority when trick has no special cards', () => {
    const deck = [createCard({ id: 'normal-1' }), createCard({ id: 'normal-2', suit: 'flowers', char: 'Q' })]
    const trick = createTrick(['normal-1', 'normal-2'])

    expect(getHighestPrioritySpecialCard(deck, trick)).toBeNull()
  })
})

describe('special card action validation', () => {
  it('validates next lead selection when selected player is active', () => {
    const result = canSelectNextLead('player_1', 'player_3', ['player_1', 'player_2', 'player_3'])

    expect(result).toEqual({ valid: true })
  })

  it('rejects next lead selection for player outside active players', () => {
    const result = canSelectNextLead('player_1', 'player_4', ['player_1', 'player_2', 'player_3'])

    expect(result).toEqual({ valid: false, reason: 'Selected player is not in the game' })
  })

  it('validates steal card action when selected card exists in trick cards', () => {
    const result = canStealCard('player_2', 'card-b', ['card-a', 'card-b'])

    expect(result).toEqual({ valid: true })
  })

  it('rejects steal card action when selected card is not in trick cards', () => {
    const result = canStealCard('player_2', 'card-z', ['card-a', 'card-b'])

    expect(result).toEqual({ valid: false, reason: 'Selected card is not in the trick' })
  })
})
