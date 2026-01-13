import type { PlayerId } from './Player'
import type { Trick } from './Trick'
import type { Bid, PointsBidCondition, SetCollectionBidCondition, TrickBidCondition } from './Bid'

export type RoundPhase = 
  | 'round_setup'
  | 'player_drawing'
  | 'playing'
  | 'scoring'

export interface RoundBids {
  points: Bid | null
  set_collection: Bid | null
  trick: Bid | null
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