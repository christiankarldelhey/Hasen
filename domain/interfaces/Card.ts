import type { PlayerId } from './Player'

export type Suit = 'acorns' | 'leaves' | 'berries' | 'flowers'
export type State = 'in_deck' | 'in_hand_visible' | 'in_hand_hidden' | 'in_trick' | 'in_finished_trick' | 'in_discard_pile'
export type Character = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'S' | 'U' | 'O' | 'K' | 'Q' | 'A'
export type NormalRank = 0 | 1 | 2 | 3 | 11 | 12 | 13 | 14 | 15 | 31 | 32 | 33
export type LeadRank = 5 | 6 | 7 | 8 | 9 | 10 | 20 | 21 | 40
export type CardPoints = 0 | 1 | 2 | 3 | 4 | 5 | 10 | 11 | 12
export type PlayingCardId = string
export interface SpritePosition {
  row: number
  col: number
}

export type Rank = {
  base: NormalRank
  onSuit: LeadRank | null
}

export type PlayerHand = PlayingCard[];

export interface PlayingCard {
  id: PlayingCardId
  suit: Suit
  char: Character
  rank: Rank
  owner: PlayerId | null
  state: State
  points: CardPoints
  spritePos: SpritePosition
  position?: number
}