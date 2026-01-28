import type { Suit } from './Card'
import type { TrickNumber } from './Trick'

export type BidType = 'points' | 'set_collection' | 'trick'
export type BidScore = number

export interface PointsBidCondition {
  min_points: number
  max_points: number
}

export interface SetCollectionBidCondition {
  win_suit: Suit
  avoid_suit: Suit
}

export interface TrickBidCondition {
  win_trick_position?: TrickNumber[]
  lose_trick_position?: TrickNumber[]
  may_win_trick_position?: TrickNumber[]
  win_min_tricks?: TrickNumber
  win_max_tricks?: TrickNumber
}

export interface PlayerBidEntry {
  bidId: string
  trickNumber: TrickNumber
  onLose: number
  isPlayerWinning: boolean | null
}

export interface PlayerBidsMap {
  player_1?: PlayerBidEntry[]
  player_2?: PlayerBidEntry[]
  player_3?: PlayerBidEntry[]
  player_4?: PlayerBidEntry[]
}

export interface Bid {
  bid_id: string
  bid_type: BidType
  bid_score: BidScore
  win_condition: PointsBidCondition | SetCollectionBidCondition | TrickBidCondition
}

export interface BidPool {
  bids: Bid[]
  playerBids: PlayerBidsMap
}