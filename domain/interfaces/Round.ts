import type { PlayerId } from './Player'
import type { Trick } from './Trick'
import type { Bid, PointsBidCondition, SetCollectionBidCondition, TrickBidCondition } from './Bid'

export type RoundPhase = 
  | 'shuffle'
  | 'update_bids'
  | 'dealing_first_card'
  | 'dealing_remaining_cards'
  | 'player_drawing'
  | 'back_to_hand'
  | 'playing'
  | 'scoring'

export interface RoundBids {
  points: [Bid, Bid]
  set_collection: [Bid, Bid]
  trick: [Bid, Bid]
}

export interface Round {
  round: number
  playerTurn: PlayerId
  roundBids: RoundBids
  roundPhase: RoundPhase
  currentTrick: Trick | null
}

export interface PlayerRoundScore {
  playerId: PlayerId
  points: number
  totalScore: number
  tricksWon: number
  win_condition: PointsBidCondition | SetCollectionBidCondition | TrickBidCondition
}