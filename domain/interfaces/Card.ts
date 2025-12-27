import { PlayerId } from './Player'

export type Suit = 'acorns' | 'leaves' | 'berries' | 'flowers'
export type State = 'in_deck' | 'in_hand' | 'in_trick' | 'in_finished_trick' | 'in_discard_pile'
export type Character = '6' | '7' | '8' | '9' | '10' | 'U' | 'O' | 'K'
export type NormalRank = 0 | 1 | 2 | 3 | 11 | 12 | 13 | 14 | 31 | 32 | 33
export type LeadRank = 6 | 7 | 8 | 9 | 10 | 20 | 21 | 40
export type CardPoints = 0 | 2 | 3 | 4 | 10 | 11
export type PlayingCardId = string

export type Rank = {
  base: NormalRank
  onSuit: LeadRank | null
}

export interface PlayingCard {
  id: PlayingCardId
  suit: Suit
  char: Character
  rank: Rank
  owner: PlayerId | null
  state: State
  points: CardPoints
}