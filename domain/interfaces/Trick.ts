import { PlayerId } from './Player'
import { PlayingCardId, Suit } from './Card'

export type TrickNumber = 1 | 2 | 3 | 4 | 5
export type TrickState = 'in_progress' | 'resolve' | 'ended'
export type LeadSuit = 'acorns' | 'leaves' | 'berries'
export type TrickScore = {
  trick_winner: PlayerId | null;
  trick_points: number;
  trick_collections: Record<Suit, number>;
}

export interface Trick {
  trick_id: number
  trick_state: TrickState
  trick_number: TrickNumber
  lead_player: PlayerId
  winning_card: PlayingCardId | null
  lead_suit: LeadSuit | null
  cards: PlayingCardId[]
  score: TrickScore
}